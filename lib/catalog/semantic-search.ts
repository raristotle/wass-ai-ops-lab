/**
 * Semantic-lane fusion for hybrid search (v4-S3 #4). Pure + deterministic: blends
 * a semantic (embedding-KNN) ranking into the already-computed result order using
 * the same reciprocal-rank fusion the keyword + fuzzy lanes use, so semantic
 * relevance becomes a fourth signal rather than overriding the others. Conservative
 * by design — it only re-ranks products already in the result set, so the semantic
 * lane can never inject an off-topic product, only nudge ordering.
 */

import { reciprocalRankFusion } from "@/lib/catalog/rrf";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Fuse a semantic-ranked id list into the current result order. `semanticIds` is
 * the KNN output (best first). Returns the input unchanged when there's no
 * semantic signal (dormant, not backfilled, or no overlap).
 */
export function fuseSemanticLane(items: CatalogProduct[], semanticIds: string[]): CatalogProduct[] {
  if (semanticIds.length === 0 || items.length === 0) return items;
  const byId = new Map(items.map((p) => [p.id, p]));
  const semanticItems: CatalogProduct[] = [];
  for (const id of semanticIds) {
    const p = byId.get(id);
    if (p) semanticItems.push(p);
  }
  if (semanticItems.length === 0) return items;
  return reciprocalRankFusion([items, semanticItems], { key: (p) => p.id });
}
