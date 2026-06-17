"use client";

import { useMemo } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { repScorecard, type ScorecardQuote } from "@/lib/product-finder-rep-scorecard";

/**
 * Rep performance scorecard (#18) — a manager-dashboard table of per-rep sales
 * metrics computed from the shipped quote history (no new tracking). Rep =
 * the quote's audit-trail author. Internal; hidden when there are no quotes.
 */
export function RepScorecardCard() {
  const quotes = useProductFinder((s) => s.quotes);

  const stats = useMemo(
    () =>
      repScorecard(
        quotes.map(
          (qt): ScorecardQuote => ({
            status: qt.status as ScorecardQuote["status"],
            marginPct: qt.marginPct,
            createdAt: qt.createdAt,
            convertedAt: qt.convertedAt,
            // Group cross-sell by SUBCATEGORY — the whole catalog is one top-level
            // category ("electrical"), so category would make cross-sell always 0%.
            lines: qt.lines.map((l) => ({ category: l.product.subcategory })),
            // The audit-trail author (first event carrying an actor); falls back to
            // "Unknown" only when no event names a rep (e.g. an anonymous draft).
            rep: qt.events?.find((e) => e.actor)?.actor ?? "Unknown",
          }),
        ),
      ),
    [quotes],
  );

  if (stats.length === 0) return null;
  const pct = (n: number | null) => (n === null ? "—" : `${Math.round(n * 100)}%`);

  return (
    <section aria-label="Rep performance scorecard" className="rounded-xl border border-[#B7C9D3]/40 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-[#1D252D]">
        Rep performance <span className="text-xs font-normal text-[#4F758B]">(from quote history — internal)</span>
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#B7C9D3] text-left text-[#4F758B]">
              <th scope="col" className="py-1.5 pr-3">Rep</th>
              <th scope="col" className="px-2 text-right">Quotes</th>
              <th scope="col" className="px-2 text-right">Win rate</th>
              <th scope="col" className="px-2 text-right">Avg margin</th>
              <th scope="col" className="px-2 text-right">Cross-sell</th>
              <th scope="col" className="px-2 text-right">Cycle</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.rep} className="border-b border-[#B7C9D3]/30">
                <td className="py-1.5 pr-3 font-medium text-[#1D252D]">{s.rep}</td>
                <td className="px-2 text-right tabular-nums">{s.volume}</td>
                <td className="px-2 text-right tabular-nums">
                  {pct(s.winRate)} <span className="text-[#4F758B]">({s.won}/{s.decided})</span>
                </td>
                <td className="px-2 text-right tabular-nums">{pct(s.avgMarginPct)}</td>
                <td className="px-2 text-right tabular-nums">{pct(s.crossSellAttachPct)}</td>
                <td className="px-2 text-right tabular-nums">{s.avgCycleDays === null ? "—" : `${Math.round(s.avgCycleDays)}d`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
