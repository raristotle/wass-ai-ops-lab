import { BRAND_HIERARCHY_ENTRIES } from "@/data/real/brand-hierarchy";

/**
 * Brand → sub-brand → division → parent-company registry.
 *
 * Every node carries a sourceUrl supporting the relationship (corporate
 * about/brand page, acquisition announcement, or the Wesco brand page).
 * Entries live in data/real/brand-hierarchy.ts — researched and
 * link-verified, never assumed. Brands absent from the registry resolve to
 * null and count as a coverage gap in the data-quality report.
 */

export interface BrandNode {
  /** Canonical brand name exactly as it appears in catalog data. */
  brand: string;
  /** Alternate spellings that resolve to this node (e.g. "GE (ABB)"). */
  aliases?: string[];
  /** Marketing sub-brand of `brand` context, when applicable. */
  subBrand?: string;
  /** Operating division/business unit, when publicly documented. */
  division?: string;
  /** Ultimate parent company. Independent brands name themselves. */
  parentCompany: string;
  /** Page supporting this relationship — link-verified at research time. */
  sourceUrl: string;
  /** wesco.com brand page when one exists (Wesco carriage provenance). */
  wescoBrandUrl?: string;
  verifiedAt: string; // YYYY-MM-DD
}

const norm = (s: string) => s.trim().toLowerCase();

let index: Map<string, BrandNode> | null = null;

function buildIndex(): Map<string, BrandNode> {
  const m = new Map<string, BrandNode>();
  for (const node of BRAND_HIERARCHY_ENTRIES) {
    m.set(norm(node.brand), node);
    for (const a of node.aliases ?? []) m.set(norm(a), node);
  }
  return m;
}

/** Resolve a catalog brand name to its hierarchy node (null = unmodeled). */
export function brandHierarchyFor(brand: string): BrandNode | null {
  if (!index) index = buildIndex();
  return index.get(norm(brand)) ?? null;
}

export interface BrandCoverage {
  covered: string[];
  missing: string[];
}

/** Which of the given brands the registry models — feeds the data-quality report. */
export function brandCoverage(brands: readonly string[]): BrandCoverage {
  const covered: string[] = [];
  const missing: string[] = [];
  for (const b of brands) {
    (brandHierarchyFor(b) ? covered : missing).push(b);
  }
  return { covered, missing };
}

/** Structural validation for the shipped registry (tests + reports). */
export function validateHierarchy(entries: readonly BrandNode[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    const keys = [e.brand, ...(e.aliases ?? [])].map(norm);
    for (const k of keys) {
      if (seen.has(k)) problems.push(`${e.brand}: duplicate brand/alias "${k}"`);
      seen.add(k);
    }
    if (!e.parentCompany.trim()) problems.push(`${e.brand}: empty parentCompany`);
    if (!/^https:\/\/\S+$/i.test(e.sourceUrl)) problems.push(`${e.brand}: sourceUrl must be https`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.verifiedAt)) problems.push(`${e.brand}: bad verifiedAt`);
    if (e.wescoBrandUrl && !/^https:\/\/(www\.)?wesco\.com\//i.test(e.wescoBrandUrl)) {
      problems.push(`${e.brand}: wescoBrandUrl must be a wesco.com URL`);
    }
  }
  return problems;
}
