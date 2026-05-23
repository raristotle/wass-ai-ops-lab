"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { computeDeltaBuckets } from "@/lib/win-loss";
import type { QuoteRecord } from "@/lib/win-loss";

interface Props { records: QuoteRecord[] }

export function PriceDeltaChart({ records }: Props) {
  const data = computeDeltaBuckets(records);
  const hasData = data.some((d) => d.won + d.lost > 0);

  if (!hasData) {
    return (
      <div className="rounded-lg border bg-card p-4 flex items-center justify-center h-[280px]">
        <p className="text-xs text-muted-foreground">No price-delta data for selected filters</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Price Delta Distribution
      </p>
      <p className="mb-4 text-xs text-muted-foreground">
        Our price vs. competitor — negative = we were more expensive
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              border: "1px solid var(--border)",
              borderRadius: 6,
              backgroundColor: "var(--card)",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            formatter={(v) => <span style={{ color: "var(--muted-foreground)" }}>{v}</span>}
          />
          <Bar dataKey="won"  stackId="a" name="Won"  fill="#00AA13" radius={[0, 0, 0, 0]} />
          <Bar dataKey="lost" stackId="a" name="Lost" fill="#DB6B30" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
