"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/features/product-finder/ProductCard";
import { ResultsTable } from "@/features/product-finder/ResultsTable";
import { AppliedFiltersBar } from "@/features/product-finder/AppliedFiltersBar";
import { useResultsKeyboard } from "@/features/product-finder/useResultsKeyboard";
import { useProductFinder } from "@/lib/product-finder-store";
import { searchResultsCsv, downloadCsv } from "@/lib/product-finder-csv";
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
  const substitutes = useProductFinder((s) => s.substitutes);
  const activeResultIndex = useProductFinder((s) => s.activeResultIndex);
  const setKeyboardHelpOpen = useProductFinder((s) => s.setKeyboardHelpOpen);

  // Keyboard-first power layer over the rendered results (j/k/a/c/Enter/?).
  useResultsKeyboard(products);

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSortKey(e.target.value as SortKey);
  }

  function handleExportCsv() {
    downloadCsv("product-results.csv", searchResultsCsv(products));
  }

  // ── Copy shareable link ─────────────────────────────────────────────────────
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => { if (copyTimer.current) clearTimeout(copyTimer.current); };
  }, []);

  async function handleCopyLink() {
    const url = window.location.href;
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      // Fallback for blocked clipboard API: hidden textarea + execCommand.
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.className = "sr-only";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopyState("copied");
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopyState("idle"), 2000);
    } else {
      setCopyState("failed");
    }
  }

  return (
    <div className="flex flex-col gap-3">
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
        {/* Keyboard power-layer hint (desktop only) */}
        {total > 0 && (
          <button
            type="button"
            onClick={() => setKeyboardHelpOpen(true)}
            className="hidden text-[11px] text-[#4F758B] underline decoration-dotted underline-offset-2 hover:text-[#1D252D] sm:inline"
            aria-label="Show keyboard shortcuts"
          >
            Press ? for shortcuts
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {/* Copy shareable link */}
          {total > 0 && (
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-xs border border-[#B7C9D3] rounded-md px-2 py-1.5 text-[#4F758B] bg-white hover:border-[#1D252D] hover:text-[#1D252D] transition-colors"
              aria-label="Copy shareable link to these results"
            >
              {copyState === "copied" ? "✓ Copied" : "🔗 Copy link"}
            </button>
          )}
          {total > 0 && copyState === "failed" && (
            <span className="text-[10px] text-[#DB6B30]">Copy from the address bar</span>
          )}

          {/* Export CSV */}
          {products.length > 0 && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="text-xs border border-[#B7C9D3] rounded-md px-2 py-1.5 text-[#4F758B] bg-white hover:border-[#1D252D] hover:text-[#1D252D] transition-colors"
              aria-label="Export visible results to CSV"
            >
              ⬇ Export CSV
            </button>
          )}

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
            <button
              type="button"
              aria-label="Table view"
              aria-pressed={viewMode === "table"}
              onClick={() => setViewMode("table")}
              className={cn(
                "px-2.5 py-1.5 text-xs border-l border-[#B7C9D3]",
                viewMode === "table"
                  ? "bg-[#1D252D] text-white"
                  : "bg-white text-[#4F758B] hover:bg-[#B7C9D3]/20"
              )}
            >
              ▦
            </button>
          </div>
        </div>
      </div>

      {/* ── Applied-filters overview bar (#2) ────────────────────── */}
      <AppliedFiltersBar />

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
      {products.length > 0 &&
        (viewMode === "table" ? (
          <ResultsTable products={products} />
        ) : (
          <div
            className={cn(
              viewMode === "list"
                ? "flex flex-col gap-3"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            )}
          >
            {products.map((product, i) => (
              <div
                key={product.id}
                data-result-index={i}
                aria-current={activeResultIndex === i ? "true" : undefined}
                className={cn(
                  "rounded-xl",
                  activeResultIndex === i && "ring-2 ring-[#00AA13] ring-offset-2 ring-offset-[#F8FAFB]"
                )}
              >
                <ProductCard
                  product={product}
                  referenceProduct={referenceProduct ?? undefined}
                  substitute={substitutes[product.id]}
                />
              </div>
            ))}
          </div>
        ))}

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
