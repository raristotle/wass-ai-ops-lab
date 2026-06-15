/**
 * BOM Health Score — grade every line of a basket/BOM A/B/C on the dimensions
 * a distributor's BOM platform actually flags (Octopart weekly health review,
 * Arrow A/B/C grading, Z2Data BOM Risk Score): lifecycle, stock depth,
 * single-source risk, and substitute availability. Composes the Wave-1 engines
 * (lifecycle status, second-source coverage, active-successor lookup) into a
 * durable, re-openable "fix these N lines" worklist that drives substitution.
 *
 * This module is the pure grading + rollup logic (inputs injected); the server
 * route computes the inputs from the catalog and the UI renders the worklist.
 */

import type { LifecycleStatus } from "@/lib/catalog/lifecycle";
import { LIFECYCLE_META, isObsolescent } from "@/lib/catalog/lifecycle";

export type HealthGrade = "A" | "B" | "C";

export interface LineHealthInput {
  lifecycleStatus?: LifecycleStatus;
  /** Total stocked quantity (branch + DC) available now. */
  stockQty: number;
  /** Quantity the line needs. */
  qty: number;
  /** 1 (single-source) … 5 (broadly sourced) from the coverage engine. */
  sourcingScore: number;
  /** An active replacement we stock exists (for an obsolescent part). */
  hasActiveSuccessor: boolean;
  /** A cheaper documented stocked cross exists — its % savings, if any. */
  cheaperCrossSavingPct?: number;
}

export interface LineHealth {
  grade: HealthGrade;
  /** 0–100 composite. */
  score: number;
  /** Short risk flags, worst first. */
  flags: string[];
  /** The single recommended fix, when one applies. */
  action?: string;
}

export function gradeLine(input: LineHealthInput): LineHealth {
  let score = 100;
  const flags: string[] = [];
  let action: string | undefined;

  // Lifecycle
  if (isObsolescent(input.lifecycleStatus)) {
    const sev = LIFECYCLE_META[input.lifecycleStatus!].severity; // 1..4
    score -= sev >= 3 ? 40 : 20;
    flags.push(LIFECYCLE_META[input.lifecycleStatus!].short);
    if (input.hasActiveSuccessor) action = "Swap to the active successor we stock";
  }

  // Stock depth vs need
  if (input.stockQty <= 0) {
    score -= 25;
    flags.push("Out of stock");
  } else if (input.stockQty < input.qty) {
    score -= 15;
    flags.push("Short stock");
  } else if (input.stockQty < input.qty * 2) {
    score -= 8;
    flags.push("Thin stock");
  }

  // Single-source risk
  if (input.sourcingScore <= 1) {
    score -= 25;
    flags.push("Single-source");
    action ??= "Qualify a second source";
  } else if (input.sourcingScore === 2) {
    score -= 8;
    flags.push("Dual-source");
  }

  // Savings opportunity (not a risk, but a worklist action)
  if (input.cheaperCrossSavingPct && input.cheaperCrossSavingPct >= 3) {
    action ??= `Cheaper documented cross saves ${Math.round(input.cheaperCrossSavingPct)}%`;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const grade: HealthGrade = score >= 80 ? "A" : score >= 55 ? "B" : "C";
  return { grade, score, flags, ...(action ? { action } : {}) };
}

export interface BomHealth {
  lines: number;
  a: number;
  b: number;
  c: number;
  /** Lines worth a reviewer's attention (grade B or C). */
  needsAttention: number;
  worstGrade: HealthGrade;
  avgScore: number;
}

export function rollupHealth(grades: LineHealth[]): BomHealth {
  if (grades.length === 0) {
    return { lines: 0, a: 0, b: 0, c: 0, needsAttention: 0, worstGrade: "A", avgScore: 0 };
  }
  const a = grades.filter((g) => g.grade === "A").length;
  const b = grades.filter((g) => g.grade === "B").length;
  const c = grades.filter((g) => g.grade === "C").length;
  const worstGrade: HealthGrade = c > 0 ? "C" : b > 0 ? "B" : "A";
  const avgScore = Math.round(grades.reduce((s, g) => s + g.score, 0) / grades.length);
  return { lines: grades.length, a, b, c, needsAttention: b + c, worstGrade, avgScore };
}
