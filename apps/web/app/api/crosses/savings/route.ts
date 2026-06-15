import { NextResponse } from "next/server";
import { resolvedCrossEntries, resolveStocked, provenancedIndex } from "@/lib/catalog/cross-runtime";
import { verifiedCrossesFor } from "@/lib/catalog/verified-crosses";
import { identifierKey } from "@/lib/catalog/identifiers";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import type { CrossCandidate } from "@/lib/catalog/cross-savings";

export const dynamic = "force-dynamic";

const SAVINGS_LIMIT = { limit: 60, windowMs: 60_000 };

const SKU_CAP = 200;

/**
 * Substitute-&-save candidates: POST { skus } → for each cart SKU, the stocked,
 * production-grade documented crosses (full product + citation). The client
 * prices both sides with its own store state and decides which swap saves money
 * (lib/catalog/cross-savings), so pricing stays consistent with the cart.
 */
export async function POST(req: Request) {
  const rl = await rateLimit(req, SAVINGS_LIMIT);
  if (!rl.ok) return tooManyRequests(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const skus = (body as { skus?: unknown })?.skus;
  if (!Array.isArray(skus) || skus.some((s) => typeof s !== "string")) {
    return NextResponse.json({ error: "skus must be a string array" }, { status: 400 });
  }

  const entries = resolvedCrossEntries();
  const candidates: Record<string, CrossCandidate[]> = {};
  for (const sku of skus.slice(0, SKU_CAP)) {
    const product = (provenancedIndex().get(identifierKey(sku)) ?? [])[0];
    if (!product) continue;
    const results = verifiedCrossesFor(product, entries, resolveStocked)
      .filter((r) => r.substituteProduct && r.productionReady)
      .map((r) => ({
        product: r.substituteProduct as NonNullable<typeof r.substituteProduct>,
        relation: r.relation,
        sourceKind: r.sourceKind,
        sourceUrl: r.sourceUrl,
        confidence: r.confidence,
        matchReason: r.matchReason,
      }));
    if (results.length > 0) candidates[sku] = results;
  }

  return NextResponse.json({ candidates });
}
