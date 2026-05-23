"use client";

import { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { QuoteRecord, QuoteOutcome } from "@/lib/win-loss";
import { OUTCOME_COLORS, OUTCOME_LABELS, LOSS_REASON_LABELS } from "@/lib/win-loss";

interface Props {
  records: QuoteRecord[];
  onSelect: (record: QuoteRecord) => void;
}

type SortKey = "month" | "quoteValue" | "marginPct" | "priceDelta" | "winRate";
type SortDir = "asc" | "desc";

function OutcomePill({ outcome }: { outcome: QuoteOutcome }) {
  const color = OUTCOME_COLORS[outcome];
  return (
    <span
      className="rounded border px-1.5 py-0.5 text-[9px] font-semibold"
      style={{ color, borderColor: `${color}40`, backgroundColor: `${color}15` }}
    >
      {OUTCOME_LABELS[outcome]}
    </span>
  );
}

function DeltaCell({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-muted-foreground">—</span>;
  const color = delta > 0 ? "#00AA13" : delta < 0 ? "#DB6B30" : "#4F758B";
  return (
    <span className="font-medium tabular-nums" style={{ color }}>
      {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
    </span>
  );
}

const OUTCOME_FILTERS: Array<"all" | QuoteOutcome> = ["all", "won", "lost", "pending", "no-bid"];

export function QuoteTable({ records, onSelect }: Props) {
  const [search,    setSearch]    = useState("");
  const [outcome,   setOutcome]   = useState<"all" | QuoteOutcome>("all");
  const [sortKey,   setSortKey]   = useState<SortKey>("month");
  const [sortDir,   setSortDir]   = useState<SortDir>("desc");
  const [page,      setPage]      = useState(1);
  const PAGE_SIZE = 12;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    let rows = [...records];
    if (outcome !== "all") rows = rows.filter((r) => r.outcome === outcome);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.customer.toLowerCase().includes(q) ||
          r.quoteNumber.toLowerCase().includes(q) ||
          r.salesOwner.toLowerCase().includes(q) ||
          r.primarySku.toLowerCase().includes(q) ||
          r.productFamily.toLowerCase().includes(q) ||
          (r.competitor ?? "").toLowerCase().includes(q),
      );
    }
    rows.sort((a, b) => {
      let av: number, bv: number;
      switch (sortKey) {
        case "month":      av = a.month.localeCompare(b.month); return sortDir === "asc" ? av : -av;
        case "quoteValue": av = a.quoteValue;     bv = b.quoteValue;     break;
        case "marginPct":  av = a.marginPct ?? -Infinity; bv = b.marginPct ?? -Infinity; break;
        case "priceDelta": av = a.priceDelta ?? -Infinity; bv = b.priceDelta ?? -Infinity; break;
        default:           av = a.quoteValue; bv = b.quoteValue;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return rows;
  }, [records, outcome, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function SortBtn({ k, label }: { k: SortKey; label: string }) {
    const active = sortKey === k;
    return (
      <button
        onClick={() => toggleSort(k)}
        className={cn(
          "flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider",
          active ? "text-[#1D252D] dark:text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {label}
        {active
          ? sortDir === "asc"
            ? <ChevronUp className="h-3 w-3" />
            : <ChevronDown className="h-3 w-3" />
          : <ChevronDown className="h-3 w-3 opacity-30" />}
      </button>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search customer, SKU, rep…"
            className="w-full rounded-md border bg-background pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#00AA13]"
          />
        </div>
        <div className="flex rounded-lg border bg-muted p-0.5">
          {OUTCOME_FILTERS.map((o) => (
            <button
              key={o}
              onClick={() => { setOutcome(o); setPage(1); }}
              className={cn(
                "rounded-md px-3 py-1 text-[10px] font-medium capitalize transition-colors",
                outcome === o
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o === "all" ? `All (${records.length})` : OUTCOME_LABELS[o]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="whitespace-nowrap px-4 py-2 text-left"><SortBtn k="month" label="Date" /></th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quote #</th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Customer</th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Product Family</th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Competitor</th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Outcome</th>
              <th className="whitespace-nowrap px-3 py-2 text-left"><SortBtn k="quoteValue" label="Value" /></th>
              <th className="whitespace-nowrap px-3 py-2 text-left"><SortBtn k="marginPct" label="Margin" /></th>
              <th className="whitespace-nowrap px-3 py-2 text-left"><SortBtn k="priceDelta" label="Δ Price" /></th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rep</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                  No quotes match current filters
                </td>
              </tr>
            )}
            {pageRows.map((r) => (
              <tr
                key={r.id}
                onClick={() => onSelect(r)}
                className="cursor-pointer border-b last:border-0 hover:bg-muted/20 transition-colors"
              >
                <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">{r.month}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px]">{r.quoteNumber}</td>
                <td className="whitespace-nowrap px-3 py-2 font-medium max-w-[140px] truncate">{r.customer}</td>
                <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{r.productFamily}</td>
                <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{r.competitor ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <OutcomePill outcome={r.outcome} />
                </td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums font-medium">
                  {formatCurrency(r.quoteValue)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                  {r.marginPct !== null ? (
                    <span className={cn(r.marginPct < 12 ? "text-[#DB6B30] font-semibold" : "")}>
                      {r.marginPct.toFixed(1)}%
                    </span>
                  ) : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <DeltaCell delta={r.priceDelta} />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-muted-foreground text-[10px]">
                  {r.salesOwner.split(" ")[0]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t px-4 py-2">
        <p className="text-[10px] text-muted-foreground">
          {filtered.length} quote{filtered.length !== 1 ? "s" : ""}
          {outcome !== "all" ? ` · ${outcome}` : ""}
        </p>
        <div className="flex items-center gap-1">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border px-2 py-0.5 text-[10px] disabled:opacity-40 hover:bg-muted"
          >
            ‹ Prev
          </button>
          <span className="px-2 text-[10px] text-muted-foreground">{page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-2 py-0.5 text-[10px] disabled:opacity-40 hover:bg-muted"
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}
