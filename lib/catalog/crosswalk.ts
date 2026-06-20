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

export type CrosswalkSource = "demo" | "import";

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
}

const CUSTOMER_HEADERS = ["customer_number", "customer number", "customer_sku", "your_sku", "your number", "cust_part", "customer_part", "account_sku", "their_sku", "customer item", "item_id"];
const SKU_HEADERS = ["sku", "our_sku", "meridian_sku", "mfr", "mpn", "part", "part_number", "manufacturer_sku", "catalog", "product"];

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

function findColumn(headers: string[], synonyms: string[]): number {
  const lower = headers.map((h) => h.toLowerCase());
  for (const syn of synonyms) {
    const i = lower.indexOf(syn);
    if (i !== -1) return i;
  }
  const tokens = headers.map(tokenize);
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].some((t) => synonyms.includes(t))) return i;
  }
  for (let i = 0; i < lower.length; i++) {
    if (synonyms.some((syn) => syn.length >= 4 && lower[i].includes(syn))) return i;
  }
  return -1;
}

/**
 * Parse a customer crosswalk CSV (a `customer number,sku` mapping). Header row
 * required. Rows missing either side are dropped + counted (never invented).
 */
export function parseCrosswalkCsv(csv: string): { entries: { customerNumber: string; sku: string }[]; stats: CrosswalkParseStats } {
  const empty = { entries: [], stats: { rows: 0, dropped: 0, entries: 0, mapping: { customerNumber: null, sku: null } } };
  if (!csv || !csv.trim()) return empty;
  const lines = csv.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return empty;

  const delim = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delim);
  const custCol = findColumn(headers, CUSTOMER_HEADERS);
  // The SKU column must not be the same column chosen for the customer number.
  let skuCol = findColumn(headers, SKU_HEADERS);
  if (skuCol === custCol) skuCol = -1;
  const mapping = {
    customerNumber: custCol === -1 ? null : headers[custCol],
    sku: skuCol === -1 ? null : headers[skuCol],
  };
  if (custCol === -1 || skuCol === -1) {
    return { entries: [], stats: { rows: lines.length - 1, dropped: lines.length - 1, entries: 0, mapping } };
  }

  const entries: { customerNumber: string; sku: string }[] = [];
  let dropped = 0;
  for (let r = 1; r < lines.length; r++) {
    const cells = splitCsvLine(lines[r], delim);
    const customerNumber = (cells[custCol] ?? "").trim();
    const sku = (cells[skuCol] ?? "").trim();
    if (!customerNumber || !sku) { dropped++; continue; }
    entries.push({ customerNumber, sku });
  }
  return { entries, stats: { rows: lines.length - 1, dropped, entries: entries.length, mapping } };
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
  _resetCrosswalkCache();
}
export async function getCrosswalkManifest(store: KvStore): Promise<CrosswalkManifest | null> {
  try {
    return await store.get<CrosswalkManifest>(CROSSWALK_NS, MANIFEST_KEY);
  } catch {
    return null;
  }
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
      for (const e of imported) index.set(identifierKey(e.customerNumber), { sku: e.sku, source: "import", customerNumber: e.customerNumber });
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
