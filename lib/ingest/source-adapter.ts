/**
 * Renewable data-ingestion framework (data-sources backlog, Sprint D1) — the Source
 * Adapter spine that every data source plugs into so the recommender can RE-RUN a
 * source later, diff for new/changed/removed data, gate it on provenance, and expose
 * it as an MCP tool / API feed. $0, honest (drop-on-unverifiable), source-agnostic.
 *
 *   fetch()  → pull raw payloads (REST API | bulk file | sitemap+HTML | JSON-LD)
 *   parse()  → normalize raw → IngestRecord[] (sku/mpn/gtin + attributes + datasheet
 *              + image + crosses, each carrying sourceUrl + confidence)
 *   gate     → keep only records meeting the confidence floor (PRODUCTION_CONFIDENCE)
 *   snapshot → persist the gated pull (one snapshot per adapter, durable store)
 *   diff     → compare vs the last snapshot → added / changed / removed
 *   merge    → (per-source) graft into the catalog enrichment layer
 *
 * This module is the pure, testable core: the types, the provenance GATE, the
 * snapshot DIFF, and the run ORCHESTRATION (with injected fetcher/store/clock). The
 * only I/O — the polite HTTP fetch — lives in ./fetcher; persistence in ./snapshot-store.
 */

import { PRODUCTION_CONFIDENCE } from "@/lib/catalog/provenance";
import { normalizeGtin } from "@/lib/catalog/identifiers";

/** The kinds of data an adapter can yield (mirrors the backlog's data-type groups). */
export type IngestDataType =
  | "attributes"
  | "datasheets"
  | "images"
  | "cross-reference"
  | "gtin-identity"
  | "compliance-cert"
  | "pricing-stock"
  | "manufacturer-entity"
  | "taxonomy"
  | "lifecycle-obsolescence";

/** A single normalized datum an adapter emits. Aligns with RealProductEntry so a
 *  downstream sprint can map it into the real-products enrichment layer. */
export interface IngestRecord {
  /** Carried product SKU this datum enriches, when known. */
  sku?: string;
  /** Manufacturer part number. */
  mpn?: string;
  /** Global trade item number (UPC/EAN). */
  gtin?: string;
  brand?: string;
  attributes?: { name: string; value: string }[];
  /** A reference URL to mirror only where the license permits — never hot-linked blindly. */
  datasheetUrl?: string;
  imageUrl?: string;
  crosses?: { competitorSku: string; relation: string }[];
  /** Where this datum came from (required — provenance). */
  sourceUrl: string;
  /** 0-100 confidence; the gate drops anything below the floor. */
  confidence: number;
}

/** A raw payload an adapter's fetch() returns, handed to parse(). */
export interface RawPayload {
  url: string;
  contentType: string;
  body: string;
}

/** Injected dependencies so runAdapter is fully testable offline. */
export interface AdapterContext {
  /** Polite HTTP GET (robots/rate-limit/cache) — see ./fetcher. */
  get: (url: string) => Promise<RawPayload>;
  /** A clock, injected for deterministic tests. */
  nowIso: () => string;
}

export interface SourceAdapter {
  /** Stable id (snapshot namespace key), e.g. "schema-org:eaton". */
  id: string;
  /** Human label. */
  label: string;
  /** Wesco segment (EES/CSS/UBS/safety/cross-segment). */
  segment: string;
  dataTypes: IngestDataType[];
  /** License / redistribution note kept with every run for auditability. */
  license: string;
  /** Pull raw payloads to parse. */
  fetch(ctx: AdapterContext): Promise<RawPayload[]>;
  /** Normalize one raw payload into records. Pure. */
  parse(raw: RawPayload): IngestRecord[];
}

// ── Provenance gate ───────────────────────────────────────────────────────────

export interface GateResult {
  kept: IngestRecord[];
  dropped: IngestRecord[];
}

/**
 * Keep only records that meet the confidence floor AND carry the minimum identity to
 * be mergeable (a sku, mpn, or a CHECK-DIGIT-VALID gtin) plus a sourceUrl. Honest by
 * construction: a record we can't attribute or key is dropped, never invented; and a
 * GTIN that fails GS1 mod-10 validation is never persisted as a verified identifier —
 * it's stripped from the kept record (the record can still survive on a sku/mpn), so a
 * scraped/typo'd code can't masquerade as an authoritative key.
 */
export function gateRecords(records: IngestRecord[], minConfidence: number = PRODUCTION_CONFIDENCE): GateResult {
  const kept: IngestRecord[] = [];
  const dropped: IngestRecord[] = [];
  for (const r of records) {
    const validGtin = r.gtin ? normalizeGtin(r.gtin) : null; // normalized digits, or null when invalid
    const hasIdentity = Boolean(r.sku || r.mpn || validGtin);
    const hasSource = Boolean(r.sourceUrl);
    if (hasIdentity && hasSource && r.confidence >= minConfidence) {
      // Persist only a validated, normalized GTIN — drop an unverifiable one rather than
      // store it as if it were authoritative.
      if (r.gtin && validGtin !== r.gtin) kept.push({ ...r, gtin: validGtin ?? undefined });
      else kept.push(r);
    } else {
      dropped.push(r);
    }
  }
  return { kept, dropped };
}

// ── Snapshot + diff ─────────────────────────────────────────────────────────

export interface SourceSnapshot {
  adapterId: string;
  fetchedAtIso: string;
  records: IngestRecord[];
}

export interface SnapshotDiff {
  added: IngestRecord[];
  changed: { key: string; before: IngestRecord; after: IngestRecord }[];
  removed: IngestRecord[];
}

/**
 * The stable, COLLISION-SAFE key for a record. A valid GTIN is globally unique, so it
 * keys alone (`G:<gtin>`). An MPN/SKU is only unique WITHIN a brand, so it is namespaced
 * by brand (`M:<brand>|<mpn>` / `S:<brand>|<sku>`) — otherwise two different brands'
 * parts that share a part number, or a record whose MPN happens to equal another's GTIN
 * string, would collide and silently mask one another in the diff. Type-prefixed so a
 * GTIN can never collide with an MPN/SKU of the same characters.
 */
export function recordKey(r: IngestRecord): string {
  const gtin = r.gtin ? normalizeGtin(r.gtin) : null;
  if (gtin) return `G:${gtin}`;
  const brand = (r.brand ?? "").trim().toUpperCase();
  if (r.mpn) return `M:${brand}|${r.mpn.trim().toUpperCase()}`;
  if (r.sku) return `S:${brand}|${r.sku.trim().toUpperCase()}`;
  return "";
}

/** The best human-facing identifier for a record (for operator-facing samples). */
export function recordIdentity(r: IngestRecord): string {
  return String(r.gtin || r.mpn || r.sku || "");
}

/** Deterministic content signature so "changed" is detected without deep-equality bugs. */
function recordSignature(r: IngestRecord): string {
  const attrs = (r.attributes ?? []).map((a) => `${a.name}=${a.value}`).sort().join("|");
  const crosses = (r.crosses ?? []).map((c) => `${c.competitorSku}:${c.relation}`).sort().join("|");
  return [r.brand ?? "", r.datasheetUrl ?? "", r.imageUrl ?? "", attrs, crosses].join("¦");
}

/** Diff two snapshots' record sets by key. Pure. The first snapshot may be null (a
 *  first run → everything is "added"). */
export function diffSnapshots(prev: SourceSnapshot | null, next: SourceSnapshot): SnapshotDiff {
  const prevByKey = new Map<string, IngestRecord>();
  for (const r of prev?.records ?? []) prevByKey.set(recordKey(r), r);
  const nextByKey = new Map<string, IngestRecord>();
  for (const r of next.records) nextByKey.set(recordKey(r), r);

  const added: IngestRecord[] = [];
  const changed: SnapshotDiff["changed"] = [];
  for (const [key, after] of nextByKey) {
    const before = prevByKey.get(key);
    if (!before) added.push(after);
    else if (recordSignature(before) !== recordSignature(after)) changed.push({ key, before, after });
  }
  const removed: IngestRecord[] = [];
  for (const [key, before] of prevByKey) if (!nextByKey.has(key)) removed.push(before);

  return { added, changed, removed };
}

// ── Run orchestration ─────────────────────────────────────────────────────────

export interface RunReport {
  adapterId: string;
  label: string;
  runAtIso: string;
  fetched: number;
  parsed: number;
  kept: number;
  dropped: number;
  diff: { added: number; changed: number; removed: number };
  /** A few example new keys for the operator-facing summary. */
  sampleAdded: string[];
  error?: string;
}

export interface RunResult {
  report: RunReport;
  /** The gated snapshot to persist (null when the run errored before producing one). */
  snapshot: SourceSnapshot | null;
  diff: SnapshotDiff | null;
}

/**
 * Run one adapter end-to-end against the LAST snapshot: fetch → parse → gate →
 * snapshot → diff. Pure orchestration over injected deps (`ctx`, `prevSnapshot`,
 * `minConfidence`); the caller persists `snapshot` and the `report`. Never throws —
 * an adapter failure is captured in the report so one bad source can't break a batch.
 */
export async function runAdapter(
  adapter: SourceAdapter,
  ctx: AdapterContext,
  prevSnapshot: SourceSnapshot | null,
  minConfidence: number = PRODUCTION_CONFIDENCE,
): Promise<RunResult> {
  const runAtIso = ctx.nowIso();
  const base: RunReport = {
    adapterId: adapter.id,
    label: adapter.label,
    runAtIso,
    fetched: 0,
    parsed: 0,
    kept: 0,
    dropped: 0,
    diff: { added: 0, changed: 0, removed: 0 },
    sampleAdded: [],
  };
  try {
    const raws = await adapter.fetch(ctx);
    const parsed = raws.flatMap((r) => adapter.parse(r));
    const { kept, dropped } = gateRecords(parsed, minConfidence);
    const snapshot: SourceSnapshot = { adapterId: adapter.id, fetchedAtIso: runAtIso, records: kept };
    const diff = diffSnapshots(prevSnapshot, snapshot);
    return {
      report: {
        ...base,
        fetched: raws.length,
        parsed: parsed.length,
        kept: kept.length,
        dropped: dropped.length,
        diff: { added: diff.added.length, changed: diff.changed.length, removed: diff.removed.length },
        sampleAdded: diff.added.slice(0, 5).map(recordIdentity),
      },
      snapshot,
      diff,
    };
  } catch (e) {
    return { report: { ...base, error: e instanceof Error ? e.message : String(e) }, snapshot: null, diff: null };
  }
}
