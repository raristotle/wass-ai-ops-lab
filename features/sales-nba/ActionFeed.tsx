"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Phone, FileText, Globe, Tag, CreditCard, BarChart2,
  ChevronRight, AlertTriangle, TrendingUp,
} from "lucide-react";
import {
  ACTION_LABELS, ACTION_PERSONAS,
} from "@/lib/risk/nba";
import type { NbaOutput, NbaAction, ActionType, Persona, Urgency } from "@/lib/risk/nba";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

const ACTION_ICON: Record<ActionType, React.ComponentType<{ className?: string }>> = {
  "call":               Phone,
  "quote-followup":     FileText,
  "platform-discovery": Globe,
  "cross-sell-intro":   Tag,
  "collections-check":  CreditCard,
  "pricing-review":     BarChart2,
};

const ACTION_COLOR: Record<ActionType, string> = {
  "call":               "text-slate-400",
  "quote-followup":     "text-blue-400",
  "platform-discovery": "text-purple-400",
  "cross-sell-intro":   "text-emerald-400",
  "collections-check":  "text-red-400",
  "pricing-review":     "text-orange-400",
};

const URGENCY_VARIANT: Record<Urgency, BadgeVariant> = {
  critical: "destructive",
  high:     "warning",
  medium:   "secondary",
  low:      "outline",
};

const TIER_VARIANT: Record<string, BadgeVariant> = {
  Gold:   "warning",
  Silver: "secondary",
  Bronze: "outline",
  New:    "default",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ActionChip({ action }: { action: NbaAction }) {
  const Icon = ACTION_ICON[action.type];
  return (
    <span className={cn("flex items-center gap-1 text-[10px] font-medium", ACTION_COLOR[action.type])}>
      <Icon className="h-3 w-3 shrink-0" />
      {action.label}
    </span>
  );
}

function ScoreBar({ score, urgency }: { score: number; urgency: Urgency }) {
  const barColor = urgency === "critical" ? "bg-red-500"
    : urgency === "high" ? "bg-orange-500"
    : urgency === "medium" ? "bg-yellow-500"
    : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", barColor)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs tabular-nums font-semibold">{score}</span>
    </div>
  );
}

// ── ActionFeed ────────────────────────────────────────────────────────────────

const ALL_ACTION_TYPES = Object.keys(ACTION_LABELS) as ActionType[];
const PAGE_SIZE = 12;

interface Props {
  outputs: NbaOutput[];
  activePersona: Persona | null;
  activeActionTypes: ActionType[];
  onSelect: (output: NbaOutput) => void;
  selectedId: string | null;
}

export function ActionFeed({
  outputs,
  activePersona,
  activeActionTypes,
  onSelect,
  selectedId,
}: Props) {
  const [page, setPage] = useState(0);

  // Filter outputs by persona and action type.
  // An account is shown if it has at least one action matching the active filters.
  const filtered = useMemo(() => {
    return outputs.filter((out) => {
      return out.actions.some((a) => {
        const typeOk  = activeActionTypes.length === 0 || activeActionTypes.includes(a.type);
        const personaOk = activePersona === null || ACTION_PERSONAS[a.type].includes(activePersona);
        return typeOk && personaOk;
      });
    });
  }, [outputs, activePersona, activeActionTypes]);

  // For each filtered account, compute the top visible action under current filters
  const withVisibleTop = useMemo(() => {
    return filtered.map((out) => {
      const visibleActions = out.actions.filter((a) => {
        const typeOk    = activeActionTypes.length === 0 || activeActionTypes.includes(a.type);
        const personaOk = activePersona === null || ACTION_PERSONAS[a.type].includes(activePersona);
        return typeOk && personaOk;
      });
      return { out, topVisible: visibleActions[0] ?? out.topAction };
    }).sort((a, b) => b.topVisible.priorityScore - a.topVisible.priorityScore);
  }, [filtered, activePersona, activeActionTypes]);

  const totalPages = Math.ceil(withVisibleTop.length / PAGE_SIZE);
  const paginated  = withVisibleTop.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (filtered.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground">
        No accounts match the active filters.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {paginated.map(({ out, topVisible }) => {
        const isSelected = out.accountId === selectedId;
        const otherCount = out.actions.filter((a) => {
          const typeOk    = activeActionTypes.length === 0 || activeActionTypes.includes(a.type);
          const personaOk = activePersona === null || ACTION_PERSONAS[a.type].includes(activePersona);
          return typeOk && personaOk && a.type !== topVisible.type;
        }).length;

        return (
          <button
            key={out.accountId}
            onClick={() => onSelect(out)}
            className={cn(
              "flex w-full items-start gap-4 rounded-lg border bg-card px-4 py-3 text-left transition-all hover:bg-muted/30",
              isSelected && "border-primary bg-primary/5 ring-1 ring-primary",
            )}
          >
            {/* Priority score */}
            <div className="shrink-0 pt-0.5">
              <ScoreBar score={topVisible.priorityScore} urgency={topVisible.urgency} />
            </div>

            {/* Account info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-semibold">{out.accountName}</span>
                <Badge variant={TIER_VARIANT[out.tier] ?? "outline"} className="text-[9px]">
                  {out.tier}
                </Badge>
                <Badge variant={URGENCY_VARIANT[topVisible.urgency]} className="text-[9px] capitalize">
                  {topVisible.urgency}
                </Badge>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{out.sbu} · {out.owner}</p>

              {/* Top action */}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <ActionChip action={topVisible} />
                {topVisible.revenueImpactUsd > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    {formatCurrency(topVisible.revenueImpactUsd)} impact
                  </span>
                )}
              </div>

              {/* Reason codes */}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {topVisible.reasonCodes.map((rc) => (
                  <span key={rc} className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
                    {rc}
                  </span>
                ))}
              </div>
            </div>

            {/* Right side */}
            <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
              <span className="text-[10px] font-medium text-muted-foreground">
                {formatCurrency(out.annualRevenueUsd)}
              </span>
              {otherCount > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  +{otherCount} more action{otherCount > 1 ? "s" : ""}
                </span>
              )}
              {topVisible.urgency === "critical" && (
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 pt-1 text-xs text-muted-foreground">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, withVisibleTop.length)} of{" "}
            {withVisibleTop.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded px-2 py-1 hover:bg-muted disabled:opacity-30"
            >←</button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="rounded px-2 py-1 hover:bg-muted disabled:opacity-30"
            >→</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Re-export for convenience
export type { NbaOutput, ActionType, Persona };
export { ALL_ACTION_TYPES, ACTION_ICON, ACTION_COLOR, ACTION_LABELS };
