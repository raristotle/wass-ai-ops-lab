export type PipelineStatus = "running" | "succeeded" | "failed" | "queued" | "cancelled";
export type StageStatus = "pending" | "running" | "succeeded" | "failed" | "skipped";

export interface PipelineStage {
  name: string;
  status: StageStatus;
  durationMs: number | null;
}

export interface Pipeline {
  id: string;
  name: string;
  status: PipelineStatus;
  triggeredBy: string;
  startedAt: string;
  finishedAt: string | null;
  stages: PipelineStage[];
  totalTokens: number;
  costUsd: number;
}

const now = Date.now();

export const mockPipelines: Pipeline[] = [
  {
    id: "PLN-001",
    name: "Document Intelligence — Nightly Batch",
    status: "succeeded",
    triggeredBy: "cron",
    startedAt: new Date(now - 7 * 3_600_000).toISOString(),
    finishedAt: new Date(now - 5.5 * 3_600_000).toISOString(),
    stages: [
      { name: "Ingest",       status: "succeeded", durationMs: 12_400 },
      { name: "Chunk & Embed",status: "succeeded", durationMs: 184_200 },
      { name: "LLM Extract",  status: "succeeded", durationMs: 3_241_000 },
      { name: "Validate",     status: "succeeded", durationMs: 8_900 },
      { name: "Store",        status: "succeeded", durationMs: 5_100 },
    ],
    totalTokens: 4_820_000,
    costUsd: 14.46,
  },
  {
    id: "PLN-002",
    name: "Customer Feedback Classifier",
    status: "running",
    triggeredBy: "webhook",
    startedAt: new Date(now - 12 * 60_000).toISOString(),
    finishedAt: null,
    stages: [
      { name: "Fetch",       status: "succeeded", durationMs: 2_100 },
      { name: "Preprocess",  status: "succeeded", durationMs: 8_800 },
      { name: "Classify",    status: "running",   durationMs: null },
      { name: "Aggregate",   status: "pending",   durationMs: null },
      { name: "Notify",      status: "pending",   durationMs: null },
    ],
    totalTokens: 890_000,
    costUsd: 2.67,
  },
  {
    id: "PLN-003",
    name: "RAG Index Rebuild",
    status: "failed",
    triggeredBy: "manual",
    startedAt: new Date(now - 2 * 3_600_000).toISOString(),
    finishedAt: new Date(now - 1.8 * 3_600_000).toISOString(),
    stages: [
      { name: "Load Source", status: "succeeded", durationMs: 6_200 },
      { name: "Chunk",       status: "succeeded", durationMs: 22_100 },
      { name: "Embed",       status: "failed",    durationMs: 45_000 },
      { name: "Index",       status: "skipped",   durationMs: null },
      { name: "Verify",      status: "skipped",   durationMs: null },
    ],
    totalTokens: 210_000,
    costUsd: 0.26,
  },
  {
    id: "PLN-004",
    name: "Evaluation Suite — Haiku Regression",
    status: "queued",
    triggeredBy: "ci",
    startedAt: new Date(now - 3 * 60_000).toISOString(),
    finishedAt: null,
    stages: [
      { name: "Load Evals",    status: "pending", durationMs: null },
      { name: "Run Inference", status: "pending", durationMs: null },
      { name: "Score",         status: "pending", durationMs: null },
      { name: "Report",        status: "pending", durationMs: null },
    ],
    totalTokens: 0,
    costUsd: 0,
  },
];
