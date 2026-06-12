// Generates data/real/cross-source-registry.ts from the user-supplied
// cross-reference source workbook (all_1000_product_cross_reference_sources_with_urls.md,
// archived as data/real/research/xref-sources-raw.json).
//
//   node scripts/ingest-xref-sources.mjs
//
// Deterministic: dedupes the workbook's per-section rows to one entry per
// cross_reference_data_url, classifies access/kind/status with the same rules
// shipped in lib/catalog/cross-sources.ts, and flags URLs the workbook
// truncated with a literal "...". Sources we extracted pairs from this
// session are marked "ingested" via the INGESTED map below.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const raw = JSON.parse(readFileSync(resolve(root, "data/real/research/xref-sources-raw.json"), "utf8"));

// url → note, maintained by the extraction pass (scripts/merge-extracted-crosses.mjs prints these).
const INGESTED = JSON.parse(
  readFileSync(resolve(root, "data/real/research/xref-ingested-urls.json"), "utf8").toString() || "{}"
);

// ── classification (mirrors lib/catalog/cross-sources.ts) ──
const has = (s, ...words) => {
  const l = (s ?? "").toLowerCase();
  return words.some((w) => l.includes(w));
};
function classifyAccess(f) {
  if (has(f, "non-free", "subscription", "proprietary", "paid tiers", "paid api")) {
    if (has(f, "free tier", "free web")) return "free";
    return "licensed";
  }
  if (has(f, "register", "login", "request")) return "registration";
  return "free";
}
function classifyKind(fmt) {
  if (has(fmt, "saas", "api", "database")) return "api-database";
  if (has(fmt, "pdf")) {
    return has(fmt, "cross", "table", "matrix", "migration", "compat", "guide", "chart", "list", "poster", "handbook")
      ? "pdf-table"
      : "document";
  }
  if (has(fmt, "tool", "selector", "finder", "search", "form", "upload", "cpq", "configurator", "workflow", "login", "app"))
    return "interactive-tool";
  if (has(fmt, "cross-reference", "table", "matrix", "chart", "list", "guide")) return "html-table";
  if (has(fmt, "catalog", "hierarchy", "product family", "brand", "hub", "source", "portal")) return "catalog-page";
  return "document";
}
function initialIngestStatus(access, kind, f) {
  if (access === "licensed") return "requires-license";
  if (kind === "api-database") return has(f, "free tier", "free web") ? "requires-api-key" : "requires-license";
  if (kind === "interactive-tool") return "requires-browser";
  if (kind === "pdf-table" || kind === "html-table") return "ingestible";
  return "no-direct-crosses";
}

// ── dedupe per URL ──
const byUrl = new Map();
for (const r of raw) {
  const url = r.cross_reference_data_url;
  if (!byUrl.has(url)) {
    byUrl.set(url, {
      name: r.source_table,
      url,
      domain: r.url_domain,
      format: r.data_format,
      freeOrNonFree: r.free_or_non_free,
      qualityScore: r.quality_score,
      volumeScore: r.volume_score,
      categories: new Set(),
      sections: new Set(),
      recordCount: 0,
      batch: r.batch ?? "Unbatched",
      lastChecked: r.last_checked,
    });
  }
  const e = byUrl.get(url);
  e.recordCount += 1;
  if (r.product_category) e.categories.add(r.product_category);
  if (r.sub_sub_category_or_section) e.sections.add(r.sub_sub_category_or_section);
}

const entries = [...byUrl.values()]
  .sort((a, b) => b.qualityScore - a.qualityScore || a.url.localeCompare(b.url))
  .map((e, i) => {
    const access = classifyAccess(e.freeOrNonFree);
    const kind = classifyKind(e.format);
    const urlTruncated = e.url.endsWith("...");
    const ingestNote = INGESTED[e.url];
    let ingestStatus = initialIngestStatus(access, kind, e.freeOrNonFree);
    if (urlTruncated && ingestStatus === "ingestible") ingestStatus = "requires-browser"; // full URL unknown — needs manual resolution
    if (ingestNote) ingestStatus = "ingested";
    return {
      id: `xref-src-${String(i + 1).padStart(3, "0")}`,
      name: e.name,
      url: e.url,
      domain: e.domain,
      format: e.format,
      access,
      kind,
      ingestStatus,
      qualityScore: e.qualityScore,
      volumeScore: e.volumeScore,
      categories: [...e.categories].sort(),
      sections: [...e.sections].sort(),
      recordCount: e.recordCount,
      batch: e.batch,
      lastChecked: e.lastChecked,
      urlTruncated,
      ...(ingestNote ? { ingestNote } : {}),
    };
  });

const header = `// GENERATED FILE — do not hand-edit.
// Built by scripts/ingest-xref-sources.mjs from data/real/research/xref-sources-raw.json
// (the user-supplied "Top 1000 Product Cross-Reference Source Records" workbook, 2026-06-12 vintage,
// deduped from ${raw.length} per-section rows to one entry per source URL).
// Regenerate with:  node scripts/ingest-xref-sources.mjs
import type { CrossSourceEntry } from "@/lib/catalog/cross-sources";

export const CROSS_SOURCE_WORKBOOK_ROWS = ${raw.length};

export const CROSS_SOURCE_ENTRIES: CrossSourceEntry[] = `;

writeFileSync(
  resolve(root, "data/real/cross-source-registry.ts"),
  header + JSON.stringify(entries, null, 1) + ";\n"
);
console.log(`wrote data/real/cross-source-registry.ts — ${entries.length} sources from ${raw.length} rows`);
const byStatus = {};
for (const e of entries) byStatus[e.ingestStatus] = (byStatus[e.ingestStatus] ?? 0) + 1;
console.log(byStatus);
