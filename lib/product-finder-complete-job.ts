import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * "Complete this job" — surfaces complementary products the basket is missing,
 * so a rep doesn't ship conduit with no fittings or a receptacle with no plate.
 *
 * CLIENT-SAFE: this module is pure — complements are INJECTED. Binding it to the
 * catalog's goesWith() here dragged the generated catalog into the browser bundle
 * (docs/perf-audit-2026-07-10.md); CartDrawer injects complements fetched from
 * /api/products/[id]/goeswith, and server callers can bind goesWith directly.
 */

export interface CompletionSuggestion {
  product: CatalogProduct;
  /** Which basket item drove this suggestion. */
  reason: string;
}

/**
 * Pure core: for each basket line, pull its complements (via the injected
 * resolver) and keep only those whose subcategory the basket does NOT already
 * cover — i.e. genuine gaps. Deduped, capped at `k`, basket order = priority.
 */
export function suggestCompletions(
  basket: { product: CatalogProduct }[],
  getComplements: (p: CatalogProduct) => CatalogProduct[],
  k = 4,
): CompletionSuggestion[] {
  const basketIds = new Set(basket.map((l) => l.product.id));
  const basketSubcats = new Set(basket.map((l) => l.product.subcategory));
  const seen = new Set<string>();
  const out: CompletionSuggestion[] = [];

  for (const { product } of basket) {
    for (const complement of getComplements(product)) {
      if (basketIds.has(complement.id) || seen.has(complement.id)) continue;
      if (basketSubcats.has(complement.subcategory)) continue; // already covered
      seen.add(complement.id);
      out.push({ product: complement, reason: `Pairs with ${product.name}` });
      if (out.length >= k) return out;
    }
  }
  return out;
}
