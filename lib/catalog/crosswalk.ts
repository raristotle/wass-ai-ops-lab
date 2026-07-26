/**
 * Customer catalog-number crosswalk (pilot data onboarding) — lets a buyer find a
 * product by THEIR own internal catalog/part number, not just the manufacturer SKU.
 *
 * A distributor's customers each keep their own item numbers. Importing a customer's
 * number→product crosswalk means their buyers search the way they think ("WX-100023"),
 * and it resolves to the carried product. Until a real crosswalk is imported, a small
 * DEMO crosswalk (clearly labeled `source:"demo"`, derived deterministically from the
 * catalog) makes the feature demoable — it is illustrative, NOT real customer data.
 *
 * Resolution order everywhere is exact-SKU FIRST, then crosswalk, so a customer number
 * can never shadow a real manufacturer SKU. $0: pure parsing + the existing durable
 * store; the lookup index is cached in-memory per scope.
 */

import { getCatalog } from "@/lib/catalog/index";
import { identifierKey } from "@/lib/catalog/identifiers";
import type { KvStore } from "@/lib/server/persistence";
import {
  MAX_STORED_CROSSWALK_REJECTS,
  type CrosswalkReject,
  type CrosswalkRejectReport,
} from "@/lib/catalog/crosswalk-reject";

export type CrosswalkSource = "demo" | "import" | "captured";

export interface CrosswalkEntry {
  /** The customer's own catalog/part number. */
  customerNumber: string;
  /** The carried product SKU it maps to. */
  sku: string;
  source: CrosswalkSource;
}

export interface CrosswalkHit {
  sku: string;
  source: CrosswalkSource;
  customerNumber: string;
}

export const CROSSWALK_NS = "catalog-crosswalk";
const ENTRIES_KEY = "entries";
const MANIFEST_KEY = "manifest";
/** PF-5: the triage report for the LAST import's unresolved rows (replaced each import). */
const REJECTS_KEY = "rejects";

export interface CrosswalkManifest {
  version: number;
  customer: string | null;
  entries: number;
  resolved: number;
  unresolved: number;
  importedAtIso: string;
}

// ── Pure CSV parser ──────────────────────────────────────────────────────────
export interface CrosswalkParseStats {
  rows: number;
  dropped: number;
  entries: number;
  mapping: { customerNumber: string | null; sku: string | null };
  /**
   * PF-5: the dropped rows themselves, not just `dropped`'s count — one entry per row
   * the parser discarded, carrying its source line number and which side was blank.
   * Empty when the header row is unmappable: that is a whole-FILE failure the import
   * route rejects up front, so there is nothing per-row to triage.
   */
  rejects: CrosswalkReject[];
}

/** A parsed row plus its 1-based source line number (so a later failure can name it). */
export interface CrosswalkParsedRow {
  customerNumber: string;
  sku: string;
  line: number;
}

// The LOOKUP-KEY column: the number a rep types. Covers both a customer's own item number
// AND a Wesco stock number — import a `wesco_sku,mfr_part` file and reps resolve by Wesco #.
const CUSTOMER_HEADERS = [
  "customer_number", "customer number", "customer_sku", "your_sku", "your number", "cust_part",
  "customer_part", "account_sku", "their_sku", "customer item", "item_id",
  "wesco_sku", "wesco number", "wesco", "wesco_stock", "wesco_part", "stock_number", "stock number", "stock_no",
];
// The carried-product column it resolves TO (the manufacturer SKU we stock).
const SKU_HEADERS = ["sku", "our_sku", "meridian_sku", "mfr", "mpn", "part", "part_number", "manufacturer_sku", "manufacturer part", "catalog", "product"];

function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false;
      } else cur += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delim) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function detectDelimiter(headerLine: string): string {
  let best = ",";
  let bestCount = -1;
  for (const d of [",", "\t", ";", "|"]) {
    const n = headerLine.split(d).length;
    if (n > bestCount) { bestCount = n; best = d; }
  }
  return best;
}

function tokenize(header: string): string[] {
  return header.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function findColumn(headers: string[], synonyms: string[], exclude = -1): number {
  const lower = headers.map((h) => h.toLowerCase());
  for (const syn of synonyms) {
    const i = lower.indexOf(syn);
    if (i !== -1 && i !== exclude) return i;
  }
  const tokens = headers.map(tokenize);
  for (let i = 0; i < tokens.length; i++) {
    if (i !== exclude && tokens[i].some((t) => synonyms.includes(t))) return i;
  }
  for (let i = 0; i < lower.length; i++) {
    if (i !== exclude && synonyms.some((syn) => syn.length >= 4 && lower[i].includes(syn))) return i;
  }
  return -1;
}

/**
 * Parse a customer crosswalk CSV (a `customer number,sku` mapping). Header row
 * required. Rows missing either side are dropped + counted (never invented) AND
 * recorded in `stats.rejects` with their source line number, so the operator can be
 * handed the list instead of only the tally (PF-5).
 *
 * Blank lines are skipped for parsing but still consume a line number, so every
 * reported `line` matches what the operator sees in their spreadsheet.
 */
export function parseCrosswalkCsv(csv: string): { entries: CrosswalkParsedRow[]; stats: CrosswalkParseStats } {
  const empty = {
    entries: [],
    stats: { rows: 0, dropped: 0, entries: 0, mapping: { customerNumber: null, sku: null }, rejects: [] },
  };
  if (!csv || !csv.trim()) return empty;
  // Keep each surviving line's ORIGINAL 1-based position; filtering blanks away first
  // would make every reported row number wrong for any file with a blank line in it.
  const lines: { text: string; line: number }[] = [];
  csv.split(/\r\n|\r|\n/).forEach((text, i) => {
    if (text.trim().length > 0) lines.push({ text, line: i + 1 });
  });
  if (lines.length < 2) return empty;

  const delim = detectDelimiter(lines[0].text);
  const headers = splitCsvLine(lines[0].text, delim);
  const custCol = findColumn(headers, CUSTOMER_HEADERS);
  // The carried-SKU column must not be the lookup-key column — exclude it, so a header like
  // "wesco_sku" (which matches both detectors) maps to the lookup key, not both.
  let skuCol = findColumn(headers, SKU_HEADERS, custCol);
  if (skuCol === custCol) skuCol = -1;
  const mapping = {
    customerNumber: custCol === -1 ? null : headers[custCol],
    sku: skuCol === -1 ? null : headers[skuCol],
  };
  if (custCol === -1 || skuCol === -1) {
    // Whole-file failure (unmappable header): every row is dropped, but a per-row
    // report would just repeat "we couldn't read this file" N times. The route 400s
    // with a message naming both required columns instead.
    return { entries: [], stats: { rows: lines.length - 1, dropped: lines.length - 1, entries: 0, mapping, rejects: [] } };
  }

  const entries: CrosswalkParsedRow[] = [];
  const rejects: CrosswalkReject[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = splitCsvLine(lines[r].text, delim);
    const customerNumber = (cells[custCol] ?? "").trim();
    const sku = (cells[skuCol] ?? "").trim();
    if (!customerNumber || !sku) {
      // Which side is blank IS the fix, so the two cases are separate reasons. A row
      // missing both reports the customer-number side (the lookup key is the row's
      // reason to exist — without it the mapping is meaningless either way).
      rejects.push({
        line: lines[r].line,
        customerNumber,
        sku,
        reason: !customerNumber ? "missing_customer_number" : "missing_sku",
        lookupKey: "",
        nearMatch: "",
      });
      continue;
    }
    entries.push({ customerNumber, sku, line: lines[r].line });
  }
  return { entries, stats: { rows: lines.length - 1, dropped: rejects.length, entries: entries.length, mapping, rejects } };
}

/**
 * Verify each parsed row's SKU against the catalog, splitting the file into the
 * mappings to keep and the rows to triage (PF-5).
 *
 * The resolver is INJECTED (`resolveBySku` in the route) so this stays pure and every
 * failure branch is unit-testable without loading the 200k-product catalog. It returns
 * the canonical catalog SKU — stored in place of the customer's spelling so resolution
 * is stable — or null when the part isn't carried.
 *
 * Near-match: when a SKU doesn't resolve we try the row's OTHER cell. A hit proves the
 * columns are swapped, which is a single one-line fix for the whole file rather than
 * hundreds of "typo" edits. This is an exact O(1) lookup, never a fuzzy guess — if we
 * can't prove a candidate, `nearMatch` stays empty.
 */
export function resolveCrosswalkRows(
  rows: CrosswalkParsedRow[],
  resolveSku: (identifier: string) => string | null,
): { entries: CrosswalkEntry[]; rejects: CrosswalkReject[] } {
  const entries: CrosswalkEntry[] = [];
  const rejects: CrosswalkReject[] = [];
  for (const row of rows) {
    const canonical = resolveSku(row.sku);
    if (canonical) {
      entries.push({ customerNumber: row.customerNumber, sku: canonical, source: "import" });
      continue;
    }
    rejects.push({
      line: row.line,
      customerNumber: row.customerNumber,
      sku: row.sku,
      reason: "sku_not_carried",
      lookupKey: identifierKey(row.sku),
      nearMatch: resolveSku(row.customerNumber) ?? "",
    });
  }
  return { entries, rejects };
}

// ── Demo seed (illustrative, deterministic, NOT real customer data) ───────────
let _demo: CrosswalkEntry[] | null = null;
function demoEntries(): CrosswalkEntry[] {
  if (_demo) return _demo;
  // Map illustrative "WX-100000…" numbers to the first preferred products — so a demo
  // search like "WX-100000" resolves to a real carried product. Replace by importing
  // the customer's real crosswalk. Deterministic (catalog order is fixed).
  const preferred = getCatalog().products.filter((p) => p.preferred).slice(0, 30);
  _demo = preferred.map((p, i) => ({ customerNumber: `WX-${100000 + i}`, sku: p.sku, source: "demo" as const }));
  return _demo;
}

// ── Store bridge ─────────────────────────────────────────────────────────────
export async function saveCrosswalk(store: KvStore, entries: CrosswalkEntry[], manifest: CrosswalkManifest): Promise<void> {
  await store.put(CROSSWALK_NS, ENTRIES_KEY, entries);
  await store.put(CROSSWALK_NS, MANIFEST_KEY, manifest);
  _resetCrosswalkCache();
}
export async function clearCrosswalk(store: KvStore): Promise<void> {
  await store.delete(CROSSWALK_NS, ENTRIES_KEY);
  await store.delete(CROSSWALK_NS, MANIFEST_KEY);
  // The triage report describes an import that no longer exists — clear it too, or the
  // modal would offer a download of rows from a crosswalk the operator just deleted.
  await store.delete(CROSSWALK_NS, REJECTS_KEY);
  _resetCrosswalkCache();
}
export async function getCrosswalkManifest(store: KvStore): Promise<CrosswalkManifest | null> {
  try {
    return await store.get<CrosswalkManifest>(CROSSWALK_NS, MANIFEST_KEY);
  } catch {
    return null;
  }
}

/**
 * PF-5 — persist the LAST import's unresolved rows so the triage export survives a page
 * reload (the whole point: a count you can't act on is what this replaces). Pass null to
 * clear, which is what a clean import does — a stale report from a previous file would be
 * actively misleading. Bounded by MAX_STORED_CROSSWALK_REJECTS; the caller records the
 * true total in `report.total` so the UI never understates the problem.
 */
export async function saveCrosswalkRejects(store: KvStore, report: CrosswalkRejectReport | null): Promise<void> {
  if (!report || report.rows.length === 0) {
    await store.delete(CROSSWALK_NS, REJECTS_KEY);
    return;
  }
  await store.put(CROSSWALK_NS, REJECTS_KEY, report);
}

/** The stored triage report, or null when the last import had nothing unresolved. */
export async function getCrosswalkRejects(store: KvStore): Promise<CrosswalkRejectReport | null> {
  try {
    return await store.get<CrosswalkRejectReport>(CROSSWALK_NS, REJECTS_KEY);
  } catch {
    return null;
  }
}

/** Cap a reject list into a storable/returnable report, preserving the true total. */
export function buildCrosswalkRejectReport(rejects: CrosswalkReject[], importedAtIso: string): CrosswalkRejectReport {
  return {
    rows: rejects.slice(0, MAX_STORED_CROSSWALK_REJECTS),
    total: rejects.length,
    truncated: rejects.length > MAX_STORED_CROSSWALK_REJECTS,
    importedAtIso,
  };
}

/**
 * B17 — Wesco stock-number capture. Append a single number→sku mapping into the crosswalk (source
 * "captured"), DEDUPED by the normalized number so a re-capture updates in place rather than
 * duplicating. Preserves any existing import's manifest label and bumps the entry count. The CALLER
 * validates the sku is a carried product (never invent). Reps drip-feed real Wesco stock numbers this
 * way — the per-entry complement to the batch crosswalk import (B7), so real identifiers accrue as a
 * byproduct of daily use.
 */
export async function captureCrosswalkEntry(
  store: KvStore,
  number: string,
  sku: string,
): Promise<{ entries: number; added: boolean }> {
  const num = number.trim();
  const s = sku.trim();
  const key = identifierKey(num);
  const entries = (await store.get<CrosswalkEntry[]>(CROSSWALK_NS, ENTRIES_KEY)) ?? [];
  const idx = entries.findIndex((e) => identifierKey(e.customerNumber) === key);
  let added = false;
  if (idx >= 0) {
    entries[idx] = { customerNumber: num, sku: s, source: "captured" };
  } else {
    entries.push({ customerNumber: num, sku: s, source: "captured" });
    added = true;
  }
  const prev = await getCrosswalkManifest(store);
  const manifest: CrosswalkManifest = {
    version: (prev?.version ?? 0) + 1,
    customer: prev?.customer ?? "Captured (reps)",
    entries: entries.length,
    resolved: entries.length,
    unresolved: 0,
    importedAtIso: new Date().toISOString(),
  };
  await saveCrosswalk(store, entries, manifest);
  return { entries: entries.length, added };
}

// ── Per-scope index (demo seed + imported entries), cached ────────────────────
const TTL_MS = 20_000;
const _cache = new Map<string, { index: Map<string, CrosswalkHit>; at: number }>();

export function _resetCrosswalkCache(): void {
  _cache.clear();
  _demo = null;
}

/**
 * The crosswalk index for a scope: the demo seed PLUS any imported entries (imports
 * override demo on a key collision). Keys are normalized via identifierKey so
 * spelling/separator variants resolve the same. Cached per scope; fails closed to the
 * demo seed alone on a store error.
 */
export async function crosswalkIndex(store: KvStore, scopeKey: string, nowMs: number = Date.now()): Promise<Map<string, CrosswalkHit>> {
  const cached = _cache.get(scopeKey);
  if (cached && nowMs - cached.at < TTL_MS) return cached.index;

  const index = new Map<string, CrosswalkHit>();
  for (const e of demoEntries()) index.set(identifierKey(e.customerNumber), { sku: e.sku, source: "demo", customerNumber: e.customerNumber });
  try {
    const imported = await store.get<CrosswalkEntry[]>(CROSSWALK_NS, ENTRIES_KEY);
    if (imported) {
      for (const e of imported) index.set(identifierKey(e.customerNumber), { sku: e.sku, source: e.source, customerNumber: e.customerNumber });
    }
  } catch {
    /* keep the demo-only index */
  }
  _cache.set(scopeKey, { index, at: nowMs });
  return index;
}

/** Resolve a customer number against a prebuilt index (sync). Null when not found. */
export function resolveCustomerNumber(index: Map<string, CrosswalkHit>, num: string): CrosswalkHit | null {
  if (!num) return null;
  return index.get(identifierKey(num)) ?? null;
}
