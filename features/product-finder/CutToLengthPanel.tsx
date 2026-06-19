"use client";

import { useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { Button } from "@/components/ui/button";
import { isSoldByFoot, calcCutToLength, cutToLengthLabel } from "@/lib/product-finder-cut-to-length";
import type { CatalogProduct } from "@/features/product-finder/types";

interface Props {
  product: CatalogProduct;
  onAdded?: () => void;
}

/**
 * Inline cut-to-length panel for wire / conduit / strut sold by the foot.
 * Renders only when the product's UOM is "ft" or "lf".
 * qty = Math.ceil(footage); calls addToCart with computed qty.
 */
export function CutToLengthPanel({ product, onAdded }: Props) {
  const addToCart = useProductFinder((s) => s.addToCart);
  const setCartOpen = useProductFinder((s) => s.setCartOpen);
  const [lengthFt, setLengthFt] = useState(10);
  const [added, setAdded] = useState(false);

  if (!isSoldByFoot(product)) return null;

  const result = calcCutToLength(product, lengthFt);

  function handleAdd() {
    if (result.qty <= 0) return;
    addToCart(product, result.qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    onAdded?.();
    setCartOpen(true);
  }

  return (
    <div className="mt-3 rounded-lg border border-[#B7C9D3] bg-[#F1EFE8] px-4 py-3">
      <p className="mb-2 text-xs font-semibold text-[#1D252D]">Cut-to-length</p>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="1"
            step="1"
            value={lengthFt}
            onChange={(e) => setLengthFt(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 rounded border border-[#B7C9D3] px-2 py-1 text-sm text-[#1D252D] focus:border-[#00AA13] focus:outline-none"
            aria-label="Length in feet"
          />
          <span className="text-xs text-[#4F758B]">ft</span>
        </div>
        <div className="flex-1 text-xs text-[#1D252D]">
          {cutToLengthLabel(result)}
          {result.qty > lengthFt && (
            <span className="ml-1 text-[#4F758B]">({result.qty} ft ordered)</span>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={result.qty <= 0 || added}
          className="h-7 shrink-0 bg-[#00AA13] text-white hover:bg-[#00880F] disabled:opacity-50"
        >
          {added ? "Added ✓" : "Add to Basket"}
        </Button>
      </div>
      {result.ampacity !== null && (
        <p className="mt-1.5 text-[11px] text-[#4F758B]">
          NEC 310.15 ampacity: <span className="font-medium text-[#00573F]">{result.ampacity} A</span>
          {result.note ? ` — ${result.note}` : ""}
        </p>
      )}
    </div>
  );
}
