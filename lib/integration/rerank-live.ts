/**
 * Live search reranking (REAL) — Cohere Rerank v2, env-gated exactly like the
 * Mouser/Digi-Key distributor seam and the FRED commodity seam: a precision lift
 * over the existing fuzzy candidate ordering ONLY when COHERE_API_KEY is set;
 * otherwise the caller keeps its fuzzy order unchanged. Fetched per request,
 * never stored. $0 until a key is added (free trial: 1000 calls/mo). Called with
 * raw fetch — no Cohere SDK.
 *
 * The reorder / merge-back (`applyRerank`) is pure and unit-tested; only the thin
 * fetch wrapper touches the network. Server-only — the key never reaches the client.
 *
 *   COHERE_API_KEY       — the gate (Bearer token).
 *   COHERE_RERANK_MODEL  — optional model override (default rerank-v4.0-pro).
 */

import { z } from "zod";
import { logApiError } from "@/lib/server/log";

const RERANK_URL = "https://api.cohere.com/v2/rerank";
const DEFAULT_MODEL = "rerank-v4.0-pro";
/** One billed search unit covers up to 100 documents. */
const MAX_DOCUMENTS = 100;

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** True when the live reranker is configured (a free Cohere trial key works). */
export function rerankConfigured(): boolean {
  return Boolean(env("COHERE_API_KEY"));
}

const RerankResponseSchema = z.object({
  results: z.array(z.object({ index: z.number().int().nonnegative(), relevance_score: z.number() })),
});

/**
 * Pure merge-back: reorder `candidates` by Cohere's `results` (already sorted
 * best-first), annotating each with its rerankScore. Out-of-range or duplicate
 * indices are ignored; candidates Cohere did not return (e.g. beyond top_n) are
 * appended in their original order with score 0 — so the set is reordered but
 * never shrunk. Fully unit-testable with a canned results array.
 */
export function applyRerank<T extends object>(
  candidates: T[],
  results: { index: number; relevance_score: number }[],
): Array<T & { rerankScore: number }> {
  const out: Array<T & { rerankScore: number }> = [];
  const used = new Set<number>();
  for (const r of results) {
    if (r.index < 0 || r.index >= candidates.length || used.has(r.index)) continue;
    used.add(r.index);
    out.push({ ...candidates[r.index], rerankScore: r.relevance_score });
  }
  candidates.forEach((c, i) => {
    if (!used.has(i)) out.push({ ...c, rerankScore: 0 });
  });
  return out;
}

export type RerankResult<T> =
  | { enabled: true; source: "Cohere Rerank"; model: string; items: Array<T & { rerankScore: number }>; fetchedAt: string }
  | { enabled: false; reason: "no-keys" | "error" | "empty" };

/**
 * Rerank `candidates` against `query`. Returns {enabled:false} when dormant (no
 * key) or on any error — callers fall back to the existing fuzzy order and never
 * see a throw. Sends at most 100 documents (one billed search unit).
 */
export async function rerankCandidates<T extends object>(
  query: string,
  candidates: T[],
  toDocument: (c: T) => string,
  opts?: { topN?: number },
): Promise<RerankResult<T>> {
  const key = env("COHERE_API_KEY");
  if (!key) return { enabled: false, reason: "no-keys" }; // ← dormant: no key ⇒ no network
  if (candidates.length === 0) return { enabled: false, reason: "empty" };

  const model = env("COHERE_RERANK_MODEL") ?? DEFAULT_MODEL;
  const head = candidates.slice(0, MAX_DOCUMENTS);
  const tail = candidates.slice(MAX_DOCUMENTS);

  try {
    const res = await fetch(RERANK_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        query,
        documents: head.map(toDocument),
        ...(opts?.topN ? { top_n: opts.topN } : {}),
        max_tokens_per_doc: 4096,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      logApiError("rerank:cohere", new Error(`Cohere Rerank HTTP ${res.status}`));
      return { enabled: false, reason: "error" };
    }
    const parsed = RerankResponseSchema.safeParse(await res.json());
    if (!parsed.success) return { enabled: false, reason: "error" };
    const items = [
      ...applyRerank(head, parsed.data.results),
      ...tail.map((c) => ({ ...c, rerankScore: 0 })),
    ];
    return { enabled: true, source: "Cohere Rerank", model, items, fetchedAt: new Date().toISOString() };
  } catch (e) {
    logApiError("rerank:cohere", e);
    return { enabled: false, reason: "error" };
  }
}
