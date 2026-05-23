"use client";

import { AlertTriangle, TrendingDown, Target, DollarSign, UserX, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { PricingInsight, InsightType, InsightSeverity } from "@/lib/pricing-insights";

const TYPE_META: Record<InsightType, { label: string; Icon: React.ElementType; color: string }> = {
  "price-review":       { label: "Price Review",        Icon: TrendingDown, color: "#DB6B30" },
  "competitor-alert":   { label: "Competitor Alert",    Icon: AlertTriangle, color: "#EAAA00" },
  "market-share-alert": { label: "Market Share Alert",  Icon: Target,        color: "#004986" },
  "margin-risk":        { label: "Margin Risk",         Icon: DollarSign,    color: "#DB6B30" },
  "value-sell-note":    { label: "Value-Sell Note",     Icon: TrendingDown,  color: "#4F758B" },
  "rep-concern":        { label: "Rep Concern",         Icon: UserX,         color: "#EAAA00" },
};

const SEVERITY_DOT: Record<InsightSeverity, string> = {
  high:   "bg-[#DB6B30]",
  medium: "bg-[#EAAA00]",
  low:    "bg-[#B7C9D3]",
};

interface CardProps {
  insight: PricingInsight;
  onViewQuotes?: (ids: string[]) => void;
}

function InsightCard({ insight, onViewQuotes }: CardProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[insight.type];

  return (
    <div
      className="rounded-lg border bg-card"
      style={{ borderLeftWidth: 3, borderLeftColor: meta.color }}
    >
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <meta.Icon
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: meta.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="rounded border px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{
                    color: meta.color,
                    borderColor: `${meta.color}40`,
                    backgroundColor: `${meta.color}15`,
                  }}
                >
                  {meta.label}
                </span>
                <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", SEVERITY_DOT[insight.severity])} />
                <span className="text-[9px] capitalize text-muted-foreground">{insight.severity}</span>
              </div>
              <p className="mt-1 text-xs font-semibold leading-snug">{insight.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="rounded border px-2 py-0.5 text-[10px] font-bold tabular-nums"
              style={{ color: meta.color, borderColor: `${meta.color}40`, backgroundColor: `${meta.color}10` }}
            >
              {insight.metric}
            </span>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Body */}
        <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">{insight.body}</p>

        {/* Expanded suggestion */}
        {expanded && (
          <div className="mt-2 rounded-md border bg-muted/20 px-3 py-2">
            <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              Suggested Action
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{insight.suggestion}</p>
            {onViewQuotes && insight.affectedIds.length > 0 && (
              <button
                onClick={() => onViewQuotes(insight.affectedIds)}
                className="mt-2 text-[10px] font-semibold underline underline-offset-2"
                style={{ color: meta.color }}
              >
                View {insight.affectedIds.length} affected quote{insight.affectedIds.length !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  insights: PricingInsight[];
  onViewQuotes?: (ids: string[]) => void;
}

export function InsightCards({ insights, onViewQuotes }: Props) {
  const high   = insights.filter((i) => i.severity === "high");
  const medium = insights.filter((i) => i.severity === "medium");

  if (insights.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-card px-6 py-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">No insights triggered for selected filters</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Insights appear when patterns exceed configured thresholds
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary header */}
      <div className="flex items-center gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {insights.length} Insight{insights.length !== 1 ? "s" : ""}
        </p>
        {high.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#DB6B30]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#DB6B30]" />
            {high.length} high severity
          </span>
        )}
        {medium.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#EAAA00]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#EAAA00]" />
            {medium.length} medium
          </span>
        )}
      </div>

      {/* Cards — high first */}
      <div className="grid gap-3 lg:grid-cols-2">
        {[...high, ...medium].map((ins) => (
          <InsightCard key={ins.id} insight={ins} onViewQuotes={onViewQuotes} />
        ))}
      </div>
    </div>
  );
}
