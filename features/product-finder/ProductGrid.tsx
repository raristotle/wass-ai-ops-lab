"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/features/product-finder/ProductCard";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct, SortKey } from "@/features/product-finder/types";

interface ProductGridProps {
  products: CatalogProduct[];
  referenceProduct?: CatalogProduct | null;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "preferred", label: "Preferred Suppliers First" },
  { value: "branchStock", label: "Local Stock High→Low" },
  { value: "priceLow", label: "Price: Low→High" },
  { value: "priceHigh", label: "Price: High→Low" },
  { value: "brand", label: "Brand A–Z" },
];

export function ProductGrid({
  products,
  referenceProduct,
}: ProductGridProps) {
  const viewMode = useProductFinder((s) => s.filters.viewMode);
  const setViewMode = useProductFinder((s) => s.setViewMode);
  const sortKey = useProductFinder((s) => s.filters.sortKey);
  const setSortKey = useProductFinder((s) => s.setSortKey);
  const loading = useProductFinder((s) => s.loading);
  const total = useProductFinder((s) => s.total);
  const results = useProductFinder((s) => s.results);
  const loadMore = useProductFinder((s) => s.loadMore);
  const compareIds = useProductFinder((s) => s.compareIds);
  const clearCompare = useProductFinder((s) => s.clearCompare);
  const setCompareModalOpen = useProductFinder((s) => s.setCompareModalOpen);

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSortKey(e.target.value as SortKey);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── Compare bar ─────────────────────────────────────────── */}
      {compareIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-[#004986]/30 bg-[#004986]/5 px-4 py-2.5">
          <span className="text-sm text-[#004986] font-medium">
            Comparing {compareIds.size} product{compareIds.size !== 1 ? "s" : ""}
          </span>
          <Button
            size="sm"
            className="bg-[#004986] hover:bg-[#004986]/90 text-white border-0 ml-auto"
            onClick={() => setCompareModalOpen(true)}
          >
            Compare Specs
          </Button>
          <button
            type="button"
            onClick={clearCompare}
            className="text-xs text-[#4F758B] hover:text-[#1D252D] underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Results bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "text-sm font-semibold",
            total > 0 ? "text-[#00AA13]" : "text-[#4F758B]"
          )}
        >
          {total} product{total !== 1 ? "s" : ""} found
        </span>

        <div className="flex items-center gap-2 ml-auto">
          {/* Sort select */}
          <select
            value={sortKey}
            onChange={handleSortChange}
            className="text-xs border border-[#B7C9D3] rounded-md px-2 py-1.5 text-[#1D252D] bg-white focus:outline-none focus:ring-1 focus:ring-[#004986]"
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* View mode toggle */}
          <div className="flex border border-[#B7C9D3] rounded-md overflow-hidden">
            <button
              type="button"
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
              className={cn(
                "px-2.5 py-1.5 text-xs",
                viewMode === "list"
                  ? "bg-[#1D252D] text-white"
                  : "bg-white text-[#4F758B] hover:bg-[#B7C9D3]/20"
              )}
            >
              ☰
            </button>
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              className={cn(
                "px-2.5 py-1.5 text-xs border-l border-[#B7C9D3]",
                viewMode === "grid"
                  ? "bg-[#1D252D] text-white"
                  : "bg-white text-[#4F758B] hover:bg-[#B7C9D3]/20"
              )}
            >
              ⊞
            </button>
          </div>
        </div>
      </div>

      {/* ── Empty state ──────────────────────────────────────────── */}
      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4" role="img" aria-label="Electrical plug">
            🔌
          </span>
          <p className="text-base font-semibold text-[#1D252D] mb-1">
            No products found
          </p>
          <p className="text-sm text-[#4F758B]">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* ── Product list or grid ─────────────────────────────────── */}
      {products.length > 0 && (
        <div
          className={cn(
            viewMode === "list"
              ? "flex flex-col gap-3"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          )}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              referenceProduct={referenceProduct ?? undefined}
            />
          ))}
        </div>
      )}

      {/* ── Load more ────────────────────────────────────────────── */}
      {results.length < total && (
        <div className="flex justify-center pt-2">
          <Button type="button" onClick={() => loadMore()} disabled={loading}
            className="bg-[#1D252D] text-white hover:bg-[#2d3740]">
            {loading ? "Loading…" : `Load more (${total - results.length} more)`}
          </Button>
        </div>
      )}
    </div>
  );
}
