"use client";

import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { computeMonthlyTrend } from "@/lib/win-loss";
import type { QuoteRecord } from "@/lib/win-loss";

interface Props { records: QuoteRecord[] }

export function WinRateTrend({ records }: Props) {
  const data = computeMonthlyTrend(records);

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Win-Rate Trend
      </p>
      <p className="mb-4 text-xs text-muted-foreground">Monthly win rate (%) vs. quote volume</p>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              border: "1px solid var(--border)",
              borderRadius: 6,
              backgroundColor: "var(--card)",
            }}
            formatter={(value: number, name: string) =>
              name === "Win Rate %" ? [`${value}%`, name] : [value, name]
            }
          />
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            formatter={(v) => <span style={{ color: "var(--muted-foreground)" }}>{v}</span>}
          />
          <Bar
            yAxisId="right"
            dataKey="total"
            name="Quotes"
            fill="#B7C9D3"
            opacity={0.6}
            radius={[2, 2, 0, 0]}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="winRate"
            name="Win Rate %"
            stroke="#00AA13"
            fill="#00AA13"
            fillOpacity={0.12}
            strokeWidth={2}
            dot={{ r: 3, fill: "#00AA13" }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
