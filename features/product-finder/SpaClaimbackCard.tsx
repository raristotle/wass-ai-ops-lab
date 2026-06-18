"use client";

import { useMemo } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { spaClaimbacks, type SpaQuote } from "@/lib/product-finder-spa";
import { toCsv, downloadCsv } from "@/lib/product-finder-csv";

/**
 * SPA / rebate claim-back recovery (v3-S3 #9) — manager card surfacing unclaimed
 * Special Pricing Agreement dollars across WON quotes (pure margin-leakage), with
 * a per-manufacturer breakdown and a claim-file CSV export. $0, deterministic.
 * Hidden when nothing is claimable.
 */
const fmt$ = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

export function SpaClaimbackCard() {
  const quotes = useProductFinder((s) => s.quotes);

  const summary = useMemo(() => {
    const won: SpaQuote[] = quotes
      .filter((q) => q.status === "won")
      .map((q) => ({
        number: q.number,
        customer: q.customer,
        customerId: q.customerId,
        lines: q.lines.map((l) => ({ product: l.product, qty: l.qty })),
      }));
    return spaClaimbacks(won);
  }, [quotes]);

  if (summary.lineCount === 0) return null;

  function exportCsv() {
    const header = [
      "Quote", "Customer", "SKU", "Name", "Manufacturer", "SPA Ref",
      "Qty", "Std Unit Cost", "Rebate %", "Claimable/Unit", "Claimable",
    ];
    const body = summary.rows.map((r) => [
      r.quoteNumber, r.customer, r.sku, r.name, r.manufacturer, r.ref,
      r.qty, r.standardUnitCost, `${(r.rebatePct * 100).toFixed(1)}%`, r.claimablePerUnit, r.claimable,
    ]);
    downloadCsv("spa-claimback.csv", toCsv([header, ...body]));
  }

  return (
    <section
      aria-label="SPA rebate claim-back"
      className="rounded-xl border border-[#EAAA00]/50 bg-[#EAAA00]/5 p-4"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#1D252D]">
          SPA Rebate Claim-Back
          <span className="ml-1 text-xs font-normal text-[#4F758B]">(unclaimed margin on won quotes)</span>
        </h2>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-md border border-[#4F758B] px-2.5 py-1 text-xs font-semibold text-[#4F758B] transition-colors hover:border-[#1D252D] hover:text-[#1D252D]"
        >
          Export claim file (CSV)
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="text-xs text-[#4F758B]">Unclaimed to date</p>
          <p className="text-2xl font-bold text-[#854F0B]">{fmt$(summary.totalClaimable)}</p>
        </div>
        <div>
          <p className="text-xs text-[#4F758B]">Eligible lines</p>
          <p className="text-lg font-bold text-[#1D252D]">{summary.lineCount}</p>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {summary.byManufacturer.map((m) => (
          <li key={m.manufacturer} className="flex items-center gap-2 text-xs">
            <span className="min-w-0 flex-1 truncate font-medium text-[#1D252D]">{m.manufacturer}</span>
            <span className="text-[#4F758B]">
              {m.lines} line{m.lines === 1 ? "" : "s"}
            </span>
            <span className="w-24 shrink-0 text-right font-semibold text-[#854F0B]">{fmt$(m.claimable)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] italic text-[#4F758B]">
        Claimable = standard distributor cost × the manufacturer SPA rebate, per won-quote line —
        deterministic over simulated cost; file these against the rebate system.
      </p>
    </section>
  );
}
