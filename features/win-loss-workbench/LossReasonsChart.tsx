"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, ResponsiveContainer,
} from "recharts";
import { computeReasonBreakdown, LOSS_REASON_COLORS } from "@/lib/win-loss";
import type { QuoteRecord } from "@/lib/win-loss";
import { formatCurrency } from "@/lib/utils";

interface Props { records: QuoteRecord[] }

export function LossReasonsChart({ records }: Props) {
  const data = computeReasonBreakdown(records);

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 flex items-center justify-center h-[280px]">
        <p className="text-xs text-muted-foreground">No loss data for selected filters</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Loss Reasons
      </p>
      <p className="mb-4 text-xs text-muted-foreground">By frequency — count of lost quotes</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={148}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              border: "1px solid var(--border)",
              borderRadius: 6,
              backgroundColor: "var(--card)",
            }}
            formatter={(value: number, _name: string, props: { payload?: { lostValue?: number; pct?: number } }) => [
              `${value} quotes (${props.payload?.pct ?? 0}%) · ${formatCurrency(props.payload?.lostValue ?? 0)} at risk`,
              "Lost",
            ]}
          />
          <Bar dataKey="count" radius={[0, 3, 3, 0]} maxBarSize={20}>
            {data.map((entry, i) => (
              <Cell key={i} fill={LOSS_REASON_COLORS[entry.reason]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
