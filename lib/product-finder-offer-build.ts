/**
 * Source mappers for the aggregated offer ladder (v3-S5 #12). These turn the
 * two ALWAYS-ON internal lanes — the Meridian branch/DC offer and the existing
 * live Mouser/Digi-Key quotes — into the shared `Offer` shape, so the route can
 * merge them with the dormant external adapters (ECIA, OEMsecrets) and rank one
 * unified ladder. Pure + unit-tested; the route owns the (dormant-safe) fetching.
 */

import type { CatalogProduct } from "@/features/product-finder/types";
import type { LiveQuote } from "@/lib/integration/distributor-live";
import { entryPrice, type Offer, type OfferBreak } from "@/lib/product-finder-offers";
import { priceTiers } from "@/lib/product-finder-pricing";

/**
 * The internal Meridian offer from catalog price tiers + on-hand stock. Always
 * authorized (it is our own stock). Lead time is 0 when a branch holds it, ~2d
 * from the DC, null when neither — mirroring the existing stock-warning logic.
 */
export function internalOffer(product: CatalogProduct): Offer {
  const priceBreaks: OfferBreak[] = priceTiers(product).map((t) => ({ qty: t.minQty, price: t.unitPrice }));
  const branch = product.branchStock.reduce((s, b) => s + b.quantity, 0);
  const dc = product.dcStock.reduce((s, d) => s + d.quantity, 0);
  const stock = branch + dc;
  return {
    source: "Meridian",
    authorized: true,
    stock,
    leadDays: branch > 0 ? 0 : dc > 0 ? 2 : null,
    unitPrice: entryPrice(priceBreaks), // qty-1 tier price
    priceBreaks,
    url: null,
  };
}

/**
 * A live distributor quote (Mouser / Digi-Key) as a ladder offer. Both are
 * authorized distributors. unitPrice prefers the API's quoted unit price and
 * falls back to the entry break.
 */
export function liveQuoteToOffer(q: LiveQuote): Offer {
  return {
    source: q.distributor,
    authorized: true,
    stock: q.stock,
    leadDays: null,
    unitPrice: q.unitPrice ?? entryPrice(q.priceBreaks),
    priceBreaks: q.priceBreaks,
    url: q.productUrl,
  };
}
