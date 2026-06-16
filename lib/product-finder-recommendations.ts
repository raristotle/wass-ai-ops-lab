/**
 * Recommendation engine — pure, count-based collaborative filtering + a
 * margin/availability-protecting substitution optimizer. No vendor, no model,
 * no network: both functions are pure over the order history the store already
 * holds (mirrors product-finder-foryou.ts) and are fully unit-tested.
 */

import type { CatalogProduct } from "@/features/product-finder/types";
import type { Order } from "@/lib/product-finder-store";

// ── Also-bought (count-based collaborative filtering) ──────────────────────────

export interface AlsoBought {
  product: CatalogProduct;
  /** Number of the seed product's orders that also contained this product. */
  coOrders: number;
}

/**
 * "Customers who ordered X also ordered…" — for every order containing
 * `productId`, tally the OTHER distinct products in that order and rank by
 * co-occurrence (ties broken by name for determinism). Excludes the seed and any
 * `excludeIds` (e.g. what's already in the cart). Empty when the seed was never
 * ordered.
 */
export function alsoBought(
  orders: Order[],
  productId: string,
  opts?: { excludeIds?: ReadonlySet<string>; k?: number },
): AlsoBought[] {
  const k = opts?.k ?? 4;
  const exclude = opts?.excludeIds ?? new Set<string>();
  const counts = new Map<string, AlsoBought>();
  for (const order of orders) {
    if (!order.lines.some((l) => l.product.id === productId)) continue;
    const seen = new Set<string>(); // count each product at most once per order
    for (const line of order.lines) {
      const id = line.product.id;
      if (id === productId || exclude.has(id) || seen.has(id)) continue;
      seen.add(id);
      const e = counts.get(id);
      if (e) e.coOrders += 1;
      else counts.set(id, { product: line.product, coOrders: 1 });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.coOrders - a.coOrders || a.product.name.localeCompare(b.product.name))
    .slice(0, k);
}

// ── Substitution optimizer (margin- + availability-protecting) ─────────────────

export interface SubstituteSuggestion {
  product: CatalogProduct;
  inStock: boolean;
  preferred: boolean;
  /** Best-first reasons this substitute ranks where it does. */
  reasons: string[];
}

/**
 * Rank substitute candidates for a product, protecting availability and margin:
 * in-stock first, then preferred-line (better terms/margin), then lower price.
 * Pure — the caller supplies the candidate substitutes (alternatives /
 * source-backed crosses) and a `branchStockOf` accessor for on-hand quantity.
 */
export function optimizeSubstitution(
  candidates: CatalogProduct[],
  branchStockOf: (p: CatalogProduct) => number,
  k = 3,
): SubstituteSuggestion[] {
  return candidates
    .map((product) => {
      const stock = branchStockOf(product);
      const inStock = stock > 0;
      const reasons: string[] = [];
      if (inStock) reasons.push(`In stock (${stock})`);
      if (product.preferred) reasons.push("Preferred line");
      return { product, inStock, preferred: product.preferred, reasons };
    })
    .sort((a, b) => {
      if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
      if (a.preferred !== b.preferred) return a.preferred ? -1 : 1;
      return a.product.unitPrice - b.product.unitPrice;
    })
    .slice(0, k);
}
