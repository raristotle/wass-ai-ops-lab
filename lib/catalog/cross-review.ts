/**
 * Cross-reference review queue — the human-in-the-loop layer over the
 * sub-production tier. Crosses below 95% source confidence (distributor cross
 * tables, industry charts) never reach recommendations automatically; a
 * reviewer can approve or reject them here. Decisions are recorded per pair;
 * an approval marks the pair production-eligible (the promotion seam).
 * Pure helpers; persistence is the caller's concern.
 */

export const PRODUCTION_CONFIDENCE = 95;

export type ReviewDecision = "approved" | "rejected";

export interface ReviewablePair {
  aBrand: string;
  aMpn: string;
  bBrand: string;
  bMpn: string;
  sourceUrl: string;
  confidence: number;
}

/** Stable per-pair key (brand+mpn both sides + source) for decision storage. */
export function reviewKey(p: { aBrand: string; aMpn: string; bBrand: string; bMpn: string; sourceUrl: string }): string {
  return `${p.aBrand}|${p.aMpn}↔${p.bBrand}|${p.bMpn}@${p.sourceUrl}`;
}

/** A pair is in the review tier when its source confidence is below production. */
export function isReviewTier(confidence: number): boolean {
  return confidence < PRODUCTION_CONFIDENCE;
}

export interface ReviewCounts {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

/** Tally review-tier pairs by their recorded decision. */
export function reviewCounts(
  pairs: readonly ReviewablePair[],
  decisions: Record<string, ReviewDecision>
): ReviewCounts {
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  for (const p of pairs) {
    if (!isReviewTier(p.confidence)) continue;
    const d = decisions[reviewKey(p)];
    if (d === "approved") approved += 1;
    else if (d === "rejected") rejected += 1;
    else pending += 1;
  }
  return { pending, approved, rejected, total: pending + approved + rejected };
}
