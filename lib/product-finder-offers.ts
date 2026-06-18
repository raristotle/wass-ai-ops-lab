/**
 * Aggregated offer ladder (v3-S3... v3-S5 #12) — the foundation that stacks the
 * internal Meridian offer + every configured external source (Mouser/Digi-Key
 * live, ECIA TrustedParts, OEMsecrets) into ONE sortable seller / stock / lead /
 * unit-price ladder with a quantity-break price curve. Pure + deterministic; the
 * route does the (dormant-safe) fetching and feeds the results in here.
 */

export interface OfferBreak {
  qty: number;
  price: number;
}

export interface Offer {
  /** Seller / source label, e.g. "Meridian (branch)", "Mouser Electronics". */
  source: string;
  /** True for an authorized-distributor source (ECIA) or the internal branch. */
  authorized: boolean;
  stock: number | null;
  leadDays: number | null;
  /**
   * Entry (smallest-break / qty-1) unit price — the fair cross-source comparator
   * the ladder ranks on; the full volume curve lives in `priceBreaks`. Null when
   * the source returned no price.
   */
  unitPrice: number | null;
  priceBreaks: OfferBreak[];
  url: string | null;
}

/**
 * Rank offers for the ladder: in-stock first, then lowest unit price, then
 * authorized sources ahead of brokers, then by source name (stable). Unpriced
 * offers sink to the bottom of their stock group.
 */
export function rankOffers(offers: Offer[]): Offer[] {
  const priceOf = (o: Offer) => (o.unitPrice == null ? Number.POSITIVE_INFINITY : o.unitPrice);
  const stockRank = (o: Offer) => (o.stock != null && o.stock > 0 ? 0 : 1);
  return [...offers].sort(
    (a, b) =>
      stockRank(a) - stockRank(b) ||
      priceOf(a) - priceOf(b) ||
      (a.authorized === b.authorized ? 0 : a.authorized ? -1 : 1) ||
      a.source.localeCompare(b.source),
  );
}

/** The single best offer (top of the ranked ladder), or null. */
export function bestOffer(offers: Offer[]): Offer | null {
  return rankOffers(offers)[0] ?? null;
}

/** Distinct sources present in the ladder (for the "N sources" summary). */
export function offerSources(offers: Offer[]): string[] {
  return [...new Set(offers.map((o) => o.source))];
}

/**
 * The unit price at the smallest quantity break (the entry price a buyer first
 * sees), or null when there are no breaks. Source adapters use this so every
 * Offer.unitPrice is a comparable qty-1 entry price rather than a deep-volume
 * floor — otherwise a broker quoting a huge qty-10k break would falsely rank
 * cheapest.
 */
export function entryPrice(breaks: OfferBreak[]): number | null {
  let best: OfferBreak | null = null;
  for (const b of breaks) {
    if (typeof b.qty !== "number" || typeof b.price !== "number") continue;
    if (best == null || b.qty < best.qty) best = b;
  }
  return best ? best.price : null;
}

export interface CurvePoint {
  qty: number;
  price: number;
}

/**
 * Quantity-break price curve for the mini sparkline — de-duplicated by qty,
 * sorted ascending, with each qty taking its lowest price.
 */
export function priceCurve(breaks: OfferBreak[]): CurvePoint[] {
  const byQty = new Map<number, number>();
  for (const b of breaks) {
    if (typeof b.qty !== "number" || typeof b.price !== "number") continue;
    const cur = byQty.get(b.qty);
    if (cur == null || b.price < cur) byQty.set(b.qty, b.price);
  }
  return [...byQty.entries()].map(([qty, price]) => ({ qty, price })).sort((a, b) => a.qty - b.qty);
}
