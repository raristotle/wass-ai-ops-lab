import type { CatalogProduct, ProductCategory } from "@/features/product-finder/types";

/**
 * Rep margin visibility. There is no real cost feed, so distributor unit cost is
 * derived deterministically from list price (category base ratio + per-product
 * jitter). Pure: same product → same cost. INTERNAL — never surface in
 * customer-facing artifacts (printed quote, shared basket, customer CSV).
 */

// Distributor cost as a fraction of list price, by category.
const BASE_COST_RATIO: Record<ProductCategory, number> = {
  electrical: 0.72,
  datacom: 0.68,
  "oem-electrical": 0.70,
  av: 0.75,
  security: 0.73,
  safety: 0.65,
};

function stableHash(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) ^ s.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Deterministic estimated distributor unit cost (clamped 0.50–0.92 of list). */
export function estimatedUnitCost(product: CatalogProduct): number {
  const base = BASE_COST_RATIO[product.category] ?? 0.72;
  const jitter = ((stableHash(product.id) % 13) - 6) / 100; // -0.06 … +0.06
  const ratio = Math.min(0.92, Math.max(0.5, base + jitter));
  return round2(product.unitPrice * ratio);
}

/** Gross margin fraction (0..1) at a given selling price. */
export function marginPct(effectiveUnitPrice: number, cost: number): number {
  if (effectiveUnitPrice <= 0) return 0;
  return (effectiveUnitPrice - cost) / effectiveUnitPrice;
}

/** Dollar margin for a line. */
export function lineMargin(effectiveUnitPrice: number, cost: number, qty: number): number {
  return (effectiveUnitPrice - cost) * qty;
}

export type MarginTier = "low" | "ok" | "good";

/** <15% = low, 15–30% = ok, ≥30% = good. */
export function marginTier(pct: number): MarginTier {
  if (pct < 0.15) return "low";
  if (pct < 0.3) return "ok";
  return "good";
}

export const MARGIN_TIER_COLOR: Record<MarginTier, string> = {
  low: "#DB6B30",
  ok: "#EAAA00",
  good: "#00AA13",
};

export interface BasketMargin {
  revenue: number;
  cost: number;
  marginDollars: number;
  marginPct: number;
}

/** Aggregate margin across basket lines (revenue uses effective price). */
export function basketMargin(
  lines: { product: CatalogProduct; qty: number; effectiveUnitPrice: number }[],
): BasketMargin {
  let revenue = 0;
  let cost = 0;
  for (const l of lines) {
    revenue += l.effectiveUnitPrice * l.qty;
    cost += estimatedUnitCost(l.product) * l.qty;
  }
  const marginDollars = round2(revenue - cost);
  return {
    revenue: round2(revenue),
    cost: round2(cost),
    marginDollars,
    marginPct: revenue > 0 ? marginDollars / revenue : 0,
  };
}
