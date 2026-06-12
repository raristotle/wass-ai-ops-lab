import { REAL_PRODUCT_ENTRIES, REAL_PRODUCTS_BUILT_AT } from "@/data/real/real-products";
import { BRAND_HIERARCHY_ENTRIES } from "@/data/real/brand-hierarchy";
import { VERIFIED_CROSS_ENTRIES } from "@/data/real/verified-crosses";
import { assessRecord } from "@/lib/catalog/provenance";
import { brandCoverage, validateHierarchy } from "@/lib/catalog/brand-hierarchy";
import { validateCrossEntries } from "@/lib/catalog/verified-crosses";
import { parseSalesRank } from "@/lib/catalog/sales-rank";
import { identifierKey } from "@/lib/catalog/identifiers";

/**
 * Data-quality + cross-reference reporting over the verified datasets.
 * Pure and deterministic (dates come from the datasets, not the clock), so
 * the committed report regenerates byte-identically until the data changes.
 */

export interface DataQualityReport {
  builtAt: string;
  products: {
    total: number;
    productionReady: number;
    belowThreshold: { brand: string; mpn: string; status: string; confidence: number }[];
    confidenceDistribution: { "95+": number; "85-94": number; "70-84": number; "<70": number };
  };
  fieldCoverage: Record<string, { present: number; pct: number }>;
  brands: {
    distinct: number;
    hierarchyModeled: number;
    hierarchyMissingTop: { brand: string; products: number }[];
  };
  missingFieldsByCategory: Record<string, Record<string, number>>;
  crosses: {
    pairs: number;
    bySourceKind: Record<string, number>;
    anchoredBothSides: number;
    anchoredOneSide: number;
    structuralProblems: string[];
  };
  missingInputs: { name: string; detail: string }[];
}

export function buildDataQualityReport(): DataQualityReport {
  const entries = REAL_PRODUCT_ENTRIES;

  const dist = { "95+": 0, "85-94": 0, "70-84": 0, "<70": 0 };
  const belowThreshold: DataQualityReport["products"]["belowThreshold"] = [];
  let productionReady = 0;
  const fieldCounts: Record<string, number> = {
    specSheetUrl: 0,
    productUrl: 0,
    sourceUrl: 0,
    wescoSku: 0,
    catalogNumber: 0,
    "gtin/upc": 0,
    parentCompany: 0,
  };
  const missingByCategory: Record<string, Record<string, number>> = {};

  for (const e of entries) {
    const a = assessRecord(e);
    if (a.confidence >= 95) dist["95+"] += 1;
    else if (a.confidence >= 85) dist["85-94"] += 1;
    else if (a.confidence >= 70) dist["70-84"] += 1;
    else dist["<70"] += 1;
    if (a.productionReady) productionReady += 1;
    else belowThreshold.push({ brand: e.brand, mpn: e.mpn, status: a.status, confidence: a.confidence });

    if (e.specSheetUrl) fieldCounts.specSheetUrl += 1;
    if (e.productUrl) fieldCounts.productUrl += 1;
    if (e.sourceUrl) fieldCounts.sourceUrl += 1;
    if (e.wescoSku) fieldCounts.wescoSku += 1;
    if (e.catalogNumber) fieldCounts.catalogNumber += 1;
    if (e.gtin || e.upc) fieldCounts["gtin/upc"] += 1;
    if (e.parentCompany || brandCoverage([e.brand]).covered.length > 0) fieldCounts.parentCompany += 1;

    const cat = (missingByCategory[e.category] ??= {});
    for (const f of a.missingFields) cat[f] = (cat[f] ?? 0) + 1;
  }

  const fieldCoverage: DataQualityReport["fieldCoverage"] = {};
  for (const [field, present] of Object.entries(fieldCounts)) {
    fieldCoverage[field] = { present, pct: Math.round((present / Math.max(1, entries.length)) * 1000) / 10 };
  }

  // Brand coverage weighted by product count
  const productsByBrand = new Map<string, number>();
  for (const e of entries) productsByBrand.set(e.brand, (productsByBrand.get(e.brand) ?? 0) + 1);
  const allBrands = [...productsByBrand.keys()];
  const { covered, missing } = brandCoverage(allBrands);
  const hierarchyMissingTop = missing
    .map((brand) => ({ brand, products: productsByBrand.get(brand) ?? 0 }))
    .sort((a, b) => b.products - a.products)
    .slice(0, 15);

  // Crosses
  const skuKeys = new Set(entries.map((e) => identifierKey(e.mpn)));
  let both = 0;
  let one = 0;
  const bySourceKind: Record<string, number> = {};
  for (const c of VERIFIED_CROSS_ENTRIES) {
    bySourceKind[c.sourceKind] = (bySourceKind[c.sourceKind] ?? 0) + 1;
    const aIn = skuKeys.has(identifierKey(c.aMpn));
    const bIn = skuKeys.has(identifierKey(c.bMpn));
    if (aIn && bIn) both += 1;
    else if (aIn || bIn) one += 1;
  }

  // Missing inputs — reported, never guessed.
  const salesRank = parseSalesRank(null);
  const missingInputs: DataQualityReport["missingInputs"] = [
    {
      name: "Wesco sales-volume ranking",
      detail: salesRank.available
        ? "available"
        : `${salesRank.reason} Drop the file at ${salesRank.expectedPath} with schema ${salesRank.expectedSchema}.`,
    },
    {
      name: "Wesco brands index page",
      detail:
        "https://www.wesco.com/us/en/brands.html returns HTTP 403 to scripted fetchers (WAF). Per-brand pages (wesco.com/us/en/brands/<letter>/<slug>.html) are indexed by search engines and recorded as wescoBrandUrl where confirmed; the full index needs a browser session or an approved feed.",
    },
  ];

  return {
    builtAt: REAL_PRODUCTS_BUILT_AT,
    products: { total: entries.length, productionReady, belowThreshold, confidenceDistribution: dist },
    fieldCoverage,
    brands: { distinct: allBrands.length, hierarchyModeled: covered.length, hierarchyMissingTop },
    missingFieldsByCategory: missingByCategory,
    crosses: {
      pairs: VERIFIED_CROSS_ENTRIES.length,
      bySourceKind,
      anchoredBothSides: both,
      anchoredOneSide: one,
      structuralProblems: [...validateCrossEntries(VERIFIED_CROSS_ENTRIES), ...validateHierarchy(BRAND_HIERARCHY_ENTRIES)],
    },
    missingInputs,
  };
}

export function renderDataQualityMarkdown(r: DataQualityReport): string {
  const lines: string[] = [];
  lines.push("# Product Finder — Data Quality & Cross-Reference Report");
  lines.push("");
  lines.push(`Generated from datasets built ${r.builtAt}. Regenerated automatically by the test gate (\`lib/catalog/data-quality.test.ts\`) — do not hand-edit.`);
  lines.push("");
  lines.push("## Verified product records");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|---|---|`);
  lines.push(`| Records loaded | ${r.products.total} |`);
  lines.push(`| Production-ready (verified, ≥95% confidence) | ${r.products.productionReady} |`);
  lines.push(`| Below threshold (quarantined/review) | ${r.products.belowThreshold.length} |`);
  lines.push(`| Distinct brands | ${r.brands.distinct} |`);
  lines.push(`| Brands with modeled hierarchy | ${r.brands.hierarchyModeled} |`);
  lines.push("");
  lines.push("### Confidence distribution");
  lines.push("");
  lines.push(`| Band | Records |`);
  lines.push(`|---|---|`);
  for (const [band, n] of Object.entries(r.products.confidenceDistribution)) {
    lines.push(`| ${band} | ${n} |`);
  }
  lines.push("");
  lines.push("### Field coverage");
  lines.push("");
  lines.push(`| Field | Present | % |`);
  lines.push(`|---|---|---|`);
  for (const [field, c] of Object.entries(r.fieldCoverage)) {
    lines.push(`| ${field} | ${c.present} | ${c.pct}% |`);
  }
  if (r.products.belowThreshold.length > 0) {
    lines.push("");
    lines.push("### Quarantined / review records");
    lines.push("");
    for (const b of r.products.belowThreshold.slice(0, 50)) {
      lines.push(`- ${b.brand} ${b.mpn} — ${b.status} (${b.confidence})`);
    }
  }
  if (r.brands.hierarchyMissingTop.length > 0) {
    lines.push("");
    lines.push("### Largest brands not yet hierarchy-modeled");
    lines.push("");
    for (const b of r.brands.hierarchyMissingTop) {
      lines.push(`- ${b.brand} (${b.products} products)`);
    }
  }
  lines.push("");
  lines.push("## Cross-reference dataset");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|---|---|`);
  lines.push(`| Source-backed pairs | ${r.crosses.pairs} |`);
  lines.push(`| Pairs with both sides in catalog | ${r.crosses.anchoredBothSides} |`);
  lines.push(`| Pairs with one side in catalog | ${r.crosses.anchoredOneSide} |`);
  for (const [kind, n] of Object.entries(r.crosses.bySourceKind)) {
    lines.push(`| Source: ${kind} | ${n} |`);
  }
  lines.push(`| Structural problems | ${r.crosses.structuralProblems.length} |`);
  lines.push("");
  lines.push("## Missing inputs (reported, not guessed)");
  lines.push("");
  for (const m of r.missingInputs) {
    lines.push(`- **${m.name}** — ${m.detail}`);
  }
  lines.push("");
  return lines.join("\n");
}
