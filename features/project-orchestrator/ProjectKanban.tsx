"use client";

import { Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { ComplexProject, ProjectScore, ProjectStatus, SBU } from "@/lib/risk/project-orchestrator";
import { STATUS_LABELS, ALL_STATUSES } from "@/lib/risk/project-orchestrator";

// ── Style maps ─────────────────────────────────────────────────────────────────

const SBU_COLOR: Record<SBU, string> = {
  CSS: "bg-[#004986]/15 text-[#004986] border-[#004986]/30",
  EES: "bg-[#00573F]/15 text-[#00573F] border-[#00573F]/30",
  UBS: "bg-[#64CCC9]/20 text-[#3a9f9c] border-[#64CCC9]/40",
};

const STATUS_HEADER: Record<ProjectStatus, string> = {
  planning:  "bg-[#B7C9D3]/20 text-[#4F758B] border-[#B7C9D3]/40",
  active:    "bg-[#00AA13]/10 text-[#00573F] border-[#00AA13]/30",
  "at-risk": "bg-[#EAAA00]/15 text-[#7a5900] border-[#EAAA00]/40",
  "on-hold": "bg-[#4F758B]/15 text-[#4F758B] border-[#4F758B]/30",
  complete:  "bg-[#00573F]/10 text-[#00573F] border-[#00573F]/30",
};

const RISK_BAR: Record<string, string> = {
  critical: "bg-red-500",
  high:     "bg-[#DB6B30]",
  medium:   "bg-[#EAAA00]",
  low:      "bg-[#00AA13]",
};

// ── ScoreBar ───────────────────────────────────────────────────────────────────

function ScoreBar({ score, level }: { score: number; level: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", RISK_BAR[level])} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground">{score}</span>
    </div>
  );
}

// ── KanbanCard ─────────────────────────────────────────────────────────────────

function KanbanCard({
  project,
  score,
  isSelected,
  onSelect,
}: {
  project: ComplexProject;
  score: ProjectScore;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const critRisks = project.risks.filter((r) => r.severity === "critical").length;
  const lateMs    = project.milestones.filter((m) => m.status === "late").length;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-all hover:shadow-md",
        isSelected && "border-[#00AA13] ring-1 ring-[#00AA13]",
      )}
    >
      {/* Name + value */}
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold leading-tight text-foreground">{project.name}</p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{project.customer}</p>
      </div>

      {/* SBU badges */}
      <div className="flex flex-wrap gap-1">
        {project.sbus.map((sbu) => (
          <span
            key={sbu}
            className={cn("rounded border px-1.5 py-0.5 text-[9px] font-semibold", SBU_COLOR[sbu])}
          >
            {sbu}
          </span>
        ))}
      </div>

      {/* Value + score */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-[#1D252D] dark:text-foreground">
          {formatCurrency(project.totalValueUsd)}
        </span>
        <ScoreBar score={score.compositeRisk} level={score.riskLevel} />
      </div>

      {/* Alert chips */}
      {(critRisks > 0 || lateMs > 0) && (
        <div className="flex flex-wrap gap-1">
          {critRisks > 0 && (
            <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-medium text-red-600">
              {critRisks} critical risk{critRisks > 1 ? "s" : ""}
            </span>
          )}
          {lateMs > 0 && (
            <span className="rounded bg-[#DB6B30]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#DB6B30]">
              {lateMs} late milestone{lateMs > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Owner count */}
      <p className="text-[9px] text-muted-foreground">
        {project.owners.length > 0
          ? `${project.owners.length} owner${project.owners.length > 1 ? "s" : ""}`
          : "⚠ No owner"}
      </p>
    </button>
  );
}

// ── ProjectKanban ──────────────────────────────────────────────────────────────

interface Props {
  projects: ComplexProject[];
  scores: Map<string, ProjectScore>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ProjectKanban({ projects, scores, selectedId, onSelect }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[900px] gap-3">
        {ALL_STATUSES.map((status) => {
          const col = projects.filter((p) => p.status === status);
          return (
            <div key={status} className="flex w-[200px] shrink-0 flex-col gap-2">
              {/* Column header */}
              <div className={cn("rounded-lg border px-3 py-2 text-center", STATUS_HEADER[status])}>
                <p className="text-[10px] font-semibold uppercase tracking-wider">
                  {STATUS_LABELS[status]}
                </p>
                <p className="mt-0.5 text-[10px] opacity-70">{col.length} project{col.length !== 1 ? "s" : ""}</p>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {col.length === 0 && (
                  <div className="rounded-lg border border-dashed bg-muted/20 px-3 py-4 text-center text-[10px] text-muted-foreground">
                    None
                  </div>
                )}
                {col.map((p) => {
                  const score = scores.get(p.id);
                  if (!score) return null;
                  return (
                    <KanbanCard
                      key={p.id}
                      project={p}
                      score={score}
                      isSelected={selectedId === p.id}
                      onSelect={() => onSelect(p.id)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
