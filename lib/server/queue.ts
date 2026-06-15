/**
 * Background-job queue seam (env-gated, dormant by default).
 *
 * CLAUDE.md mandates BullMQ over cron for scheduled/background work. This seam
 * honours that while staying free until Redis is provisioned: in-process it runs
 * jobs INLINE (await the handler, never drop work); when REDIS_URL is set, the
 * documented activation step is to add a BullMQ worker that drains the same
 * named jobs. `queueConfigured()` reports infra readiness (REDIS_URL present),
 * not that BullMQ is live in this process — a serverless request can't host a
 * long-running worker, so the worker is a separate deployment.
 *
 * Pure + testable: the inline executor runs the handler and routes failures to
 * logApiError rather than throwing into the request path.
 */

import { logApiError } from "@/lib/server/log";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** True when Redis is configured (the BullMQ worker can be activated). */
export function queueConfigured(): boolean {
  return Boolean(env("REDIS_URL"));
}

export interface EnqueueOptions {
  /** Best-effort delay; honoured by the BullMQ worker, ignored inline. */
  delayMs?: number;
  jobId?: string;
}

export interface JobQueue {
  readonly mode: "inline" | "bullmq";
  /** Run (inline) or enqueue (BullMQ) a named job. Never throws into the caller. */
  enqueue<T>(name: string, data: T, handler: (data: T) => Promise<void> | void, opts?: EnqueueOptions): Promise<void>;
}

/** In-process inline executor — the dormant default. */
export class InlineQueue implements JobQueue {
  readonly mode = "inline" as const;
  async enqueue<T>(name: string, data: T, handler: (data: T) => Promise<void> | void): Promise<void> {
    try {
      await handler(data);
    } catch (e) {
      logApiError(`queue:${name}`, e);
    }
  }
}

const g = globalThis as unknown as { __jobQueue?: JobQueue };

/**
 * The process job queue. Inline today; with REDIS_URL set + a BullMQ worker
 * deployed, swap this factory to return the BullMQ-backed queue (the worker
 * drains the same job names). Kept lazy/cached on globalThis like the catalog.
 */
export function getJobQueue(): JobQueue {
  return (g.__jobQueue ??= new InlineQueue());
}
