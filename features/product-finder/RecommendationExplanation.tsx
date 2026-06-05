"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { scoreProduct, topReasons } from "@/lib/product-finder-scoring";
import { useProductFinder } from "@/lib/product-finder-store";
import type { WescoProduct, RecommendationTier } from "@/features/product-finder/types";

const TIER_LABEL: Record<RecommendationTier, string> = {
  excellent: "Excellent match",
  good: "Good match",
  partial: "Partial match",
};

// WCAG: text colors chosen to pass on white / light tints
const TIER_TEXT: Record<RecommendationTier, string> = {
  excellent: "text-[#00573F]",
  good: "text-[#8a6500]",
  partial: "text-[#4F758B]",
};

const TIER_RING: Record<RecommendationTier, string> = {
  excellent: "#00AA13",
  good: "#EAAA00",
  partial: "#B7C9D3",
};

interface Props {
  product: WescoProduct;
  reference: WescoProduct;
}

export function RecommendationExplanation({ product, reference }: Props) {
  const [open, setOpen] = useState(false);
  const userBranchId = useProductFinder((s) => s.user?.branchId);
  const score = scoreProduct(product, reference, userBranchId);
  const chips = topReasons(score, 2);

  return (
    <div className="mt-2">
      {/* Score ring + tier label */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(${TIER_RING[score.tier]} ${score.total}%, #e2e8ec ${score.total}% 100%)` }}
          role="progressbar"
          aria-valuenow={score.total}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Match score: ${score.total} percent, ${TIER_LABEL[score.tier]}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#1D252D]">
            {score.total}%
          </span>
        </div>
        <span className={cn("text-sm font-bold", TIER_TEXT[score.tier])}>{TIER_LABEL[score.tier]}</span>
      </div>

      {/* Top-2 reason chips */}
      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((f) => (
            <span
              key={f.label}
              className="rounded-full border border-[#00AA13]/30 bg-[#00AA13]/10 px-2 py-0.5 text-[11px] font-semibold text-[#00573F]"
            >
              ✓ {f.label}
            </span>
          ))}
        </div>
      )}

      {/* Why disclosure */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-[#004986] hover:underline"
      >
        <span className={cn("text-[9px] transition-transform", open ? "rotate-90" : "rotate-0")}>▶</span>
        Why recommended?
      </button>

      {open && (
        <ul className="mt-2 space-y-1.5 border-t border-dashed border-[#cfd9e0] pt-2">
          {score.factors.map((f) => (
            <li key={f.label} className="flex items-start gap-1.5 text-[11px] text-[#1D252D]">
              <span className={f.positive ? "font-bold text-[#00AA13]" : "font-bold text-[#EAAA00]"}>
                {f.positive ? "✓" : "⚠"}
              </span>
              <span className="flex-1">{f.label}</span>
              {f.points > 0 && <span className="tabular-nums text-[#4F758B]">+{f.points}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
