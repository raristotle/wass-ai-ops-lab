"use client";

import { useState, useMemo } from "react";
import { ScopeUploader } from "./ScopeUploader";
import { BomReviewTable } from "./BomReviewTable";
import { BomLineCard } from "./BomLineCard";
import { SmeRequestDrawer } from "./SmeRequestDrawer";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { BomExtraction, BomLine, BomLineStatus } from "@/lib/autobom";
import { computeBomStats } from "@/lib/autobom";
import { parseScopeText } from "@/lib/parsers/autobom-parser";

// ── KPI card ───────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: {
  label: string; value: string; sub: string; accent: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums", accent)}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

// ── AutoBomPage ────────────────────────────────────────────────────────────────

type ViewTab = "table" | "cards";

export function AutoBomPage() {
  const [extraction, setExtraction]   = useState<BomExtraction | null>(null);
  const [lines, setLines]             = useState<BomLine[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [smeLineId, setSmeLineId]     = useState<string | null>(null);
  const [view, setView]               = useState<ViewTab>("table");

  // ── handlers ──────────────────────────────────────────────────────────────

  function handleExtract(ext: BomExtraction, fromParser = false) {
    setIsLoading(true);
    // Simulate processing delay for UX realism; run live parser for custom input
    setTimeout(() => {
      const result = fromParser
        ? parseScopeText(ext.sourceText, ext.projectName)
        : ext;
      setExtraction(result);
      setLines(result.lines.map((l) => ({ ...l }))); // local mutable copy
      setSelectedId(null);
      setIsLoading(false);
    }, 600);
  }

  function updateLineStatus(id: string, status: BomLineStatus, extra?: Partial<BomLine>) {
    setLines((prev) =>
      prev.map((l) => (l.id !== id ? l : { ...l, status, ...extra })),
    );
  }

  function handleAccept(id: string) {
    updateLineStatus(id, "accepted");
  }

  function handleRequestSme(id: string) {
    setSmeLineId(id); // open the SME drawer
  }

  function handleSmeSubmit(lineId: string, note: string, assignee: string) {
    updateLineStatus(lineId, "sme-requested", { smeNote: note, smeAssignee: assignee });
    setSmeLineId(null);
  }

  function handleSendToQuote(id: string) {
    updateLineStatus(id, "sent-to-quote");
  }

  function handleLineAction(lineId: string, action: "accept" | "flag" | "sme") {
    if (action === "accept") handleAccept(lineId);
    if (action === "sme")    handleRequestSme(lineId);
    if (action === "flag")   updateLineStatus(lineId, "flagged");
  }

  // ── derived stats ──────────────────────────────────────────────────────────

  const stats = useMemo(() => computeBomStats(lines), [lines]);

  const selectedLine = useMemo(
    () => (selectedId ? (lines.find((l) => l.id === selectedId) ?? null) : null),
    [selectedId, lines],
  );

  const smeLine = useMemo(
    () => (smeLineId ? (lines.find((l) => l.id === smeLineId) ?? null) : null),
    [smeLineId, lines],
  );

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-[#1D252D] dark:text-foreground">
          AutoBOM Assistant
        </h1>
        <p className="text-sm text-muted-foreground">
          Scope-to-materials extraction · AI-suggested SKUs · review & send to quote
        </p>
      </div>

      {/* Scope uploader */}
      <ScopeUploader onExtract={handleExtract} isLoading={isLoading} />

      {/* Results */}
      {extraction && lines.length > 0 && (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard
              label="Total Lines"
              value={String(stats.total)}
              sub={extraction.projectName}
              accent="text-[#004986]"
            />
            <KpiCard
              label="High Confidence"
              value={String(stats.highConf)}
              sub={`${Math.round((stats.highConf / Math.max(stats.total, 1)) * 100)}% match rate`}
              accent="text-[#00AA13]"
            />
            <KpiCard
              label="Needs Review"
              value={String(stats.needsReview)}
              sub="low confidence or missing specs"
              accent={stats.needsReview > 0 ? "text-[#DB6B30]" : "text-[#00AA13]"}
            />
            <KpiCard
              label="Est. Material Value"
              value={stats.estimatedValue !== null ? formatCurrency(stats.estimatedValue) : "TBD"}
              sub="placeholder pricing · not contractual"
              accent="text-[#1D252D]"
            />
          </div>

          {/* View toggle + project label */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#1D252D] dark:text-foreground">
                {extraction.projectName}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Extracted {new Date(extraction.extractedAt).toLocaleString("en-US", {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })} · parser {extraction.parserVersion}
              </p>
            </div>
            <div className="flex rounded-lg border bg-muted p-0.5">
              {(["table", "cards"] as ViewTab[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    view === v
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {v === "table" ? "Review Table" : "Card View"}
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          {view === "table" ? (
            <>
              <BomReviewTable
                lines={lines}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(selectedId === id ? null : id)}
                onAccept={handleAccept}
                onRequestSme={handleRequestSme}
                onSendToQuote={handleSendToQuote}
              />
              {/* Expanded line card */}
              {selectedLine && (
                <BomLineCard
                  key={selectedLine.id}
                  line={selectedLine}
                  onAction={handleLineAction}
                />
              )}
            </>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {lines.map((line) => (
                <BomLineCard
                  key={line.id}
                  line={line}
                  onAction={handleLineAction}
                />
              ))}
            </div>
          )}

          {/* Progress summary */}
          <div className="rounded-lg border bg-card px-4 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Review Progress
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[#00AA13] transition-all"
                    style={{ width: `${Math.round(((stats.accepted + stats.sentToQuote) / Math.max(stats.total, 1)) * 100)}%` }}
                  />
                </div>
              </div>
              <p className="shrink-0 text-[11px] font-semibold tabular-nums">
                {stats.accepted + stats.sentToQuote}/{stats.total} lines reviewed
              </p>
              <p className="shrink-0 text-[11px] text-[#004986] font-medium">
                {stats.sentToQuote} sent to quote
              </p>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!extraction && !isLoading && (
        <div className="rounded-lg border border-dashed bg-card px-6 py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Select a sample scope or paste your own spec text, then click <strong>Extract BOM</strong>.
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            The assistant will suggest SKUs, confidence scores, alternates, and flag missing specs.
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="rounded-lg border bg-card px-6 py-16 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#00AA13] border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">Extracting BOM lines…</p>
        </div>
      )}

      <p className="text-center text-[10px] text-muted-foreground">
        PROTOTYPE ONLY — SKU suggestions are deterministic stubs. Pricing is placeholder data.
        No ERP writes. Human review required before quoting.
      </p>

      {/* SME request drawer */}
      <SmeRequestDrawer
        open={smeLineId !== null}
        onClose={() => setSmeLineId(null)}
        line={smeLine}
        onSubmit={handleSmeSubmit}
      />
    </div>
  );
}
