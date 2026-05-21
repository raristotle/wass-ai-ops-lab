"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { mockMetrics, mockModelMetrics } from "@/data/mock/metrics";

function fmtHour(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function LatencyChart() {
  const data = mockMetrics.map((m) => ({
    time: fmtHour(m.timestamp),
    p50: m.latencyP50,
    p95: m.latencyP95,
    p99: m.latencyP99,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={3} />
        <YAxis tick={{ fontSize: 11 }} unit="ms" width={50} />
        <Tooltip formatter={(v: number) => [`${v}ms`]} />
        <Legend />
        <Area type="monotone" dataKey="p50" name="P50" stroke="#6366f1" fill="#ede9fe" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="p95" name="P95" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="p99" name="P99" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ThroughputChart() {
  const data = mockMetrics.map((m) => ({
    time: fmtHour(m.timestamp),
    rps: m.throughput,
    errors: parseFloat((m.throughput * m.errorRate).toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={3} />
        <YAxis tick={{ fontSize: 11 }} unit=" rps" width={60} />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="rps"    name="Requests/s" stroke="#10b981" fill="#d1fae5" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="errors" name="Errors/s"   stroke="#ef4444" fill="#fee2e2" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ModelComparisonChart() {
  const data = mockModelMetrics.map((m) => ({
    model: m.model.replace("claude-", "").replace("gemini-1.5-", "gemini-"),
    latency: m.avgLatencyMs,
    throughput: m.throughputRps,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="model" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="lat" orientation="left"  tick={{ fontSize: 11 }} unit="ms" width={55} />
        <YAxis yAxisId="thr" orientation="right" tick={{ fontSize: 11 }} unit=" rps" width={60} />
        <Tooltip />
        <Legend />
        <Bar yAxisId="lat" dataKey="latency"    name="Avg Latency (ms)"  fill="#6366f1" radius={[4, 4, 0, 0]} />
        <Bar yAxisId="thr" dataKey="throughput" name="Throughput (rps)"  fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
