export interface MetricPoint {
  timestamp: string;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  throughput: number;
  errorRate: number;
  tokenCount: number;
}

function generateMetrics(): MetricPoint[] {
  const now = Date.now();
  return Array.from({ length: 24 }, (_, i) => {
    const ts = new Date(now - (23 - i) * 3_600_000);
    const hour = ts.getHours();
    const peak = hour >= 9 && hour <= 17;
    const baseTp = peak ? 850 : 200;
    const baseMs = peak ? 45 : 30;
    return {
      timestamp: ts.toISOString(),
      latencyP50: baseMs + Math.round(Math.random() * 15),
      latencyP95: Math.round(baseMs * 2.5 + Math.random() * 30),
      latencyP99: Math.round(baseMs * 4 + Math.random() * 50),
      throughput: baseTp + Math.round(Math.random() * 200 - 100),
      errorRate: parseFloat((Math.random() * 0.5).toFixed(3)),
      tokenCount: Math.round((baseTp + Math.random() * 200) * 512),
    };
  });
}

export const mockMetrics: MetricPoint[] = generateMetrics();

export interface ModelMetric {
  model: string;
  avgLatencyMs: number;
  throughputRps: number;
  errorRatePct: number;
  costPer1kTokens: number;
}

export const mockModelMetrics: ModelMetric[] = [
  { model: "claude-opus-4",    avgLatencyMs: 2400, throughputRps: 120,  errorRatePct: 0.12, costPer1kTokens: 15.00 },
  { model: "claude-sonnet-4",  avgLatencyMs:  890, throughputRps: 450,  errorRatePct: 0.08, costPer1kTokens:  3.00 },
  { model: "claude-haiku-4",   avgLatencyMs:  310, throughputRps: 980,  errorRatePct: 0.05, costPer1kTokens:  0.25 },
  { model: "gpt-4o",           avgLatencyMs: 1200, throughputRps: 380,  errorRatePct: 0.15, costPer1kTokens:  5.00 },
  { model: "gemini-1.5-pro",   avgLatencyMs:  750, throughputRps: 520,  errorRatePct: 0.11, costPer1kTokens:  1.25 },
];
