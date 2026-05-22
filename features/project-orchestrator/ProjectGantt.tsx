"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ComplexProject, ProjectScore, MilestoneStatus, ProjectStatus } from "@/lib/risk/project-orchestrator";

// ── Style maps ─────────────────────────────────────────────────────────────────

const STATUS_BAR: Record<ProjectStatus, string> = {
  planning:  "bg-[#B7C9D3]",
  active:    "bg-[#00AA13]/70",
  "at-risk": "bg-[#EAAA00]/80",
  "on-hold": "bg-[#4F758B]/60",
  complete:  "bg-[#00573F]/70",
};

const MS_DOT: Record<MilestoneStatus, string> = {
  complete:  "bg-[#00AA13] border-[#00573F]",
  "on-track":"bg-white border-[#00AA13]",
  "at-risk": "bg-[#EAAA00] border-[#7a5900]",
  late:      "bg-red-500 border-red-700",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function pct(date: string, minMs: number, rangeMs: number): number {
  const t = new Date(date).getTime();
  return Math.max(0, Math.min(100, ((t - minMs) / rangeMs) * 100));
}

// ── ProjectGantt ───────────────────────────────────────────────────────────────

interface Props {
  projects: ComplexProject[];
  scores: Map<string, ProjectScore>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ProjectGantt({ projects, scores, selectedId, onSelect }: Props) {
  const { minMs, rangeMs, months } = useMemo(() => {
    const today = new Date();

    // Window: 3 months before today → 18 months after
    const windowStart = new Date(today);
    windowStart.setMonth(windowStart.getMonth() - 3);
    windowStart.setDate(1);

    const windowEnd = new Date(today);
    windowEnd.setMonth(windowEnd.getMonth() + 18);
    windowEnd.setDate(1);

    const minMs   = windowStart.getTime();
    const maxMs   = windowEnd.getTime();
    const rangeMs = maxMs - minMs;

    // Build month labels
    const months: { label: string; left: number }[] = [];
    const cur = new Date(windowStart);
    while (cur < windowEnd) {
      months.push({
        label: cur.toLocaleString("default", { month: "short", year: "2-digit" }),
        left:  ((cur.getTime() - minMs) / rangeMs) * 100,
      });
      cur.setMonth(cur.getMonth() + 1);
    }

    return { minMs, rangeMs, months };
  }, []);

  const todayPct = pct(new Date().toISOString().split("T")[0]!, minMs, rangeMs);

  const sorted = [...projects].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Month axis */}
        <div className="relative mb-1 h-6 border-b">
          {months.map((m) => (
            <span
              key={m.label}
              className="absolute top-1 text-[9px] text-muted-foreground"
              style={{ left: `${m.left}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* Today line overlay container */}
        <div className="relative flex flex-col gap-1">
          {/* Today line */}
          <div
            className="pointer-events-none absolute inset-y-0 z-10 w-px bg-[#00AA13]/60"
            style={{ left: `${todayPct}%` }}
          />

          {sorted.map((p) => {
            const score      = scores.get(p.id);
            const barLeft    = pct(p.startDate, minMs, rangeMs);
            const barRight   = pct(p.endDate,   minMs, rangeMs);
            const barWidth   = Math.max(barRight - barLeft, 0.5);
            const isSelected = selectedId === p.id;

            return (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className={cn(
                  "relative flex h-9 w-full items-center rounded transition-colors hover:bg-muted/30",
                  isSelected && "bg-muted/40",
                )}
              >
                {/* Row label (fixed left) */}
                <span className="absolute left-0 w-[180px] shrink-0 truncate pr-2 text-left text-[10px] font-medium text-foreground">
                  {p.name}
                </span>

                {/* Chart area — push left by label width */}
                <div className="absolute inset-y-1 right-0" style={{ left: "185px" }}>
                  <div className="relative h-full w-full">
                    {/* Project bar */}
                    <div
                      className={cn(
                        "absolute top-1 h-3 rounded-full opacity-80",
                        STATUS_BAR[p.status],
                        isSelected && "opacity-100 ring-1 ring-[#00AA13]",
                      )}
                      style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                    />

                    {/* Milestone dots */}
                    {p.milestones.map((m) => {
                      const mLeft = pct(m.plannedDate, minMs, rangeMs);
                      if (mLeft < 0 || mLeft > 100) return null;
                      return (
                        <div
                          key={m.name}
                          title={`${m.name} (${m.plannedDate})`}
                          className={cn(
                            "absolute top-1 h-3 w-3 -translate-x-1/2 rounded-full border-2",
                            MS_DOT[m.status],
                          )}
                          style={{ left: `${mLeft}%` }}
                        />
                      );
                    })}

                    {/* Risk badge */}
                    {score && (
                      <span
                        className={cn(
                          "absolute -top-0.5 rounded px-1 py-0.5 text-[8px] font-semibold text-white",
                          score.riskLevel === "critical" ? "bg-red-500" :
                          score.riskLevel === "high"     ? "bg-[#DB6B30]" :
                          score.riskLevel === "medium"   ? "bg-[#EAAA00] text-[#1D252D]" :
                                                           "bg-[#00AA13]",
                        )}
                        style={{ left: `${Math.max(barLeft + barWidth + 0.5, 0)}%` }}
                      >
                        {score.compositeRisk}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t pt-2 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full border-2 border-[#00573F] bg-[#00AA13]" /> Complete
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full border-2 border-[#00AA13] bg-white" /> On-track
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full border-2 border-[#7a5900] bg-[#EAAA00]" /> At Risk
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full border-2 border-red-700 bg-red-500" /> Late
          </span>
          <span className="ml-auto flex items-center gap-1">
            <span className="h-3 w-px bg-[#00AA13]/60" /> Today
          </span>
        </div>
      </div>
    </div>
  );
}
