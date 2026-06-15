"use client";

import { useEffect, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { apiBomAnalyze, type BomAnalysis } from "@/lib/product-finder-api";
import { rollupHealth, type LineHealth, type HealthGrade } from "@/lib/catalog/bom-health";
import { cn } from "@/lib/utils";

const GRADE_BADGE: Record<HealthGrade, string> = {
  A: "bg-[#00AA13] text-white",
  B: "bg-[#EAAA00] text-[#1D252D]",
  C: "bg-[#DB6B30] text-white",
};

export function BomIntelligenceModal() {
  const open = useProductFinder((s) => s.bomIqOpen);
  const setOpen = useProductFinder((s) => s.setBomIqOpen);
  const cart = useProductFinder((s) => s.cart);
  const branchId = useProductFinder((s) => s.user?.branchId);

  const [analysis, setAnalysis] = useState<BomAnalysis | null>(null);
  const [busy, setBusy] = useState(false);

  const items = Object.values(cart).map(({ product, qty }) => ({ sku: product.sku, qty }));

  useEffect(() => {
    if (!open) {
      setAnalysis(null);
      return;
    }
    if (items.length === 0) {
      setAnalysis({ rows: [], compliance: { lines: 0, ulListed: 0, notUlListed: 0, rohsIssues: 0, prop65: 0, tariffExposed: 0, flagged: 0 } });
      return;
    }
    let cancelled = false;
    setBusy(true);
    void apiBomAnalyze(items, branchId)
      .then((a) => {
        if (!cancelled) setAnalysis(a);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
    // Re-run when the modal opens; cart snapshot taken at open time.
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const rows = analysis?.rows ?? null;
  const grades = (rows ?? []).map((r) => r.health).filter((h): h is LineHealth => h !== null);
  const roll = rollupHealth(grades);
  const totalSavings = (rows ?? []).reduce((s, r) => s + (r.award?.switch ? r.award.lineSavings : 0), 0);
  const comp = analysis?.compliance;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="BOM intelligence"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">BOM intelligence</h2>
            <p className="text-xs text-[#B7C9D3]">Health grade + landed-cost award for your basket.</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close BOM intelligence"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="px-5 py-4">
          {busy && <p className="text-sm text-[#4F758B]">Analyzing the basket…</p>}

          {!busy && rows !== null && rows.length === 0 && (
            <p className="text-sm text-[#4F758B]">Your basket is empty — add lines, then re-open BOM intelligence.</p>
          )}

          {!busy && rows !== null && rows.length > 0 && (
            <>
              {/* Rollup */}
              <div className="mb-4 grid grid-cols-4 gap-2">
                <div className="rounded-lg bg-[#F1EFE8] px-3 py-2">
                  <p className="text-[11px] text-[#4F758B]">BOM health</p>
                  <p className="text-lg font-semibold text-[#1D252D]">
                    <span className={cn("mr-1 rounded px-1.5 py-0.5 text-sm", GRADE_BADGE[roll.worstGrade])}>{roll.worstGrade}</span>
                    {roll.avgScore}/100
                  </p>
                  <p className="text-[11px] text-[#4F758B]">{roll.a} A · {roll.b} B · {roll.c} C</p>
                </div>
                <div className="rounded-lg bg-[#F1EFE8] px-3 py-2">
                  <p className="text-[11px] text-[#4F758B]">Lines to review</p>
                  <p className="text-lg font-semibold text-[#1D252D]">{roll.needsAttention}</p>
                  <p className="text-[11px] text-[#4F758B]">of {roll.lines}</p>
                </div>
                <div className="rounded-lg bg-[#F1EFE8] px-3 py-2">
                  <p className="text-[11px] text-[#4F758B]">Landed savings found</p>
                  <p className="text-lg font-semibold text-[#00573F]">${totalSavings.toFixed(2)}</p>
                  <p className="text-[11px] text-[#4F758B]">across better awards</p>
                </div>
                <div className="rounded-lg bg-[#F1EFE8] px-3 py-2">
                  <p className="text-[11px] text-[#4F758B]">Compliance</p>
                  <p className="text-lg font-semibold text-[#1D252D]">{comp?.flagged ?? 0}</p>
                  <p className="text-[11px] text-[#4F758B]">
                    {(comp?.tariffExposed ?? 0) > 0 ? `${comp!.tariffExposed} tariff-exposed` : "lines flagged"}
                  </p>
                </div>
              </div>

              {/* Per-line worklist */}
              <ul className="max-h-80 space-y-1.5 overflow-y-auto">
                {rows.map((r, i) => (
                  <li key={i} className="rounded-lg border border-[#B7C9D3] px-3 py-2">
                    <div className="flex items-center gap-2">
                      {r.health && (
                        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", GRADE_BADGE[r.health.grade])}>
                          {r.health.grade}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#1D252D]">
                        {r.qty}× {r.product ? `${r.product.brand} ${r.product.name}` : r.sku}
                      </span>
                      {r.health && r.health.flags.length > 0 && (
                        <span className="truncate text-[10px] text-[#DB6B30]">{r.health.flags.join(" · ")}</span>
                      )}
                    </div>
                    {r.health?.action && (
                      <p className="mt-1 text-[11px] text-[#4F758B]">→ {r.health.action}</p>
                    )}
                    {r.award?.switch && (
                      <p className="mt-0.5 text-[11px] text-[#00573F]">💰 {r.award.rationale}</p>
                    )}
                    {r.compliance && (r.compliance.flags.length > 0 || r.compliance.countryOfOrigin) && (
                      <p className="mt-0.5 text-[10px] text-[#854F0B]">
                        ⚖ {r.compliance.countryOfOrigin}
                        {r.compliance.flags.length > 0 ? ` · ${r.compliance.flags.join(" · ")}` : " · compliant"}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10px] leading-snug text-[#4F758B]">
                Health composes lifecycle, stock depth, single-source risk, and substitute availability. Landed cost =
                list price + estimated freight + a lead-time carrying penalty; swap via each line&apos;s detail view.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
