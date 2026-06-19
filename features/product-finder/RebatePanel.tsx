"use client";

import { estimateRebate, rebateForQuantity } from "@/lib/product-finder-rebates";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Utility-rebate estimate for a lighting product (v4-S2 #6). Deterministic, $0 —
 * renders only for rebate-bearing lighting categories. Always framed as an
 * estimate the local utility confirms; DLC listing is the eligibility gate.
 */

const fmt$ = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export function RebatePanel({ product, qty = 1 }: { product: CatalogProduct; qty?: number }) {
  const est = estimateRebate(product);
  if (!est) return null;

  const base = rebateForQuantity(est, qty, false);
  const withControls = est.controlsDetected;
  const perLow = withControls ? est.withControlsLow : est.perUnitLow;
  const perHigh = withControls ? est.withControlsHigh : est.perUnitHigh;
  const total = rebateForQuantity(est, qty, withControls);

  return (
    <div className="mt-3 rounded-lg border border-[#EAAA00]/50 bg-[#EAAA00]/5 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[#1D252D]">💰 Utility rebate estimate</p>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ backgroundColor: est.dlcEligible ? "#00573F" : "#B7C9D3", color: "#FFFFFF" }}
        >
          {est.dlcEligible ? "DLC-eligible category" : "Check eligibility"}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <p className="text-[11px] text-[#4F758B]">Per {est.unit}</p>
          <p className="text-base font-bold text-[#854F0B]">
            {fmt$(perLow)}–{fmt$(perHigh)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[#4F758B]">
            Est. for {total.qty} {est.unit}
            {total.qty === 1 ? "" : "s"}
          </p>
          <p className="text-base font-bold text-[#854F0B]">
            {fmt$(total.low)}–{fmt$(total.high)}
          </p>
        </div>
      </div>

      {withControls ? (
        <p className="mt-1.5 text-[11px] text-[#00573F]">
          ✓ Controls detected — the higher controls-incentive band is applied (base{" "}
          {fmt$(base.low)}–{fmt$(base.high)} without).
        </p>
      ) : (
        <p className="mt-1.5 text-[11px] text-[#4F758B]">
          Adding occupancy/daylight controls can lift this to{" "}
          {fmt$(rebateForQuantity(est, qty, true).low)}–{fmt$(rebateForQuantity(est, qty, true).high)}.
        </p>
      )}

      <p className="mt-2 text-[10px] italic leading-snug text-[#4F758B]">{est.disclaimer}</p>
    </div>
  );
}
