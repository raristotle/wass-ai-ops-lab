import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { getCatalog } from "@/lib/catalog/index";
import { embeddingsConfigured, embedTexts, enrichedEmbeddingText } from "@/lib/integration/embeddings-live";
import { vectorStoreConfigured, upsertVectors, vectorCount } from "@/lib/server/vector-store";

export const dynamic = "force-dynamic";

/**
 * Catalog embedding backfill (v4-S3 #4) — operator-triggered, NOT a cron (per
 * CLAUDE.md: scheduled/background work would be a BullMQ job, but Vercel hosts no
 * worker, so this is an explicit authenticated POST the operator loops over a
 * page at a time). Embeds a slice of the catalog and upserts the 1024-dim vectors
 * into Neon pgvector. Dormant unless BOTH an embeddings key and Neon are set.
 *
 * GET  → { embeddings, vectorStore } readiness booleans.
 * POST { offset?, limit? } → embeds [offset, offset+limit) and returns progress.
 */
const BodySchema = z.object({
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(500).default(200),
});

export function GET() {
  return NextResponse.json({
    embeddings: embeddingsConfigured(),
    vectorStore: vectorStoreConfigured(),
  });
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  if (!embeddingsConfigured() || !vectorStoreConfigured()) {
    return NextResponse.json({ enabled: false, reason: "not-configured" });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const products = getCatalog().products;
    const total = products.length;
    const slice = products.slice(body.offset, body.offset + body.limit);
    if (slice.length === 0) {
      return NextResponse.json({ enabled: true, embedded: 0, offset: body.offset, total, done: true });
    }

    const texts = slice.map((p) => enrichedEmbeddingText(p));
    const vectors = await embedTexts(texts, "document");
    if (!vectors) {
      return NextResponse.json({ enabled: false, reason: "embed-failed" }, { status: 502 });
    }

    const rows = slice.map((p, i) => ({ productId: p.id, embedding: vectors[i] }));
    const embedded = await upsertVectors(rows);
    const nextOffset = body.offset + slice.length;

    return NextResponse.json({
      enabled: true,
      embedded,
      offset: body.offset,
      nextOffset,
      total,
      done: nextOffset >= total,
      vectorCount: await vectorCount(),
    });
  } catch (e) {
    logApiError("/api/embeddings/backfill:POST", e);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}
