// INTEGRATION SEAM — live distributor data (real prices, stock, datasheets).
//
// Unlike the simulated providers in this folder, this module calls REAL
// distributor APIs when keys are configured, and is silently disabled when
// they are not. Coverage is strongest for OEM/electronic components (that is
// what these distributors carry); electrical-construction SKUs often won't
// match — callers should treat "no quotes" as normal.
//
//   MOUSER_API_KEY          — free key: https://www.mouser.com/api-search/
//   DIGIKEY_CLIENT_ID/_SECRET — free app: https://developer.digikey.com
//
// Data is fetched per-request and never persisted — distributor API terms
// restrict caching/redistribution of their catalog data.

export interface LiveQuote {
  distributor: "Mouser Electronics" | "Digi-Key";
  matchedPart: string;
  manufacturer: string;
  description: string;
  unitPrice: number | null;
  priceBreaks: { qty: number; price: number }[];
  stock: number | null;
  datasheetUrl: string | null;
  productUrl: string | null;
}

export function liveDistributorsConfigured(): string[] {
  const out: string[] = [];
  if (process.env.MOUSER_API_KEY) out.push("Mouser Electronics");
  if (process.env.DIGIKEY_CLIENT_ID && process.env.DIGIKEY_CLIENT_SECRET) out.push("Digi-Key");
  return out;
}

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

// ── Mouser ────────────────────────────────────────────────────────────

interface MouserPart {
  ManufacturerPartNumber?: string;
  Manufacturer?: string;
  Description?: string;
  DataSheetUrl?: string;
  ProductDetailUrl?: string;
  Availability?: string;
  PriceBreaks?: { Quantity?: number; Price?: string }[];
}

export function mapMouserParts(parts: MouserPart[], mpn: string): LiveQuote[] {
  const want = norm(mpn);
  return parts
    .filter((p) => p.ManufacturerPartNumber && norm(p.ManufacturerPartNumber).startsWith(want))
    .slice(0, 2)
    .map((p) => {
      const breaks = (p.PriceBreaks ?? [])
        .map((b) => ({ qty: Number(b.Quantity) || 1, price: Number(String(b.Price ?? "").replace(/[^0-9.]/g, "")) }))
        .filter((b) => Number.isFinite(b.price) && b.price > 0);
      const stockMatch = /([\d,]+)\s*In Stock/i.exec(p.Availability ?? "");
      return {
        distributor: "Mouser Electronics" as const,
        matchedPart: p.ManufacturerPartNumber ?? mpn,
        manufacturer: p.Manufacturer ?? "",
        description: p.Description ?? "",
        unitPrice: breaks.length ? breaks[0].price : null,
        priceBreaks: breaks.slice(0, 4),
        stock: stockMatch ? Number(stockMatch[1].replace(/,/g, "")) : null,
        datasheetUrl: p.DataSheetUrl || null,
        productUrl: p.ProductDetailUrl || null,
      };
    });
}

async function fetchMouser(mpn: string): Promise<LiveQuote[]> {
  const key = process.env.MOUSER_API_KEY;
  if (!key) return [];
  const r = await fetch(`https://api.mouser.com/api/v1/search/keyword?apiKey=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ SearchByKeywordRequest: { keyword: mpn, records: 5, startingRecord: 0 } }),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) return [];
  const data = await r.json();
  return mapMouserParts(data?.SearchResults?.Parts ?? [], mpn);
}

// ── Digi-Key ──────────────────────────────────────────────────────────

interface DigiKeyProduct {
  ManufacturerProductNumber?: string;
  Manufacturer?: { Name?: string };
  Description?: { ProductDescription?: string };
  DatasheetUrl?: string;
  ProductUrl?: string;
  QuantityAvailable?: number;
  UnitPrice?: number;
}

export function mapDigiKeyProducts(products: DigiKeyProduct[], mpn: string): LiveQuote[] {
  const want = norm(mpn);
  return products
    .filter((p) => p.ManufacturerProductNumber && norm(p.ManufacturerProductNumber).startsWith(want))
    .slice(0, 2)
    .map((p) => ({
      distributor: "Digi-Key" as const,
      matchedPart: p.ManufacturerProductNumber ?? mpn,
      manufacturer: p.Manufacturer?.Name ?? "",
      description: p.Description?.ProductDescription ?? "",
      unitPrice: Number.isFinite(p.UnitPrice) && (p.UnitPrice as number) > 0 ? (p.UnitPrice as number) : null,
      priceBreaks: [],
      stock: Number.isFinite(p.QuantityAvailable) ? (p.QuantityAvailable as number) : null,
      datasheetUrl: p.DatasheetUrl || null,
      productUrl: p.ProductUrl || null,
    }));
}

const g = globalThis as unknown as { __dkToken?: { token: string; expiresAt: number } };

async function digikeyToken(): Promise<string | null> {
  const id = process.env.DIGIKEY_CLIENT_ID;
  const secret = process.env.DIGIKEY_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (g.__dkToken && g.__dkToken.expiresAt > Date.now() + 30_000) return g.__dkToken.token;
  const r = await fetch("https://api.digikey.com/v1/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: "client_credentials" }),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) {
    // Status only — never log credentials or response bodies wholesale.
    console.warn(`[distributor-live] Digi-Key token request failed: ${r.status}`);
    return null;
  }
  const data = await r.json();
  if (!data?.access_token) {
    console.warn("[distributor-live] Digi-Key token response had no access_token");
    return null;
  }
  g.__dkToken = { token: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) || 600) * 1000 };
  return g.__dkToken.token;
}

async function fetchDigiKey(mpn: string): Promise<LiveQuote[]> {
  const token = await digikeyToken();
  if (!token) return [];
  const r = await fetch("https://api.digikey.com/products/v4/search/keyword", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-DIGIKEY-Client-Id": process.env.DIGIKEY_CLIENT_ID as string,
      "X-DIGIKEY-Locale-Site": "US",
      "X-DIGIKEY-Locale-Currency": "USD",
    },
    body: JSON.stringify({ Keywords: mpn, Limit: 5, Offset: 0 }),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) {
    console.warn(`[distributor-live] Digi-Key search failed: ${r.status}`);
    return [];
  }
  const data = await r.json();
  return mapDigiKeyProducts(data?.Products ?? [], mpn);
}

// ── Public API ────────────────────────────────────────────────────────

export async function getLiveQuotes(mpn: string): Promise<LiveQuote[]> {
  const settled = await Promise.allSettled([fetchMouser(mpn), fetchDigiKey(mpn)]);
  return settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
}
