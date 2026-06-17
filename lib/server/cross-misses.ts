/**
 * Demand-ranked cross-reference coverage gaps (#8). When a competitor/legacy part
 * is looked up for a Wesco cross and there is NONE, we record the miss (atomic
 * per-SKU counter in the Neon/Memory KV). The catalog team then expands crosses
 * where demand is highest — gaps ranked by how often customers actually hit them.
 * Best-effort: a counter blip never blocks the request path.
 */

import { getStore, mutate } from "@/lib/server/persistence";

const NS = "cross-misses";

export interface CrossMiss {
  sku: string;
  count: number;
  lastMissAt: number;
  hint?: string; // optional brand/category context from the lookup
}

/** Record one cross-reference miss for a competitor/legacy SKU. Best-effort. */
export async function recordCrossMiss(sku: string, hint?: string): Promise<void> {
  const key = sku.trim().toUpperCase();
  if (!key) return;
  try {
    await mutate<CrossMiss>(getStore(), NS, key, (cur) => ({
      sku: key,
      count: (cur?.count ?? 0) + 1,
      lastMissAt: Date.now(),
      hint: hint ?? cur?.hint,
    }));
  } catch {
    /* counter is best-effort — never surface a store error into the request */
  }
}

/** Top missed competitor SKUs, demand-ranked (highest miss count first). */
export async function topCrossGaps(limit = 20): Promise<CrossMiss[]> {
  try {
    const all = await getStore().list<CrossMiss>(NS, { limit: 500 });
    return all
      .filter((m): m is CrossMiss => Boolean(m) && typeof m.count === "number")
      .sort((a, b) => b.count - a.count || b.lastMissAt - a.lastMissAt)
      .slice(0, Math.max(1, limit));
  } catch {
    return [];
  }
}
