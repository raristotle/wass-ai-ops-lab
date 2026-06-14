import type { CatalogProduct } from "@/features/product-finder/types";
import type { CrossRelation, CrossSourceKind } from "@/lib/catalog/verified-crosses";

/**
 * Substitute-&-save — when a cart/quote line has a cheaper STOCKED verified
 * cross, surface the swap and the money it saves. The candidate crosses are
 * production-grade documented equivalents (≥95% source confidence, resolved
 * from /api/crosses/savings); pricing of both sides is computed by the caller
 * so it stays consistent with the cart (overrides, contract, volume tiers).
 * This module is the pure decision layer: given prices, which swap wins.
 */

export interface CrossCandidate {
  product: CatalogProduct;
  relation: CrossRelation;
  sourceKind: CrossSourceKind;
  sourceUrl: string;
  confidence: number;
  matchReason: string;
}

export interface CrossSaving {
  candidate: CrossCandidate;
  originalUnit: number;
  substituteUnit: number;
  unitSavings: number;
  /** Fraction of the original unit price saved (0..1). */
  pctSavings: number;
  lineSavings: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The best money-saving documented cross for a line, or null if none beats the
 * original by at least `minPct` (default 2% — below that the swap isn't worth
 * the disruption). Among qualifying candidates the largest unit saving wins;
 * ties prefer a documented "equivalent" over a "functional-substitute".
 */
export function bestCrossSaving(
  originalUnit: number,
  qty: number,
  candidates: { candidate: CrossCandidate; substituteUnit: number }[],
  opts?: { minPct?: number }
): CrossSaving | null {
  const minPct = opts?.minPct ?? 0.02;
  let best: CrossSaving | null = null;
  for (const { candidate, substituteUnit } of candidates) {
    if (!(originalUnit > 0) || !(substituteUnit >= 0)) continue;
    const unitSavings = originalUnit - substituteUnit;
    if (unitSavings <= 0) continue;
    const pctSavings = unitSavings / originalUnit;
    if (pctSavings < minPct) continue;
    const saving: CrossSaving = {
      candidate,
      originalUnit: round2(originalUnit),
      substituteUnit: round2(substituteUnit),
      unitSavings: round2(unitSavings),
      pctSavings,
      lineSavings: round2(unitSavings * qty),
    };
    if (best === null) {
      best = saving;
      continue;
    }
    if (saving.unitSavings > best.unitSavings) {
      best = saving;
    } else if (
      saving.unitSavings === best.unitSavings &&
      saving.candidate.relation === "equivalent" &&
      best.candidate.relation !== "equivalent"
    ) {
      best = saving;
    }
  }
  return best;
}

/** Total documented swap savings across a basket (for the cart summary). */
export function totalCrossSavings(savings: (CrossSaving | null)[]): number {
  return round2(savings.reduce((sum, s) => sum + (s?.lineSavings ?? 0), 0));
}
