"use client";

import { useEffect, useState } from "react";

/**
 * Demand-ranked cross-reference coverage gaps (#8) — the competitor/legacy parts
 * customers looked up for a Wesco cross but we don't cross yet, ranked by how
 * often they were hit, so the catalog team expands where demand is highest.
 * Hidden when there's no gap data (nothing accumulated / dormant store).
 */
type Gap = { sku: string; count: number; lastMissAt: number };

export function CoverageGapsCard() {
  const [gaps, setGaps] = useState<Gap[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/crosses/gaps")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { gaps?: Gap[] } | null) => {
        if (alive && d && Array.isArray(d.gaps)) setGaps(d.gaps);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!gaps || gaps.length === 0) return null;

  return (
    <section aria-label="Cross-reference coverage gaps" className="rounded-xl border border-[#DB6B30]/30 bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#1D252D]">Coverage gaps</h2>
        <span className="text-[11px] text-[#4F758B]">
          most-requested competitor parts with no Wesco cross — expand crosses here first
        </span>
      </div>
      <ul className="divide-y divide-[#B7C9D3]/40">
        {gaps.map((g) => (
          <li key={g.sku} className="flex items-center justify-between gap-2 py-1.5 text-xs">
            <span className="font-mono text-[#1D252D]">{g.sku}</span>
            <span className="rounded-full bg-[#DB6B30]/10 px-2 py-0.5 font-semibold text-[#993C1D]">
              {g.count}× requested
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
