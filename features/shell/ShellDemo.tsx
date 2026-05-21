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
import type { Section } from "@/lib/store";

type ShellSection = Exclude<Section, "imt-risk">;

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

  // IMT Risk has its own full-page layout
  if (activeSection === "imt-risk") {
    return (
      <AppShell>
        <ImtRiskPage />
      </AppShell>
    );
  }

  // All other sections use the generic shell
  const config = SECTION_CONFIGS[activeSection as ShellSection];

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const rawData = useMemo(() => config.getData(), [activeSection]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const filteredData = useMemo(
    () => applyFilters(rawData, selectedSbus, selectedFunctions, dateFrom, dateTo),
    [rawData, selectedSbus, selectedFunctions, dateFrom, dateTo]
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const kpis = useMemo(() => config.computeKpis(filteredData), [filteredData, activeSection]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const chartConfig = useMemo(
    () => config.computeChartData(filteredData),
    [filteredData, activeSection] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const selectedRow = useMemo(
    () => (selectedRowId ? (rawData.find((r) => r.id === selectedRowId) ?? null) : null),
    [selectedRowId, rawData]
  );

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
