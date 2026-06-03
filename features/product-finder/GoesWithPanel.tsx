"use client";

import { getCrossSells, getUpsells, getTotalBranchStock, getTotalDCStock } from "@/data/mock/wesco-products";
import { useProductFinder } from "@/lib/product-finder-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { WescoProduct } from "@/features/product-finder/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  product: WescoProduct;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StockDot({ product }: { product: WescoProduct }) {
  const branch = getTotalBranchStock(product);
  const dc = getTotalDCStock(product);
  const color =
    branch > 0
      ? "bg-[#00AA13]"
      : dc > 0
      ? "bg-[#EAAA00]"
      : "bg-gray-300";
  const label =
    branch > 0 ? "In branch stock" : dc > 0 ? "DC stock only" : "Out of stock";

  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full flex-shrink-0", color)}
      aria-label={label}
      title={label}
    />
  );
}

interface MiniProductRowProps {
  product: WescoProduct;
  isUpsell?: boolean;
}

function MiniProductRow({ product, isUpsell = false }: MiniProductRowProps) {
  const { addToCart } = useProductFinder();

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg border transition-all cursor-default",
        "border-transparent hover:border-[#00AA13]/60 hover:bg-[#00AA13]/5"
      )}
    >
      {/* Icon */}
      <span className="text-xl flex-shrink-0" aria-hidden="true">
        {product.imageIcon}
      </span>

      {/* Name + brand + SKU */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-[#1D252D] text-sm truncate max-w-[160px]">
            {product.name}
          </span>
          {isUpsell && (
            <Badge
              className="text-xs px-1.5 py-0 border-0 flex-shrink-0 bg-[#64CCC9] text-white"
            >
              &#x2191; Upgrade
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">
          {product.brand} &middot; {product.sku}
        </p>
      </div>

      {/* Stock dot */}
      <StockDot product={product} />

      {/* Price */}
      <span className="text-sm font-semibold text-[#1D252D] flex-shrink-0 tabular-nums">
        ${product.unitPrice.toFixed(2)}
      </span>

      {/* Add button */}
      <button
        onClick={() => addToCart(product)}
        className="flex-shrink-0 w-7 h-7 rounded-full bg-[#00AA13] text-white flex items-center justify-center hover:bg-[#008f10] transition-colors text-lg leading-none"
        aria-label={`Add ${product.name} to basket`}
      >
        +
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GoesWithPanel({ product }: Props) {
  const { addToCart } = useProductFinder();
  const crossSells = getCrossSells(product);
  const upsells = getUpsells(product);

  if (crossSells.length === 0 && upsells.length === 0) return null;

  const bundleTotal = crossSells.reduce((sum, p) => sum + p.unitPrice, 0);
  const showBundle = crossSells.length >= 2;

  const handleAddBundle = () => {
    for (const p of crossSells) addToCart(p);
  };

  return (
    <Card className="border border-[#B7C9D3] shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-[#1D252D]">
          Recommendations
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Goes-With / Cross-sells */}
        {crossSells.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-[#4F758B] uppercase tracking-wide mb-2">
              Frequently Bought Together
            </p>
            <div className="space-y-1">
              {crossSells.map((p) => (
                <MiniProductRow key={p.id} product={p} />
              ))}
            </div>

            {/* Bundle CTA */}
            {showBundle && (
              <div className="mt-3 flex items-center justify-between bg-[#00AA13]/5 border border-[#00AA13]/20 rounded-lg px-3 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-[#1D252D]">Complete the Job</p>
                  <p className="text-xs text-gray-500">
                    Buy all goes-with items &mdash;{" "}
                    <span className="font-semibold text-[#00AA13]">
                      ${bundleTotal.toFixed(2)} total
                    </span>
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-[#00AA13] hover:bg-[#008f10] text-white text-xs ml-3 flex-shrink-0"
                  onClick={handleAddBundle}
                >
                  Add Bundle to Basket
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Separator when both sections present */}
        {crossSells.length > 0 && upsells.length > 0 && (
          <Separator className="bg-[#B7C9D3]" />
        )}

        {/* Upgrade Options / Upsells */}
        {upsells.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-[#4F758B] uppercase tracking-wide mb-2">
              Consider Upgrading To
            </p>
            <div className="space-y-1">
              {upsells.map((p) => (
                <MiniProductRow key={p.id} product={p} isUpsell />
              ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
