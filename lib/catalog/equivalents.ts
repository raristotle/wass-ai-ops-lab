import type { CatalogProduct } from "@/features/product-finder/types";
import { getCatalog } from "@/lib/catalog/index";
import { scoreProduct } from "@/lib/product-finder-scoring";
import {
  isFunctionalEquivalent,
  functionalEquivalents,
  sharedNonNegCount,
} from "@/lib/catalog/equivalence";

/**
 * Returns up to `k` alternatives for a product, optimized for cross-reference
 * precision: TRUE functional equivalents (same subcategory + identical
 * non-negotiable specs — genuinely interchangeable) come first, ranked for the
 * rep. Only when fewer than `k` true equivalents exist do we backfill with the
 * closest near-matches (most shared non-negotiable specs, then recommendation
 * score) so the list is always useful without diluting interchangeability.
 */
export function findEquivalents(product: CatalogProduct, k = 8, branchId?: string): CatalogProduct[] {
  const exact = functionalEquivalents(product, k, branchId);
  if (exact.length >= k) return exact;

  const have = new Set(exact.map((p) => p.id));
  have.add(product.id);

  const { products } = getCatalog();
  // Backfill pool: same subcategory first, then same category, excluding the
  // product, anything already chosen, and any remaining true equivalents (those
  // are exhausted — exact.length < k means none are left).
  const sameSub = products.filter(
    (p) => !have.has(p.id) && p.subcategory === product.subcategory && !isFunctionalEquivalent(product, p),
  );
  const sameCat = products.filter(
    (p) => !have.has(p.id) && p.category === product.category && p.subcategory !== product.subcategory,
  );

  const backfill = [...sameSub, ...sameCat]
    .map((p) => ({
      p,
      shared: sharedNonNegCount(product, p),
      score: scoreProduct(p, product, branchId).total,
    }))
    .sort((a, b) => b.shared - a.shared || b.score - a.score || a.p.id.localeCompare(b.p.id))
    .slice(0, k - exact.length)
    .map((x) => x.p);

  return [...exact, ...backfill];
}
