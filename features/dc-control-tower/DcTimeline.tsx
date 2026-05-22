"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { DcProject, DcMilestone } from "@/lib/risk/dc-risk";

// ── Style maps ─────────────────────────────────────────────────────────────────

const MS_STATUS_COLOR: Record<DcMilestone["status"], string> = {
  complete:   "bg-[#00AA13] border-[#00573F] text-white",
  "on-track": "bg-white border-[#00AA13] text-[#00573F]",
  late:       "bg-red-500 border-red-700 text-white",
  pending:    "bg-[#B7C9D3] border-[#4F758B] text-[#4F758B]",
};

const MS_LINE_COLOR: Record<DcMilestone["status"], string> = {
  complete:   "bg-[#00AA13]",
  "on-track": "bg-[#00AA13]/40",
  late:       "bg-red-400",
  pending:    "bg-[#B7C9D3]",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function pct(dateStr: string, minMs: number, rangeMs: number): number {
  const t = new Date(dateStr).getTime();
  return Math.max(0, Math.min(100, ((t - minMs) / rangeMs) * 100));
}

// ── DcTimeline ─────────────────────────────────────────────────────────────────

interface Props {
  projects: DcProject[];
  activeProjectId: string;
  onProjectChange: (id: string) => void;
}

export function DcTimeline({ projects, activeProjectId, onProjectChange }: Props) {
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0];

  const { minMs, rangeMs, months, todayPct } = useMemo(() => {
    if (!activeProject) return { minMs: 0, rangeMs: 1, months: [], todayPct: 0 };

    // Window: 2 months before earliest milestone → 1 month after mechanicalSet
    const dates = activeProject.milestones.map((m) => new Date(m.date).getTime());
    const earliest = Math.min(...dates);
    const mechanicalMs = new Date(activeProject.mechanicalSetDate).getTime();

    const start = new Date(earliest);
    start.setMonth(start.getMonth() - 1);
    start.setDate(1);

    const end = new Date(mechanicalMs);
    end.setMonth(end.getMonth() + 1);
    end.setDate(1);

    const minMs   = start.getTime();
    const maxMs   = end.getTime();
    const rangeMs = Math.max(maxMs - minMs, 1);
    const todayPct = pct(new Date().toISOString().split("T")[0]!, minMs, rangeMs);

    const months: { label: string; left: number }[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      months.push({
        label: cur.toLocaleString("default", { month: "short", year: "2-digit" }),
        left: ((cur.getTime() - minMs) / rangeMs) * 100,
      });
      cur.setMonth(cur.getMonth() + 1);
    }

    return { minMs, rangeMs, months, todayPct };
  }, [activeProject]);

  if (!activeProject) return null;

  const mechanicalPct = pct(activeProject.mechanicalSetDate, minMs, rangeMs);

  return (
    <div className="flex flex-col gap-4">
      {/* Project selector */}
      <div className="flex flex-wrap gap-1.5">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => onProjectChange(p.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              p.id === activeProjectId
                ? "border-[#00AA13] bg-[#00AA13]/10 text-[#00573F]"
                : "border-transparent bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="overflow-x-auto">
        <div className="relative min-w-[700px] pb-4 pt-8">
          {/* Month axis */}
          <div className="absolute inset-x-0 top-0 h-6">
            {months.map((m) => (
              <span
                key={m.label}
                className="absolute text-[9px] text-muted-foreground"
                style={{ left: `${m.left}%` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Mechanical-set deadline */}
          <div
            className="absolute inset-y-6 bottom-0 z-20 flex flex-col items-center"
            style={{ left: `${mechanicalPct}%` }}
          >
            <div className="w-px flex-1 border-l-2 border-dashed border-red-500" />
            <span className="mt-1 rounded bg-red-500 px-1 py-0.5 text-[8px] font-bold text-white whitespace-nowrap">
              Mech. Set
            </span>
          </div>

          {/* Today line */}
          <div
            className="absolute inset-y-6 bottom-0 z-10 w-px bg-[#00AA13]/70"
            style={{ left: `${todayPct}%` }}
          />

          {/* Spine */}
          <div className="absolute inset-x-0 top-[52px] h-px bg-border" />

          {/* Milestone nodes */}
          <div className="relative pt-6">
            {activeProject.milestones.map((m, i) => {
              const left = pct(m.date, minMs, rangeMs);
              return (
                <div
                  key={i}
                  className="absolute"
                  style={{ left: `${left}%`, top: 0 }}
                >
                  {/* Connector line from spine */}
                  <div className={cn("mx-auto w-px", MS_LINE_COLOR[m.status])} style={{ height: "20px" }} />
                  {/* Node */}
                  <div
                    className={cn(
                      "relative -translate-x-1/2 rounded-full border-2 text-center",
                      MS_STATUS_COLOR[m.status],
                    )}
                    style={{ width: 16, height: 16 }}
                    title={`${m.name}: ${m.date}`}
                  />
                  {/* Label — alternate above/below */}
                  <div
                    className={cn(
                      "absolute w-24 -translate-x-1/2 text-[8px] leading-tight",
                      i % 2 === 0 ? "top-10 text-muted-foreground" : "-top-8 text-muted-foreground",
                    )}
                  >
                    <p className="font-medium">{m.name}</p>
                    <p>{m.date}</p>
                    <p className={cn(
                      "font-semibold capitalize",
                      m.status === "late" ? "text-red-500" :
                      m.status === "on-track" ? "text-[#00AA13]" : "",
                    )}>
                      {m.status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Asset completion summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(["po-placed", "receiving", "staging", "qa", "ready", "delivered"] as const).map((stage) => {
          const count = activeProject.assets.filter((a) => a.stage === stage).length;
          return count > 0 ? (
            <div key={stage} className="rounded-lg border bg-card px-3 py-2">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{stage.replace("-", " ")}</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums">{count}</p>
              <p className="text-[9px] text-muted-foreground">asset{count !== 1 ? "s" : ""}</p>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}
