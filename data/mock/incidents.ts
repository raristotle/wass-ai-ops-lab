export type Severity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "investigating" | "mitigated" | "resolved";

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  affectedModel: string;
  startedAt: string;
  resolvedAt: string | null;
  errorCount: number;
  impactedUsers: number;
}

const now = Date.now();

export const mockIncidents: Incident[] = [
  {
    id: "INC-001",
    title: "Elevated P99 latency on claude-opus-4",
    description:
      "P99 latency spiked to 8.2s, above the 5s SLA threshold. Root cause: upstream inference cluster saturation during a batch job overlap.",
    severity: "high",
    status: "mitigated",
    affectedModel: "claude-opus-4",
    startedAt: new Date(now - 3 * 3_600_000).toISOString(),
    resolvedAt: new Date(now - 1 * 3_600_000).toISOString(),
    errorCount: 847,
    impactedUsers: 231,
  },
  {
    id: "INC-002",
    title: "Token quota exhaustion — Batch Pipeline #14",
    description:
      "Daily token quota exceeded at 22:14 UTC. Batch jobs queued; real-time traffic was unaffected. Quota increased post-incident.",
    severity: "medium",
    status: "resolved",
    affectedModel: "claude-sonnet-4",
    startedAt: new Date(now - 6 * 3_600_000).toISOString(),
    resolvedAt: new Date(now - 5 * 3_600_000).toISOString(),
    errorCount: 1203,
    impactedUsers: 0,
  },
  {
    id: "INC-003",
    title: "Tool-call parse failures — structured output regression",
    description:
      "3.2% of tool-call responses returning malformed JSON after model deployment v2.1.4. Rollback in progress.",
    severity: "critical",
    status: "investigating",
    affectedModel: "claude-sonnet-4",
    startedAt: new Date(now - 45 * 60_000).toISOString(),
    resolvedAt: null,
    errorCount: 412,
    impactedUsers: 89,
  },
  {
    id: "INC-004",
    title: "Embedding service degraded — vector store sync delay",
    description:
      "Embedding generation throughput dropped 60%. New document ingestion backlogged by ~4h. Cause under investigation.",
    severity: "high",
    status: "open",
    affectedModel: "text-embedding-3",
    startedAt: new Date(now - 20 * 60_000).toISOString(),
    resolvedAt: null,
    errorCount: 0,
    impactedUsers: 0,
  },
  {
    id: "INC-005",
    title: "Rate limiter false positives on /completions",
    description:
      "Overly aggressive rate limiter configuration throttling legitimate enterprise traffic. Config corrected; limit raised.",
    severity: "low",
    status: "resolved",
    affectedModel: "claude-haiku-4",
    startedAt: new Date(now - 24 * 3_600_000).toISOString(),
    resolvedAt: new Date(now - 23 * 3_600_000).toISOString(),
    errorCount: 156,
    impactedUsers: 44,
  },
];
