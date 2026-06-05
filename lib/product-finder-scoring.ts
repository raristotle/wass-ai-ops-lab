import type {
  WescoProduct,
  RecommendationScore,
  RecommendationTier,
  ScoreFactor,
} from "@/features/product-finder/types";
import { getTotalDCStock } from "@/data/mock/wesco-products";

export const SCORE_WEIGHTS = {
  spec: 45,
  branchStock: 25,
  dcStock: 12,
  preferred: 15,
  cheaper: 8,
  subcategory: 7,
} as const;

export function tierForScore(total: number): RecommendationTier {
  if (total >= 85) return "excellent";
  if (total >= 70) return "good";
  return "partial";
}

function branchQtyFor(product: WescoProduct, branchId?: string): number {
  if (!branchId) return 0;
  return product.branchStock.find((s) => s.branchId === branchId)?.quantity ?? 0;
}

export function scoreProduct(
  candidate: WescoProduct,
  reference: WescoProduct,
  userBranchId?: string,
): RecommendationScore {
  const factors: ScoreFactor[] = [];

  // 1. Non-negotiable spec match
  const refNonNeg = reference.specs.filter((s) => s.isNonNeg);
  let specPoints: number;
  if (refNonNeg.length === 0) {
    specPoints = SCORE_WEIGHTS.spec;
    factors.push({ label: "No spec constraints to meet", points: specPoints, positive: true });
  } else {
    const matched = refNonNeg.filter((rs) => {
      const cs = candidate.specs.find((s) => s.name === rs.name);
      return cs?.value === rs.value;
    });
    specPoints = Math.round((matched.length / refNonNeg.length) * SCORE_WEIGHTS.spec);
    factors.push({
      label:
        matched.length === refNonNeg.length
          ? `Matches all ${refNonNeg.length} non-negotiable specs`
          : `Matches ${matched.length} of ${refNonNeg.length} non-negotiable specs`,
      points: specPoints,
      positive: true,
    });
    const missing = refNonNeg.find((rs) => {
      const cs = candidate.specs.find((s) => s.name === rs.name);
      return cs?.value !== rs.value;
    });
    if (missing) {
      factors.push({ label: `Differs on ${missing.name} (needs ${missing.value})`, points: 0, positive: false });
    }
  }

  // 2. Stock (branch beats DC)
  const branchQty = branchQtyFor(candidate, userBranchId);
  const dcQty = getTotalDCStock(candidate);
  let stockPoints = 0;
  if (branchQty > 0) {
    stockPoints = SCORE_WEIGHTS.branchStock;
    factors.push({ label: "In stock at your branch", points: stockPoints, positive: true });
  } else if (dcQty > 0) {
    stockPoints = SCORE_WEIGHTS.dcStock;
    factors.push({ label: "Available from distribution center", points: stockPoints, positive: true });
  } else {
    factors.push({ label: "Not in Wesco stock", points: 0, positive: false });
  }

  // 3. Preferred line
  let preferredPoints = 0;
  if (candidate.preferred) {
    preferredPoints = SCORE_WEIGHTS.preferred;
    factors.push({ label: "Wesco Preferred line", points: preferredPoints, positive: true });
  }

  // 4. Price vs reference
  let pricePoints = 0;
  if (candidate.unitPrice < reference.unitPrice && reference.unitPrice > 0) {
    const pctCheaper = (reference.unitPrice - candidate.unitPrice) / reference.unitPrice;
    pricePoints = Math.min(SCORE_WEIGHTS.cheaper, Math.round(pctCheaper * 20));
    if (pricePoints > 0) {
      factors.push({ label: `${Math.round(pctCheaper * 100)}% cheaper than your reference`, points: pricePoints, positive: true });
    }
  } else if (candidate.unitPrice > reference.unitPrice && reference.unitPrice > 0) {
    const pct = Math.round(((candidate.unitPrice - reference.unitPrice) / reference.unitPrice) * 100);
    factors.push({ label: `${pct}% more expensive than your reference`, points: 0, positive: false });
  }

  // 5. Same subcategory
  let subPoints = 0;
  if (candidate.subcategory === reference.subcategory) {
    subPoints = SCORE_WEIGHTS.subcategory;
    factors.push({ label: "Same product subcategory", points: subPoints, positive: true });
  }

  const total = Math.max(
    0,
    Math.min(100, specPoints + stockPoints + preferredPoints + pricePoints + subPoints),
  );

  factors.sort((a, b) => {
    if (a.positive !== b.positive) return a.positive ? -1 : 1;
    return b.points - a.points;
  });

  return { total, tier: tierForScore(total), factors };
}

export function topReasons(score: RecommendationScore, n = 2): ScoreFactor[] {
  return score.factors.filter((f) => f.positive && f.points > 0).slice(0, n);
}
