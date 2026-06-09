import type { CatalogProduct } from "@/features/product-finder/types";
import { getCatalog } from "@/lib/catalog/index";
import { findEquivalents } from "@/lib/catalog/equivalents";
import { functionalEquivalents, isFunctionalEquivalent } from "@/lib/catalog/equivalence";

/**
 * Catalog quality metric for cross-reference / functional-equivalent precision.
 *
 * The "alternatives" the recommender shows must be genuine cross-references —
 * interchangeable parts, not merely similar ones. These metrics quantify that:
 *
 *   top1Accuracy  — of products that HAVE a true equivalent in the catalog, the
 *                   fraction whose #1 alternative is a true functional equivalent.
 *                   Target: 1.0 (never lead with a non-interchangeable part).
 *   precisionAtK  — average fraction of the returned K alternatives that are true
 *                   functional equivalents (the rest are closest near-matches,
 *                   surfaced only to fill K for rare spec combinations).
 */
export interface EquivalenceMetrics {
  sampled: number;
  withOpportunity: number;
  top1Accuracy: number;
  precisionAtK: number;
}

export function measureEquivalence(sample: CatalogProduct[], k = 8): EquivalenceMetrics {
  let withOpportunity = 0;
  let top1True = 0;
  let precisionNumer = 0;
  let precisionDenom = 0;

  for (const p of sample) {
    if (functionalEquivalents(p, 1).length === 0) continue; // no true equivalent exists
    withOpportunity++;

    const got = findEquivalents(p, k);
    if (got.length > 0 && isFunctionalEquivalent(p, got[0])) top1True++;
    for (const g of got) {
      precisionDenom++;
      if (isFunctionalEquivalent(p, g)) precisionNumer++;
    }
  }

  return {
    sampled: sample.length,
    withOpportunity,
    top1Accuracy: withOpportunity === 0 ? 1 : top1True / withOpportunity,
    precisionAtK: precisionDenom === 0 ? 1 : precisionNumer / precisionDenom,
  };
}

/** Deterministic evenly-spaced sample of the catalog (every `step`-th product). */
export function sampleCatalog(step = 137, limit = 400): CatalogProduct[] {
  const { products } = getCatalog();
  return products.filter((_, i) => i % step === 0).slice(0, limit);
}
