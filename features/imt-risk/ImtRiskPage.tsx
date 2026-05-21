"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { scoreImtRequest, DEFAULT_THRESHOLDS, type ImtThresholds, type ImtOutput } from "@/lib/risk/imt";
import { IMT_REQUESTS, type ImtRequest } from "@/data/mock/imt-requests";
import { ThresholdSlider } from "./ThresholdSlider";
import { ScenarioChart } from "./ScenarioChart";
import { ImtQueue, type ScoredRequest } from "./ImtQueue";
import { ImtDetailDrawer } from "./ImtDetailDrawer";

function StatCard({
  label, value, icon: Icon, color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="px-4 py-3 flex items-center gap-3">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", color)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none tabular-nums">{value}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ImtRiskPage() {
  const [thresholds, setThresholds] = useState<ImtThresholds>(DEFAULT_THRESHOLDS);
  const [selectedItem, setSelectedItem] = useState<ScoredRequest | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const scoredItems: ScoredRequest[] = useMemo(
    () =>
      IMT_REQUESTS.map((req) => ({
        request: req,
        output: scoreImtRequest(req.input, thresholds),
      })),
    [thresholds]
  );

  const counts = useMemo(() => ({
    total:   scoredItems.length,
    approve: scoredItems.filter((i) => i.output.decision === "approve").length,
    review:  scoredItems.filter((i) => i.output.decision === "review").length,
    reject:  scoredItems.filter((i) => i.output.decision === "reject").length,
  }), [scoredItems]);

  function handleSelect(item: ScoredRequest) {
    setSelectedItem(item);
    setDrawerOpen(true);
  }

  // Re-compute selected output whenever thresholds change
  const selectedOutput: ImtOutput | null = useMemo(
    () =>
      selectedItem
        ? scoreImtRequest(selectedItem.request.input, thresholds)
        : null,
    [selectedItem, thresholds]
  );

  const selectedRequest: ImtRequest | null = selectedItem?.request ?? null;

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total in Queue"    value={counts.total}   icon={AlertTriangle}  color="bg-slate-500" />
        <StatCard label="Approve"           value={counts.approve} icon={CheckCircle2}   color="bg-green-500" />
        <StatCard label="Needs Review"      value={counts.review}  icon={Clock}          color="bg-amber-500" />
        <StatCard label="Reject"            value={counts.reject}  icon={XCircle}        color="bg-red-500" />
      </div>

      {/* Controls + chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ThresholdSlider thresholds={thresholds} onChange={setThresholds} />
        </div>
        <div className="lg:col-span-3">
          <ScenarioChart
            output={selectedOutput}
            title={selectedRequest ? `${selectedRequest.id} — Factor Breakdown` : "Factor Risk Breakdown"}
          />
        </div>
      </div>

      {/* Queue table */}
      <ImtQueue
        items={scoredItems}
        selectedId={selectedItem?.request.id ?? null}
        onSelect={handleSelect}
      />

      {/* Detail drawer */}
      <ImtDetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        request={selectedRequest}
        output={selectedOutput}
      />
    </div>
  );
}
