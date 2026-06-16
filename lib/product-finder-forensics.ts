/**
 * Deal forensics (#15) — pure analytics over saved quotes that upgrade the
 * win/loss card into forensics: a LOST-REASON taxonomy/breakdown and win/loss by
 * an arbitrary COHORT (e.g. customer). Complements product-finder-winloss.ts
 * (which slices win-rate by margin band). No I/O — fully unit-tested.
 */

import type { SavedQuote } from "@/lib/product-finder-quotes";

export type LostReason =
  | "price"
  | "lead-time"
  | "competitor"
  | "spec-mismatch"
  | "no-decision"
  | "relationship"
  | "other";

export const LOST_REASONS: { value: LostReason; label: string }[] = [
  { value: "price", label: "Price / too expensive" },
  { value: "lead-time", label: "Lead time / availability" },
  { value: "competitor", label: "Lost to competitor" },
  { value: "spec-mismatch", label: "Spec / product mismatch" },
  { value: "no-decision", label: "No decision / stalled" },
  { value: "relationship", label: "Incumbent / relationship" },
  { value: "other", label: "Other" },
];

const LABEL = new Map<string, string>(LOST_REASONS.map((r) => [r.value, r.label]));
const ORDER: LostReason[] = LOST_REASONS.map((r) => r.value);

export interface LostReasonStat {
  reason: LostReason;
  label: string;
  count: number;
  /** Share of lost quotes (0..1). */
  pct: number;
}

/**
 * Breakdown of LOST quotes by captured reason, descending. Lost quotes without a
 * captured reason fall into "other", so the breakdown always sums to the lost
 * total. Empty when there are no lost quotes.
 */
export function lostReasonBreakdown(quotes: SavedQuote[]): LostReasonStat[] {
  const lost = quotes.filter((q) => q.status === "lost");
  if (lost.length === 0) return [];
  const counts = new Map<string, number>();
  for (const q of lost) {
    const r = q.lostReason && LABEL.has(q.lostReason) ? q.lostReason : "other";
    counts.set(r, (counts.get(r) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([reason, count]) => ({ reason: reason as LostReason, label: LABEL.get(reason) ?? "Other", count, pct: count / lost.length }))
    .sort((a, b) => b.count - a.count || ORDER.indexOf(a.reason) - ORDER.indexOf(b.reason));
}

export interface CohortStat {
  cohort: string;
  won: number;
  lost: number;
  decided: number;
  /** won / decided (0..1). */
  winRate: number;
}

/**
 * Win/loss by an arbitrary cohort key (only decided quotes). Cohorts with fewer
 * than `minDecided` decided quotes are dropped (too small to read into). Sorted
 * by win-rate desc, then sample size — so the head is "where we win" and the tail
 * is "where we lose".
 */
export function cohortWinLoss(quotes: SavedQuote[], keyOf: (q: SavedQuote) => string, minDecided = 2): CohortStat[] {
  const m = new Map<string, { won: number; lost: number }>();
  for (const q of quotes) {
    if (q.status !== "won" && q.status !== "lost") continue;
    const key = keyOf(q) || "—";
    const e = m.get(key) ?? { won: 0, lost: 0 };
    if (q.status === "won") e.won += 1;
    else e.lost += 1;
    m.set(key, e);
  }
  return [...m.entries()]
    .map(([cohort, v]) => ({ cohort, won: v.won, lost: v.lost, decided: v.won + v.lost, winRate: v.won / (v.won + v.lost) }))
    .filter((c) => c.decided >= minDecided)
    .sort((a, b) => b.winRate - a.winRate || b.decided - a.decided || a.cohort.localeCompare(b.cohort));
}

/** Convenience: win/loss cohorts by customer name. */
export function winLossByCustomer(quotes: SavedQuote[], minDecided = 2): CohortStat[] {
  return cohortWinLoss(quotes, (q) => q.customer, minDecided);
}
