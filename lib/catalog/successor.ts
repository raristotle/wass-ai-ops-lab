/**
 * "Swap to the active successor" — for an obsolescent part, pick the best active
 * replacement from a list of equivalents that is ALREADY ranked by the detail
 * API (stock → preferred → price). Pure and side-effect free so it is trivially
 * testable; the UI fetches the equivalents and renders the result.
 */

import type { CatalogProduct } from "@/features/product-finder/types";
import { isActiveLifecycle, isObsolescent } from "@/lib/catalog/lifecycle";

/**
 * The best active successor for `product`, or null when the part is itself
 * active or no active equivalent exists. Input order is preserved as priority,
 * so the first active equivalent (the API's top-ranked) wins.
 */
export function pickActiveSuccessor(
  product: CatalogProduct,
  rankedEquivalents: CatalogProduct[],
): CatalogProduct | null {
  if (!isObsolescent(product.lifecycleStatus)) return null;
  for (const e of rankedEquivalents) {
    if (e.id !== product.id && isActiveLifecycle(e.lifecycleStatus)) return e;
  }
  return null;
}
