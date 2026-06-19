/**
 * Compliance & trade enrichment — the attributes that make the recommender
 * bid-grade for spec-driven electrical sales: submittals, AHJ approvals, and
 * government/MRO bids gate on UL listing and RoHS/Prop 65, and 2026 sourcing
 * decisions hinge on country-of-origin + Section 301 tariff exposure.
 *
 * Like the lifecycle and UNSPSC attributes, the values for SYNTHETIC catalog
 * products are derived DETERMINISTICALLY from the product id (a stable hash —
 * NOT the catalog generator's PRNG, so nothing else shifts) and must be labelled
 * as derived demo data wherever shown.
 *
 * CRITICAL CARVE-OUT: real parts (dataSource "verified"/"curated") are NEVER
 * hash-fabricated — `complianceForProduct` returns null for them, exactly as the
 * lifecycle feature keeps real parts out of the hash. Stamping a fake
 * country-of-origin / Section 301 / "Not UL listed" on a named real part would
 * be a false, bid-disqualifying claim. A real UL Product iQ /
 * manufacturer-declaration feed is the planned source for real parts.
 */

import type { ProductCategory, ProductDataSource } from "@/features/product-finder/types";
import { htsEntryForSubcategory, hts10 } from "@/lib/catalog/hts-tariff";

export type RohsStatus = "compliant" | "exempt" | "non-compliant";

export interface Compliance {
  /** UL/NEMA listed (or recognized). */
  ulListed: boolean;
  rohs: RohsStatus;
  /** Contains a REACH SVHC above threshold. */
  reachSvhc: boolean;
  /** A California Prop 65 warning applies. */
  prop65: boolean;
  /** ISO-3166 alpha-2 country of origin. */
  countryOfOrigin: string;
  /** 10-digit HTS classification. */
  htsCode: string;
  /** Tariff-exposed under USTR Section 301 (China-origin on the list). */
  section301: boolean;
}

/** FNV-1a 32-bit — deterministic, independent of the shared PRNG. */
function hash32(s: string, salt: string): number {
  let h = 0x811c9dc5;
  const str = `${salt}:${s}`;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
const pct = (id: string, salt: string) => hash32(id, salt) % 100;

// Country-of-origin distribution (cumulative). Section 301 exposure follows CN.
const ORIGINS: { code: string; upto: number }[] = [
  { code: "US", upto: 34 },
  { code: "MX", upto: 50 },
  { code: "CN", upto: 73 },
  { code: "DE", upto: 82 },
  { code: "CA", upto: 88 },
  { code: "TW", upto: 93 },
  { code: "KR", upto: 97 },
  { code: "IN", upto: 100 },
];

function originFor(id: string): string {
  const p = pct(id, "coo");
  return ORIGINS.find((o) => p < o.upto)?.code ?? "US";
}

// Lead HTS chapter by category (8-digit chapter/heading + a 2-digit stat suffix).
// Used as a FALLBACK when a product's subcategory isn't in the verified HTS table.
const HTS_BY_CATEGORY: Record<ProductCategory, string> = {
  electrical: "85361000",
  "oem-electrical": "85044000",
  datacom: "85176200",
  av: "85285900",
  security: "85258900",
  safety: "65061000",
};

/**
 * The 10-digit HTS code for a product. Prefers the REAL, web-verified
 * per-subcategory code (DI-7, data/real/hts-codes.ts); falls back to the
 * category-level heading + a stable pseudo-suffix when the subcategory is unmapped
 * or unknown.
 */
function htsFor(id: string, category: ProductCategory, subcategory?: string): string {
  if (subcategory) {
    const entry = htsEntryForSubcategory(subcategory);
    if (entry) return hts10(entry.hts);
  }
  const head = HTS_BY_CATEGORY[category];
  const suffix = String(hash32(id, "hts") % 100).padStart(2, "0");
  return `${head}${suffix}`;
}

/**
 * Derived compliance for a SYNTHETIC product, or `null` for real
 * (verified/curated) parts — we never fabricate compliance claims on a named
 * real part; that requires a real manufacturer/UL feed.
 */
export function complianceForProduct(product: {
  id: string;
  category: ProductCategory;
  subcategory?: string;
  dataSource?: ProductDataSource;
}): Compliance | null {
  if (product.dataSource === "verified" || product.dataSource === "curated") return null;
  const { id, category, subcategory } = product;
  const coo = originFor(id);
  // Most electrical gear is UL listed; a realistic minority isn't (imports/commodity).
  const ulListed = pct(id, "ul") < 92;
  const rohsRoll = pct(id, "rohs");
  const rohs: RohsStatus = rohsRoll < 88 ? "compliant" : rohsRoll < 96 ? "exempt" : "non-compliant";
  const reachSvhc = pct(id, "reach") < 6;
  const prop65 = pct(id, "p65") < 9;
  return {
    ulListed,
    rohs,
    reachSvhc,
    prop65,
    countryOfOrigin: coo,
    htsCode: htsFor(id, category, subcategory),
    section301: coo === "CN",
  };
}

/** Concise risk flags for a product (worst first); empty = clean. */
export function complianceFlags(c: Compliance): string[] {
  const flags: string[] = [];
  if (!c.ulListed) flags.push("Not UL listed");
  if (c.rohs === "non-compliant") flags.push("RoHS non-compliant");
  if (c.reachSvhc) flags.push("REACH SVHC");
  if (c.prop65) flags.push("Prop 65");
  if (c.section301) flags.push("Section 301 tariff");
  return flags;
}

export interface BomCompliance {
  lines: number;
  ulListed: number;
  notUlListed: number;
  rohsIssues: number;
  prop65: number;
  tariffExposed: number;
  /** Lines with any compliance flag. */
  flagged: number;
}

export function rollupCompliance(items: Compliance[]): BomCompliance {
  const notUlListed = items.filter((c) => !c.ulListed).length;
  return {
    lines: items.length,
    ulListed: items.length - notUlListed,
    notUlListed,
    rohsIssues: items.filter((c) => c.rohs === "non-compliant").length,
    prop65: items.filter((c) => c.prop65).length,
    tariffExposed: items.filter((c) => c.section301).length,
    flagged: items.filter((c) => complianceFlags(c).length > 0).length,
  };
}
