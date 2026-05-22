"use client";

import { useState, useMemo } from "react";
import { mockDcProjects, mockEscalations } from "@/data/mock/dc-projects";
import { scoreDcProject } from "@/lib/risk/dc-risk";
import type { DcRiskScore, EscalationStatus, DcStatus } from "@/lib/risk/dc-risk";
import { DcTimeline } from "./DcTimeline";
import { WarehouseCards } from "./WarehouseCards";
import { IssueQueue } from "./IssueQueue";
import { EscalationDrawer } from "./EscalationDrawer";
import { cn } from "@/lib/utils";

// ── Style maps ─────────────────────────────────────────────────────────────────

const DC_STATUS_BADGE: Record<DcStatus, string> = {
  active:    "bg-[#00AA13]/15 text-[#00573F] border-[#00AA13]/30",
  "at-risk": "bg-[#EAAA00]/15 text-[#7a5900] border-[#EAAA00]/40",
  critical:  "bg-red-500/15 text-red-600 border-red-400/40",
  complete:  "bg-[#00573F]/15 text-[#00573F] border-[#00573F]/30",
};

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

// ── RiskGauge ──────────────────────────────────────────────────────────────────

function RiskGauge({ score }: { score: DcRiskScore }) {
  const color =
    score.riskLevel === "critical" ? "bg-red-500" :
    score.riskLevel === "high"     ? "bg-[#DB6B30]" :
    score.riskLevel === "medium"   ? "bg-[#EAAA00]" : "bg-[#00AA13]";
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score.compositeRisk}%` }} />
      </div>
      <span className="font-bold tabular-nums">{score.compositeRisk}</span>
      <span className={cn(
        "capitalize text-[10px]",
        score.riskLevel === "critical" ? "text-red-500" :
        score.riskLevel === "high"     ? "text-[#DB6B30]" :
        score.riskLevel === "medium"   ? "text-[#EAAA00]" : "text-[#00AA13]",
      )}>
        {score.riskLevel}
      </span>
    </div>
  );
}

// ── DcControlTowerPage ─────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0]!;

export function DcControlTowerPage() {
  const [activeProjectId, setActiveProjectId]   = useState(mockDcProjects[0]?.id ?? "");
  const [selectedEscId,   setSelectedEscId]     = useState<string | null>(null);
  const [escalations, setEscalations]           = useState(mockEscalations);

  // Score all DC projects
  const riskScores: Map<string, DcRiskScore> = useMemo(() => {
    const m = new Map<string, DcRiskScore>();
    mockDcProjects.forEach((p) => m.set(p.id, scoreDcProject(p, TODAY)));
    return m;
  }, []);

  const activeProject = mockDcProjects.find((p) => p.id === activeProjectId) ?? mockDcProjects[0];
  const activeScore   = activeProject ? riskScores.get(activeProject.id) ?? null : null;

  // KPIs across all projects
  const totalAssets   = mockDcProjects.reduce((s, p) => s + p.assets.length, 0);
  const critProjects  = [...riskScores.values()].filter((r) => r.riskLevel === "critical").length;
  const totalExc      = mockDcProjects.reduce((s, p) => s + p.assets.filter((a) => a.exceptions.length > 0).length, 0);
  const openEsc       = escalations.filter((e) => e.status !== "resolved").length;

  // Selected escalation
  const selectedEsc    = selectedEscId ? escalations.find((e) => e.id === selectedEscId) ?? null : null;
  const escProject     = selectedEsc   ? mockDcProjects.find((p) => p.id === selectedEsc.projectId) ?? null : null;
  const escScore       = escProject    ? riskScores.get(escProject.id) ?? null : null;

  function handleUpdateStatus(id: string, newStatus: EscalationStatus) {
    setEscalations((prev) =>
      prev.map((e) => e.id !== id ? e : {
        ...e,
        status: newStatus,
        history: [
          ...e.history,
          {
            timestamp: new Date().toISOString(),
            action: `Status advanced to ${newStatus}`,
            actor: "Current User",
          },
        ],
      }),
    );
  }

  if (!activeProject) return null;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-[#1D252D] dark:text-foreground">
          DC Control Tower
        </h1>
        <p className="text-sm text-muted-foreground">
          OFCI fulfillment tracking · {mockDcProjects.length} active data center projects
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Total OFCI Assets"
          value={String(totalAssets)}
          sub="across all DC projects"
          accent="text-[#004986]"
        />
        <KpiCard
          label="Critical Projects"
          value={String(critProjects)}
          sub="risk score ≥ 70"
          accent="text-red-500"
        />
        <KpiCard
          label="Asset Exceptions"
          value={String(totalExc)}
          sub="need resolution"
          accent="text-[#DB6B30]"
        />
        <KpiCard
          label="Open Escalations"
          value={String(openEsc)}
          sub="unresolved issues"
          accent={openEsc > 0 ? "text-[#EAAA00]" : "text-[#00AA13]"}
        />
      </div>

      {/* Project selector + risk overview */}
      <div className="rounded-lg border bg-card px-4 py-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Active DC Projects
        </p>
        <div className="flex flex-wrap gap-2">
          {mockDcProjects.map((p) => {
            const score = riskScores.get(p.id);
            const isActive = p.id === activeProjectId;
            return (
              <button
                key={p.id}
                onClick={() => setActiveProjectId(p.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all hover:shadow-sm",
                  isActive
                    ? "border-[#00AA13] bg-[#00AA13]/5 ring-1 ring-[#00AA13]"
                    : "border-border bg-card hover:bg-muted/20",
                )}
              >
                <div>
                  <p className="text-xs font-semibold">{p.name}</p>
                  <p className="text-[9px] text-muted-foreground">
                    Mech. Set: {p.mechanicalSetDate} · {p.assets.length} assets
                  </p>
                  {score && <RiskGauge score={score} />}
                </div>
                <span className={cn(
                  "ml-2 rounded border px-1.5 py-0.5 text-[8px] font-semibold capitalize",
                  DC_STATUS_BADGE[p.status],
                )}>
                  {p.status}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active project: delivery risk breakdown */}
      {activeScore && (
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Delivery Risk — {activeProject.name}
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {[
              { label: "Milestone Proximity", value: activeScore.milestoneProximityRisk },
              { label: "Missing QA",          value: activeScore.missingQaRisk },
              { label: "Location Mismatch",   value: activeScore.locationMismatchRisk },
              { label: "Delayed ASN",         value: activeScore.delayedAsnRisk },
              { label: "Freight Exception",   value: activeScore.freightExceptionRisk },
              { label: "Inventory Aging",     value: activeScore.inventoryAgingRisk },
            ].map(({ label, value }) => (
              <div key={label} className="rounded border bg-background px-2 py-2 text-center">
                <p className="text-[8px] text-muted-foreground leading-tight">{label}</p>
                <p className={cn(
                  "mt-0.5 text-lg font-bold tabular-nums",
                  value >= 70 ? "text-red-500" : value >= 50 ? "text-[#DB6B30]" : value >= 30 ? "text-[#EAAA00]" : "text-[#00AA13]",
                )}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-lg border bg-card px-4 py-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Delivery Timeline
        </p>
        <DcTimeline
          projects={mockDcProjects}
          activeProjectId={activeProjectId}
          onProjectChange={setActiveProjectId}
        />
      </div>

      {/* Warehouse stage cards */}
      <div className="rounded-lg border bg-card px-4 py-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Warehouse Status — {activeProject.name}
        </p>
        <WarehouseCards
          project={activeProject}
          onAssetClick={(assetId) => {
            // Find any escalation for this asset
            const esc = escalations.find((e) => e.assetId === assetId);
            if (esc) setSelectedEscId(esc.id);
          }}
        />
      </div>

      {/* Issue queue */}
      <div className="rounded-lg border bg-card px-4 py-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Escalation Queue — All Projects
        </p>
        <IssueQueue
          escalations={escalations}
          selectedId={selectedEscId}
          onSelect={(id) => setSelectedEscId(selectedEscId === id ? null : id)}
        />
      </div>

      {/* Escalation drawer */}
      <EscalationDrawer
        open={selectedEscId !== null}
        onClose={() => setSelectedEscId(null)}
        escalation={selectedEsc}
        project={escProject}
        riskScore={escScore}
        onUpdateStatus={handleUpdateStatus}
      />

      <p className="text-center text-[10px] text-muted-foreground">
        PROTOTYPE ONLY — Fulfillment data is simulated. No ERP writes. Not for operational use.
      </p>
    </div>
  );
}
