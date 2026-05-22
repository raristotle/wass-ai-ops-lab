"use client";

import { useState } from "react";
import {
  CheckCircle, Clock, AlertTriangle, Package, ChevronRight,
  ArrowUpDown, Send, UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { BomLine, BomLineStatus, BomCategory } from "@/lib/autobom";
import { CATEGORY_COLORS, AVAIL_LABELS, STATUS_LABELS } from "@/lib/autobom";

// ── filter types ───────────────────────────────────────────────────────────────

type FilterTab = "all" | "needs-review" | "accepted" | "flagged" | "sent-to-quote";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all",          label: "All" },
  { key: "needs-review", label: "Needs Review" },
  { key: "accepted",     label: "Accepted" },
  { key: "flagged",      label: "Flagged" },
  { key: "sent-to-quote",label: "Sent to Quote" },
];

function matchFilter(line: BomLine, f: FilterTab): boolean {
  if (f === "all") return true;
  if (f === "needs-review") return line.confidenceLevel !== "high" || line.missingInfo.length > 0;
  if (f === "accepted") return line.status === "accepted" || line.status === "replaced";
  if (f === "flagged")  return line.status === "flagged";
  if (f === "sent-to-quote") return line.status === "sent-to-quote";
  return true;
}

// ── ConfidencePill ─────────────────────────────────────────────────────────────

function ConfidencePill({ score, level }: { score: number; level: BomLine["confidenceLevel"] }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            level === "high"    ? "bg-[#00AA13]" :
            level === "medium"  ? "bg-[#EAAA00]" :
            level === "low"     ? "bg-[#DB6B30]" : "bg-red-500",
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn(
        "text-[10px] font-bold tabular-nums",
        level === "high"   ? "text-[#00AA13]" :
        level === "medium" ? "text-[#EAAA00]" :
        level === "low"    ? "text-[#DB6B30]"  : "text-red-500",
      )}>
        {score}
      </span>
    </div>
  );
}

// ── StatusBadge ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BomLineStatus }) {
  const cls: Record<BomLineStatus, string> = {
    pending:          "border-border bg-muted text-muted-foreground",
    accepted:         "border-[#00AA13]/30 bg-[#00AA13]/10 text-[#00573F]",
    replaced:         "border-[#00AA13]/30 bg-[#00AA13]/10 text-[#00573F]",
    "sme-requested":  "border-[#EAAA00]/30 bg-[#EAAA00]/10 text-[#7a5900]",
    "sent-to-quote":  "border-[#004986]/30 bg-[#004986]/10 text-[#004986]",
    flagged:          "border-[#DB6B30]/30 bg-[#DB6B30]/10 text-[#DB6B30]",
  };
  return (
    <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-medium", cls[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ── ActionBar (inline per row) ─────────────────────────────────────────────────

interface ActionBarProps {
  line: BomLine;
  onAccept:     (id: string) => void;
  onRequestSme: (id: string) => void;
  onSendToQuote:(id: string) => void;
}

function ActionBar({ line, onAccept, onRequestSme, onSendToQuote }: ActionBarProps) {
  const canAccept   = (line.status === "pending" || line.status === "flagged") && line.suggestedSku !== null;
  const canSend     = line.status === "accepted" || line.status === "replaced";
  const canSme      = line.status !== "sent-to-quote" && line.status !== "sme-requested";

  return (
    <div className="flex items-center gap-1">
      {canAccept && (
        <button
          title="Accept suggested SKU"
          onClick={(e) => { e.stopPropagation(); onAccept(line.id); }}
          className="rounded p-1 text-[#00AA13] hover:bg-[#00AA13]/10"
        >
          <CheckCircle className="h-3.5 w-3.5" />
        </button>
      )}
      {canSme && (
        <button
          title="Request SME review"
          onClick={(e) => { e.stopPropagation(); onRequestSme(line.id); }}
          className="rounded p-1 text-[#EAAA00] hover:bg-[#EAAA00]/10"
        >
          <UserCheck className="h-3.5 w-3.5" />
        </button>
      )}
      {canSend && (
        <button
          title="Send to quote"
          onClick={(e) => { e.stopPropagation(); onSendToQuote(line.id); }}
          className="rounded p-1 text-[#004986] hover:bg-[#004986]/10"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ── BomReviewTable ─────────────────────────────────────────────────────────────

interface Props {
  lines: BomLine[];
  selectedId:    string | null;
  onSelect:      (id: string) => void;
  onAccept:      (id: string) => void;
  onRequestSme:  (id: string) => void;
  onSendToQuote: (id: string) => void;
}

export function BomReviewTable({
  lines, selectedId, onSelect, onAccept, onRequestSme, onSendToQuote,
}: Props) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [sortConf, setSortConf] = useState<"asc" | "desc" | null>(null);

  const visible = lines
    .filter((l) => matchFilter(l, filter))
    .sort((a, b) => {
      if (!sortConf) return a.lineNumber - b.lineNumber;
      return sortConf === "asc" ? a.confidence - b.confidence : b.confidence - a.confidence;
    });

  // per-filter badge counts
  const counts: Record<FilterTab, number> = {
    all:            lines.length,
    "needs-review": lines.filter((l) => matchFilter(l, "needs-review")).length,
    accepted:       lines.filter((l) => matchFilter(l, "accepted")).length,
    flagged:        lines.filter((l) => matchFilter(l, "flagged")).length,
    "sent-to-quote":lines.filter((l) => matchFilter(l, "sent-to-quote")).length,
  };

  return (
    <div className="rounded-lg border bg-card">
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b px-3 py-2">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
              filter === key
                ? "bg-[#1D252D] text-white dark:bg-white dark:text-[#1D252D]"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {label}
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
              filter === key ? "bg-white/20" : "bg-muted text-muted-foreground",
            )}>
              {counts[key]}
            </span>
          </button>
        ))}
        <div className="ml-auto">
          <button
            onClick={() => setSortConf((c) => c === "asc" ? "desc" : c === "desc" ? null : "asc")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] transition-colors",
              sortConf ? "bg-[#004986]/10 text-[#004986]" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <ArrowUpDown className="h-3 w-3" />
            Confidence {sortConf === "asc" ? "↑" : sortConf === "desc" ? "↓" : ""}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-[11px]">
          <thead>
            <tr className="border-b bg-muted/30">
              {["#", "Category", "Spec Text", "Suggested SKU", "Qty", "Unit Price", "Avail.", "Conf.", "Status", "Actions"].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-[11px] text-muted-foreground">
                  No BOM lines match this filter.
                </td>
              </tr>
            )}
            {visible.map((line) => {
              const activeSku = line.replacedWith ?? line.suggestedSku;
              const isSelected = selectedId === line.id;
              return (
                <tr
                  key={line.id}
                  onClick={() => onSelect(line.id)}
                  className={cn(
                    "cursor-pointer border-b transition-colors hover:bg-muted/20",
                    isSelected && "bg-[#00AA13]/5 ring-1 ring-inset ring-[#00AA13]/30",
                    line.status === "flagged" && "bg-[#DB6B30]/3",
                    line.status === "sent-to-quote" && "bg-[#004986]/3",
                  )}
                >
                  {/* # */}
                  <td className="px-3 py-2 text-muted-foreground font-mono">{line.lineNumber}</td>

                  {/* Category */}
                  <td className="px-3 py-2">
                    <span className={cn(
                      "rounded border px-1.5 py-0.5 text-[9px] font-semibold whitespace-nowrap",
                      CATEGORY_COLORS[line.category],
                    )}>
                      {line.category}
                    </span>
                  </td>

                  {/* Spec text */}
                  <td className="px-3 py-2 max-w-[220px]">
                    <p className="truncate font-medium text-[#1D252D] dark:text-foreground">
                      {line.rawText}
                    </p>
                    {line.missingInfo.length > 0 && (
                      <p className="text-[9px] text-[#DB6B30] flex items-center gap-0.5 mt-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {line.missingInfo.length} missing spec{line.missingInfo.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </td>

                  {/* Suggested SKU */}
                  <td className="px-3 py-2">
                    {activeSku ? (
                      <div>
                        <p className="font-mono font-medium text-[#1D252D] dark:text-foreground">{activeSku.sku}</p>
                        <p className="text-[9px] text-muted-foreground truncate max-w-[140px]">{activeSku.manufacturer}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </td>

                  {/* Qty */}
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">
                    {line.quantity !== null ? `${line.quantity} ${line.unit ?? ""}`.trim() : "—"}
                  </td>

                  {/* Unit price */}
                  <td className="px-3 py-2 tabular-nums">
                    {activeSku?.unitPrice !== null && activeSku?.unitPrice !== undefined
                      ? formatCurrency(activeSku.unitPrice)
                      : <span className="text-muted-foreground">TBD</span>}
                  </td>

                  {/* Availability */}
                  <td className="px-3 py-2">
                    {activeSku ? (
                      <span className={cn(
                        "rounded border px-1.5 py-0.5 text-[9px] font-medium whitespace-nowrap",
                        activeSku.availability === "in-stock"   ? "border-[#00AA13]/30 bg-[#00AA13]/10 text-[#00573F]" :
                        activeSku.availability === "limited"    ? "border-[#EAAA00]/40 bg-[#EAAA00]/10 text-[#7a5900]" :
                        activeSku.availability === "lead-time"  ? "border-[#DB6B30]/30 bg-[#DB6B30]/10 text-[#DB6B30]" :
                        activeSku.availability === "discontinued" ? "border-red-200 bg-red-50 text-red-600" :
                        "border-border bg-muted text-muted-foreground",
                      )}>
                        {AVAIL_LABELS[activeSku.availability]}
                        {activeSku.availability === "lead-time" && activeSku.leadTimeDays
                          ? ` ~${activeSku.leadTimeDays}d` : ""}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Confidence */}
                  <td className="px-3 py-2">
                    <ConfidencePill score={line.confidence} level={line.confidenceLevel} />
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2">
                    <StatusBadge status={line.status} />
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-0.5">
                      <ActionBar
                        line={line}
                        onAccept={onAccept}
                        onRequestSme={onRequestSme}
                        onSendToQuote={onSendToQuote}
                      />
                      <ChevronRight className={cn(
                        "h-3 w-3 text-muted-foreground transition-transform",
                        isSelected && "rotate-90",
                      )} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bulk action footer */}
      {lines.filter((l) => l.status === "accepted" || l.status === "replaced").length > 0 && (
        <div className="border-t px-4 py-2 flex items-center justify-between bg-[#004986]/3">
          <p className="text-[10px] text-[#004986]">
            <span className="font-semibold">
              {lines.filter((l) => l.status === "accepted" || l.status === "replaced").length}
            </span>{" "}
            line{lines.filter((l) => l.status === "accepted" || l.status === "replaced").length !== 1 ? "s" : ""} accepted
          </p>
          <button
            onClick={() => lines.filter((l) => l.status === "accepted" || l.status === "replaced").forEach((l) => onSendToQuote(l.id))}
            className="flex items-center gap-1.5 rounded-md bg-[#004986] px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-[#004986]/80 transition-colors"
          >
            <Send className="h-3 w-3" />
            Send All to Quote
          </button>
        </div>
      )}
    </div>
  );
}
