"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ImtOutput } from "@/lib/risk/imt";

interface ScenarioChartProps {
  output: ImtOutput | null;
  title?: string;
}

function factorColor(rawScore: number): string {
  if (rawScore >= 65) return "#ef4444"; // red
  if (rawScore >= 35) return "#f59e0b"; // amber
  return "#10b981";                     // green
}

export function ScenarioChart({ output, title = "Factor Risk Breakdown" }: ScenarioChartProps) {
  if (!output) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center text-xs text-muted-foreground py-12">
          Select a request from the queue to see its risk breakdown.
        </CardContent>
      </Card>
    );
  }

  const chartData = output.factorScores.map((f) => ({
    name: f.label.replace(" Risk", "").replace(" Criticality", ""),
    raw: f.rawScore,
    weighted: Math.round(f.weightedScore),
    weight: Math.round(f.weight * 100),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Raw factor scores (0-100) with weighted contribution. Overall: <strong>{output.riskScore}</strong> · Confidence: <strong>{output.confidence}%</strong>
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={88} />
            <Tooltip
              formatter={(value, name) =>
                name === "raw" ? [`${value}`, "Raw score"] : [`${value}`, "Weighted pts"]
              }
              contentStyle={{ fontSize: 11 }}
            />
            <ReferenceLine x={65} stroke="#ef4444" strokeDasharray="4 2" label={{ value: "65", position: "right", fontSize: 9, fill: "#ef4444" }} />
            <ReferenceLine x={30} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: "30", position: "right", fontSize: 9, fill: "#f59e0b" }} />
            <Bar dataKey="raw" radius={[0, 3, 3, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={factorColor(entry.raw)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
