import { z } from "zod";

export const MetricPointSchema = z.object({
  timestamp: z.string().datetime(),
  latencyP50: z.number().nonnegative(),
  latencyP95: z.number().nonnegative(),
  latencyP99: z.number().nonnegative(),
  throughput: z.number().nonnegative(),
  errorRate: z.number().min(0).max(1),
  tokenCount: z.number().nonnegative(),
});

export const SeveritySchema = z.enum(["critical", "high", "medium", "low"]);
export const IncidentStatusSchema = z.enum(["open", "investigating", "mitigated", "resolved"]);

export const IncidentSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  severity: SeveritySchema,
  status: IncidentStatusSchema,
  affectedModel: z.string(),
  startedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
  errorCount: z.number().nonnegative().int(),
  impactedUsers: z.number().nonnegative().int(),
});

export const PipelineStatusSchema = z.enum(["running", "succeeded", "failed", "queued", "cancelled"]);
export const StageStatusSchema = z.enum(["pending", "running", "succeeded", "failed", "skipped"]);

export const PipelineStageSchema = z.object({
  name: z.string(),
  status: StageStatusSchema,
  durationMs: z.number().nonnegative().nullable(),
});

export const PipelineSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  status: PipelineStatusSchema,
  triggeredBy: z.string(),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
  stages: z.array(PipelineStageSchema),
  totalTokens: z.number().nonnegative().int(),
  costUsd: z.number().nonnegative(),
});

export type MetricPoint = z.infer<typeof MetricPointSchema>;
export type Incident = z.infer<typeof IncidentSchema>;
export type Pipeline = z.infer<typeof PipelineSchema>;
export type PipelineStage = z.infer<typeof PipelineStageSchema>;
export type Severity = z.infer<typeof SeveritySchema>;
export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;
export type PipelineStatus = z.infer<typeof PipelineStatusSchema>;
export type StageStatus = z.infer<typeof StageStatusSchema>;
