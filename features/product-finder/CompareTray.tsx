"use client";

import { useProductFinder } from "@/lib/product-finder-store";
import { PRODUCT_MAP, getTotalBranchStock, getTotalDCStock } from "@/data/mock/catalog-products";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Sticky compare tray (#3) — a Digi-Key/Mouser-style persistent bottom bar that
 * accumulates compare selections ACROSS result pages and views (mounted in the
 * shell, not the results page) and opens the existing spec-compare modal. Each
 * chip flags the cheapest / most-available option from data already in hand.
 * Renders nothing when the compare set is empty.
 */
export function CompareTray() {
  const compareIds = useProductFinder((s) => s.compareIds);
  const toggleCompare = useProductFinder((s) => s.toggleCompare);
  const clearCompare = useProductFinder((s) => s.clearCompare);
  const setCompareModalOpen = useProductFinder((s) => s.setCompareModalOpen);
  const results = useProductFinder((s) => s.results);

  if (compareIds.size === 0) return null;

  const products: CatalogProduct[] = Array.from(compareIds)
    .map((id) => PRODUCT_MAP.get(id) ?? results.find((p) => p.id === id) ?? null)
    .filter((p): p is CatalogProduct => p !== null);

  if (products.length === 0) return null;

  const cheapestId = products.reduce((m, p) => (p.unitPrice < m.unitPrice ? p : m), products[0]).id;
  const stockOf = (p: CatalogProduct) => getTotalBranchStock(p) + getTotalDCStock(p);
  const mostAvailableId = products.reduce((m, p) => (stockOf(p) > stockOf(m) ? p : m), products[0]).id;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#004986]/30 bg-white/95 px-4 py-2.5 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] backdrop-blur print:hidden"
      role="region"
      aria-label="Compare tray"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-[#004986] sm:block">
          Compare
        </span>
        <ul className="flex flex-1 flex-wrap gap-1.5">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-1 rounded-full border border-[#B7C9D3] bg-white py-0.5 pl-2 pr-1 text-xs"
            >
              <span className="max-w-[150px] truncate font-medium text-[#1D252D]" title={p.name}>
                {p.sku}
              </span>
              {p.id === cheapestId && (
                <span className="rounded bg-[#00AA13]/10 px-1 text-[10px] font-medium text-[#00573F]" title="Lowest price">
                  $ low
                </span>
              )}
              {p.id === mostAvailableId && p.id !== cheapestId && (
                <span className="rounded bg-[#004986]/10 px-1 text-[10px] font-medium text-[#004986]" title="Most available">
                  in stock
                </span>
              )}
              <button
                type="button"
                onClick={() => toggleCompare(p.id)}
                aria-label={`Remove ${p.sku} from compare`}
                className="ml-0.5 rounded-full px-1 text-[#4F758B] hover:bg-[#B7C9D3]/30 hover:text-[#1D252D]"
              >
                &#x2715;
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setCompareModalOpen(true)}
          className="shrink-0 rounded bg-[#004986] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#004986]/90"
        >
          Compare {products.length}
        </button>
        <button
          type="button"
          onClick={clearCompare}
          className="shrink-0 text-xs text-[#4F758B] underline hover:text-[#1D252D]"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
