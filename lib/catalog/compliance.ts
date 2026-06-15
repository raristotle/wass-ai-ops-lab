/**
 * Compliance & trade enrichment — the attributes that make the recommender
 * bid-grade for spec-driven electrical sales: submittals, AHJ approvals, and
 * government/MRO bids gate on UL listing and RoHS/Prop 65, and 2026 sourcing
 * decisions hinge on country-of-origin + Section 301 tariff exposure.
 *
 * Like the lifecycle and UNSPSC attributes, these are derived DETERMINISTICALLY
 * from the product id (a stable hash — NOT the catalog generator's PRNG, so
 * nothing else shifts) and labelled honestly as seeded: a real UL Product iQ /
 * manufacturer-declaration feed is the env-gated upgrade. Curated/verified real
 * products can carry explicit values later; absent → derived.
 */

import type { ProductCategory } from "@/features/product-finder/types";

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
const HTS_BY_CATEGORY: Record<ProductCategory, string> = {
  electrical: "85361000",
  "oem-electrical": "85044000",
  datacom: "85176200",
  av: "85285900",
  security: "85258900",
  safety: "65061000",
};

function htsFor(id: string, category: ProductCategory): string {
  const head = HTS_BY_CATEGORY[category];
  const suffix = String(hash32(id, "hts") % 100).padStart(2, "0");
  return `${head}${suffix}`;
}

/** Derived compliance attributes for a product. */
export function complianceForProduct(product: { id: string; category: ProductCategory }): Compliance {
  const { id, category } = product;
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
    htsCode: htsFor(id, category),
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
