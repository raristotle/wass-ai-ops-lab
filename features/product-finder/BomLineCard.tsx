"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BomLine, WescoProduct } from "@/features/product-finder/types";

interface BomLineCardProps {
  line: BomLine;
  onSelect: (product: WescoProduct) => void;
}

function StockBadge({ product }: { product: WescoProduct }) {
  const branchQty = product.branchStock.reduce((s, b) => s + b.quantity, 0);
  const dcQty = product.dcStock.reduce((s, d) => s + d.quantity, 0);

  if (branchQty > 0) {
    return (
      <Badge className="border-0 bg-[#00AA13] text-xs text-white">
        In Stock
      </Badge>
    );
  }
  if (dcQty > 0) {
    return (
      <Badge className="border-0 bg-[#4F758B] text-xs text-white">
        DC Only
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="text-xs">
      Out of Stock
    </Badge>
  );
}

export function BomLineCard({ line, onSelect }: BomLineCardProps) {
  const resolved: WescoProduct | null = line.resolved;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-white px-4 py-3 text-sm",
        "transition-colors hover:border-[#B7C9D3]",
        resolved !== null && "cursor-default"
      )}
    >
      {/* Left: quantity + description */}
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="shrink-0 rounded-full bg-[#00AA13] px-2 py-0.5 text-xs font-semibold text-white">
          &times;{line.quantity}
        </span>
        <span className="truncate text-[#1D252D]">{line.description}</span>
      </div>

      {/* Middle: resolved product info */}
      <div className="hidden w-56 shrink-0 sm:block">
        {resolved !== null ? (
          <div className="min-w-0">
            <p className="truncate font-medium text-[#1D252D]">
              <span className="mr-1">{resolved.imageIcon}</span>
              {resolved.name}
            </p>
            <p className="truncate text-xs text-[#4F758B]">
              SKU: {resolved.sku} &middot; {resolved.brand}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[#DB6B30]">
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              />
            </svg>
            <span className="text-xs font-medium">No match found</span>
          </div>
        )}
      </div>

      {/* Right: alternatives chip + stock + select */}
      <div className="flex shrink-0 items-center gap-2">
        {resolved !== null && (
          <>
            {line.alternatives.length > 0 && (
              <span className="rounded-full border border-[#B7C9D3] px-2 py-0.5 text-xs text-[#4F758B]">
                {line.alternatives.length}&nbsp;alt
                {line.alternatives.length !== 1 ? "s" : ""}
              </span>
            )}
            <StockBadge product={resolved} />
            <Button
              size="sm"
              className="h-7 bg-[#00AA13] px-3 text-xs text-white hover:bg-[#009911]"
              onClick={() => onSelect(resolved)}
            >
              Select
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
