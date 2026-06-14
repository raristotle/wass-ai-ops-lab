"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { reviewKey, isReviewTier, reviewCounts, type ReviewDecision } from "@/lib/catalog/cross-review";

const REVIEW_STORAGE_KEY = "pf_cross_reviews";

/**
 * Cross-Reference Explorer — every source-backed cross pair the recommender
 * trusts, plus the full ingestion registry behind them. Read-only and
 * deep-linkable; the working surface for "where did this cross come from?"
 */

type ExplorerPair = {
  aBrand: string;
  aMpn: string;
  aProductId: string | null;
  bBrand: string;
  bMpn: string;
  bProductId: string | null;
  relation: "equivalent" | "functional-substitute";
  sourceKind: string;
  confidence: number;
  sourceUrl: string;
  sourceId: string | null;
  notes: string | null;
  verifiedAt: string;
};

type ExplorerSource = {
  id: string;
  name: string;
  domain: string;
  url: string;
  urlTruncated: boolean;
  kind: string;
  access: string;
  ingestStatus: string;
  qualityScore: number;
  recordCount: number;
  categories: string[];
  ingestNote: string | null;
};

type ExplorerPayload = {
  stats: {
    pairs: number;
    bothStocked: number;
    oneStocked: number;
    bySourceKind: Record<string, number>;
    sources: { total: number; byStatus: Record<string, number>; workbookRows: number };
  };
  pairs: ExplorerPair[];
  sources: ExplorerSource[];
};

const SOURCE_KIND_LABEL: Record<string, string> = {
  "manufacturer-cross": "Manufacturer cross",
  datasheet: "Datasheet",
  "distributor-cross": "Distributor cross",
  "industry-table": "Industry table",
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  ingested: { label: "Ingested", cls: "bg-[#00AA13]/10 text-[#00573F] border-[#00AA13]/40" },
  ingestible: { label: "Ingestible", cls: "bg-[#64CCC9]/10 text-[#004986] border-[#64CCC9]" },
  "requires-browser": { label: "Needs browser", cls: "bg-[#EAAA00]/10 text-[#8a6400] border-[#EAAA00]/60" },
  "requires-api-key": { label: "Needs API key", cls: "bg-[#004986]/10 text-[#004986] border-[#004986]/40" },
  "requires-license": { label: "Licensed", cls: "bg-[#DB6B30]/10 text-[#a34614] border-[#DB6B30]/50" },
  "no-direct-crosses": { label: "No direct crosses", cls: "bg-[#B7C9D3]/20 text-[#4F758B] border-[#B7C9D3]" },
};

function StockedDot({ stocked }: { stocked: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full align-middle",
        stocked ? "bg-[#00AA13]" : "bg-[#B7C9D3]"
      )}
      title={stocked ? "Stocked — in the verified catalog" : "Not stocked"}
    />
  );
}

function Side({ brand, mpn, productId }: { brand: string; mpn: string; productId: string | null }) {
  const inner = (
    <>
      <StockedDot stocked={!!productId} />{" "}
      <span className="font-medium text-[#1D252D]">{brand}</span>{" "}
      <span className="font-mono text-xs">{mpn}</span>
    </>
  );
  return productId ? (
    <Link
      href={`/product-finder?q=${encodeURIComponent(mpn)}`}
      className="hover:underline underline-offset-2"
      title="Open in the Product Finder"
    >
      {inner}
    </Link>
  ) : (
    <span>{inner}</span>
  );
}

export default function CrossExplorerPage() {
  const [data, setData] = useState<ExplorerPayload | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [stockedOnly, setStockedOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [tab, setTab] = useState<"pairs" | "sources" | "review">("pairs");
  const [reviews, setReviews] = useState<Record<string, ReviewDecision>>({});

  useEffect(() => {
    fetch("/api/crosses")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  // Review decisions persist locally (the human-in-the-loop promotion seam).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
      if (raw) setReviews(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  function decide(key: string, decision: ReviewDecision | null) {
    setReviews((prev) => {
      const next = { ...prev };
      if (decision === null) delete next[key];
      else next[key] = decision;
      try {
        localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const reviewPairs = useMemo(() => (data ? data.pairs.filter((p) => isReviewTier(p.confidence)) : []), [data]);
  const counts = useMemo(() => reviewCounts(reviewPairs, reviews), [reviewPairs, reviews]);

  const pairs = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.pairs.filter((p) => {
      if (kind !== "all" && p.sourceKind !== kind) return false;
      if (stockedOnly && !(p.aProductId && p.bProductId)) return false;
      if (!needle) return true;
      return [p.aBrand, p.aMpn, p.bBrand, p.bMpn].some((s) => s.toLowerCase().includes(needle));
    });
  }, [data, q, kind, stockedOnly]);

  const sources = useMemo(() => {
    if (!data) return [];
    return data.sources.filter((s) => statusFilter === "all" || s.ingestStatus === statusFilter);
  }, [data, statusFilter]);

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p className="text-sm text-[#DB6B30]">Could not load the cross-reference data. Try reloading.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#1D252D] px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3">
          <div>
            <Link href="/product-finder" className="text-xs text-[#B7C9D3] hover:text-white">
              ← Product Finder
            </Link>
            <h1 className="mt-1 text-xl font-bold text-white [font-family:var(--font-titillium,'Arial_Bold',sans-serif)]">
              Cross-Reference Explorer
            </h1>
            <p className="text-xs text-[#B7C9D3]">
              Every pair cites the official document that states it — nothing here is similarity-generated.
            </p>
          </div>
          {data && (
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Source-backed pairs", value: data.stats.pairs },
                { label: "Both sides stocked", value: data.stats.bothStocked },
                { label: "One side stocked", value: data.stats.oneStocked },
                {
                  label: "Sources ingested",
                  value: `${data.stats.sources.byStatus.ingested ?? 0}/${data.stats.sources.total}`,
                },
                { label: "Workbook rows mapped", value: data.stats.sources.workbookRows },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-white/10 px-3 py-1.5 text-center">
                  <p className="text-base font-bold leading-tight text-white">{s.value}</p>
                  <p className="text-[9px] uppercase tracking-wide text-[#B7C9D3]">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-5">
        {/* Tabs */}
        <div className="mb-4 flex gap-1 border-b border-[#B7C9D3]/60">
          {(["pairs", "sources", "review"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 text-sm font-semibold transition-colors",
                tab === t
                  ? "border-b-2 border-[#00AA13] text-[#1D252D]"
                  : "text-[#4F758B] hover:text-[#1D252D]"
              )}
            >
              {t === "pairs"
                ? `Cross pairs${data ? ` (${data.stats.pairs})` : ""}`
                : t === "sources"
                  ? `Source registry${data ? ` (${data.stats.sources.total})` : ""}`
                  : `Review queue${data ? ` (${counts.pending})` : ""}`}
            </button>
          ))}
        </div>

        {!data && !error && <p className="py-8 text-center text-sm text-[#4F758B]">Loading…</p>}

        {data && tab === "pairs" && (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter by brand or part number…"
                className="w-64 rounded-lg border border-[#B7C9D3] px-3 py-1.5 text-sm focus:border-[#00AA13] focus:outline-none focus:ring-1 focus:ring-[#00AA13]"
                aria-label="Filter cross pairs"
              />
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="rounded-lg border border-[#B7C9D3] px-2 py-1.5 text-sm text-[#1D252D]"
                aria-label="Filter by source kind"
              >
                <option value="all">All source kinds</option>
                {Object.entries(SOURCE_KIND_LABEL).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label} ({data.stats.bySourceKind[k] ?? 0})
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-sm text-[#1D252D]">
                <input
                  type="checkbox"
                  checked={stockedOnly}
                  onChange={(e) => setStockedOnly(e.target.checked)}
                  className="accent-[#00AA13]"
                />
                Both sides stocked
              </label>
              <span className="ml-auto text-xs text-[#4F758B]">{pairs.length} shown</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#B7C9D3]/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#B7C9D3]/60 bg-gray-50 text-left text-xs font-semibold text-[#4F758B]">
                    <th className="px-3 py-2">Part</th>
                    <th className="px-3 py-2">Crosses to</th>
                    <th className="px-3 py-2">Relation</th>
                    <th className="px-3 py-2">Confidence</th>
                    <th className="px-3 py-2">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {pairs.map((p, i) => (
                    <tr key={i} className="border-b border-[#B7C9D3]/30 align-top last:border-0 hover:bg-[#00573F]/[0.03]">
                      <td className="px-3 py-2">
                        <Side brand={p.aBrand} mpn={p.aMpn} productId={p.aProductId} />
                      </td>
                      <td className="px-3 py-2">
                        <Side brand={p.bBrand} mpn={p.bMpn} productId={p.bProductId} />
                        {p.notes && (
                          <p className="mt-0.5 max-w-md text-[10px] leading-snug text-[#4F758B]" title={p.notes}>
                            {p.notes.length > 140 ? `${p.notes.slice(0, 140)}…` : p.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-[#1D252D]">
                        {p.relation === "equivalent" ? "Equivalent" : "Functional substitute"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold text-white",
                            p.confidence >= 95 ? "bg-[#00573F]" : "bg-[#4F758B]"
                          )}
                          title={p.confidence >= 95 ? "Production — shown to reps" : "Review tier — suppressed from recommendations"}
                        >
                          {p.confidence}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <a
                          href={p.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#004986] underline underline-offset-2"
                        >
                          {SOURCE_KIND_LABEL[p.sourceKind] ?? p.sourceKind} ↗
                        </a>
                        <p className="text-[10px] text-[#4F758B]">verified {p.verifiedAt}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pairs.length === 0 && (
                <p className="py-6 text-center text-sm text-[#4F758B]">No pairs match the filters.</p>
              )}
            </div>
          </>
        )}

        {data && tab === "sources" && (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-semibold",
                  statusFilter === "all" ? "border-[#1D252D] text-[#1D252D]" : "border-[#B7C9D3] text-[#4F758B]"
                )}
              >
                All ({data.stats.sources.total})
              </button>
              {Object.entries(STATUS_META).map(([status, meta]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-semibold",
                    meta.cls,
                    statusFilter === status && "ring-1 ring-[#1D252D]/40"
                  )}
                >
                  {meta.label} ({data.stats.sources.byStatus[status] ?? 0})
                </button>
              ))}
              <span className="ml-auto text-xs text-[#4F758B]">
                From the 1,000-row cross-reference source workbook ({data.stats.sources.workbookRows} rows)
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#B7C9D3]/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#B7C9D3]/60 bg-gray-50 text-left text-xs font-semibold text-[#4F758B]">
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Quality</th>
                    <th className="px-3 py-2">Rows</th>
                    <th className="px-3 py-2">Extracted</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((s) => {
                    const meta = STATUS_META[s.ingestStatus];
                    return (
                      <tr key={s.id} className="border-b border-[#B7C9D3]/30 align-top last:border-0">
                        <td className="max-w-xs px-3 py-2">
                          <p className="font-medium leading-snug text-[#1D252D]">{s.name}</p>
                          {s.urlTruncated ? (
                            <p className="text-[10px] text-[#DB6B30]" title="The workbook truncated this URL — full address unknown">
                              {s.domain} · URL truncated in workbook
                            </p>
                          ) : (
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-[#004986] underline underline-offset-2"
                            >
                              {s.domain} ↗
                            </a>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", meta?.cls)}>
                            {meta?.label ?? s.ingestStatus}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-[#1D252D]">{s.qualityScore}</td>
                        <td className="px-3 py-2 text-xs text-[#1D252D]">{s.recordCount}</td>
                        <td className="max-w-sm px-3 py-2 text-[11px] leading-snug text-[#4F758B]">
                          {s.ingestNote ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {data && tab === "review" && (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <p className="text-sm text-[#1D252D]">
                Pairs below 95% confidence — approve to promote into production, reject to suppress.
              </p>
              <span className="ml-auto flex gap-2 text-xs">
                <span className="rounded-full bg-[#EAAA00]/15 px-2 py-0.5 text-[#8a6400]">{counts.pending} pending</span>
                <span className="rounded-full bg-[#00AA13]/10 px-2 py-0.5 text-[#00573F]">{counts.approved} approved</span>
                <span className="rounded-full bg-[#DB6B30]/10 px-2 py-0.5 text-[#a34614]">{counts.rejected} rejected</span>
              </span>
            </div>

            {reviewPairs.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#4F758B]">
                Nothing in the review tier — every documented pair is production-grade (≥95%).
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[#B7C9D3]/60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#B7C9D3]/60 bg-gray-50 text-left text-xs font-semibold text-[#4F758B]">
                      <th className="px-3 py-2">Part</th>
                      <th className="px-3 py-2">Crosses to</th>
                      <th className="px-3 py-2">Confidence</th>
                      <th className="px-3 py-2">Source</th>
                      <th className="px-3 py-2">Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewPairs.map((p, i) => {
                      const key = reviewKey(p);
                      const decision = reviews[key];
                      return (
                        <tr
                          key={i}
                          className={cn(
                            "border-b border-[#B7C9D3]/30 align-top last:border-0",
                            decision === "approved" && "bg-[#00AA13]/[0.04]",
                            decision === "rejected" && "bg-[#DB6B30]/[0.04]"
                          )}
                        >
                          <td className="px-3 py-2">
                            <Side brand={p.aBrand} mpn={p.aMpn} productId={p.aProductId} />
                          </td>
                          <td className="px-3 py-2">
                            <Side brand={p.bBrand} mpn={p.bMpn} productId={p.bProductId} />
                          </td>
                          <td className="px-3 py-2">
                            <span className="rounded-full bg-[#4F758B] px-2 py-0.5 text-[10px] font-bold text-white">
                              {p.confidence}%
                            </span>
                            <span className="ml-1 text-[10px] text-[#4F758B]">{SOURCE_KIND_LABEL[p.sourceKind] ?? p.sourceKind}</span>
                          </td>
                          <td className="px-3 py-2 text-xs">
                            <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#004986] underline underline-offset-2">
                              source ↗
                            </a>
                          </td>
                          <td className="px-3 py-2">
                            {decision ? (
                              <span className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                    decision === "approved" ? "bg-[#00AA13] text-white" : "bg-[#DB6B30] text-white"
                                  )}
                                >
                                  {decision === "approved" ? "✓ Approved" : "✕ Rejected"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => decide(key, null)}
                                  className="text-[10px] text-[#4F758B] underline underline-offset-2 hover:text-[#1D252D]"
                                >
                                  undo
                                </button>
                              </span>
                            ) : (
                              <span className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => decide(key, "approved")}
                                  className="rounded bg-[#00573F] px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-[#004936]"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => decide(key, "rejected")}
                                  className="rounded border border-[#DB6B30] px-2 py-0.5 text-[10px] font-semibold text-[#a34614] hover:bg-[#DB6B30]/10"
                                >
                                  Reject
                                </button>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-2 text-[10px] italic text-[#4F758B]">
              Decisions are saved in this browser. In production, an approval promotes the pair to the
              recommendation path through the same provenance gate.
            </p>
          </>
        )}

        <p className="mt-4 text-[11px] italic text-[#4F758B]">
          Confidence is scored by source authority; pairs under 95% stay in the review tier and never reach
          recommendations. Contradicting sources are settled by a documented rule — source authority, then source
          quality score, then recency.
        </p>
      </div>
    </main>
  );
}
