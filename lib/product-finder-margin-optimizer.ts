import type { CatalogProduct } from "@/features/product-finder/types";
import type { CrossRelation } from "@/lib/catalog/verified-crosses";
import {
  estimatedUnitCost,
  marginPct,
  marginTier,
  basketMargin,
  type MarginTier,
  type BasketMargin,
} from "@/lib/product-finder-margin";

/**
 * Whole-basket margin optimizer (#14). Turns the per-line margin display + the
 * substitute-&-save crosses into a single pass: flag low-margin lines, and for
 * each, find the best spec-equivalent stocked cross that LIFTS the line's margin
 * — showing the margin gained AND the customer price delta so the rep can judge
 * the trade. Reuses the deterministic cost model (estimatedUnitCost); the
 * candidate equivalents + their cart-consistent prices are injected by the caller
 * (same crosses the substitute-&-save panel already fetches), so this stays pure.
 */

export interface OptimizerCandidate {
  product: CatalogProduct;
  /** The candidate's effective unit price, computed cart-consistently by the caller. */
  effectiveUnitPrice: number;
  relation: CrossRelation;
}

export interface OptimizerLineInput {
  product: CatalogProduct;
  qty: number;
  effectiveUnitPrice: number;
  candidates: OptimizerCandidate[];
}

export interface MarginSwap {
  to: CatalogProduct;
  toUnitPrice: number;
  newMarginPct: number;
  /** New margin minus current margin, as a fraction (×100 = percentage points). */
  marginLiftPct: number;
  /** Dollar margin gained over the whole line at qty. */
  lineMarginGain: number;
  /** Customer unit-price change (+ = the customer pays more for the higher margin). */
  customerPriceDeltaUnit: number;
  relation: CrossRelation;
}

export interface OptimizedLine {
  product: CatalogProduct;
  qty: number;
  currentMarginPct: number;
  tier: MarginTier;
  /** Current margin is below the attention floor. */
  flagged: boolean;
  bestSwap: MarginSwap | null;
}

export interface MarginOptimization {
  lines: OptimizedLine[];
  current: BasketMargin;
  /** Basket margin if every suggested swap were applied. */
  optimized: BasketMargin;
  totalMarginGain: number;
  flaggedCount: number;
  swapCount: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const EPS = 1e-6;

/**
 * Whether swap `a` is a better pick than `b`. Primary key is margin DOLLARS at qty
 * (the figure the panel headlines), so a higher-% but much cheaper equivalent that
 * nets fewer dollars never wins. Float-safe ties fall through to higher margin %,
 * then a smaller customer price increase, then a documented equivalent.
 */
function beatsForMargin(a: MarginSwap, b: MarginSwap): boolean {
  if (a.lineMarginGain > b.lineMarginGain + EPS) return true;
  if (a.lineMarginGain < b.lineMarginGain - EPS) return false;
  if (a.newMarginPct > b.newMarginPct + EPS) return true;
  if (a.newMarginPct < b.newMarginPct - EPS) return false;
  if (a.customerPriceDeltaUnit < b.customerPriceDeltaUnit - EPS) return true;
  if (a.customerPriceDeltaUnit > b.customerPriceDeltaUnit + EPS) return false;
  return a.relation === "equivalent" && b.relation !== "equivalent";
}

/**
 * Analyze a basket for margin. `minLiftPct` is the minimum margin improvement (in
 * fraction, default 0.02 = 2 pts) for a swap to be worth suggesting; `floorPct`
 * flags lines whose margin is below it (default 0.15 = the "low" tier). Pure.
 */
export function optimizeMargin(
  lines: OptimizerLineInput[],
  opts?: { minLiftPct?: number; floorPct?: number },
): MarginOptimization {
  const minLift = opts?.minLiftPct ?? 0.02;
  const floor = opts?.floorPct ?? 0.15;

  const out: OptimizedLine[] = lines.map((line) => {
    const cost = estimatedUnitCost(line.product);
    const curMargin = marginPct(line.effectiveUnitPrice, cost);
    let best: MarginSwap | null = null;
    for (const c of line.candidates) {
      if (c.product.id === line.product.id) continue;
      const cCost = estimatedUnitCost(c.product);
      const cMargin = marginPct(c.effectiveUnitPrice, cCost);
      const lift = cMargin - curMargin;
      if (lift < minLift) continue;
      const swap: MarginSwap = {
        to: c.product,
        toUnitPrice: round2(c.effectiveUnitPrice),
        newMarginPct: cMargin,
        marginLiftPct: lift,
        lineMarginGain: round2((c.effectiveUnitPrice - cCost - (line.effectiveUnitPrice - cost)) * line.qty),
        customerPriceDeltaUnit: round2(c.effectiveUnitPrice - line.effectiveUnitPrice),
        relation: c.relation,
      };
      // Only suggest swaps that genuinely ADD margin dollars at qty.
      if (swap.lineMarginGain <= 0) continue;
      if (!best || beatsForMargin(swap, best)) best = swap;
    }
    return {
      product: line.product,
      qty: line.qty,
      currentMarginPct: curMargin,
      tier: marginTier(curMargin),
      flagged: curMargin < floor,
      bestSwap: best,
    };
  });

  const current = basketMargin(
    lines.map((l) => ({ product: l.product, qty: l.qty, effectiveUnitPrice: l.effectiveUnitPrice })),
  );
  const optimized = basketMargin(
    out.map((l, i) =>
      l.bestSwap
        ? { product: l.bestSwap.to, qty: l.qty, effectiveUnitPrice: l.bestSwap.toUnitPrice }
        : { product: l.product, qty: l.qty, effectiveUnitPrice: lines[i].effectiveUnitPrice },
    ),
  );

  return {
    lines: out,
    current,
    optimized,
    totalMarginGain: round2(optimized.marginDollars - current.marginDollars),
    flaggedCount: out.filter((l) => l.flagged).length,
    swapCount: out.filter((l) => l.bestSwap).length,
  };
}
