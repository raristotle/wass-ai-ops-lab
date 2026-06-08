import type { CatalogProduct } from "@/features/product-finder/types";
import { scoreProduct } from "@/lib/product-finder-scoring";

/** Sum of all branch + DC stock for a product. */
export function totalStock(product: CatalogProduct): number {
  return (
    product.branchStock.reduce((s, b) => s + b.quantity, 0) +
    product.dcStock.reduce((s, d) => s + d.quantity, 0)
  );
}

/**
 * Pick the best in-stock substitute for an out-of-stock product from a
 * candidate pool. Ranking: recommendation score vs the reference (spec match,
 * preferred line, price) → total stock → id (deterministic tie-break).
 * Returns null when the pool has no in-stock candidate.
 */
export function pickInStockSubstitute(
  product: CatalogProduct,
  pool: CatalogProduct[],
): CatalogProduct | null {
  const ranked = pool
    .filter((p) => p.id !== product.id && totalStock(p) > 0)
    .map((p) => ({
      p,
      score: scoreProduct(p, product).total,
      stock: totalStock(p),
    }))
    .sort(
      (a, b) =>
        b.score - a.score || b.stock - a.stock || a.p.id.localeCompare(b.p.id),
    );
  return ranked[0]?.p ?? null;
}
