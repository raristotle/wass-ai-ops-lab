"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Cross-reference coverage card for the manager dashboard — makes the
 * source-backed cross dataset and its ingestion pipeline visible: how many
 * pairs, how much is both-sides stocked, the source ingest-status mix, pairs by
 * category, and the brands still missing a modeled hierarchy. Data from
 * /api/crosses/coverage (the deterministic data-quality report).
 */

type Coverage = {
  pairs: number;
  bothStocked: number;
  oneStocked: number;
  bySourceKind: Record<string, number>;
  byCategory: Record<string, number>;
  sources: { total: number; byStatus: Record<string, number>; workbookRows: number };
  products: { total: number; productionReady: number };
  brands: { distinct: number; modeled: number; topUncovered: { brand: string; products: number }[] };
};

const STATUS_LABEL: Record<string, string> = {
  ingested: "Ingested",
  ingestible: "Ingestible",
  "requires-browser": "Needs browser",
  "requires-api-key": "Needs API key",
  "requires-license": "Licensed",
  "no-direct-crosses": "Catalog only",
};

const CATEGORY_LABEL: Record<string, string> = {
  electrical: "Electrical",
  datacom: "Datacom",
  "oem-electrical": "OEM Electrical",
  av: "AV",
  security: "Security",
  safety: "Safety",
};

export function CrossCoveragePanel() {
  const [data, setData] = useState<Coverage | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/crosses/coverage")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  if (failed) return null;

  const catEntries = data ? Object.entries(data.byCategory).sort((a, b) => b[1] - a[1]) : [];
  const maxCat = catEntries.length ? catEntries[0][1] : 1;
  const ingested = data?.sources.byStatus.ingested ?? 0;

  return (
    <section
      aria-label="Cross-reference coverage"
      className="rounded-xl border border-[#00573F]/30 bg-[#00573F]/5 p-4"
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#00573F]">
          Cross-Reference Coverage
        </h2>
        <Link
          href="/product-finder/crosses"
          className="text-xs font-semibold text-[#004986] underline underline-offset-2 hover:text-[#1D252D]"
        >
          Open Explorer →
        </Link>
      </div>

      {!data ? (
        <p className="py-6 text-center text-xs text-[#4F758B]">Loading coverage…</p>
      ) : (
        <>
          {/* Headline stats */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Source-backed pairs", value: data.pairs, accent: "#00573F" },
              { label: "Both sides stocked", value: data.bothStocked, accent: "#00AA13" },
              { label: "One side stocked", value: data.oneStocked, accent: "#004986" },
              { label: "Sources ingested", value: `${ingested}/${data.sources.total}`, accent: "#4F758B" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-[#B7C9D3]/40 bg-white p-3">
                <p className="text-xl font-bold" style={{ color: s.accent }}>
                  {s.value}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-[#4F758B]">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* Pairs by category */}
            <div>
              <p className="mb-2 text-xs font-semibold text-[#1D252D]">Pairs by category</p>
              {catEntries.length === 0 ? (
                <p className="text-xs text-[#4F758B]">No stocked-side pairs.</p>
              ) : (
                <ul className="space-y-1.5">
                  {catEntries.map(([cat, n]) => (
                    <li key={cat} className="flex items-center gap-2">
                      <span className="w-24 shrink-0 truncate text-xs text-[#1D252D]">
                        {CATEGORY_LABEL[cat] ?? cat}
                      </span>
                      <div className="h-3 flex-1 overflow-hidden rounded bg-[#B7C9D3]/30">
                        <div
                          className="h-full rounded bg-[#00573F]"
                          style={{ width: `${Math.round((n / maxCat) * 100)}%` }}
                          aria-hidden="true"
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs font-semibold text-[#4F758B]">{n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Source ingest-status mix + uncovered brands */}
            <div>
              <p className="mb-2 text-xs font-semibold text-[#1D252D]">
                Source workbook ({data.sources.workbookRows} rows → {data.sources.total} sources)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.sources.byStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, n]) => (
                    <span
                      key={status}
                      className="rounded-full border border-[#B7C9D3] bg-white px-2 py-0.5 text-[10px] text-[#4F758B]"
                    >
                      {STATUS_LABEL[status] ?? status}: <span className="font-semibold text-[#1D252D]">{n}</span>
                    </span>
                  ))}
              </div>

              <p className="mb-1.5 mt-3 text-xs font-semibold text-[#1D252D]">
                Largest brands not yet hierarchy-modeled
                <span className="ml-1 font-normal text-[#4F758B]">
                  ({data.brands.modeled}/{data.brands.distinct} modeled)
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.brands.topUncovered.map((b) => (
                  <span key={b.brand} className="rounded-full bg-[#EAAA00]/15 px-2 py-0.5 text-[10px] text-[#8a6400]">
                    {b.brand} ({b.products})
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-3 text-[10px] italic text-[#4F758B]">
            {data.products.productionReady}/{data.products.total} verified records production-ready (≥95%).
            Pairs below 95% confidence stay in the review queue — see the Explorer.
          </p>
        </>
      )}
    </section>
  );
}
