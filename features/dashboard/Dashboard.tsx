"use client";

import { useOpsStore } from "@/lib/store";
import { mockIncidents } from "@/data/mock/incidents";
import { mockPipelines } from "@/data/mock/pipelines";
import { mockMetrics, mockModelMetrics } from "@/data/mock/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LatencyChart, ThroughputChart, ModelComparisonChart } from "@/components/charts/MetricsChart";
import { IncidentList } from "@/features/incidents/IncidentList";
import { PipelineView } from "@/features/pipelines/PipelineView";
import { formatNumber, formatTokens } from "@/lib/utils";

const TIME_RANGES = ["1h", "6h", "24h", "7d"] as const;

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "red" | "yellow" | "green" | "blue";
}) {
  const accentClass = {
    red: "border-l-red-500",
    yellow: "border-l-yellow-500",
    green: "border-l-green-500",
    blue: "border-l-blue-500",
  }[accent ?? "blue"];

  return (
    <Card className={`border-l-4 ${accentClass}`}>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { timeRange, setTimeRange } = useOpsStore();

  const openIncidents = mockIncidents.filter((i) => i.status !== "resolved").length;
  const criticalIncidents = mockIncidents.filter((i) => i.severity === "critical" && i.status !== "resolved").length;
  const runningPipelines = mockPipelines.filter((p) => p.status === "running").length;
  const totalTokens = mockMetrics.reduce((s, m) => s + m.tokenCount, 0);
  const avgErrorRate = (mockMetrics.reduce((s, m) => s + m.errorRate, 0) / mockMetrics.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight">WASS AI Ops Lab</h1>
          {criticalIncidents > 0 && (
            <Badge variant="critical">{criticalIncidents} critical</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {TIME_RANGES.map((r) => (
            <Button
              key={r}
              variant={timeRange === r ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange(r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </header>

      <main className="px-6 py-6 space-y-6 max-w-screen-2xl mx-auto">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Active Models"
            value={mockModelMetrics.length}
            sub="across all providers"
            accent="blue"
          />
          <StatCard
            label="Open Incidents"
            value={openIncidents}
            sub={criticalIncidents > 0 ? `${criticalIncidents} critical` : "none critical"}
            accent={criticalIncidents > 0 ? "red" : "green"}
          />
          <StatCard
            label="Pipelines Running"
            value={runningPipelines}
            sub={`${mockPipelines.length} total today`}
            accent="yellow"
          />
          <StatCard
            label="Tokens (24h)"
            value={formatTokens(totalTokens)}
            sub={`${avgErrorRate.toFixed(2)}% avg error rate`}
            accent="green"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Inference Latency</CardTitle>
            </CardHeader>
            <CardContent>
              <LatencyChart />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Request Throughput</CardTitle>
            </CardHeader>
            <CardContent>
              <ThroughputChart />
            </CardContent>
          </Card>
        </div>

        {/* Model comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Model Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ModelComparisonChart />
          </CardContent>
        </Card>

        {/* Incidents + Pipelines */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <IncidentList />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pipeline Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <PipelineView />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
