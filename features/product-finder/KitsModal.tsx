"use client";

import { useState, useEffect } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";
import { apiSearch } from "@/lib/product-finder-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KIT_DEFS, kitRollup, type KitDef } from "@/lib/product-finder-kits";
import { getTotalBranchStock } from "@/data/mock/catalog-products";
import type { CatalogProduct, FilterState } from "@/features/product-finder/types";

const CATEGORY_COLOR: Record<KitDef["category"], string> = {
  wiring: "#DB6B30",
  lighting: "#EAAA00",
  power: "#004986",
  datacom: "#64CCC9",
  safety: "#00573F",
};

/** Resolve the best stocked product for a kit line. */
async function resolveKitLine(searchQuery: string, subcategory: string): Promise<CatalogProduct | null> {
  const filters: FilterState = {
    query: searchQuery,
    categories: new Set(),
    subcategories: new Set([subcategory]),
    brands: new Set(),
    onlyBranchStock: false,
    onlyDCStock: false,
    onlyPreferred: false,
    onlyActive: true,
    onlyWithCrosses: false,
    priceMin: null,
    priceMax: null,
    sortKey: "branchStock",
    viewMode: "list",
    specFilters: {},
    specRanges: {},
  };
  try {
    const res = await apiSearch(filters, 0, 1);
    return res.items[0] ?? null;
  } catch {
    return null;
  }
}

interface ResolvedLine {
  product: CatalogProduct | null;
  inStock: boolean;
}

export function KitsModal() {
  const open = useProductFinder((s) => s.kitsOpen);
  const setOpen = useProductFinder((s) => s.setKitsOpen);
  const closeRef = useModalA11y(open, () => setOpen(false));
  const addToCart = useProductFinder((s) => s.addToCart);
  const setCartOpen = useProductFinder((s) => s.setCartOpen);

  const [selectedKit, setSelectedKit] = useState<KitDef | null>(null);
  const [resolvedLines, setResolvedLines] = useState<ResolvedLine[]>([]);
  const [resolving, setResolving] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!selectedKit) { setResolvedLines([]); return; }
    // Cancellation guard: if the user switches kits while a slow resolve is in
    // flight, a late response must NOT overwrite the newer kit's lines (which would
    // mis-describe stock/price and let the wrong products be added to the cart).
    let cancelled = false;
    setResolving(true);
    setAdded(false);
    Promise.all(
      selectedKit.lines.map(async (line) => {
        const product = await resolveKitLine(line.searchQuery, line.subcategory);
        const inStock = product !== null && getTotalBranchStock(product) >= line.qty;
        return { product, inStock };
      }),
    ).then((results) => {
      if (cancelled) return;
      setResolvedLines(results);
      setResolving(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedKit]);

  if (!open) return null;

  const rollup =
    selectedKit && resolvedLines.length
      ? kitRollup(
          selectedKit.lines.map((def, i) => ({
            def,
            unitPrice: resolvedLines[i]?.product?.unitPrice ?? null,
            inStock: resolvedLines[i]?.inStock ?? false,
          })),
        )
      : null;

  const canAddKit =
    !resolving &&
    rollup?.inStock &&
    resolvedLines.every((rl, i) => selectedKit!.lines[i].optional || rl.product !== null);

  function handleAddKit() {
    if (!selectedKit || !canAddKit) return;
    selectedKit.lines.forEach((line, i) => {
      const product = resolvedLines[i]?.product;
      if (product) addToCart(product, line.qty);
    });
    setAdded(true);
    setTimeout(() => { setAdded(false); setOpen(false); setCartOpen(true); }, 800);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Kits and assemblies"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div className="flex items-center gap-3">
            {selectedKit && (
              <button
                type="button"
                onClick={() => setSelectedKit(null)}
                className="text-sm text-[#B7C9D3] hover:text-white"
                aria-label="Back to kits list"
              >
                ← Back
              </button>
            )}
            <div>
              <h2 className="text-base font-semibold text-white">
                {selectedKit ? selectedKit.name : "Kits & Assemblies"}
              </h2>
              <p className="text-xs text-[#B7C9D3]">
                {selectedKit
                  ? selectedKit.description
                  : "Curated bundles — add every component with one click."}
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close kits modal"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Kit list */}
          {!selectedKit && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {KIT_DEFS.map((kit) => {
                const color = CATEGORY_COLOR[kit.category];
                return (
                  <button
                    key={kit.id}
                    type="button"
                    onClick={() => setSelectedKit(kit)}
                    className={cn(
                      "rounded-lg border border-[#B7C9D3] bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AA13]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                        style={{ backgroundColor: color }}
                      >
                        {kit.category}
                      </span>
                      {kit.priceRange && (
                        <span className="text-[11px] text-[#4F758B]">{kit.priceRange}</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#1D252D]">{kit.name}</p>
                    <p className="mt-0.5 text-xs text-[#4F758B] line-clamp-2">{kit.description}</p>
                    <p className="mt-2 text-[11px] text-[#B7C9D3]">
                      {kit.lines.length} component{kit.lines.length !== 1 ? "s" : ""}
                      {kit.lines.some((l) => l.optional) ? " (some optional)" : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Kit detail */}
          {selectedKit && (
            <div>
              {resolving && (
                <p className="py-4 text-center text-sm text-[#4F758B]">Resolving components…</p>
              )}
              {!resolving && (
                <>
                  <div className="divide-y divide-[#B7C9D3]/50 rounded-lg border border-[#B7C9D3]">
                    {selectedKit.lines.map((line, i) => {
                      const rl = resolvedLines[i];
                      const product = rl?.product;
                      const inStock = rl?.inStock ?? false;
                      return (
                        <div key={i} className="flex items-start gap-3 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#1D252D]">
                              {line.label}
                              {line.optional && (
                                <span className="ml-1 text-[#4F758B]">(optional)</span>
                              )}
                            </p>
                            {line.note && (
                              <p className="text-[11px] text-[#4F758B]">{line.note}</p>
                            )}
                            {product ? (
                              <p className="mt-0.5 truncate text-[11px] text-[#1D252D]">
                                {product.name} · SKU {product.sku}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-[11px] text-[#DB6B30]">
                                No stocked match — may need manual selection
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            {product && (
                              <p className="text-xs font-medium text-[#1D252D]">
                                ${(product.unitPrice * line.qty).toFixed(2)}
                              </p>
                            )}
                            <p
                              className={cn(
                                "text-[10px] font-semibold",
                                inStock ? "text-[#00AA13]" : "text-[#DB6B30]",
                              )}
                            >
                              {inStock ? "In stock" : product ? "Low/OOS" : "—"}
                            </p>
                            <p className="text-[10px] text-[#4F758B]">×{line.qty}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Rollup + add button */}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#1D252D]">
                        Kit total: ${rollup?.totalPrice.toFixed(2) ?? "—"}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          rollup?.inStock ? "text-[#00AA13]" : "text-[#DB6B30]",
                        )}
                      >
                        {rollup?.inStock
                          ? "All required components in stock"
                          : "One or more required components out of stock"}
                      </p>
                    </div>
                    <Button
                      onClick={handleAddKit}
                      disabled={!canAddKit || added}
                      className="bg-[#00AA13] text-white hover:bg-[#00880F] disabled:opacity-50"
                    >
                      {added ? "Added ✓" : "Add kit to cart"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
