/**
 * pgvector store for semantic search (v4-S3 #4). Holds one 1024-dim embedding per
 * product in a Neon Postgres table and answers cosine-distance KNN queries over
 * the serverless HTTP driver. Dormant unless POSTGRES_URL is set; the Neon driver
 * is lazily imported so it never enters the memory path or any client bundle.
 *
 * Vector storage needs Neon; embedding GENERATION needs the embeddings key — two
 * separate gates. When either is missing, the search route simply skips the
 * semantic lane and the keyword + fuzzy RRF stands ($0, fail-closed).
 *
 * The column is vector(1024) to match embeddings-live EMBEDDING_DIM; an HNSW
 * cosine index keeps KNN fast on a mostly-static catalog.
 */

import { postgresUrl } from "@/lib/server/persistence";
import { logApiError } from "@/lib/server/log";
import { EMBEDDING_DIM } from "@/lib/integration/embeddings-live";

// Keep the DDL width in sync with the embeddings dimension. (DDL can't be
// parameterized via the tagged template, so the literal below must equal this.)
if (EMBEDDING_DIM !== 1024) {
  throw new Error("vector-store: ProductVector column is vector(1024); EMBEDDING_DIM must be 1024.");
}

type NeonSql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

/** True when Postgres is configured (vectors can be stored/queried). */
export function vectorStoreConfigured(): boolean {
  return postgresUrl() !== null;
}

/** Format a number[] as a pgvector literal: [0.1,0.2,...]. NaN/Inf → 0. */
export function toVectorLiteral(v: number[]): string {
  return `[${v.map((x) => (Number.isFinite(x) ? x : 0)).join(",")}]`;
}

/** A vector is storable only at the fixed column width — guards against a bad embedding. */
export function isValidEmbedding(v: number[]): boolean {
  return Array.isArray(v) && v.length === EMBEDDING_DIM;
}

let _sql: NeonSql | null = null;
let _ready: Promise<void> | null = null;

/** Lazily connect + ensure the extension/table/index exist. Returns null when dormant. */
async function getSql(): Promise<NeonSql | null> {
  const url = postgresUrl();
  if (!url) return null;
  if (!_ready) {
    _ready = (async () => {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(url) as unknown as NeonSql;
      await sql`CREATE EXTENSION IF NOT EXISTS vector`;
      await sql`CREATE TABLE IF NOT EXISTS "ProductVector" (
        product_id text PRIMARY KEY,
        embedding vector(1024) NOT NULL,
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )`;
      // HNSW builds fine before/while rows load; cosine ops match the <=> queries.
      await sql`CREATE INDEX IF NOT EXISTS productvector_hnsw ON "ProductVector" USING hnsw (embedding vector_cosine_ops)`;
      // Publish the handle ONLY after the schema is guaranteed to exist, so a
      // partial bootstrap never leaves a live handle to a missing table.
      _sql = sql;
    })().catch((e) => {
      // A transient bootstrap failure (e.g. a Neon blip during the DDL) must not
      // wedge the store for the life of the instance: clear the cached promise +
      // handle so the next call retries once the database recovers.
      _ready = null;
      _sql = null;
      throw e;
    });
  }
  await _ready;
  return _sql;
}

/** Upsert product embeddings. Returns the number written. Best-effort per row. */
export async function upsertVectors(rows: { productId: string; embedding: number[] }[]): Promise<number> {
  let written = 0;
  try {
    const sql = await getSql();
    if (!sql) return 0;
    for (const r of rows) {
      if (!isValidEmbedding(r.embedding)) {
        logApiError("vector:upsert", new Error(`bad embedding dim ${r.embedding?.length} (need ${EMBEDDING_DIM})`));
        continue;
      }
      const lit = toVectorLiteral(r.embedding);
      try {
        await sql`INSERT INTO "ProductVector" (product_id, embedding, "updatedAt")
          VALUES (${r.productId}, ${lit}::vector, now())
          ON CONFLICT (product_id) DO UPDATE SET embedding = ${lit}::vector, "updatedAt" = now()`;
        written += 1;
      } catch (e) {
        logApiError("vector:upsert", e);
      }
    }
  } catch (e) {
    logApiError("vector:upsert-init", e);
  }
  return written;
}

/** Cosine-distance KNN: the closest product ids to `queryEmbedding`, best first. */
export async function knnSearch(queryEmbedding: number[], limit = 200): Promise<string[]> {
  if (!isValidEmbedding(queryEmbedding)) return []; // wrong-dim query ⇒ no KNN
  try {
    const sql = await getSql();
    if (!sql) return [];
    const lit = toVectorLiteral(queryEmbedding);
    const rows = await sql`SELECT product_id FROM "ProductVector" ORDER BY embedding <=> ${lit}::vector LIMIT ${limit}`;
    return rows.map((r) => String(r.product_id));
  } catch (e) {
    logApiError("vector:knn", e);
    return [];
  }
}

/** How many products are embedded (0 when dormant / not yet backfilled). */
export async function vectorCount(): Promise<number> {
  try {
    const sql = await getSql();
    if (!sql) return 0;
    const rows = await sql`SELECT COUNT(*)::int AS n FROM "ProductVector"`;
    return Number(rows[0]?.n ?? 0);
  } catch {
    return 0;
  }
}
