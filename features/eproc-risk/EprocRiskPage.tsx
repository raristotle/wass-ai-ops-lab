"use client";

import { useState, useMemo } from "react";
import { mockEprocAccounts } from "@/data/mock/eproc-accounts";
import { scoreEprocAccount } from "@/lib/risk/eproc";
import type { EprocAccount, EprocScore } from "@/lib/risk/eproc";
import { EprocHeatmap } from "./EprocHeatmap";
import { EprocTable } from "./EprocTable";
import { PlatformDetail } from "./PlatformDetail";
import { CsvImport } from "./CsvImport";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ScoredAccount = { account: EprocAccount; score: EprocScore };

// ── KPI card ─────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: string;
  sub: string;
  accent: "blue" | "red" | "orange" | "green";
}

function KpiCard({ label, value, sub, accent }: KpiProps) {
  const accentClass: Record<KpiProps["accent"], string> = {
    blue:   "text-blue-500",
    red:    "text-red-500",
    orange: "text-orange-500",
    green:  "text-emerald-500",
  };
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums", accentClass[accent])}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function EprocRiskPage() {
  const [importedAccounts, setImportedAccounts] = useState<EprocAccount[]>([]);
  const [filterRiskLevel, setFilterRiskLevel] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedSbu, setSelectedSbu] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [heatmapFilter, setHeatmapFilter] = useState(false);

  const allAccounts = useMemo(
    () => [...mockEprocAccounts, ...importedAccounts],
    [importedAccounts],
  );

  const scored: ScoredAccount[] = useMemo(
    () => allAccounts.map((a) => ({ account: a, score: scoreEprocAccount(a) })),
    [allAccounts],
  );

  const sbus = useMemo(
    () => [...new Set(allAccounts.map((a) => a.sbu))].sort(),
    [allAccounts],
  );

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const criticalCount     = scored.filter((s) => s.score.riskLevel === "critical").length;
  const highCount         = scored.filter((s) => s.score.riskLevel === "high").length;
  const totalRevAtRisk    = scored.reduce((sum, s) => sum + s.score.revenueAtRiskUsd, 0);
  const avgScore          = scored.length > 0
    ? Math.round(scored.reduce((sum, s) => sum + s.score.riskScore, 0) / scored.length)
    : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleCellClick(platform: string, sbu: string) {
    setSelectedPlatform(platform);
    setSelectedSbu(sbu);
    setDetailOpen(true);
    setHeatmapFilter(true);
  }

  function handleDetailClose() {
    setDetailOpen(false);
    setHeatmapFilter(false);
    setSelectedPlatform(null);
    setSelectedSbu(null);
  }

  function handleImport(accounts: EprocAccount[]) {
    setImportedAccounts((prev) => [...prev, ...accounts]);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">eProcurement Risk</h1>
          <p className="text-sm text-muted-foreground">
            Integration gaps and competitor exposure across 9 platforms ·{" "}
            <span className="font-medium">{scored.length} accounts</span>
          </p>
        </div>
        <CsvImport onImport={handleImport} />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Total Accounts"
          value={String(scored.length)}
          sub={`${sbus.length} SBUs tracked`}
          accent="blue"
        />
        <KpiCard
          label="Critical Risk"
          value={String(criticalCount)}
          sub={`+ ${highCount} high risk`}
          accent="red"
        />
        <KpiCard
          label="Revenue at Risk"
          value={`$${(totalRevAtRisk / 1e6).toFixed(1)}M`}
          sub="weighted exposure"
          accent="orange"
        />
        <KpiCard
          label="Avg Risk Score"
          value={String(avgScore)}
          sub="0 = none · 100 = critical"
          accent={avgScore >= 51 ? "orange" : avgScore >= 26 ? "orange" : "green"}
        />
      </div>

      {/* Risk heatmap */}
      <EprocHeatmap
        scored={scored}
        sbus={sbus}
        onCellClick={handleCellClick}
        selectedPlatform={selectedPlatform}
        selectedSbu={selectedSbu}
      />

      {/* Account table */}
      <EprocTable
        scored={scored}
        filterRiskLevel={filterRiskLevel}
        filterPlatform={heatmapFilter ? selectedPlatform : null}
        filterSbu={heatmapFilter ? selectedSbu : null}
        onRiskLevelFilter={setFilterRiskLevel}
      />

      {/* Prototype disclaimer */}
      <p className="text-center text-[10px] text-muted-foreground">
        PROTOTYPE ONLY — Data is simulated. No ERP writes. Not for operational use.
      </p>

      {/* Platform detail drawer — portalled to doc root via fixed positioning */}
      <PlatformDetail
        open={detailOpen}
        onClose={handleDetailClose}
        platform={selectedPlatform}
        sbu={selectedSbu}
        scored={scored}
      />
    </div>
  );
}
