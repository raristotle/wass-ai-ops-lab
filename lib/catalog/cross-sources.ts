/**
 * Cross-reference source registry.
 *
 * The registry catalogs every cross-reference SOURCE we know about (a
 * manufacturer cross tool, a published PDF table, a paid database...), where
 * the verified-crosses dataset catalogs individual SKU↔SKU pairs. A source
 * record says where crosses can come from, how it is accessed, and whether we
 * have ingested from it — it never implies the pairs themselves exist until
 * they are extracted into data/real/verified-crosses.ts with evidence.
 */

export type SourceAccess = "free" | "registration" | "licensed";

export type SourceKind =
  | "pdf-table"        // published PDF cross/compatibility/migration table
  | "html-table"       // static HTML cross table — directly parseable
  | "interactive-tool" // JS search/selector tool — needs a browser session
  | "api-database"     // API or database product (may need keys/contract)
  | "catalog-page"     // product catalog/hierarchy page — no direct crosses
  | "document";        // other document (manual, handbook, guide)

export type IngestStatus =
  | "ingested"           // pairs extracted into data/real/verified-crosses.ts
  | "ingestible"         // free + parseable format, not yet extracted
  | "requires-browser"   // interactive tool; scripted fetchers can't drive it
  | "requires-api-key"   // free/freemium API — needs credentials
  | "requires-license"   // paid/subscription source
  | "no-direct-crosses"; // catalog/selector content without stated SKU pairs

export interface CrossSourceEntry {
  /** Stable id, e.g. "xref-src-001". */
  id: string;
  name: string;
  url: string;
  domain: string;
  /** Raw format string from the ingestion workbook. */
  format: string;
  access: SourceAccess;
  kind: SourceKind;
  ingestStatus: IngestStatus;
  /** 0-100 quality/volume scores carried from the ingestion workbook. */
  qualityScore: number;
  volumeScore: number;
  /** Product categories the workbook tags this source with. */
  categories: string[];
  /** Sections/series rows the workbook lists under this source. */
  sections: string[];
  /** Number of workbook rows that pointed at this URL. */
  recordCount: number;
  batch: string;
  lastChecked: string; // YYYY-MM-DD from the workbook
  /** The workbook truncated this URL with a literal "..." — full URL unknown. */
  urlTruncated: boolean;
  /** Set when ingestStatus is "ingested": what we extracted this session. */
  ingestNote?: string;
}

const has = (s: string, ...words: string[]) => {
  const l = s.toLowerCase();
  return words.some((w) => l.includes(w));
};

export function classifyAccess(freeOrNonFree: string): SourceAccess {
  if (has(freeOrNonFree, "non-free", "subscription", "proprietary", "paid tiers", "paid api")) {
    // "Free tier/paid tiers" and "Free web / paid API" still allow free entry.
    if (has(freeOrNonFree, "free tier", "free web")) return "free";
    return "licensed";
  }
  if (has(freeOrNonFree, "register", "login", "request")) return "registration";
  return "free";
}

export function classifyKind(format: string): SourceKind {
  if (has(format, "saas", "api", "database")) return "api-database";
  if (has(format, "pdf")) {
    return has(format, "cross", "table", "matrix", "migration", "compat", "guide", "chart", "list", "poster", "handbook")
      ? "pdf-table"
      : "document";
  }
  if (has(format, "tool", "selector", "finder", "search", "form", "upload", "cpq", "configurator", "workflow", "login", "app"))
    return "interactive-tool";
  if (has(format, "cross-reference", "table", "matrix", "chart", "list", "guide"))
    return "html-table";
  if (has(format, "catalog", "hierarchy", "product family", "brand", "hub", "source", "portal"))
    return "catalog-page";
  return "document";
}

/** Status a source starts with; extraction later upgrades parseable ones to "ingested". */
export function initialIngestStatus(access: SourceAccess, kind: SourceKind, freeOrNonFree: string): IngestStatus {
  if (access === "licensed") return "requires-license";
  if (kind === "api-database") return has(freeOrNonFree, "free tier", "free web") ? "requires-api-key" : "requires-license";
  if (kind === "interactive-tool") return "requires-browser";
  if (kind === "pdf-table" || kind === "html-table") return "ingestible";
  return "no-direct-crosses";
}

export interface CrossSourceStats {
  total: number;
  byStatus: Record<IngestStatus, number>;
  byAccess: Record<SourceAccess, number>;
  byKind: Record<SourceKind, number>;
  truncatedUrls: number;
  workbookRecords: number;
}

export function crossSourceStats(entries: readonly CrossSourceEntry[]): CrossSourceStats {
  const byStatus = {} as Record<IngestStatus, number>;
  const byAccess = {} as Record<SourceAccess, number>;
  const byKind = {} as Record<SourceKind, number>;
  let truncatedUrls = 0;
  let workbookRecords = 0;
  for (const e of entries) {
    byStatus[e.ingestStatus] = (byStatus[e.ingestStatus] ?? 0) + 1;
    byAccess[e.access] = (byAccess[e.access] ?? 0) + 1;
    byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
    if (e.urlTruncated) truncatedUrls += 1;
    workbookRecords += e.recordCount;
  }
  return { total: entries.length, byStatus, byAccess, byKind, truncatedUrls, workbookRecords };
}

export function validateCrossSources(entries: readonly CrossSourceEntry[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const urls = new Set<string>();
  for (const e of entries) {
    if (ids.has(e.id)) problems.push(`${e.id}: duplicate id`);
    ids.add(e.id);
    if (urls.has(e.url)) problems.push(`${e.id}: duplicate url ${e.url}`);
    urls.add(e.url);
    if (!/^https:\/\//i.test(e.url)) problems.push(`${e.id}: url must be https`);
    if (e.urlTruncated !== e.url.endsWith("...")) problems.push(`${e.id}: urlTruncated flag mismatch`);
    if (e.qualityScore < 0 || e.qualityScore > 100) problems.push(`${e.id}: qualityScore out of range`);
    if (e.ingestStatus === "ingested" && !e.ingestNote) problems.push(`${e.id}: ingested without ingestNote`);
    if (e.urlTruncated && e.ingestStatus === "ingestible")
      problems.push(`${e.id}: truncated URL cannot be ingestible — needs resolution first`);
  }
  return problems;
}

/** Workbook quality score for a cross entry's source, matched by domain. */
export function qualityScoreForUrl(url: string, entries: readonly CrossSourceEntry[]): number | null {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
  let best: number | null = null;
  for (const e of entries) {
    const d = e.domain.replace(/^www\./, "");
    if (host === d || host.endsWith(`.${d}`) || d.endsWith(`.${host}`)) {
      if (best === null || e.qualityScore > best) best = e.qualityScore;
    }
  }
  return best;
}
