import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/catalog/search";
import { parseSearchQuery } from "@/lib/catalog/schemas";
import { findEquivalents } from "@/lib/catalog/equivalents";
import { totalStock, pickInStockSubstitute } from "@/lib/product-finder-substitute";
import { crossCountForSku } from "@/lib/catalog/cross-runtime";
import { rerankConfigured, rerankCandidates } from "@/lib/integration/rerank-live";
import { embeddingsConfigured, embedQuery } from "@/lib/integration/embeddings-live";
import { vectorStoreConfigured, knnSearch } from "@/lib/server/vector-store";
import { fuseSemanticLane } from "@/lib/catalog/semantic-search";
import type { CatalogProduct } from "@/features/product-finder/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const params = parseSearchQuery(searchParams);
  const response = searchCatalog(params);

  // Attach the best in-stock substitute for each out-of-stock result so the
  // card can offer "in stock now" without a per-card round-trip.
  const substitutes: Record<string, CatalogProduct> = {};
  for (const item of response.items) {
    if (totalStock(item) > 0) continue;
    const sub = pickInStockSubstitute(item, findEquivalents(item, 24));
    if (sub) substitutes[item.id] = sub;
  }

  // Source-backed cross counts for result-card badges — verified/curated only.
  let items: CatalogProduct[] = response.items.map((item) => {
    if (item.dataSource !== "verified" && item.dataSource !== "curated") return item;
    const n = crossCountForSku(item.sku);
    return n > 0 ? { ...item, verifiedCrossCount: n } : item;
  });

  // Optional precision lift on the hybrid-ranked page (v3-S3 #18): when a Cohere
  // key is set, rerank the shown results. DORMANT/$0 by default — no key ⇒ no
  // network, the in-engine RRF order stands. Fail-soft + capped to the page.
  if (params.sort === "relevance" && params.text.trim() && rerankConfigured()) {
    try {
      const rr = await rerankCandidates(
        params.text,
        items,
        (p) => `${p.name} ${p.brand} ${p.subcategory}`,
      );
      if (rr.enabled) items = rr.items;
    } catch {
      /* keep the RRF order */
    }
  }

  // Semantic lane (v4-S3 #4): when an embeddings key + Neon pgvector are present
  // (and the catalog has been backfilled), embed the query, KNN over the vectors,
  // and RRF-fuse the page so embedding relevance becomes a fourth signal.
  // DORMANT/$0 by default — no key ⇒ no embed call, no Neon read; fail-closed to
  // the existing order. Only re-ranks products already on the page.
  if (
    params.sort === "relevance" &&
    params.text.trim() &&
    embeddingsConfigured() &&
    vectorStoreConfigured()
  ) {
    try {
      const qvec = await embedQuery(params.text);
      if (qvec) {
        const ids = await knnSearch(qvec, 200);
        items = fuseSemanticLane(items, ids);
      }
    } catch {
      /* keep the current order */
    }
  }

  return NextResponse.json({ ...response, items, substitutes });
}
