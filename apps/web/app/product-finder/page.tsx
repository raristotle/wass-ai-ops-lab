"use client";

import { useEffect } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { AuthGuard } from "@/features/product-finder/AuthGuard";
import { ProductFinderShell } from "@/features/product-finder/ProductFinderShell";
import { SearchBar } from "@/features/product-finder/SearchBar";
import { ProductGrid } from "@/features/product-finder/ProductGrid";
import { ExternalSourcesCard } from "@/features/product-finder/ExternalSourcesCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CatalogProduct } from "@/features/product-finder/types";
import { LandingState, NoResultsState } from "@/features/product-finder/EmptyState";
import { SavedAndRecentPanel } from "@/features/product-finder/SavedAndRecentPanel";

// ─── Active Product Banner ────────────────────────────────────────────────────

interface ActiveProductBannerProps {
  product: CatalogProduct;
}

function ActiveProductBanner({ product }: ActiveProductBannerProps) {
  const setActiveProduct = useProductFinder((s) => s.setActiveProduct);

  const branchTotal = product.branchStock.reduce((s, b) => s + b.quantity, 0);
  const dcTotal = product.dcStock.reduce((s, d) => s + d.quantity, 0);

  return (
    <div className="rounded-xl border border-[#4F758B]/30 bg-[#1D252D] p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        {/* Left: icon + details */}
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 text-3xl leading-none" role="img" aria-label={product.name}>
            {product.imageIcon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-bold text-white sm:text-lg">
                {product.name}
              </h2>
              {product.preferred && (
                <Badge className="shrink-0 border-0 bg-[#00AA13] text-white text-xs">
                  Preferred
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[#B7C9D3]">
              {product.brand} &middot; SKU: {product.sku} &middot; ${product.unitPrice.toFixed(2)}/{product.uom}
            </p>

            {/* Key spec chips */}
            {product.specs.filter((s) => s.isNonNeg).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.specs
                  .filter((s) => s.isNonNeg)
                  .slice(0, 5)
                  .map((spec) => (
                    <span
                      key={spec.name}
                      className="inline-flex rounded-md bg-[#4F758B]/40 px-2 py-0.5 text-xs font-medium text-white"
                    >
                      {spec.name}: {spec.value}
                    </span>
                  ))}
              </div>
            )}

            {/* Stock summary */}
            <p className="mt-2 text-xs text-[#B7C9D3]">
              Branch stock:{" "}
              <span className={branchTotal > 0 ? "text-[#00AA13] font-semibold" : "text-[#EAAA00] font-semibold"}>
                {branchTotal}
              </span>
              {" "}&middot; DC stock:{" "}
              <span className={dcTotal > 0 ? "text-[#00AA13] font-semibold" : "text-[#B7C9D3]"}>
                {dcTotal}
              </span>
            </p>
          </div>
        </div>

        {/* Change product button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setActiveProduct(null)}
          className="shrink-0 border-[#4F758B] bg-transparent text-[#B7C9D3] hover:border-white hover:bg-[#4F758B]/20 hover:text-white"
        >
          Change Product
        </Button>
      </div>
    </div>
  );
}

// ─── Loading placeholder ──────────────────────────────────────────────────────

function SearchLoadingState() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Searching…">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-[#B7C9D3] bg-white p-4"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#B7C9D3]/40 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/5 rounded bg-[#B7C9D3]/50" />
              <div className="h-3 w-3/5 rounded bg-[#B7C9D3]/30" />
              <div className="h-3 w-1/4 rounded bg-[#B7C9D3]/30" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────

interface SearchErrorBannerProps {
  message: string;
  onRetry: () => void;
}

function SearchErrorBanner({ message, onRetry }: SearchErrorBannerProps) {
  return (
    <div className="rounded-xl border border-[#DB6B30]/40 bg-[#DB6B30]/5 p-5">
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <span className="text-2xl shrink-0" role="img" aria-label="Warning">⚠️</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1D252D]">Search failed — please try again</p>
          {message && (
            <p className="mt-0.5 text-xs text-[#4F758B] truncate">{message}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-lg border border-[#1D252D] bg-white px-4 py-2 text-sm font-semibold text-[#1D252D] hover:bg-[#1D252D] hover:text-white transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductFinderPage() {
  const activeProduct = useProductFinder((s) => s.activeProduct);
  const results = useProductFinder((s) => s.results);
  const runNlSearch = useProductFinder((s) => s.runNlSearch);
  const filters = useProductFinder((s) => s.filters);
  const runSearch = useProductFinder((s) => s.runSearch);
  const loading = useProductFinder((s) => s.loading);
  const error = useProductFinder((s) => s.error);

  useEffect(() => { runSearch(); }, [runSearch]);

  const hasQueryOrFilters =
    filters.query.length > 0 ||
    filters.categories.size > 0 ||
    filters.brands.size > 0 ||
    filters.subcategories.size > 0 ||
    filters.onlyBranchStock ||
    filters.onlyDCStock ||
    filters.onlyPreferred ||
    filters.priceMin !== null ||
    filters.priceMax !== null;

  const totalInStock = activeProduct
    ? activeProduct.branchStock.reduce((s, b) => s + b.quantity, 0) +
      activeProduct.dcStock.reduce((s, d) => s + d.quantity, 0)
    : 0;

  return (
    <AuthGuard>
      <ProductFinderShell>
        <div className="p-4 space-y-4">
          <SearchBar />

          {activeProduct ? (
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* Left: reference banner + product grid */}
              <div className="min-w-0 flex-1 space-y-4">
                <ActiveProductBanner product={activeProduct} />
                <ProductGrid products={results} referenceProduct={activeProduct} />
              </div>

              {/* Right: external sources */}
              {totalInStock === 0 && (
                <div className="w-full shrink-0 lg:w-72">
                  <ExternalSourcesCard product={activeProduct} />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {loading && results.length === 0 ? (
                <SearchLoadingState />
              ) : error && !loading ? (
                <SearchErrorBanner message={error} onRetry={runSearch} />
              ) : results.length === 0 && hasQueryOrFilters ? (
                <NoResultsState onClear={() => runNlSearch("")} />
              ) : results.length === 0 ? (
                <LandingState />
              ) : (
                <>
                  {/* Default browse view (no query/filters): surface saved & recent above the grid */}
                  {!hasQueryOrFilters && <SavedAndRecentPanel />}
                  <ProductGrid products={results} />
                </>
              )}
            </div>
          )}
        </div>
      </ProductFinderShell>
    </AuthGuard>
  );
}
