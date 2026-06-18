import { describe, it, expect } from "vitest";
import { evaluateCounts, replenishmentItems, countSummary, type CountEntry } from "@/lib/product-finder-cycle-count";
import type { VmiPolicy } from "@/lib/product-finder-vmi";

const policy = (over: Partial<VmiPolicy> = {}): VmiPolicy => ({
  id: "v1", sku: "A", name: "20A breaker", customerId: null, branchId: null, min: 10, max: 50, updatedAt: 0, ...over,
});

describe("evaluateCounts", () => {
  it("flags a count below min as needing reorder up to max", () => {
    const [r] = evaluateCounts([{ sku: "A", name: "20A breaker", counted: 5, policy: policy() }]);
    expect(r.underMin).toBe(true);
    expect(r.reorder?.status).toBe("critical"); // counted < min
    expect(r.reorder?.reorderQty).toBe(45); // max(50) - available(5)
  });

  it("a count at/above min is ok with no reorder", () => {
    const [r] = evaluateCounts([{ sku: "A", name: "20A breaker", counted: 20, policy: policy() }]);
    expect(r.underMin).toBe(false);
    expect(r.reorder?.status).toBe("ok");
    expect(r.reorder?.reorderQty).toBe(0);
  });

  it("a SKU with no VMI policy has no recommendation (not under-min)", () => {
    const [r] = evaluateCounts([{ sku: "Z", name: "Unpoliced", counted: 0, policy: null }]);
    expect(r.reorder).toBeNull();
    expect(r.underMin).toBe(false);
  });

  it("a negative count is clamped to 0 on-hand", () => {
    const [r] = evaluateCounts([{ sku: "A", name: "x", counted: -5, policy: policy() }]);
    expect(r.reorder?.onHand).toBe(0);
  });
});

describe("replenishmentItems + countSummary", () => {
  const entries: CountEntry[] = [
    { sku: "A", name: "Breaker", counted: 5, policy: policy({ id: "v1", sku: "A", min: 10, max: 50 }) }, // reorder 45
    { sku: "B", name: "Wire", counted: 30, policy: policy({ id: "v2", sku: "B", min: 10, max: 50 }) }, // ok
    { sku: "C", name: "No policy", counted: 0, policy: null },
  ];
  const results = evaluateCounts(entries);

  it("the replenishment basket is the under-min SKUs with their reorder qty", () => {
    expect(replenishmentItems(results)).toEqual([{ sku: "A", qty: 45 }]);
  });

  it("summarizes counted / with-policy / under-min / reorder units", () => {
    expect(countSummary(results)).toEqual({ counted: 3, withPolicy: 2, underMin: 1, reorderUnits: 45 });
  });
});
