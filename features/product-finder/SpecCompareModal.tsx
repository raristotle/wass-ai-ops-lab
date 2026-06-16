"use client";

import type { MouseEvent } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { PRODUCT_MAP, getTotalBranchStock, getTotalDCStock } from "@/data/mock/catalog-products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CatalogProduct, ProductSpec } from "@/features/product-finder/types";

// ─── Print date helper ────────────────────────────────────────────────────────

function formatPrintDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildSpecOrder(products: CatalogProduct[]): ProductSpec[] {
  const nonNegSeen = new Map<string, string>(); // name -> first value seen
  const regularSeen = new Map<string, string>();

  for (const p of products) {
    for (const s of p.specs) {
      if (s.isNonNeg) {
        if (!nonNegSeen.has(s.name)) nonNegSeen.set(s.name, s.value);
      } else {
        if (!regularSeen.has(s.name)) regularSeen.set(s.name, s.value);
      }
    }
  }

  const nonNeg: ProductSpec[] = Array.from(nonNegSeen.keys()).map((name) => ({
    name,
    value: nonNegSeen.get(name)!, // safe: we just iterated keys() of this map
    isNonNeg: true,
  }));
  const regular: ProductSpec[] = Array.from(regularSeen.keys()).map((name) => ({
    name,
    value: regularSeen.get(name)!, // safe: we just iterated keys() of this map
  }));
  return [...nonNeg, ...regular];
}

function getSpecValue(product: CatalogProduct, specName: string): string | null {
  const found = product.specs.find((s) => s.name === specName);
  return found ? found.value : null;
}

function allSame(values: (string | null)[]): boolean {
  const filled = values.filter((v): v is string => v !== null);
  if (filled.length <= 1) return true;
  return filled.every((v) => v === filled[0]);
}

function cheapestIndex(products: CatalogProduct[]): number {
  let minIdx = 0;
  for (let i = 1; i < products.length; i++) {
    if (products[i].unitPrice < products[minIdx].unitPrice) minIdx = i;
  }
  return minIdx;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SpecCompareModal() {
  const { compareIds, compareModalOpen, setCompareModalOpen, clearCompare, addToCart, results, user } =
    useProductFinder();

  const handlePrint = () => {
    window.print();
  };

  if (!compareModalOpen) return null;

  // Resolve compare products: look in PRODUCT_MAP first, fallback to results
  const compareProducts: CatalogProduct[] = Array.from(compareIds)
    .map((id) => PRODUCT_MAP.get(id) ?? results.find((p) => p.id === id) ?? null)
    .filter((p): p is CatalogProduct => p !== null)
    .slice(0, 4);

  if (compareProducts.length === 0) return null;

  const specOrder = buildSpecOrder(compareProducts);
  const cheapest = cheapestIndex(compareProducts);

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setCompareModalOpen(false);
  };

  const handleAddAll = () => {
    for (const p of compareProducts) addToCart(p);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:static print:bg-white print:p-0 print:block print:h-auto print:overflow-visible"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Compare Products"
    >
      <div
        id="spec-compare-sheet"
        className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl flex flex-col print:max-h-none print:overflow-visible print:shadow-none print:rounded-none print:max-w-none"
      >
        {/* Header — screen only */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-[#1D252D] rounded-t-xl">
          <h2 className="text-white font-semibold text-lg">
            Compare Products ({compareProducts.length} selected)
          </h2>
          <button
            onClick={() => setCompareModalOpen(false)}
            className="text-white/80 hover:text-white transition-colors text-2xl leading-none font-light"
            aria-label="Close compare modal"
          >
            &#x2715;
          </button>
        </div>

        {/* Print-only header */}
        <div className="hidden print:block px-0 pb-4 border-b border-[#B7C9D3]/60 mb-4">
          <h1 className="text-lg font-bold text-[#1D252D]">Product Comparison</h1>
          <p className="text-xs text-[#4F758B] mt-0.5">
            {formatPrintDate()}
            {user && (
              <span>
                {" "}
                &middot; {user.name} &middot; {user.branch}
              </span>
            )}
          </p>
        </div>

        {/* Scrollable content */}
        <div className="overflow-x-auto flex-1 print:overflow-visible">
          <table className="w-full text-sm border-collapse min-w-[600px]">
            {/* Product header columns */}
            <thead>
              <tr className="border-b border-gray-200">
                {/* Spec label column */}
                <th className="w-40 min-w-[160px] text-left px-4 py-4 text-[#4F758B] font-medium align-bottom bg-gray-50 border-r border-gray-200">
                  Specification
                </th>
                {compareProducts.map((product) => (
                  <th
                    key={product.id}
                    className="px-4 py-4 align-top text-left min-w-[200px] border-r border-gray-100 last:border-r-0"
                  >
                    <div className="flex flex-col gap-2">
                      {/* Icon + name */}
                      <div className="flex items-center gap-2">
                        <span className="text-2xl" aria-hidden="true">
                          {product.imageIcon}
                        </span>
                        <span className="font-semibold text-[#1D252D] text-sm leading-tight">
                          {product.name}
                        </span>
                      </div>
                      {/* Brand */}
                      <span className="text-xs text-[#4F758B]">{product.brand}</span>
                      {/* SKU */}
                      <span className="text-xs text-gray-400 font-mono">SKU: {product.sku}</span>
                      {/* Preferred badge */}
                      {product.preferred && (
                        <Badge className="w-fit text-xs bg-[#00AA13] text-white border-0">
                          Preferred
                        </Badge>
                      )}
                      {/* Price */}
                      <span className="font-bold text-[#1D252D] text-base">
                        ${product.unitPrice.toFixed(2)}
                        <span className="text-xs font-normal text-gray-400 ml-1">
                          /{product.uom}
                        </span>
                      </span>
                      {/* Add to Basket — screen only */}
                      <Button
                        size="sm"
                        className="bg-[#00AA13] hover:bg-[#008f10] text-white text-xs print:hidden"
                        onClick={() => addToCart(product)}
                      >
                        Add to Basket
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Price comparison row */}
              <tr className="border-b border-gray-100 bg-gray-50">
                <td className="px-4 py-3 text-[#4F758B] font-medium border-r border-gray-200 align-middle">
                  Unit Price
                </td>
                {compareProducts.map((product, idx) => (
                  <td
                    key={product.id}
                    className={cn(
                      "px-4 py-3 border-r border-gray-100 last:border-r-0 align-middle",
                      idx === cheapest ? "text-[#00AA13] font-bold" : "text-[#1D252D]"
                    )}
                  >
                    ${product.unitPrice.toFixed(2)}
                    {idx === cheapest && (
                      <span className="ml-1 text-xs bg-[#00AA13]/10 text-[#00AA13] px-1 py-0.5 rounded">
                        Best
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Stock comparison row */}
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3 text-[#4F758B] font-medium border-r border-gray-200 align-middle">
                  Branch / DC Stock
                </td>
                {compareProducts.map((product) => {
                  const branch = getTotalBranchStock(product);
                  const dc = getTotalDCStock(product);
                  const dotColor =
                    branch > 0
                      ? "bg-[#00AA13]"
                      : dc > 0
                      ? "bg-[#EAAA00]"
                      : "bg-gray-300";
                  return (
                    <td
                      key={product.id}
                      className="px-4 py-3 border-r border-gray-100 last:border-r-0 align-middle"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn("inline-block h-2 w-2 rounded-full flex-shrink-0", dotColor)}
                          aria-hidden="true"
                        />
                        <span className="text-xs text-[#1D252D]">
                          {branch} branch / {dc} DC
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Lifecycle row (#12) — EOL risk informs the substitution decision */}
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3 text-[#4F758B] font-medium border-r border-gray-200 align-middle">
                  Lifecycle
                </td>
                {compareProducts.map((product) => {
                  const ls = product.lifecycleStatus ?? "Active";
                  return (
                    <td
                      key={product.id}
                      className="px-4 py-3 border-r border-gray-100 last:border-r-0 align-middle"
                    >
                      <span className={cn("text-xs", ls !== "Active" ? "text-[#DB6B30] font-semibold" : "text-[#1D252D]")}>
                        {ls}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* Documented crosses row (#12) — second-source depth */}
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3 text-[#4F758B] font-medium border-r border-gray-200 align-middle">
                  Documented crosses
                </td>
                {compareProducts.map((product) => (
                  <td
                    key={product.id}
                    className="px-4 py-3 border-r border-gray-100 last:border-r-0 align-middle text-xs text-[#1D252D]"
                  >
                    {product.verifiedCrossCount ?? 0}
                  </td>
                ))}
              </tr>

              {/* Spec rows */}
              {specOrder.map((spec) => {
                const values = compareProducts.map((p) => getSpecValue(p, spec.name));
                const same = allSame(values);
                return (
                  <tr
                    key={spec.name}
                    className={cn(
                      "border-b border-gray-100",
                      !same && "bg-[#EAAA00]/10"
                    )}
                  >
                    <td className="px-4 py-2.5 text-[#4F758B] font-medium border-r border-gray-200 align-middle">
                      <div className="flex items-center gap-1">
                        {spec.isNonNeg && (
                          <span className="text-xs" aria-label="Non-negotiable spec">
                            &#x1F512;
                          </span>
                        )}
                        <span>{spec.name}</span>
                      </div>
                    </td>
                    {values.map((val, idx) => (
                      <td
                        key={compareProducts[idx].id}
                        className={cn(
                          "px-4 py-2.5 border-r border-gray-100 last:border-r-0 align-middle",
                          same ? "text-gray-400" : "text-[#1D252D]"
                        )}
                      >
                        {val ?? (
                          <span className="text-gray-300" aria-label="Not available">
                            &mdash;
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer — screen only */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <Button
            variant="outline"
            size="sm"
            onClick={clearCompare}
            className="text-gray-600 border-gray-300 hover:bg-gray-100"
          >
            Clear Compare
          </Button>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-[#B7C9D3] text-[#1D252D]"
              onClick={handlePrint}
            >
              Download Comparison (PDF)
            </Button>
            <Button
              size="sm"
              className="bg-[#1D252D] hover:bg-[#2d3843] text-white"
              onClick={handleAddAll}
            >
              Add All to Basket
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
