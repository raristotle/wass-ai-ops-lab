"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { BranchStock } from "@/features/product-finder/types";

interface StockBadgeProps {
  branchQty: number;
  dcQty: number;
  userBranchId?: string;
  branchStock: BranchStock[];
}

function StockDot({ qty }: { qty: number }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full flex-shrink-0",
        qty > 5
          ? "bg-[#00AA13]"
          : qty > 0
          ? "bg-[#EAAA00]"
          : "bg-[#B7C9D3]"
      )}
      aria-hidden="true"
    />
  );
}

function QtyLabel({ qty, label }: { qty: number; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-[#1D252D]">
      <StockDot qty={qty} />
      <span className="font-medium">{label}</span>
      <span className="font-semibold">{qty}</span>
      <span className="text-[#4F758B]">units</span>
    </span>
  );
}

export function StockBadge({
  branchQty,
  dcQty,
  userBranchId,
  branchStock,
}: StockBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  const myBranchQty = userBranchId
    ? (branchStock.find((b) => b.branchId === userBranchId)?.quantity ?? 0)
    : branchQty;

  const showAllLocations = branchStock.length > 1;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-3">
        <QtyLabel qty={myBranchQty} label="My Branch" />
        <span className="text-[#B7C9D3] text-xs">·</span>
        <QtyLabel qty={dcQty} label="Local DC" />
        {showAllLocations && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-[#004986] hover:underline ml-1"
            aria-expanded={expanded}
          >
            {expanded ? "Hide locations" : "All Locations"}
            <span
              className={cn(
                "inline-block ml-0.5 transition-transform duration-150",
                expanded ? "rotate-180" : "rotate-0"
              )}
            >
              ▾
            </span>
          </button>
        )}
      </div>

      {expanded && showAllLocations && (
        <ul className="mt-1 space-y-0.5 pl-1">
          {branchStock.map((b) => (
            <li
              key={b.branchId}
              className="flex items-center gap-1.5 text-xs text-[#4F758B]"
            >
              <StockDot qty={b.quantity} />
              <span>
                {b.branchName} ({b.city}, {b.state})
              </span>
              <span className="font-semibold text-[#1D252D]">{b.quantity}</span>
              <span>units</span>
              {userBranchId === b.branchId && (
                <span className="text-[#00AA13] font-semibold">★</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
