import { describe, it, expect } from "vitest";
import { reviewKey, isReviewTier, reviewCounts, type ReviewablePair } from "@/lib/catalog/cross-review";

const pair = (over: Partial<ReviewablePair>): ReviewablePair => ({
  aBrand: "Burndy",
  aMpn: "KS25",
  bBrand: "Ilsco",
  bMpn: "IK-1/0",
  sourceUrl: "https://example.com/x.pdf",
  confidence: 88,
  ...over,
});

describe("cross review helpers", () => {
  it("isReviewTier flags sub-95 confidence only", () => {
    expect(isReviewTier(88)).toBe(true);
    expect(isReviewTier(86)).toBe(true);
    expect(isReviewTier(95)).toBe(false);
    expect(isReviewTier(97)).toBe(false);
  });

  it("reviewKey is stable and distinguishes pairs by side + source", () => {
    expect(reviewKey(pair({}))).toBe(reviewKey(pair({})));
    expect(reviewKey(pair({}))).not.toBe(reviewKey(pair({ bMpn: "C-1/0" })));
    expect(reviewKey(pair({}))).not.toBe(reviewKey(pair({ sourceUrl: "https://other.example/y.pdf" })));
  });

  it("counts only review-tier pairs by decision; production pairs are excluded", () => {
    const pairs = [
      pair({ confidence: 88 }), // pending
      pair({ aMpn: "YA28", confidence: 86 }), // approved
      pair({ aMpn: "SLU-70", confidence: 88 }), // rejected
      pair({ aMpn: "PROD", confidence: 97 }), // not review tier
    ];
    const decisions = {
      [reviewKey(pairs[1])]: "approved" as const,
      [reviewKey(pairs[2])]: "rejected" as const,
    };
    expect(reviewCounts(pairs, decisions)).toEqual({ pending: 1, approved: 1, rejected: 1, total: 3 });
  });
});
