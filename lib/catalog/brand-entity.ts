import { BRAND_ENTITY_ENTRIES } from "@/data/real/brand-entities";

/**
 * Manufacturer ENTITY graph (v-DI #1) — enriches every catalog brand with its
 * corporate parent, ultimate parent, GLEIF Legal Entity Identifier (LEI),
 * marketing aliases, and former names. Ingested from free/open sources
 * (GLEIF golden copy, Wikidata CC0, SEC EDGAR) and web-verified per brand;
 * every entry carries a sourceUrl and a confidence. Complements the shipped
 * brand-hierarchy registry (which models parent + Wesco carriage) by adding the
 * entity-resolution signals: a stable LEI, the ULTIMATE parent (distinct from the
 * immediate one, e.g. 2N → Axis → Canon), and FORMER names that customers still
 * search by (Cutler-Hammer → Eaton).
 *
 * This is what lifts entity resolution, cross-reference ("same corporate family /
 * equivalent brand"), search recall (alias + former-name → the right products),
 * and the embedding text — all from a real, sourced dataset. No fabricated values.
 */

export interface BrandEntity {
  /** Canonical brand exactly as it appears in catalog data. */
  brand: string;
  /** Immediate corporate parent, when distinct from the brand. */
  parentCompany?: string;
  /** Top of the ownership chain. */
  ultimateParent?: string;
  /** GLEIF Legal Entity Identifier of the (ultimate) parent — 20 chars. */
  lei?: string;
  /** Other names/sub-brands customers use for this brand. */
  aliases: string[];
  /** Prior names from rebrands/acquisitions (still searched by). */
  formerNames: string[];
  /** Citable source supporting the relationship (Wikidata/GLEIF/SEC/corporate). */
  sourceUrl: string;
  confidence: "high" | "medium" | "low";
}

const norm = (s: string) => s.trim().toLowerCase();

let byBrand: Map<string, BrandEntity> | null = null;
let byAlias: Map<string, BrandEntity> | null = null;

function build(): void {
  byBrand = new Map();
  byAlias = new Map();
  for (const e of BRAND_ENTITY_ENTRIES) {
    byBrand.set(norm(e.brand), e);
    // Alias index resolves aliases + former names back to the canonical brand,
    // but never clobbers a real catalog brand key (a brand wins over an alias).
    for (const name of [...e.aliases, ...e.formerNames]) {
      const k = norm(name);
      if (!byAlias!.has(k)) byAlias!.set(k, e);
    }
  }
}

function ensure(): void {
  if (!byBrand || !byAlias) build();
}

/** Resolve a catalog brand to its entity record (null = not modeled). */
export function brandEntityFor(brand: string): BrandEntity | null {
  ensure();
  return byBrand!.get(norm(brand)) ?? null;
}

/**
 * Resolve an arbitrary name (brand, alias, or former name) to the canonical
 * catalog brand. Powers search: typing "Cutler-Hammer" or "Homeline" finds the
 * Eaton / Square D products. Returns the canonical brand string or null.
 */
export function resolveBrandAlias(name: string): string | null {
  ensure();
  const k = norm(name);
  const direct = byBrand!.get(k);
  if (direct) return direct.brand;
  const aliased = byAlias!.get(k);
  return aliased ? aliased.brand : null;
}

/**
 * Catalog brands that share the same ultimate parent (corporate siblings) —
 * a real "same-family / second-source" signal for the cross-reference engine.
 * Excludes the brand itself.
 */
export function siblingBrands(brand: string): string[] {
  ensure();
  const e = byBrand!.get(norm(brand));
  const parent = e?.ultimateParent || e?.parentCompany;
  if (!e || !parent) return [];
  const out: string[] = [];
  for (const other of BRAND_ENTITY_ENTRIES) {
    if (other.brand === e.brand) continue;
    if ((other.ultimateParent || other.parentCompany) === parent) out.push(other.brand);
  }
  return out;
}

export interface EntityCoverage {
  total: number;
  withParent: number;
  withLei: number;
  withAlias: number;
}

/** Coverage stats over a set of catalog brands (for the data-quality dashboard). */
export function entityCoverage(brands: readonly string[]): EntityCoverage {
  ensure();
  const seen = new Set(brands.map(norm));
  let withParent = 0;
  let withLei = 0;
  let withAlias = 0;
  for (const b of seen) {
    const e = byBrand!.get(b);
    if (!e) continue;
    if (e.parentCompany) withParent += 1;
    if (e.lei) withLei += 1;
    if (e.aliases.length || e.formerNames.length) withAlias += 1;
  }
  return { total: seen.size, withParent, withLei, withAlias };
}

/** Multi-token alias/former-name phrases → canonical brand, longest-first. */
let aliasPhrases: { phrase: string; brand: string }[] | null = null;

function buildAliasPhrases(): void {
  ensure();
  const out: { phrase: string; brand: string }[] = [];
  const seen = new Set<string>();
  for (const e of BRAND_ENTITY_ENTRIES) {
    for (const name of [...e.aliases, ...e.formerNames]) {
      const p = name.trim().toLowerCase();
      // ≥4 chars; never shadow a real catalog brand; first claim wins per phrase.
      if (p.length < 4 || byBrand!.has(p) || seen.has(p)) continue;
      seen.add(p);
      out.push({ phrase: p, brand: e.brand });
    }
  }
  out.sort((a, b) => b.phrase.length - a.phrase.length);
  aliasPhrases = out;
}

/**
 * Search lift: detect brand aliases / former names in a query and append the
 * canonical catalog brand so the later brand-match pass finds the right products
 * ("Cutler-Hammer 20A breaker" → also "Eaton"; "Cooper Bussmann fuse" → "Bussmann").
 * The original text is kept (both signals survive); returns the appended brands.
 * Pure — whole-phrase, space-boundary matching, no clobber of real brand names.
 */
export function expandBrandAliases(raw: string): { text: string; brands: string[] } {
  if (!aliasPhrases) buildAliasPhrases();
  const hay = ` ${raw.toLowerCase().replace(/\s+/g, " ")} `;
  const brands: string[] = [];
  for (const { phrase, brand } of aliasPhrases!) {
    if (hay.includes(` ${phrase} `) && !brands.includes(brand)) brands.push(brand);
  }
  return { text: brands.length ? `${raw} ${brands.join(" ")}` : raw, brands };
}

/** Structural validation for the shipped dataset (tests). */
export function validateEntities(entries: readonly BrandEntity[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    const k = norm(e.brand);
    if (seen.has(k)) problems.push(`${e.brand}: duplicate brand`);
    seen.add(k);
    if (!/^https:\/\/\S+$/i.test(e.sourceUrl)) problems.push(`${e.brand}: sourceUrl must be https`);
    if (e.lei && !/^[A-Z0-9]{20}$/.test(e.lei)) problems.push(`${e.brand}: malformed LEI "${e.lei}"`);
    if (!["high", "medium", "low"].includes(e.confidence)) problems.push(`${e.brand}: bad confidence`);
  }
  return problems;
}
