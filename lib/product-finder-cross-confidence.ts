/**
 * Cross-reference confidence banding (#8) — pure. Turns the verified-cross
 * engine's 0-100 confidence + attribute deltas into a banded chip
 * (verified / probable / needs-review) and a short "why sub-100%" summary, so a
 * rep can trust (or scrutinize) a bulk cross at a glance. No I/O.
 */

export type ConfidenceBand = "verified" | "probable" | "needs-review";

/** ≥95 = production-ready (PRODUCTION_CONFIDENCE), ≥80 = probable, else review. */
export function confidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= 95) return "verified";
  if (confidence >= 80) return "probable";
  return "needs-review";
}

export const BAND_META: Record<ConfidenceBand, { label: string; color: string; blurb: string }> = {
  verified: { label: "Verified", color: "#00573F", blurb: "Production-ready documented equivalent (≥95% source confidence)." },
  probable: { label: "Probable", color: "#004986", blurb: "Likely equivalent — confirm the flagged specs before substituting." },
  "needs-review": { label: "Needs review", color: "#DB6B30", blurb: "Below the production threshold — review the spec deltas before use." },
};
