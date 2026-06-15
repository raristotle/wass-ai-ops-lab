/**
 * UNSPSC commodity classification. Ariba/Coupa and most e-procurement systems
 * require a validated UNSPSC code before a catalog can go live, and it enriches
 * the cXML PunchOut / EDI 850 line detail the procurement export already emits.
 *
 * Honesty note (matches the app's provenance discipline): codes are assigned at
 * the most specific UNSPSC node we can stand behind — `commodity` (8 significant
 * digits), `class` (…0000 → 6), `family` (…0000 → 4), or `segment` (2) — and the
 * granularity is reported. A licensed UNSPSC feed refines the family/segment
 * fallbacks to commodity level; nothing here is fabricated to look more precise
 * than it is. Codes are always a valid 8-character UNSPSC string.
 */

import type { CatalogProduct, ProductCategory } from "@/features/product-finder/types";

export type UnspscLevel = "commodity" | "class" | "family" | "segment";

export interface UnspscClassification {
  /** 8-digit UNSPSC code (trailing pairs are 00 below the asserted level). */
  code: string;
  title: string;
  level: UnspscLevel;
  /** Whether the code came from the subcategory map or the category fallback. */
  matched: "subcategory" | "category";
}

// Subcategory → confident UNSPSC node. Only entries we can stand behind appear
// here; everything else degrades to the category fallback below.
const BY_SUBCATEGORY: Record<string, Omit<UnspscClassification, "matched">> = {
  "Circuit Breakers": { code: "39121610", title: "Circuit breakers", level: "commodity" },
  "Wire & Cable": { code: "26120000", title: "Wire and cable and harness", level: "family" },
  Fuses: { code: "39120000", title: "Electrical equipment and components and supplies", level: "family" },
  "Load Centers": { code: "39120000", title: "Electrical equipment and components and supplies", level: "family" },
  Panelboards: { code: "39120000", title: "Electrical equipment and components and supplies", level: "family" },
  "Safety Switches & Disconnects": { code: "39120000", title: "Electrical equipment and components and supplies", level: "family" },
  "Surge Protective Devices": { code: "39120000", title: "Electrical equipment and components and supplies", level: "family" },
  "Meter Sockets": { code: "39120000", title: "Electrical equipment and components and supplies", level: "family" },
  "Dry-Type Transformers": { code: "26111700", title: "Transformers", level: "class" },
  "Generators & Transfer Switches": { code: "26111600", title: "Power generation", level: "class" },
  Conduit: { code: "39131600", title: "Conduit", level: "class" },
  "Conduit Fittings": { code: "39131700", title: "Electrical boxes and enclosures and fittings", level: "class" },
  "Wiring Devices": { code: "39121300", title: "Electrical wiring devices", level: "class" },
  "Receptacles & Outlets": { code: "39121300", title: "Electrical wiring devices", level: "class" },
  Switches: { code: "39121300", title: "Electrical wiring devices", level: "class" },
  "Wall Plates & Covers": { code: "39121300", title: "Electrical wiring devices", level: "class" },
  "Cord Plugs & Connectors": { code: "39121300", title: "Electrical wiring devices", level: "class" },
  "Combination Devices": { code: "39121300", title: "Electrical wiring devices", level: "class" },
  "Lighting Accessories": { code: "39110000", title: "Lighting and fixtures and accessories", level: "family" },
};

const BY_CATEGORY: Record<ProductCategory, Omit<UnspscClassification, "matched">> = {
  electrical: { code: "39120000", title: "Electrical equipment and components and supplies", level: "family" },
  "oem-electrical": { code: "26000000", title: "Power generation and distribution machinery and accessories", level: "segment" },
  datacom: { code: "43000000", title: "Information technology broadcasting and telecommunications", level: "segment" },
  av: { code: "45000000", title: "Printing and photographic and audio and visual equipment and supplies", level: "segment" },
  security: { code: "46000000", title: "Defense and law enforcement and security and safety equipment and supplies", level: "segment" },
  safety: { code: "46180000", title: "Personal safety and protection", level: "family" },
};

/** Classify one product. Subcategory match wins; otherwise the category fallback. */
export function unspscFor(product: Pick<CatalogProduct, "category" | "subcategory">): UnspscClassification {
  const sub = BY_SUBCATEGORY[product.subcategory];
  if (sub) return { ...sub, matched: "subcategory" };
  return { ...BY_CATEGORY[product.category], matched: "category" };
}

/** Just the 8-digit code (for line-item emitters). */
export function unspscCode(product: Pick<CatalogProduct, "category" | "subcategory">): string {
  return unspscFor(product).code;
}

/** True for a valid 8-digit UNSPSC code string. */
export function isValidUnspsc(code: string): boolean {
  return /^\d{8}$/.test(code);
}
