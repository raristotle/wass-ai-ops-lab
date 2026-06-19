"use client";

import { useEffect, useState } from "react";
import { TIER_COLOR, TIER_LABEL, type CatalogQualitySummary, type QualityTier } from "@/lib/catalog/data-quality-score";

/**
 * Catalog data-quality metrics (v4-S3 #11) — a manager card showing the average
 * completeness score, the distribution across tiers, and the biggest gaps so the
 * catalog team knows where to enrich first. $0/deterministic; fetched from the
 * cached summary endpoint. Hidden until data loads.
 */
const TIER_ORDER: QualityTier[] = ["excellent", "good", "partial", "incomplete"];

export function QualityMetricsCard() {
  const [summary, setSummary] = useState<CatalogQualitySummary | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/catalog/quality-summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { summary?: CatalogQualitySummary } | null) => {
        if (alive && d?.summary) setSummary(d.summary);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!summary || summary.count === 0) return null;

  const total = summary.count;

  return (
    <section aria-label="Catalog data quality" className="rounded-xl border border-[#004986]/30 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#1D252D]">
          Catalog Data Quality
          <span className="ml-1 text-xs font-normal text-[#4F758B]">(completeness across {total.toLocaleString()} products)</span>
        </h2>
        <span className="text-2xl font-bold text-[#004986]">{summary.averageScore}<span className="text-sm font-normal text-[#4F758B]">/100</span></span>
      </div>

      {/* Tier distribution bar */}
      <div className="flex h-3 w-full overflow-hidden rounded">
        {TIER_ORDER.map((t) =>
          summary.byTier[t] > 0 ? (
            <div
              key={t}
              style={{ width: `${(summary.byTier[t] / total) * 100}%`, backgroundColor: TIER_COLOR[t] }}
              title={`${TIER_LABEL[t]}: ${summary.byTier[t]}`}
              aria-hidden="true"
            />
          ) : null,
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        {TIER_ORDER.map((t) => (
          <li key={t} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TIER_COLOR[t] }} aria-hidden="true" />
            <span className="text-[#1D252D]">{TIER_LABEL[t]}</span>
            <span className="text-[#4F758B]">{Math.round((summary.byTier[t] / total) * 100)}%</span>
          </li>
        ))}
      </ul>

      {/* Top gaps */}
      {summary.topGaps.length > 0 && summary.topGaps[0].missingPct > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4F758B]">Biggest gaps</p>
          <ul className="mt-1 space-y-1">
            {summary.topGaps.filter((g) => g.missingPct > 0).slice(0, 4).map((g) => (
              <li key={g.key} className="flex items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate text-[#1D252D]">{g.label}</span>
                <div className="h-2 w-24 shrink-0 overflow-hidden rounded bg-[#B7C9D3]/30">
                  <div className="h-full rounded bg-[#DB6B30]" style={{ width: `${Math.round(g.missingPct * 100)}%` }} aria-hidden="true" />
                </div>
                <span className="w-12 shrink-0 text-right text-[#4F758B]">{Math.round(g.missingPct * 100)}% missing</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[10px] italic text-[#4F758B]">
        Deterministic score over spec richness, datasheet links, provenance, lifecycle, and identifiers —
        the same signal that improves semantic-search recall.
      </p>
    </section>
  );
}
