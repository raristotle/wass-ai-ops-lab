"use client";

import { useState, useMemo } from "react";
import { mockComplexProjects } from "@/data/mock/complex-projects";
import { scoreProject } from "@/lib/risk/project-orchestrator";
import type { ComplexProject, ProjectScore, SBU, RiskType, RiskSeverity } from "@/lib/risk/project-orchestrator";
import { ALL_SBUS } from "@/lib/risk/project-orchestrator";
import { ProjectKanban } from "./ProjectKanban";
import { ProjectGantt } from "./ProjectGantt";
import { ProjectRiskHeatmap } from "./ProjectRiskHeatmap";
import { OneWescoBrief } from "./OneWescoBrief";
import { ProjectDetailDrawer } from "./ProjectDetailDrawer";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

// ── KPI card ───────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums", accent)}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

type ViewTab = "kanban" | "gantt" | "heatmap";

const VIEW_TABS: { key: ViewTab; label: string }[] = [
  { key: "kanban",  label: "Kanban" },
  { key: "gantt",   label: "Gantt" },
  { key: "heatmap", label: "Risk Heatmap" },
];

// ── ProjectOrchestratorPage ────────────────────────────────────────────────────

export function ProjectOrchestratorPage() {
  const [view, setView]               = useState<ViewTab>("kanban");
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [detailOpen, setDetailOpen]   = useState(false);
  const [briefOpen, setBriefOpen]     = useState(false);
  const [activeSbu, setActiveSbu]     = useState<SBU | null>(null);
  const [heatActiveSbu, setHeatSbu]   = useState<SBU | null>(null);
  const [heatActiveType, setHeatType] = useState<RiskType | null>(null);

  // Score all projects once
  const scores: Map<string, ProjectScore> = useMemo(() => {
    const m = new Map<string, ProjectScore>();
    mockComplexProjects.forEach((p) => m.set(p.id, scoreProject(p, mockComplexProjects)));
    return m;
  }, []);

  // Filtered projects
  const filtered = useMemo(() => {
    return mockComplexProjects.filter((p) => {
      if (activeSbu && !p.sbus.includes(activeSbu)) return false;
      return true;
    });
  }, [activeSbu]);

  // KPIs
  const totalValue     = mockComplexProjects.reduce((s, p) => s + p.totalValueUsd, 0);
  const criticalCount  = [...scores.values()].filter((s) => s.riskLevel === "critical").length;
  const atRiskCount    = [...scores.values()].filter((s) => s.riskLevel === "high" || s.riskLevel === "critical").length;
  const xsellTotal     = mockComplexProjects.reduce(
    (s, p) => s + p.crossSell.filter((c) => c.status !== "quoted").reduce((x, c) => x + c.estimatedValueUsd, 0), 0,
  );

  const selectedProject = selectedId ? (mockComplexProjects.find((p) => p.id === selectedId) ?? null) : null;
  const selectedScore   = selectedId ? (scores.get(selectedId) ?? null) : null;

  function handleSelect(id: string) {
    setSelectedId(id);
    setDetailOpen(true);
  }

  function handleHeatmapCell(sbu: SBU, type: RiskType) {
    setHeatSbu(sbu === heatActiveSbu && type === heatActiveType ? null : sbu);
    setHeatType(sbu === heatActiveSbu && type === heatActiveType ? null : type);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-[#1D252D] dark:text-foreground">
          Cross-SBU Project Orchestrator
        </h1>
        <p className="text-sm text-muted-foreground">
          {mockComplexProjects.length} projects · CSS / EES / UBS · {criticalCount} critical-risk
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Portfolio Value"
          value={`$${(totalValue / 1e6).toFixed(1)}M`}
          sub="across all projects"
          accent="text-[#004986]"
        />
        <KpiCard
          label="Critical Risk"
          value={String(criticalCount)}
          sub="projects need immediate action"
          accent="text-red-500"
        />
        <KpiCard
          label="High + Critical"
          value={String(atRiskCount)}
          sub="risk score ≥ 50"
          accent="text-[#DB6B30]"
        />
        <KpiCard
          label="Cross-Sell Pipeline"
          value={`$${(xsellTotal / 1e6).toFixed(1)}M`}
          sub="open opportunities"
          accent="text-[#00AA13]"
        />
      </div>

      {/* SBU filter + view tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
        {/* SBU filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">SBU:</span>
          <button
            onClick={() => setActiveSbu(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              activeSbu === null
                ? "border-[#1D252D] bg-[#1D252D] text-white dark:border-white dark:bg-white dark:text-[#1D252D]"
                : "border-transparent bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </button>
          {ALL_SBUS.map((sbu) => (
            <button
              key={sbu}
              onClick={() => setActiveSbu(activeSbu === sbu ? null : sbu)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                activeSbu === sbu
                  ? sbu === "CSS" ? "border-[#004986] bg-[#004986] text-white"
                  : sbu === "EES" ? "border-[#00573F] bg-[#00573F] text-white"
                  : "border-[#3a9f9c] bg-[#64CCC9] text-[#1D252D]"
                  : "border-transparent bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {sbu}
            </button>
          ))}
          {activeSbu && (
            <button
              onClick={() => setActiveSbu(null)}
              className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {/* View tabs */}
        <div className="flex rounded-lg border bg-muted p-0.5">
          {VIEW_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* View panel */}
      <div className="rounded-lg border bg-card p-4">
        {view === "kanban" && (
          <ProjectKanban
            projects={filtered}
            scores={scores}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        )}
        {view === "gantt" && (
          <ProjectGantt
            projects={filtered}
            scores={scores}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        )}
        {view === "heatmap" && (
          <ProjectRiskHeatmap
            projects={filtered}
            activeSbu={heatActiveSbu}
            activeType={heatActiveType}
            onCellClick={handleHeatmapCell}
          />
        )}
      </div>

      {/* Score table (commit 2 panel) */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Project Score Breakdown
          </p>
          <p className="text-[10px] text-muted-foreground">Sorted by composite risk</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-[11px]">
            <thead>
              <tr className="border-b bg-muted/30">
                {["Project", "Value", "Late Ms.", "Margin", "Fulfillment", "Owner", "Composite", "Level"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...mockComplexProjects]
                .sort((a, b) => (scores.get(b.id)?.compositeRisk ?? 0) - (scores.get(a.id)?.compositeRisk ?? 0))
                .map((p) => {
                  const s = scores.get(p.id);
                  if (!s) return null;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleSelect(p.id)}
                      className={cn(
                        "cursor-pointer border-b transition-colors hover:bg-muted/20",
                        selectedId === p.id && "bg-[#00AA13]/5",
                      )}
                    >
                      <td className="px-3 py-2 font-medium">{p.name}</td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatCurrency(p.totalValueUsd)}</td>
                      {[s.lateMilestoneRisk, s.marginRisk, s.fulfillmentRisk, s.missingOwnerRisk].map((v, i) => (
                        <td key={i} className={cn(
                          "px-3 py-2 tabular-nums font-medium",
                          v >= 70 ? "text-red-500" : v >= 50 ? "text-[#DB6B30]" : v >= 30 ? "text-[#EAAA00]" : "text-[#00AA13]",
                        )}>
                          {v}
                        </td>
                      ))}
                      <td className={cn(
                        "px-3 py-2 tabular-nums font-bold",
                        s.compositeRisk >= 70 ? "text-red-500" : s.compositeRisk >= 50 ? "text-[#DB6B30]" : s.compositeRisk >= 30 ? "text-[#EAAA00]" : "text-[#00AA13]",
                      )}>
                        {s.compositeRisk}
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn(
                          "rounded px-1.5 py-0.5 text-[9px] font-semibold capitalize text-white",
                          s.riskLevel === "critical" ? "bg-red-500" :
                          s.riskLevel === "high"     ? "bg-[#DB6B30]" :
                          s.riskLevel === "medium"   ? "bg-[#EAAA00] text-[#1D252D]" :
                                                       "bg-[#00AA13]",
                        )}>
                          {s.riskLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      <ProjectDetailDrawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedId(null); }}
        project={selectedProject}
        score={selectedScore}
        onOpenBrief={() => { setDetailOpen(false); setBriefOpen(true); }}
      />

      {/* One Wesco Brief */}
      <OneWescoBrief
        open={briefOpen}
        onClose={() => setBriefOpen(false)}
        project={selectedProject}
        score={selectedScore}
      />

      <p className="text-center text-[10px] text-muted-foreground">
        PROTOTYPE ONLY — AI-generated risk scores. Human review required before action. Not for operational use.
      </p>
    </div>
  );
}
