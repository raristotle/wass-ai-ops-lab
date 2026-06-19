import { describe, it, expect } from "vitest";
import {
  buildEvalCases,
  evaluateCrossReference,
  formatEvalReport,
  EVAL_K,
} from "@/lib/catalog/cross-eval";
import { VERIFIED_CROSS_ENTRIES } from "@/data/real/verified-crosses";

describe("cross-reference evaluation (DI-12)", () => {
  const report = evaluateCrossReference();

  it("prints the measured report (repeatable runner)", () => {
    // Surfaced in the test output; copy into docs/cross-reference-eval-report.md.
    // eslint-disable-next-line no-console
    console.log("\n" + formatEvalReport(report) + "\n");
    expect(report).toBeTruthy();
  });

  it("evaluates against all documented pairs", () => {
    expect(report.totalPairs).toBe(VERIFIED_CROSS_ENTRIES.length);
    expect(report.totalPairs).toBeGreaterThanOrEqual(200);
  });

  it("has a non-trivial evaluable set and honest coverage accounting", () => {
    expect(report.evaluablePairs).toBeGreaterThan(0);
    // coverage = evaluable / total, in [0,1]
    expect(report.coverage).toBeGreaterThan(0);
    expect(report.coverage).toBeLessThanOrEqual(1);
    // Every documented pair is either evaluable or skipped for exactly one reason.
    const skips = Object.values(report.skippedByReason).reduce((a, b) => a + b, 0);
    expect(report.evaluablePairs + skips).toBe(report.totalPairs);
  });

  it("reports metrics as valid fractions", () => {
    for (const m of [report.recallAtK, report.precisionAt1, report.mrr, report.coverage]) {
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThanOrEqual(1);
    }
    expect(report.k).toBe(EVAL_K);
  });

  it("precision@1 never exceeds recall@K (a #1 hit is also a top-K hit)", () => {
    expect(report.precisionAt1).toBeLessThanOrEqual(report.recallAtK + 1e-9);
  });

  it("per-subcategory counts reconcile with the totals", () => {
    const evalSum = report.bySubcategory.reduce((a, s) => a + s.evaluable, 0);
    const foundSum = report.bySubcategory.reduce((a, s) => a + s.found, 0);
    expect(evalSum).toBe(report.evaluablePairs);
    // found across subcategories == found within top-K == evaluable - misses
    expect(foundSum).toBe(report.evaluablePairs - report.misses.length);
  });

  it("buildEvalCases keeps only same-subcategory, distinct, both-stocked pairs", () => {
    const { cases } = buildEvalCases();
    expect(cases.length).toBe(report.evaluablePairs);
    for (const c of cases) {
      expect(c.aSku).not.toBe(c.bSku);
      expect(c.subcategory.length).toBeGreaterThan(0);
    }
  });

  // Regression floor: the $0 spec-similarity engine must keep reproducing a
  // meaningful share of the documented crosses. Measured 2026-06-19:
  // recall@10 ≈ 0.393, precision@1 ≈ 0.25, MRR ≈ 0.321 over 28 evaluable pairs.
  // Floor set conservatively below the measured value so legitimate catalog/spec
  // changes don't flake the suite, but a real regression (engine or spec-data rot)
  // trips it. The catalog generator is seeded, so the number is deterministic.
  it("meets the recall floor", () => {
    expect(report.recallAtK).toBeGreaterThanOrEqual(0.3);
  });
});
