"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type ChartType = "line" | "area" | "bar";
export interface ChartKey {
  dataKey: string;
  name: string;
  color: string;
}

interface ChartAreaProps {
  title: string;
  data: Record<string, unknown>[];
  keys: ChartKey[];
  type?: ChartType;
  xKey?: string;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"];

export function ChartArea({ title, data, keys, type: defaultType = "area", xKey = "month" }: ChartAreaProps) {
  const [chartType, setChartType] = useState<ChartType>(defaultType);

  const resolvedKeys = keys.map((k, i) => ({
    ...k,
    color: k.color || COLORS[i % COLORS.length],
  }));

  function renderChart() {
    const commonProps = {
      data,
      margin: { top: 4, right: 16, left: 0, bottom: 0 },
    };

    const axes = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={48} />
        <Tooltip />
        <Legend />
      </>
    );

    if (chartType === "bar") {
      return (
        <BarChart {...commonProps}>
          {axes}
          {resolvedKeys.map((k) => (
            <Bar key={k.dataKey} dataKey={k.dataKey} name={k.name} fill={k.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      );
    }

    if (chartType === "line") {
      return (
        <LineChart {...commonProps}>
          {axes}
          {resolvedKeys.map((k) => (
            <Line
              key={k.dataKey}
              type="monotone"
              dataKey={k.dataKey}
              name={k.name}
              stroke={k.color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      );
    }

    return (
      <AreaChart {...commonProps}>
        {axes}
        {resolvedKeys.map((k) => (
          <Area
            key={k.dataKey}
            type="monotone"
            dataKey={k.dataKey}
            name={k.name}
            stroke={k.color}
            fill={k.color + "30"}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </AreaChart>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">{title}</CardTitle>
        <div className="flex gap-1">
          {(["area", "bar", "line"] as ChartType[]).map((t) => (
            <Button
              key={t}
              variant={chartType === t ? "default" : "ghost"}
              size="sm"
              className="h-6 px-2 text-[11px] capitalize"
              onClick={() => setChartType(t)}
            >
              {t}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
