import type { CatalogProduct } from "@/features/product-finder/types";
import { getCatalog } from "@/lib/catalog/index";
import { isFunctionalEquivalent } from "@/lib/catalog/equivalence-core";

/**
 * Catalog-scanning half of functional equivalence. The pure comparators
 * (isFunctionalEquivalent, canonicalKeys/Value, sharedNonNegCount,
 * specOverlapScore) live in equivalence-core.ts — CLIENT-SAFE, taxonomy-only —
 * because importing them from here dragged the generated catalog into the
 * browser bundle (docs/perf-audit-2026-07-10.md). Server callers may keep
 * importing everything from this module via the re-exports below.
 */
export {
  canonicalKeys,
  canonicalValue,
  isFunctionalEquivalent,
  sharedNonNegCount,
  specOverlapScore,
} from "@/lib/catalog/equivalence-core";

/** Total branch + DC stock, used to rank equivalents by availability. */
function totalStock(p: CatalogProduct): number {
  return (
    p.branchStock.reduce((s, b) => s + b.quantity, 0) +
    p.dcStock.reduce((s, d) => s + d.quantity, 0)
  );
}

/** Stock at a specific branch (0 when absent), for branch-aware ranking. */
function branchStockAt(p: CatalogProduct, branchId?: string): number {
  if (!branchId) return 0;
  return p.branchStock.find((b) => b.branchId === branchId)?.quantity ?? 0;
}

/**
 * All true functional equivalents of `product` in the catalog, ranked for a rep:
 * preferred line first, then stock at the rep's branch, then total stock, then
 * lowest price, then id (stable).
 */
export function functionalEquivalents(
  product: CatalogProduct,
  k = 8,
  branchId?: string,
): CatalogProduct[] {
  const { products } = getCatalog();
  return products
    .filter((p) => isFunctionalEquivalent(product, p))
    .sort(
      (a, b) =>
        Number(b.preferred) - Number(a.preferred) ||
        branchStockAt(b, branchId) - branchStockAt(a, branchId) ||
        totalStock(b) - totalStock(a) ||
        a.unitPrice - b.unitPrice ||
        a.id.localeCompare(b.id),
    )
    .slice(0, k);
}
