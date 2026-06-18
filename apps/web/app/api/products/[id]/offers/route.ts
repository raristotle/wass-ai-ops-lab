import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/index";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { getLiveQuotes, liveDistributorsConfigured } from "@/lib/integration/distributor-live";
import { eciaConfigured, getTrustedPartsOffers } from "@/lib/integration/trustedparts-live";
import { getOemsecretsOffers, oemsecretsConfigured } from "@/lib/integration/oemsecrets-live";
import { internalOffer, liveQuoteToOffer } from "@/lib/product-finder-offer-build";
import { bestOffer, offerSources, rankOffers, type Offer } from "@/lib/product-finder-offers";

export const dynamic = "force-dynamic";

/**
 * Aggregated offer ladder for a product (v3-S5 #12). Stacks the ALWAYS-ON
 * internal Meridian offer plus every CONFIGURED external source into one ranked
 * seller / stock / lead / price ladder. Every external lane is dormant by
 * default — with no keys set this returns just the internal offer and makes zero
 * outbound calls ($0). External sources only query when their key is present AND
 * the product is a real (verified/curated) part number; simulated SKUs never hit
 * a distributor API.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);

  const { id } = await ctx.params;
  const product = getCatalog().byId.get(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Lane 1 (always on): the internal Meridian branch/DC offer.
  const offers: Offer[] = [internalOffer(product)];
  const sources: Record<string, string> = { meridian: "internal" };

  // External lanes only make sense for real part numbers.
  const realPart = product.dataSource === "verified" || product.dataSource === "curated";
  const liveOn = liveDistributorsConfigured().length > 0;
  const eciaOn = eciaConfigured();
  const oemOn = oemsecretsConfigured();

  if (realPart && (liveOn || eciaOn || oemOn)) {
    const [live, ecia, oem] = await Promise.all([
      liveOn ? getLiveQuotes(product.sku).catch(() => []) : Promise.resolve([]),
      eciaOn ? getTrustedPartsOffers(product.sku) : Promise.resolve({ enabled: false as const, reason: "no-keys" as const }),
      oemOn ? getOemsecretsOffers(product.sku) : Promise.resolve({ enabled: false as const, reason: "no-keys" as const }),
    ]);

    for (const q of live) offers.push(liveQuoteToOffer(q));
    if (live.length > 0) sources.live = "ok";
    if (ecia.enabled) {
      offers.push(...ecia.offers);
      sources.ecia = "ok";
    } else if (eciaOn) {
      sources.ecia = ecia.reason;
    }
    if (oem.enabled) {
      offers.push(...oem.offers);
      sources.oemsecrets = "ok";
    } else if (oemOn) {
      sources.oemsecrets = oem.reason;
    }
  }

  const ranked = rankOffers(offers);
  return NextResponse.json({
    productId: product.id,
    realPart,
    ladder: ranked,
    best: bestOffer(offers),
    sourceCount: offerSources(ranked).length,
    // Per-lane status for the panel/debugging — never includes any key material.
    lanes: sources,
    fetchedAt: new Date().toISOString(),
  });
}
