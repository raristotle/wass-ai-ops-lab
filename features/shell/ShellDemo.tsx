"use client";

import { useMemo } from "react";
import { useOpsStore } from "@/lib/store";
import { AppShell } from "./AppShell";
import { KpiStrip } from "./KpiStrip";
import { ShellTable } from "./ShellTable";
import { ChartArea } from "./ChartArea";
import { DetailDrawer } from "./DetailDrawer";
import { SECTION_CONFIGS, applyFilters } from "./sectionConfigs";
import { ImtRiskPage } from "@/features/imt-risk/ImtRiskPage";
import { EprocRiskPage } from "@/features/eproc-risk/EprocRiskPage";
import { SalesNbaPage } from "@/features/sales-nba/SalesNbaPage";
import { ProjectOrchestratorPage } from "@/features/project-orchestrator/ProjectOrchestratorPage";
import { DcControlTowerPage } from "@/features/dc-control-tower/DcControlTowerPage";
import { AutoBomPage } from "@/features/autobom-assistant/AutoBomPage";
import { WinLossPage } from "@/features/win-loss-workbench/WinLossPage";
import type { Section } from "@/lib/store";

type ShellSection = Exclude<Section, "imt-risk" | "eproc-risk" | "sales-nba" | "project-orchestrator" | "dc-control-tower" | "autobom-assistant" | "win-loss-workbench">;

export function ShellDemo() {
  const {
    activeSection,
    selectedSbus,
    selectedFunctions,
    dateFrom,
    dateTo,
    selectRow,
    closeDrawer,
    selectedRowId,
    drawerOpen,
  } = useOpsStore();

  // All hooks must be called unconditionally — no early returns above this line.
  const isImtRisk              = activeSection === "imt-risk";
  const isEprocRisk            = activeSection === "eproc-risk";
  const isSalesNba             = activeSection === "sales-nba";
  const isProjectOrchestrator  = activeSection === "project-orchestrator";
  const isDcControlTower       = activeSection === "dc-control-tower";
  const isAutoBom              = activeSection === "autobom-assistant";
  const isWinLoss              = activeSection === "win-loss-workbench";
  const isSpecial              = isImtRisk || isEprocRisk || isSalesNba || isProjectOrchestrator || isDcControlTower || isAutoBom || isWinLoss;
  const config = isSpecial ? null : SECTION_CONFIGS[activeSection as ShellSection];

  const rawData = useMemo(
    () => (config ? config.getData() : []),
    [activeSection], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const filteredData = useMemo(
    () =>
      config ? applyFilters(rawData, selectedSbus, selectedFunctions, dateFrom, dateTo) : [],
    [rawData, selectedSbus, selectedFunctions, dateFrom, dateTo, config],
  );

  const kpis = useMemo(
    () => (config ? config.computeKpis(filteredData) : []),
    [filteredData, activeSection], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const chartConfig = useMemo(
    () => (config ? config.computeChartData(filteredData) : null),
    [filteredData, activeSection], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const selectedRow = useMemo(
    () => (selectedRowId ? (rawData.find((r) => r.id === selectedRowId) ?? null) : null),
    [selectedRowId, rawData],
  );

  // Conditional renders only after all hooks.
  if (isImtRisk) {
    return (
      <AppShell>
        <ImtRiskPage />
      </AppShell>
    );
  }

  if (isEprocRisk) {
    return (
      <AppShell>
        <EprocRiskPage />
      </AppShell>
    );
  }

  if (isSalesNba) {
    return (
      <AppShell>
        <SalesNbaPage />
      </AppShell>
    );
  }

  if (isProjectOrchestrator) {
    return (
      <AppShell>
        <ProjectOrchestratorPage />
      </AppShell>
    );
  }

  if (isDcControlTower) {
    return (
      <AppShell>
        <DcControlTowerPage />
      </AppShell>
    );
  }

  if (isAutoBom) {
    return (
      <AppShell>
        <AutoBomPage />
      </AppShell>
    );
  }

  if (isWinLoss) {
    return (
      <AppShell>
        <WinLossPage />
      </AppShell>
    );
  }

  if (!config || !chartConfig) return null;

  return (
    <AppShell>
      <KpiStrip kpis={kpis} />
      <ChartArea
        title={chartConfig.title}
        data={chartConfig.data}
        keys={chartConfig.keys}
        type={chartConfig.type}
        xKey={chartConfig.xKey}
      />
      <ShellTable
        columns={config.columns}
        data={filteredData}
        onRowClick={(row) => selectRow(row.id as string)}
        selectedId={selectedRowId}
      />
      <DetailDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        row={selectedRow}
        columns={config.columns}
        sectionTitle={config.title}
      />
    </AppShell>
  );
}
