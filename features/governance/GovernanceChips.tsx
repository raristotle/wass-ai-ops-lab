"use client";

import { UserCheck, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ── Human-review required flag ────────────────────────────────────────────────

export function HumanReviewFlag() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <UserCheck className="h-3.5 w-3.5 shrink-0" />
      Human review required before any action on this output
    </div>
  );
}

// ── Confidence score chip ─────────────────────────────────────────────────────

interface ConfidenceChipProps {
  score: number; // 0-100
  className?: string;
}

export function ConfidenceChip({ score, className }: ConfidenceChipProps) {
  const color =
    score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500";
  const label =
    score >= 80 ? "High" : score >= 60 ? "Medium" : score > 0 ? "Low" : "N/A";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="tabular-nums text-xs">{score > 0 ? `${score}%` : "—"}</span>
      <span className="text-[10px] text-muted-foreground">({label})</span>
    </div>
  );
}

// ── Reason code list ──────────────────────────────────────────────────────────

const CODE_LABELS: Record<string, string> = {
  LOW_SAMPLE_SIZE:    "Low Sample Size",
  MODEL_DRIFT:        "Model Drift",
  HIGH_ERROR_RATE:    "High Error Rate",
  COST_VARIANCE:      "Cost Variance",
  INSUFFICIENT_DATA:  "Insufficient Data",
  SEASONAL_ANOMALY:   "Seasonal Anomaly",
  REGULATORY_RISK:    "Regulatory Risk",
  MANUAL_OVERRIDE:    "Manual Override",
  PILOT_EVALUATION:   "Pilot Evaluation",
  DEPRECATED:         "Deprecated",
  HIGH_LATENCY:       "High Latency",
};

const CODE_VARIANT: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
  HIGH_ERROR_RATE:    "destructive",
  REGULATORY_RISK:    "destructive",
  MODEL_DRIFT:        "warning",
  COST_VARIANCE:      "warning",
  PILOT_EVALUATION:   "warning",
  SEASONAL_ANOMALY:   "secondary",
  LOW_SAMPLE_SIZE:    "secondary",
  INSUFFICIENT_DATA:  "secondary",
  MANUAL_OVERRIDE:    "success",
  DEPRECATED:         "outline",
  HIGH_LATENCY:       "secondary",
};

interface ReasonCodeListProps {
  codes: string[];
}

export function ReasonCodeList({ codes }: ReasonCodeListProps) {
  if (codes.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      <Tag className="h-3.5 w-3.5 shrink-0 self-center text-muted-foreground" />
      {codes.map((code) => (
        <Badge
          key={code}
          variant={CODE_VARIANT[code] ?? "secondary"}
          className="text-[10px]"
        >
          {CODE_LABELS[code] ?? code}
        </Badge>
      ))}
    </div>
  );
}

// ── Inline confidence cell (used in table columns) ────────────────────────────

export function ConfidenceCell({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500";

  if (score === 0) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="tabular-nums">{score}%</span>
    </div>
  );
}
