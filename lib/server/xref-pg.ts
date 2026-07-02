import { XREF_BRANDS, XREF_SOURCES, XREF_PACKED } from "@/data/real/xref-crosses";
import { identifierKey } from "@/lib/catalog/identifiers";
import { postgresUrl } from "@/lib/server/persistence";
import { lookupXref, type XrefHit } from "@/lib/catalog/xref-index";

/**
 * B15 — cross-reference lookups backed by Neon Postgres (DORMANT).
 *
 * The 766K packed cross pairs cost a ~35 MB parse on a cold serverless instance and can only answer
 * reverse lookups / corroboration by scanning the in-memory Map. This module moves them into an
 * indexed `xref_cross` table (btree on BOTH part columns) so a cold cross-match is a single indexed
 * query. It is OFF by default and costs $0 until you opt in:
 *
 *   1. `POSTGRES_URL` is already set (Neon is live for the KvStore).
 *   2. Run the one-time load: `POST /api/crosses/pg-load` (secret-gated, batched) until done.
 *   3. Set `XREF_SOURCE=postgres` → reads flip to SQL. Unset it → back to the in-memory Map.
 *
 * With `XREF_SOURCE` unset, none of this runs — the packed literal + in-memory index stand unchanged.
 */

const TAB = String.fromCharCode(9);

type NeonSql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;
const g = globalThis as unknown as { __xrefPgSql?: NeonSql; __xrefRows?: XrefRow[] };

async function sql(): Promise<NeonSql> {
  if (g.__xrefPgSql) return g.__xrefPgSql;
  const url = postgresUrl();
  if (!url) throw new Error("POSTGRES_URL is not configured");
  const { neon } = await import("@neondatabase/serverless");
  g.__xrefPgSql = neon(url) as unknown as NeonSql;
  return g.__xrefPgSql;
}

/**
 * B15 read flag: query Postgres for crosses ONLY when explicitly opted in AND a DB is configured.
 * Default (unset) → the in-memory path, $0.
 */
export function xrefPgEnabled(): boolean {
  return process.env.XREF_SOURCE === "postgres" && postgresUrl() !== null;
}

/** Which source cross reads use right now, for observability. */
export function xrefSourceLabel(): "postgres" | "memory" {
  return xrefPgEnabled() ? "postgres" : "memory";
}

export interface XrefRow {
  compKey: string;
  competitorBrand: string;
  competitorPart: string;
  targetKey: string;
  targetBrand: string;
  targetPart: string;
  source: string;
  relation: "equivalent" | "functional-substitute";
}

/** Parse the packed literal into typed rows (globalThis-cached). Pure aside from the cache. */
export function parseXrefPacked(): XrefRow[] {
  if (g.__xrefRows) return g.__xrefRows;
  const rows: XrefRow[] = [];
  if (XREF_PACKED) {
    for (const line of XREF_PACKED.split("\n")) {
      const f = line.split(TAB);
      if (f.length < 6) continue;
      const compKey = identifierKey(f[1]);
      const targetKey = identifierKey(f[3]);
      if (!compKey || !targetKey) continue;
      rows.push({
        compKey,
        competitorBrand: XREF_BRANDS[Number(f[0])] ?? "—",
        competitorPart: f[1],
        targetKey,
        targetBrand: XREF_BRANDS[Number(f[2])] ?? "—",
        targetPart: f[3],
        source: XREF_SOURCES[Number(f[4])] ?? "—",
        relation: f[5] === "e" ? "equivalent" : "functional-substitute",
      });
    }
  }
  g.__xrefRows = rows;
  return rows;
}

/** Create the table + btree indexes on BOTH part columns (idempotent). */
export async function ensureXrefSchema(): Promise<void> {
  const q = await sql();
  await q`CREATE TABLE IF NOT EXISTS xref_cross (
    comp_key text NOT NULL,
    competitor_brand text NOT NULL,
    competitor_part text NOT NULL,
    target_key text NOT NULL,
    target_brand text NOT NULL,
    target_part text NOT NULL,
    source text NOT NULL,
    relation text NOT NULL
  )`;
  await q`CREATE INDEX IF NOT EXISTS xref_cross_comp_idx ON xref_cross (comp_key)`;
  await q`CREATE INDEX IF NOT EXISTS xref_cross_tgt_idx ON xref_cross (target_key)`;
}

/**
 * Load one batch of rows `[offset, offset+size)` into the table. Returns the total row count and the
 * next offset (equal to total when done). Idempotent per full load only if the table is truncated
 * first — the loader route truncates on offset 0.
 */
export async function loadXrefBatch(offset: number, size: number): Promise<{ total: number; inserted: number; nextOffset: number }> {
  const rows = parseXrefPacked();
  const q = await sql();
  if (offset <= 0) {
    await ensureXrefSchema();
    await q`TRUNCATE xref_cross`;
  }
  const slice = rows.slice(offset, offset + size);
  // Chunked multi-row inserts keep each statement small enough for the HTTP driver.
  const CHUNK = 1000;
  for (let i = 0; i < slice.length; i += CHUNK) {
    const chunk = slice.slice(i, i + CHUNK);
    const values = chunk.flatMap((r) => [r.compKey, r.competitorBrand, r.competitorPart, r.targetKey, r.targetBrand, r.targetPart, r.source, r.relation]);
    const tuples = chunk.map((_, j) => {
      const b = j * 8;
      return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8})`;
    }).join(",");
    // The neon() tagged template also exposes a positional-query form via .query; use it for bulk.
    const query = (q as unknown as { query: (text: string, params: unknown[]) => Promise<unknown> }).query;
    await query(`INSERT INTO xref_cross (comp_key,competitor_brand,competitor_part,target_key,target_brand,target_part,source,relation) VALUES ${tuples}`, values);
  }
  return { total: rows.length, inserted: slice.length, nextOffset: Math.min(offset + size, rows.length) };
}

/** Look up crosses in Postgres — forward (comp_key) then reverse (target_key), tagged matchedAs. */
export async function lookupXrefPg(part: string, limit = 8): Promise<XrefHit[]> {
  const k = identifierKey(part);
  if (!k) return [];
  const q = await sql();
  const fwd = await q`SELECT competitor_brand, competitor_part, target_brand, target_part, source, relation
                        FROM xref_cross WHERE comp_key = ${k} LIMIT ${limit}`;
  const hits: XrefHit[] = fwd.map((r) => toHit(r, "competitor"));
  if (hits.length < limit) {
    const rev = await q`SELECT competitor_brand, competitor_part, target_brand, target_part, source, relation
                          FROM xref_cross WHERE target_key = ${k} LIMIT ${limit}`;
    const seen = new Set(hits.map((h) => identifierKey(h.targetPart)));
    for (const r of rev) {
      const hit = toHit(r, "target");
      if (!seen.has(identifierKey(hit.competitorPart))) hits.push(hit);
      if (hits.length >= limit) break;
    }
  }
  return hits.slice(0, limit);
}

/**
 * The cross lookup the API uses (B15): Postgres when opted in (and configured), else the sync
 * in-memory index. Fail-soft — any PG error falls back to memory so a misconfiguration can never
 * break cross-match. This lives in a SERVER module (it can reach the DB); the client-safe
 * `xref-index` stays free of any DB import.
 */
export async function lookupXrefAsync(part: string, limit = 8): Promise<XrefHit[]> {
  if (xrefPgEnabled()) {
    try {
      return await lookupXrefPg(part, limit);
    } catch {
      /* fall back to the in-memory index below */
    }
  }
  return lookupXref(part, limit);
}

function toHit(r: Record<string, unknown>, matchedAs: "competitor" | "target"): XrefHit {
  return {
    competitorBrand: String(r.competitor_brand),
    competitorPart: String(r.competitor_part),
    targetBrand: String(r.target_brand),
    targetPart: String(r.target_part),
    source: String(r.source),
    relation: r.relation === "equivalent" ? "equivalent" : "functional-substitute",
    matchedAs,
  };
}
