"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";
import type { ComplexProject, RiskSeverity, RiskType, SBU } from "@/lib/risk/project-orchestrator";
import { ALL_RISK_TYPES, ALL_SBUS, RISK_TYPE_LABELS, SBU_LABELS } from "@/lib/risk/project-orchestrator";

// ── Helpers ────────────────────────────────────────────────────────────────────

const SEV_ORDER: Record<RiskSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };

const CELL_COLOR: Record<RiskSeverity | "none", string> = {
  critical: "bg-red-600 text-white",
  high:     "bg-[#DB6B30] text-white",
  medium:   "bg-[#EAAA00] text-[#1D252D]",
  low:      "bg-[#00AA13]/70 text-white",
  none:     "bg-muted/30 text-muted-foreground/40",
};

function worstSeverity(projects: ComplexProject[], sbu: SBU, type: RiskType): { sev: RiskSeverity | "none"; count: number } {
  let best = 0;
  let count = 0;
  for (const p of projects) {
    if (!p.sbus.includes(sbu)) continue;
    for (const r of p.risks) {
      if (r.type === type) {
        count++;
        if (SEV_ORDER[r.severity] > best) best = SEV_ORDER[r.severity];
      }
    }
  }
  const sev: RiskSeverity | "none" = best === 4 ? "critical" : best === 3 ? "high" : best === 2 ? "medium" : best === 1 ? "low" : "none";
  return { sev, count };
}

// ── ProjectRiskHeatmap ─────────────────────────────────────────────────────────

interface Props {
  projects: ComplexProject[];
  onCellClick?: (sbu: SBU, type: RiskType) => void;
  activeSbu?: SBU | null;
  activeType?: RiskType | null;
}

export function ProjectRiskHeatmap({ projects, onCellClick, activeSbu, activeType }: Props) {
  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-px rounded-lg border bg-border text-center"
        style={{ gridTemplateColumns: `160px repeat(${ALL_SBUS.length}, 1fr)` }}
      >
        {/* Header row */}
        <div className="rounded-tl-lg bg-card px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" />
        {ALL_SBUS.map((sbu, i) => (
          <div
            key={sbu}
            className={cn(
              "bg-card px-2 py-2 text-[10px] font-semibold",
              i === ALL_SBUS.length - 1 && "rounded-tr-lg",
            )}
          >
            <p className="truncate">{sbu}</p>
            <p className="truncate text-[9px] font-normal text-muted-foreground">{SBU_LABELS[sbu].split(" ")[0]}</p>
          </div>
        ))}

        {/* Risk type rows */}
        {ALL_RISK_TYPES.map((type, ri) => (
          <Fragment key={type}>
            {/* Row label */}
            <div
              className={cn(
                "bg-card px-3 py-2 text-left text-[10px] font-medium text-muted-foreground",
                ri === ALL_RISK_TYPES.length - 1 && "rounded-bl-lg",
              )}
            >
              {RISK_TYPE_LABELS[type]}
            </div>

            {/* SBU cells */}
            {ALL_SBUS.map((sbu, si) => {
              const { sev, count } = worstSeverity(projects, sbu, type);
              const isActive = activeSbu === sbu && activeType === type;
              return (
                <button
                  key={sbu}
                  onClick={() => onCellClick?.(sbu, type)}
                  className={cn(
                    "flex flex-col items-center justify-center px-2 py-2 transition-all",
                    CELL_COLOR[sev],
                    isActive && "ring-2 ring-inset ring-white/60",
                    ri === ALL_RISK_TYPES.length - 1 && si === ALL_SBUS.length - 1 && "rounded-br-lg",
                  )}
                >
                  {count > 0 ? (
                    <>
                      <span className="text-xs font-bold tabular-nums">{count}</span>
                      <span className="text-[8px] font-medium capitalize opacity-80">{sev}</span>
                    </>
                  ) : (
                    <span className="text-[9px]">—</span>
                  )}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-3 text-[9px] text-muted-foreground">
        {(["critical", "high", "medium", "low", "none"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className={cn("h-2.5 w-2.5 rounded", CELL_COLOR[s])} />
            {s === "none" ? "No risk" : s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        ))}
        <span className="ml-auto">Numbers = risk count · Color = worst severity</span>
      </div>
    </div>
  );
}
