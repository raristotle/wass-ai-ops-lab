/**
 * Lighting utility-rebate estimator (v4-S2 #6).
 *
 * Commercial LED lighting qualifies for utility energy-efficiency rebates, but
 * there is NO free, national, programmatic feed of rebate DOLLAR amounts — DLC /
 * ENERGY STAR tell you a product is rebate-ELIGIBLE, while the actual dollars live
 * in each utility's prescriptive worksheet. So the honest $0 default is a
 * DETERMINISTIC estimator: it maps (fixture category, controls) → an estimated
 * per-fixture rebate RANGE, grounded in published 2025-2026 program structures
 * (PG&E, Xcel, Energize CT, etc.), and is always presented as an estimate that
 * the local utility's worksheet confirms. DLC listing is the gating eligibility
 * condition. No external call, no key — pure data + math.
 *
 * A dormant DLC/ENERGY STAR live-lookup seam (to confirm certification + auto-fill
 * watts/lumens) is the documented activation path; this module stays $0.
 */

import type { CatalogProduct } from "@/features/product-finder/types";

/** Reviewed against published utility programs as of this date — re-check yearly. */
export const REBATE_TABLE_REVIEWED = "2026-06";

export const REBATE_DISCLAIMER =
  "Estimate only — the actual rebate is set by your local utility's prescriptive worksheet, " +
  "and the product must be DLC-listed (or ENERGY STAR for residential) to qualify. " +
  `Figures are illustrative ranges reviewed ${REBATE_TABLE_REVIEWED}.`;

export interface RebateProgram {
  /** Catalog subcategory this program covers (taxonomy name). */
  subcategory: string;
  /** Most commercial programs require a DLC listing for fixtures. */
  dlcEligible: boolean;
  /** Estimated base rebate range per unit, in USD. */
  perUnitLow: number;
  perUnitHigh: number;
  /** "fixture" or "lamp" — the unit the rebate is paid per. */
  unit: "fixture" | "lamp";
  /** Controls (occupancy/daylight/level-lowering) roughly multiply the base. */
  controlsMultiplier: number;
  /** Short grounding note (a real program the band is drawn from). */
  note: string;
}

/**
 * Static estimator table. Bands drawn from cited 2025-2026 programs:
 * troffers/panels ~$25-50; high-bay ~$75-150 (PG&E up to ~$250 for big MH swaps);
 * downlights ~$8-30; strip/wrap ~$15-40; TLED tubes ~$2-10/lamp; exterior/area
 * escalating with wattage. Controls stack ~1.5-3x (Energize CT $25 → $65-90).
 */
export const REBATE_REGISTRY: readonly RebateProgram[] = [
  { subcategory: "LED Troffers & Panels", dlcEligible: true, perUnitLow: 25, perUnitHigh: 50, unit: "fixture", controlsMultiplier: 2.5, note: "Energize CT 2x4 troffer: $25 base → $65-90 with controls" },
  { subcategory: "High Bay Fixtures", dlcEligible: true, perUnitLow: 75, perUnitHigh: 150, unit: "fixture", controlsMultiplier: 2.0, note: "PG&E high-bay MH→LED prescriptive (up to ~$250 for 750W swaps)" },
  { subcategory: "Strip & Wrap Fixtures", dlcEligible: true, perUnitLow: 15, perUnitHigh: 40, unit: "fixture", controlsMultiplier: 2.0, note: "Linear strip/wrap fluorescent→LED prescriptive band" },
  { subcategory: "LED Downlights", dlcEligible: true, perUnitLow: 8, perUnitHigh: 30, unit: "fixture", controlsMultiplier: 2.0, note: "Recessed downlight retrofit prescriptive band" },
  { subcategory: "Lamps & Tubes", dlcEligible: true, perUnitLow: 2, perUnitHigh: 10, unit: "lamp", controlsMultiplier: 1.0, note: "TLED tube/lamp prescriptive ($/lamp); DLC TLED listing required" },
  { subcategory: "Outdoor & Area Lighting", dlcEligible: true, perUnitLow: 25, perUnitHigh: 100, unit: "fixture", controlsMultiplier: 1.5, note: "Wall-pack / area / flood, escalating with wattage; photocell common" },
];

const REGISTRY_BY_SUBCAT: Map<string, RebateProgram> = new Map(
  REBATE_REGISTRY.map((p) => [p.subcategory, p]),
);

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface RebateEstimate {
  subcategory: string;
  dlcEligible: boolean;
  unit: "fixture" | "lamp";
  /** Base per-unit rebate range (no controls). */
  perUnitLow: number;
  perUnitHigh: number;
  /** Per-unit range WITH a qualifying control (occupancy/daylight). */
  withControlsLow: number;
  withControlsHigh: number;
  /** True when the product's specs indicate a qualifying control is present. */
  controlsDetected: boolean;
  note: string;
  disclaimer: string;
}

/** A product carries a qualifying control if its specs say so (motion/photocell/0-10V dimming). */
function detectControls(product: CatalogProduct): boolean {
  return product.specs.some((s) => {
    const v = `${s.name} ${s.value}`.toLowerCase();
    return (
      v.includes("motion") ||
      v.includes("occupancy") ||
      v.includes("photocell") ||
      v.includes("daylight") ||
      v.includes("0-10v")
    );
  });
}

/**
 * Estimate the utility rebate for a single lighting product, or null when the
 * product's subcategory isn't a rebate-bearing lighting category.
 */
export function estimateRebate(product: CatalogProduct): RebateEstimate | null {
  const program = REGISTRY_BY_SUBCAT.get(product.subcategory);
  if (!program) return null;
  const controlsDetected = detectControls(product);
  return {
    subcategory: program.subcategory,
    dlcEligible: program.dlcEligible,
    unit: program.unit,
    perUnitLow: program.perUnitLow,
    perUnitHigh: program.perUnitHigh,
    withControlsLow: round2(program.perUnitLow * program.controlsMultiplier),
    withControlsHigh: round2(program.perUnitHigh * program.controlsMultiplier),
    controlsDetected,
    note: program.note,
    disclaimer: REBATE_DISCLAIMER,
  };
}

/** True when a product is in a rebate-bearing lighting category. */
export function isRebateEligibleProduct(product: CatalogProduct): boolean {
  return REGISTRY_BY_SUBCAT.has(product.subcategory);
}

export interface RebateTotal {
  low: number;
  high: number;
  unit: "fixture" | "lamp";
  qty: number;
  withControls: boolean;
}

/**
 * Total estimated rebate for a quantity. `withControls` uses the controls-uplift
 * band; otherwise the base band.
 */
export function rebateForQuantity(estimate: RebateEstimate, qty: number, withControls: boolean): RebateTotal {
  const n = Math.max(0, Math.floor(qty));
  const low = withControls ? estimate.withControlsLow : estimate.perUnitLow;
  const high = withControls ? estimate.withControlsHigh : estimate.perUnitHigh;
  return { low: round2(low * n), high: round2(high * n), unit: estimate.unit, qty: n, withControls };
}
