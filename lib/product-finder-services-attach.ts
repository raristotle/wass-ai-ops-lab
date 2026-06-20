/**
 * Services Attach to Cart (v5-S2 #8) — $0, deterministic rules engine.
 *
 * Wesco's most differentiated, highest-margin, stickiest cross-sell isn't another
 * SKU — it's a SERVICE: kitting, pre-labeling, cut-to-length, VMI/bin-stock,
 * project staging, jobsite delivery. The trick is to offer the RIGHT service
 * triggered by the shape of what's in the cart, so the rep attaches it at the
 * decision moment instead of never.
 *
 * Pure: derive a cart "shape" from the lines, then run deterministic trigger rules.
 * The cart drawer renders the offers; nothing here is a model or a network call.
 */

import type { CatalogProduct } from "@/features/product-finder/types";

export type ServiceCategory = "kitting" | "labeling" | "cut-to-length" | "vmi" | "staging" | "logistics";

export interface ServiceOffer {
  id: string;
  category: ServiceCategory;
  name: string;
  blurb: string;
  /** Why this cart triggered the offer — shown to the rep. */
  trigger: string;
}

/** The signals the rules read. Derived once from the cart lines. */
export interface CartShape {
  lineCount: number;
  unitCount: number;
  totalValue: number;
  subcategories: Set<string>;
  /** Distinct product families — a proxy for "multi-trade / needs kitting". */
  familyCount: number;
  /** Lines sold by the foot (wire/conduit) → cut-to-length candidates. */
  cutToLengthLines: number;
  /** Low-cost consumable lines (fittings, lugs, fasteners, connectors) → VMI candidates. */
  consumableLines: number;
  /** Cart contains a panelboard / load center / breakers → panel labeling. */
  hasDistributionGear: boolean;
}

const CONSUMABLE_SUBCATS = [
  "Conduit Fittings",
  "Lugs & Wire Connectors",
  "Grounding & Bonding",
  "Boxes & Covers",
  "Strut & Channel",
  "Connectivity",
];
const DISTRIBUTION_SUBCATS = ["Panelboards", "Load Centers", "Circuit Breakers", "Safety Switches & Disconnects"];

// Cut-to-length applies to BULK goods sold by the foot — keyed off the unit of
// measure, NOT the subcategory name (which would wrongly catch "Conduit Fittings"
// and "Lugs & Wire Connectors"). FT / MFT (thousand-ft) / C (per-hundred-ft).
const FOOT_UOMS = new Set(["FT", "MFT", "C", "CFT"]);
function isSoldByFoot(p: CatalogProduct): boolean {
  return FOOT_UOMS.has(p.uom.toUpperCase());
}

/** Reduce cart lines to the shape the rules read. */
export function deriveCartShape(lines: { product: CatalogProduct; qty: number }[]): CartShape {
  const subcategories = new Set<string>();
  let unitCount = 0;
  let totalValue = 0;
  let cutToLengthLines = 0;
  let consumableLines = 0;
  let hasDistributionGear = false;

  for (const { product, qty } of lines) {
    subcategories.add(product.subcategory);
    unitCount += qty;
    totalValue += product.unitPrice * qty;
    if (isSoldByFoot(product)) cutToLengthLines += 1;
    if (CONSUMABLE_SUBCATS.includes(product.subcategory)) consumableLines += 1;
    if (DISTRIBUTION_SUBCATS.includes(product.subcategory)) hasDistributionGear = true;
  }

  return {
    lineCount: lines.length,
    unitCount,
    totalValue,
    subcategories,
    familyCount: subcategories.size,
    cutToLengthLines,
    consumableLines,
    hasDistributionGear,
  };
}

/**
 * The services to attach for a given cart shape, most-relevant first. Each rule is
 * conservative — it only fires when the cart clearly benefits, so the rep isn't
 * spammed.
 */
export function servicesForCart(shape: CartShape): ServiceOffer[] {
  const offers: ServiceOffer[] = [];

  // Cut-to-length: any sold-by-the-foot line.
  if (shape.cutToLengthLines > 0) {
    offers.push({
      id: "cut-to-length",
      category: "cut-to-length",
      name: "Cut-to-length wire & cable",
      blurb: "We cut and coil to your pull lengths — no field waste, no return drums.",
      trigger: `${shape.cutToLengthLines} sold-by-the-foot line${shape.cutToLengthLines === 1 ? "" : "s"} in the cart`,
    });
  }

  // Kitting: a multi-family BOM with enough lines to be worth bagging per drop.
  if (shape.familyCount >= 4 && shape.lineCount >= 6) {
    offers.push({
      id: "kitting",
      category: "kitting",
      name: "Kitting & bagging",
      blurb: "We bag this BOM by drop / phase so the crew grabs one kit, not 20 SKUs.",
      trigger: `${shape.lineCount} lines across ${shape.familyCount} families`,
    });
  }

  // Panel labeling / schedules: distribution gear present.
  if (shape.hasDistributionGear) {
    offers.push({
      id: "labeling",
      category: "labeling",
      name: "Panel labeling & schedules",
      blurb: "Pre-printed panel directories and breaker labels, applied before it ships.",
      trigger: "Distribution gear (panel / breakers) in the cart",
    });
  }

  // VMI: several consumable lines → bin-stock candidate.
  if (shape.consumableLines >= 3) {
    offers.push({
      id: "vmi",
      category: "vmi",
      name: "VMI / bin stock",
      blurb: "We own the min/max on these consumables and replenish your bins automatically.",
      trigger: `${shape.consumableLines} consumable lines — a bin-stock fit`,
    });
  }

  // Project staging: a large order benefits from phased / staged delivery.
  if (shape.totalValue >= 10_000) {
    offers.push({
      id: "staging",
      category: "staging",
      name: "Project staging & phased delivery",
      blurb: "We hold and release the order on your schedule — staged to the jobsite by phase.",
      trigger: `Order value over $10k ($${Math.round(shape.totalValue).toLocaleString()})`,
    });
  }

  // Jobsite delivery is always available once there's anything to deliver.
  if (shape.lineCount > 0) {
    offers.push({
      id: "logistics",
      category: "logistics",
      name: "Jobsite delivery / will-call",
      blurb: "Direct-to-jobsite or staged for will-call pickup — your call at checkout.",
      trigger: "Available on any order",
    });
  }

  return offers;
}
