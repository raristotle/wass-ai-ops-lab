"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Escalation, EscalationSeverity, EscalationStatus } from "@/lib/risk/dc-risk";
import { EXCEPTION_LABELS } from "@/lib/risk/dc-risk";

// ── Style maps ─────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

const SEV_VARIANT: Record<EscalationSeverity, BadgeVariant> = {
  critical: "destructive",
  high:     "warning",
  medium:   "secondary",
};

const STATUS_CHIP: Record<EscalationStatus, string> = {
  open:         "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  notified:     "bg-[#EAAA00]/15 text-[#7a5900]",
  acknowledged: "bg-[#004986]/15 text-[#004986]",
  resolved:     "bg-[#00AA13]/15 text-[#00573F]",
};

const SEV_ORDER: Record<EscalationSeverity, number> = { critical: 3, high: 2, medium: 1 };

// ── IssueQueue ─────────────────────────────────────────────────────────────────

interface Props {
  escalations: Escalation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function IssueQueue({ escalations, selectedId, onSelect }: Props) {
  const [filter, setFilter] = useState<EscalationStatus | "all">("all");

  const filtered = useMemo(() => {
    const base = filter === "all"
      ? escalations
      : escalations.filter((e) => e.status === filter);
    return [...base].sort((a, b) => SEV_ORDER[b.severity] - SEV_ORDER[a.severity]);
  }, [escalations, filter]);

  const counts = useMemo(() => ({
    all:          escalations.length,
    open:         escalations.filter((e) => e.status === "open").length,
    notified:     escalations.filter((e) => e.status === "notified").length,
    acknowledged: escalations.filter((e) => e.status === "acknowledged").length,
    resolved:     escalations.filter((e) => e.status === "resolved").length,
  }), [escalations]);

  const statusTabs: { key: EscalationStatus | "all"; label: string }[] = [
    { key: "all",          label: `All (${counts.all})` },
    { key: "open",         label: `Open (${counts.open})` },
    { key: "notified",     label: `Notified (${counts.notified})` },
    { key: "acknowledged", label: `Acknowledged (${counts.acknowledged})` },
    { key: "resolved",     label: `Resolved (${counts.resolved})` },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1">
        {statusTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors",
              filter === key
                ? "border-[#1D252D] bg-[#1D252D] text-white dark:border-white dark:bg-white dark:text-[#1D252D]"
                : "border-transparent bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Issue rows */}
      {filtered.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground">
          No issues match the current filter.
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map((esc) => {
            const isSelected = selectedId === esc.id;
            const daysSince  = Math.round(
              (Date.now() - new Date(esc.createdAt).getTime()) / 86_400_000,
            );

            return (
              <button
                key={esc.id}
                onClick={() => onSelect(esc.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-all hover:bg-muted/30",
                  isSelected && "border-[#00AA13] bg-[#00AA13]/5 ring-1 ring-[#00AA13]",
                  esc.severity === "critical" && !isSelected && "border-red-300",
                )}
              >
                {/* Severity icon */}
                <AlertTriangle
                  className={cn(
                    "h-4 w-4 shrink-0",
                    esc.severity === "critical" ? "text-red-500"
                    : esc.severity === "high"   ? "text-[#DB6B30]"
                    : "text-[#EAAA00]",
                  )}
                />

                {/* Main info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold">{EXCEPTION_LABELS[esc.exceptionType]}</span>
                    <Badge variant={SEV_VARIANT[esc.severity]} className="text-[9px] capitalize">
                      {esc.severity}
                    </Badge>
                    <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium capitalize", STATUS_CHIP[esc.status])}>
                      {esc.status}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                    {esc.notes.length > 90 ? esc.notes.slice(0, 90) + "…" : esc.notes}
                  </p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    Assigned: {esc.assignee} · {daysSince}d ago · Due {esc.dueDate}
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
