import type { CatalogProduct } from "@/features/product-finder/types";
import { estimatedUnitCost } from "@/lib/product-finder-margin";

/**
 * Per-line price override guardrails. A rep may discount a cart line, but never
 * below OVERRIDE_MIN_MARGIN over estimated distributor cost, and never above
 * list price. Pure — same product → same bounds.
 */

/** Minimum gross margin a manual override may leave on a line (5%). */
export const OVERRIDE_MIN_MARGIN = 0.05;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface OverrideBounds {
  /** Lowest allowed unit price — cost / (1 − OVERRIDE_MIN_MARGIN). */
  min: number;
  /** Highest allowed unit price — list price. */
  max: number;
}

/**
 * Allowed unit-price range for a manual override on this product.
 * min preserves at least OVERRIDE_MIN_MARGIN of margin; max is list price.
 * (estimatedUnitCost is clamped ≤ 0.92 × list, so min < max always holds.)
 */
export function overrideBounds(product: CatalogProduct): OverrideBounds {
  const cost = estimatedUnitCost(product);
  return {
    min: round2(cost / (1 - OVERRIDE_MIN_MARGIN)),
    max: round2(product.unitPrice),
  };
}

/**
 * Clamp a requested override price into the allowed band, rounded to cents.
 * Non-finite or non-positive requests clamp to the band minimum.
 */
export function clampOverride(product: CatalogProduct, requested: number): number {
  const { min, max } = overrideBounds(product);
  if (!Number.isFinite(requested) || requested <= 0) return min;
  return round2(Math.min(max, Math.max(min, requested)));
}

/** True when a requested price would be changed by clamping (out of band). */
export function isOutOfBounds(product: CatalogProduct, requested: number): boolean {
  if (!Number.isFinite(requested) || requested <= 0) return true;
  const { min, max } = overrideBounds(product);
  return requested < min || requested > max;
}
