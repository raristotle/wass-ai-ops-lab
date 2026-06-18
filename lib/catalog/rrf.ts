/**
 * Reciprocal Rank Fusion (v3-S3 #18) — blend several ranked lists into one fused
 * ranking by summing 1/(k + rank) across the lists. Rank-only, so it needs no
 * score calibration; pure, deterministic, and $0. Used to fuse the keyword lane
 * with a fuzzy/semantic lane for hybrid search.
 */

const DEFAULT_K = 60;

export interface RrfOptions<T> {
  /** Smoothing constant — larger k flattens the contribution of top ranks. */
  k?: number;
  /** Stable identity for an item (so the same entity across lists is merged). */
  key?: (item: T) => string;
}

/**
 * Fuse ranked lists into a single ranking (best-first). An item's fused score is
 * Σ 1/(k + rank) over every list it appears in (rank is 0-based). Items present
 * in more lists / nearer the top rank higher. Ties break toward earlier overall
 * first appearance (stable).
 */
export function reciprocalRankFusion<T>(lists: T[][], opts: RrfOptions<T> = {}): T[] {
  const k = opts.k ?? DEFAULT_K;
  const keyOf = opts.key ?? ((x: T) => String(x));

  const score = new Map<string, number>();
  const firstItem = new Map<string, T>();
  const order = new Map<string, number>();
  let seq = 0;

  for (const list of lists) {
    list.forEach((item, rank) => {
      const key = keyOf(item);
      score.set(key, (score.get(key) ?? 0) + 1 / (k + rank + 1));
      if (!firstItem.has(key)) {
        firstItem.set(key, item);
        order.set(key, seq++);
      }
    });
  }

  return [...score.entries()]
    .sort((a, b) => b[1] - a[1] || (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0))
    .map(([key]) => firstItem.get(key) as T);
}
