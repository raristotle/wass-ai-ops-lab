"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface Kpi {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
  accent?: "blue" | "green" | "yellow" | "red" | "purple";
}

const accentBorder: Record<NonNullable<Kpi["accent"]>, string> = {
  blue:   "border-l-blue-500",
  green:  "border-l-green-500",
  yellow: "border-l-yellow-500",
  red:    "border-l-red-500",
  purple: "border-l-purple-500",
};

const trendColor = { up: "text-green-600", down: "text-red-600", flat: "text-muted-foreground" } as const;

const TrendIcon = ({ trend }: { trend: Kpi["trend"] }) => {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5" />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
};

export function KpiStrip({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((kpi) => (
        <Card
          key={kpi.label}
          className={cn("border-l-4", accentBorder[kpi.accent ?? "blue"])}
        >
          <CardContent className="px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-1 text-2xl font-bold leading-none">{kpi.value}</p>
            <p className={cn("mt-1.5 flex items-center gap-1 text-xs font-medium", trendColor[kpi.trend])}>
              <TrendIcon trend={kpi.trend} />
              {kpi.delta}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
