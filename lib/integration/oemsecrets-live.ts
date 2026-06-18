/**
 * OEMsecrets distributor-aggregator adapter (REAL) — env-gated DORMANT, $0 until
 * keyed. OEMsecrets aggregates live stock + price breaks across a broad set of
 * distributors (authorized AND independent), so it widens the offer ladder beyond
 * the authorized-only ECIA feed. Per-request, never stored; raw fetch (no SDK);
 * fail-closed. The JSON→Offer transform is pure + unit-tested.
 *
 *   OEMSECRETS_API_TOKEN — partfinder API token (the gate). Server-only.
 *   OEMSECRETS_API_BASE  — optional base override (defaults to the public host).
 *
 * Authorization is best-effort: OEMsecrets marks franchised/authorized sellers
 * with a flag; absent the flag we treat the seller as NOT authorized so the
 * ranker never over-credits a broker as authorized.
 */

import { logApiError } from "@/lib/server/log";
import { entryPrice, type Offer, type OfferBreak } from "@/lib/product-finder-offers";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** True only when the OEMsecrets token is present. Single source of dormancy. */
export function oemsecretsConfigured(): boolean {
  return Boolean(env("OEMSECRETS_API_TOKEN"));
}

// ── OEMsecrets partfinder response shape (only fields we read; all defensive) ──
interface OsPriceBreak {
  unit_break?: number | string;
  unit_price?: number | string;
}
interface OsPart {
  distributor?: { distributor_name?: string; franchised?: boolean } | string;
  stock?: number | string;
  lead_time?: number | string;
  buy_now_url?: string;
  prices?: { USD?: OsPriceBreak[] } | OsPriceBreak[];
}
export interface OsResponse {
  stock?: OsPart[];
}

/** Coerce the API's loose number|string fields to a finite number, else null. */
function num(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.replace(/[$,]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function distributorName(d: OsPart["distributor"]): string {
  if (typeof d === "string") return d || "Distributor";
  return d?.distributor_name?.trim() || "Distributor";
}

function priceRows(prices: OsPart["prices"]): OsPriceBreak[] {
  if (Array.isArray(prices)) return prices;
  return prices?.USD ?? [];
}

/** Pure: map an OEMsecrets partfinder response to ladder offers. */
export function mapOemsecretsToOffers(json: OsResponse): Offer[] {
  const offers: Offer[] = [];
  for (const row of json.stock ?? []) {
    const priceBreaks: OfferBreak[] = priceRows(row.prices)
      .map((b) => ({ qty: num(b.unit_break), price: num(b.unit_price) }))
      .filter((b): b is OfferBreak => b.qty != null && b.price != null);
    const unitPrice = entryPrice(priceBreaks);
    const authorized = typeof row.distributor === "object" && row.distributor?.franchised === true;
    offers.push({
      source: distributorName(row.distributor),
      authorized, // ← absent franchised flag ⇒ treated as broker (not authorized)
      stock: num(row.stock),
      leadDays: num(row.lead_time),
      unitPrice,
      priceBreaks,
      url: typeof row.buy_now_url === "string" ? row.buy_now_url : null,
    });
  }
  return offers;
}

export type OemsecretsResult =
  | { enabled: true; source: "OEMsecrets"; offers: Offer[]; fetchedAt: string }
  | { enabled: false; reason: "no-keys" | "fetch-failed" | "no-data" };

/**
 * Broad distributor offers for an MPN via OEMsecrets. Returns {enabled:false}
 * when dormant (no token) or on any fetch error — callers fall back to the other
 * sources and never see a throw.
 */
export async function getOemsecretsOffers(mpn: string): Promise<OemsecretsResult> {
  const token = env("OEMSECRETS_API_TOKEN");
  if (!token) return { enabled: false, reason: "no-keys" }; // ← dormant: no token ⇒ no network

  const base = env("OEMSECRETS_API_BASE") ?? "https://oemsecretsapi.com";
  try {
    const url = `${base}/partsearch?searchTerm=${encodeURIComponent(mpn)}&apiKey=${encodeURIComponent(token)}&currency=USD`;
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      logApiError("oemsecrets:offers", new Error(`OEMsecrets HTTP ${res.status}`));
      return { enabled: false, reason: "fetch-failed" };
    }
    const json = (await res.json().catch(() => ({}))) as OsResponse;
    const offers = mapOemsecretsToOffers(json);
    if (offers.length === 0) return { enabled: false, reason: "no-data" };
    return { enabled: true, source: "OEMsecrets", offers, fetchedAt: new Date().toISOString() };
  } catch (e) {
    logApiError("oemsecrets:offers", e);
    return { enabled: false, reason: "fetch-failed" };
  }
}
