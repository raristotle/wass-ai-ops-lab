/**
 * ECIA TrustedParts distributor adapter (REAL) — env-gated DORMANT, $0 until
 * keyed. TrustedParts (run by ECIA) returns real-time stock, price breaks, and
 * lead time from ONLY authorized distributors — the differentiator vs broker-
 * inclusive feeds. Per-request, never stored; raw fetch (no SDK); fail-closed.
 * The JSON→Offer transform is pure + unit-tested.
 *
 *   ECIA_API_KEY  — TrustedParts API token (the gate). Server-only.
 *   ECIA_API_BASE — optional base override (defaults to the public API host).
 */

import { logApiError } from "@/lib/server/log";
import { entryPrice, type Offer, type OfferBreak } from "@/lib/product-finder-offers";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** True only when the TrustedParts API token is present. Single source of dormancy. */
export function eciaConfigured(): boolean {
  return Boolean(env("ECIA_API_KEY"));
}

// ── TrustedParts response shape (only the fields we read; all optional/defensive) ──
interface TpPriceBreak {
  Quantity?: number;
  Price?: number;
}
interface TpDistributor {
  DistributorName?: string;
  Authorized?: boolean;
  StockQuantity?: number;
  LeadTime?: number;
  BuyNowURL?: string;
  PriceBreaks?: TpPriceBreak[];
}
interface TpPart {
  Distributors?: TpDistributor[];
}
export interface TpResponse {
  Parts?: TpPart[];
}

/** Pure: map a TrustedParts search response to ranked-ladder offers. */
export function mapTrustedPartsToOffers(json: TpResponse): Offer[] {
  const offers: Offer[] = [];
  for (const part of json.Parts ?? []) {
    for (const d of part.Distributors ?? []) {
      const priceBreaks: OfferBreak[] = (d.PriceBreaks ?? [])
        .filter((b) => typeof b.Quantity === "number" && typeof b.Price === "number")
        .map((b) => ({ qty: b.Quantity as number, price: b.Price as number }));
      const unitPrice = entryPrice(priceBreaks);
      offers.push({
        source: d.DistributorName ?? "Authorized distributor",
        authorized: d.Authorized !== false, // TrustedParts is authorized-only by design
        stock: typeof d.StockQuantity === "number" ? d.StockQuantity : null,
        leadDays: typeof d.LeadTime === "number" ? d.LeadTime : null,
        unitPrice,
        priceBreaks,
        url: d.BuyNowURL ?? null,
      });
    }
  }
  return offers;
}

export type EciaResult =
  | { enabled: true; source: "TrustedParts (ECIA)"; offers: Offer[]; fetchedAt: string }
  | { enabled: false; reason: "no-keys" | "fetch-failed" | "no-data" };

/**
 * Authorized-distributor offers for an MPN via ECIA TrustedParts. Returns
 * {enabled:false} when dormant (no key) or on any fetch error — callers fall back
 * to the other sources and never see a throw.
 */
export async function getTrustedPartsOffers(mpn: string): Promise<EciaResult> {
  const key = env("ECIA_API_KEY");
  if (!key) return { enabled: false, reason: "no-keys" }; // ← dormant: no key ⇒ no network

  const base = env("ECIA_API_BASE") ?? "https://api.trustedparts.com";
  try {
    const url = `${base}/api/v1/Search/Parts?Token=${encodeURIComponent(key)}&PartNumber=${encodeURIComponent(mpn)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      logApiError("ecia:offers", new Error(`TrustedParts HTTP ${res.status}`));
      return { enabled: false, reason: "fetch-failed" };
    }
    const json = (await res.json().catch(() => ({}))) as TpResponse;
    const offers = mapTrustedPartsToOffers(json);
    if (offers.length === 0) return { enabled: false, reason: "no-data" };
    return { enabled: true, source: "TrustedParts (ECIA)", offers, fetchedAt: new Date().toISOString() };
  } catch (e) {
    logApiError("ecia:offers", e);
    return { enabled: false, reason: "fetch-failed" };
  }
}
