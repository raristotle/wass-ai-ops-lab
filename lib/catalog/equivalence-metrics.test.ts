import { describe, it, expect } from "vitest";
import { measureEquivalence, sampleCatalog } from "@/lib/catalog/equivalence-metrics";

/**
 * The catalog-quality bar for cross-reference / functional-equivalent precision.
 * These thresholds are the "optimal metric" the recommender must hold: the #1
 * alternative is always a true interchangeable part, and the returned set is
 * near-purely interchangeable.
 */
describe("functional-equivalent precision (catalog quality gate)", () => {
  // A deterministic 150-product slice — large enough to be representative, small
  // enough to keep the catalog-wide scan fast.
  const metrics = measureEquivalence(sampleCatalog(411, 150), 8);

  it("samples a meaningful slice with real equivalence opportunities", () => {
    expect(metrics.sampled).toBeGreaterThanOrEqual(120);
    expect(metrics.withOpportunity).toBeGreaterThan(metrics.sampled * 0.9);
  });

  it("never leads with a non-interchangeable alternative (top-1 accuracy = 1.0)", () => {
    expect(metrics.top1Accuracy).toBe(1);
  });

  it("keeps the alternatives set near-purely interchangeable (precision@8 ≥ 0.98)", () => {
    expect(metrics.precisionAtK).toBeGreaterThanOrEqual(0.98);
  });
});
