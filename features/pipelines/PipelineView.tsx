"use client";

import { mockPipelines, type Pipeline, type PipelineStatus, type StageStatus } from "@/data/mock/pipelines";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatTokens, relativeTime } from "@/lib/utils";

const pipelineStatusVariant: Record<PipelineStatus, "success" | "default" | "destructive" | "secondary" | "outline"> = {
  succeeded: "success",
  running:   "default",
  failed:    "destructive",
  queued:    "secondary",
  cancelled: "outline",
};

const stageColor: Record<StageStatus, string> = {
  succeeded: "bg-green-500",
  running:   "bg-blue-500 animate-pulse",
  failed:    "bg-red-500",
  pending:   "bg-gray-200",
  skipped:   "bg-gray-300",
};

function StagePip({ status }: { status: StageStatus }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${stageColor[status]}`} />;
}

function PipelineRow({ pl }: { pl: Pipeline }) {
  return (
    <div className="py-3 border-b last:border-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{pl.id}</span>
            <Badge variant={pipelineStatusVariant[pl.status]}>{pl.status}</Badge>
            <span className="text-xs text-muted-foreground capitalize">{pl.triggeredBy}</span>
          </div>
          <p className="text-sm font-medium mt-0.5 truncate">{pl.name}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground shrink-0">
          <div>{relativeTime(pl.startedAt)}</div>
          {pl.totalTokens > 0 && <div>{formatTokens(pl.totalTokens)} tokens</div>}
          {pl.costUsd > 0 && <div>{formatCurrency(pl.costUsd)}</div>}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {pl.stages.map((s) => (
          <span key={s.name} title={`${s.name}: ${s.status}`}>
            <StagePip status={s.status} />
          </span>
        ))}
        <span className="text-xs text-muted-foreground ml-1">
          {pl.stages.map((s) => s.name).join(" → ")}
        </span>
      </div>
    </div>
  );
}

export function PipelineView() {
  return (
    <div>
      {mockPipelines.map((pl) => (
        <PipelineRow key={pl.id} pl={pl} />
      ))}
    </div>
  );
}
