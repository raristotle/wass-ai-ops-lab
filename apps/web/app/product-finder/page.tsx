"use client";

import { useEffect, useRef } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { decodeCart } from "@/lib/product-finder-share";
import { apiGetProduct } from "@/lib/product-finder-api";
import {
  hasFilterParams,
  decodeFiltersFromQuery,
  buildShareQuery,
} from "@/lib/product-finder-url";
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

// ─── Chunk helper for bounded concurrency ────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductFinderPage() {
  const activeProduct = useProductFinder((s) => s.activeProduct);
  const results = useProductFinder((s) => s.results);
  const runNlSearch = useProductFinder((s) => s.runNlSearch);
  const filters = useProductFinder((s) => s.filters);
  const runSearch = useProductFinder((s) => s.runSearch);
  const setAllFilters = useProductFinder((s) => s.setAllFilters);
  const loading = useProductFinder((s) => s.loading);
  const error = useProductFinder((s) => s.error);
  const total = useProductFinder((s) => s.total);
  const addToCart = useProductFinder((s) => s.addToCart);
  const correction = useProductFinder((s) => s.correction);
  const dismissCorrection = useProductFinder((s) => s.dismissCorrection);

  // ── Load cart from ?cart= URL param (runs once on mount) ─────────────────
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const cartParam = sp.get("cart");
    if (!cartParam) return;

    const decoded = decodeCart(cartParam);
    if (!decoded || decoded.items.length === 0) {
      // Strip the param even if we can't decode it
      sp.delete("cart");
      const next = sp.toString();
      history.replaceState(null, "", next ? `?${next}` : window.location.pathname);
      return;
    }

    // Fetch products in chunks of 6 to avoid too many concurrent requests
    const { items, customer, project } = decoded;

    const loadAndPopulate = async () => {
      const chunks = chunk(items, 6);
      for (const batch of chunks) {
        const settled = await Promise.allSettled(
          batch.map((line) => apiGetProduct(line.id))
        );
        settled.forEach((result, idx) => {
          if (result.status === "fulfilled") {
            const product = result.value.product;
            addToCart(product, batch[idx].qty);
          }
          // ids that 404 or error are silently ignored
        });
      }

      // Restore quote meta to localStorage so CartDrawer picks it up on next render
      if (typeof localStorage !== "undefined") {
        if (customer) localStorage.setItem("pf_quote_customer", customer);
        if (project) localStorage.setItem("pf_quote_project", project);
      }

      // Strip the cart param from the URL to prevent re-adding on refresh.
      // Rebuild from the CURRENT location — not the mount-time `sp` snapshot —
      // so we don't clobber filter params the filters→URL subscription may
      // have written while the cart was loading.
      const cur = new URLSearchParams(window.location.search);
      cur.delete("cart");
      const qs = cur.toString();
      history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    };

    loadAndPopulate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — run once on mount only

  // ── URL hydration (once) + filters → URL subscription ─────────────────────
  // First pass: decode any filter params from the address bar into the store,
  // then run the initial search. After that, every filters change rewrites the
  // query string via history.replaceState so the current view is shareable.
  const didInit = useRef(false);
  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      const search = window.location.search;
      if (hasFilterParams(search)) setAllFilters(decodeFiltersFromQuery(search));
      runSearch();
    }
    const unsub = useProductFinder.subscribe((state, prev) => {
      if (state.filters === prev.filters) return;
      const qs = buildShareQuery(state.filters, state.pageSize, window.location.search);
      history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              {/* Auto-applied "showing results for…" correction notice */}
              {correction?.autoApplied && (
                <div className="flex items-center gap-2 rounded-lg bg-[#B7C9D3]/20 px-4 py-2 text-sm text-[#1D252D]">
                  <span>
                    Showing results for{" "}
                    <span className="font-semibold">&ldquo;{correction.corrected}&rdquo;</span>
                    {" "}— search instead for{" "}
                    <button
                      type="button"
                      onClick={() => runNlSearch(correction.original, { noCorrect: true })}
                      className="font-semibold underline underline-offset-2 hover:text-[#00AA13]"
                    >
                      &ldquo;{correction.original}&rdquo;
                    </button>
                  </span>
                  <button
                    type="button"
                    onClick={dismissCorrection}
                    aria-label="Dismiss correction notice"
                    className="ml-auto shrink-0 text-[#4F758B] hover:text-[#1D252D]"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Near-zero results: gentle "did you mean…?" line */}
              {correction && !correction.autoApplied && total > 0 && (
                <p className="text-sm text-[#1D252D]">
                  Did you mean{" "}
                  <button
                    type="button"
                    onClick={() => runNlSearch(correction.corrected, { noCorrect: true })}
                    className="font-semibold text-[#00AA13] underline underline-offset-2 hover:text-[#009911]"
                  >
                    {correction.corrected}
                  </button>
                  ?
                </p>
              )}

              {loading && results.length === 0 ? (
                <SearchLoadingState />
              ) : error && !loading ? (
                <SearchErrorBanner message={error} onRetry={runSearch} />
              ) : results.length === 0 && hasQueryOrFilters ? (
                <NoResultsState
                  onClear={() => runNlSearch("")}
                  suggestion={correction && !correction.autoApplied ? correction.corrected : null}
                  onTrySuggestion={(q) => runNlSearch(q, { noCorrect: true })}
                />
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
