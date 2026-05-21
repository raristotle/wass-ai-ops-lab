"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ImtRequest } from "@/data/mock/imt-requests";
import type { ImtOutput, ImtDecision } from "@/lib/risk/imt";

export interface ScoredRequest {
  request: ImtRequest;
  output: ImtOutput;
}

const DECISION_VARIANT: Record<ImtDecision, Parameters<typeof Badge>[0]["variant"]> = {
  approve: "success",
  review:  "warning",
  reject:  "destructive",
};

const DECISION_FILTERS = ["all", "approve", "review", "reject"] as const;

interface ImtQueueProps {
  items: ScoredRequest[];
  selectedId: string | null;
  onSelect: (item: ScoredRequest) => void;
}

type SortKey = "id" | "riskScore" | "confidence" | "decision" | "customerName" | "repName" | "submittedAt";

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 65 ? "bg-red-500" : score >= 30 ? "bg-amber-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="tabular-nums text-xs font-medium">{score}</span>
    </div>
  );
}

export function ImtQueue({ items, selectedId, onSelect }: ImtQueueProps) {
  const [filter, setFilter] = useState<(typeof DECISION_FILTERS)[number]>("all");
  const [sortKey, setSortKey] = useState<SortKey>("submittedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  const filtered = filter === "all" ? items : items.filter((i) => i.output.decision === filter);

  const sorted = [...filtered].sort((a, b) => {
    let av: unknown, bv: unknown;
    if (sortKey === "riskScore")   { av = a.output.riskScore;   bv = b.output.riskScore; }
    else if (sortKey === "confidence") { av = a.output.confidence; bv = b.output.confidence; }
    else if (sortKey === "decision") { av = a.output.decision;   bv = b.output.decision; }
    else if (sortKey === "customerName") { av = a.request.customerName; bv = b.request.customerName; }
    else if (sortKey === "repName")  { av = a.request.repName;  bv = b.request.repName; }
    else if (sortKey === "id")       { av = a.request.id;       bv = b.request.id; }
    else                             { av = a.request.submittedAt; bv = b.request.submittedAt; }
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(0);
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  }

  const counts = {
    all:     items.length,
    approve: items.filter((i) => i.output.decision === "approve").length,
    review:  items.filter((i) => i.output.decision === "review").length,
    reject:  items.filter((i) => i.output.decision === "reject").length,
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b bg-muted/30 px-3 py-2">
        {DECISION_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(0); }}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-colors",
              filter === f
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f} <span className="ml-0.5 text-[10px] tabular-nums">({counts[f]})</span>
          </button>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            {(
              [
                { key: "id",           label: "ID" },
                { key: "customerName", label: "Customer" },
                { key: "vendorName",   label: "Vendor", noSort: true },
                { key: "repName",      label: "Rep" },
                { key: "riskScore",    label: "Score" },
                { key: "confidence",   label: "Confidence" },
                { key: "decision",     label: "Decision" },
                { key: "submittedAt",  label: "Submitted" },
              ] as { key: SortKey; label: string; noSort?: boolean }[]
            ).map(({ key, label, noSort }) => (
              <TableHead key={key} className="text-xs">
                {noSort ? label : (
                  <button
                    className="flex items-center gap-1 font-medium hover:text-foreground"
                    onClick={() => toggleSort(key)}
                  >
                    {label}
                    <SortIcon k={key} />
                  </button>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-20 text-center text-muted-foreground text-sm">
                No requests in this band.
              </TableCell>
            </TableRow>
          ) : (
            paged.map((item) => {
              const { request, output } = item;
              const isSelected = selectedId === request.id;
              return (
                <TableRow
                  key={request.id}
                  data-state={isSelected ? "selected" : undefined}
                  onClick={() => onSelect(item)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">{request.id}</TableCell>
                  <TableCell className="text-xs font-medium max-w-[140px] truncate">{request.customerName}</TableCell>
                  <TableCell className="text-xs max-w-[110px] truncate">{request.vendorName}</TableCell>
                  <TableCell className="text-xs">{request.repName}</TableCell>
                  <TableCell><ScoreBar score={output.riskScore} /></TableCell>
                  <TableCell className="text-xs tabular-nums">{output.confidence}%</TableCell>
                  <TableCell>
                    <Badge variant={DECISION_VARIANT[output.decision]} className="text-[10px] capitalize">
                      {output.decision}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(request.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-2">
        <span className="text-xs text-muted-foreground">
          {sorted.length === 0 ? "No results" : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, sorted.length)} of ${sorted.length}`}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
