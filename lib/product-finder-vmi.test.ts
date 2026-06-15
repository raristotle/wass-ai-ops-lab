import { describe, it, expect } from "vitest";
import { reorderSuggestion, demandFromOrders, demandBySku, vmiPolicyId, type VmiPolicy } from "@/lib/product-finder-vmi";

const policy = (over: Partial<VmiPolicy> = {}): VmiPolicy => ({
  id: "vmi-a",
  sku: "A-1",
  name: "Breaker",
  customerId: null,
  branchId: null,
  min: 10,
  max: 40,
  updatedAt: 1,
  ...over,
});

describe("vmiPolicyId", () => {
  it("is deterministic, readable-prefixed, and scope-keyed", () => {
    expect(vmiPolicyId("QO115", null, null)).toBe(vmiPolicyId("QO115", null, null));
    expect(vmiPolicyId("QO115", null, null)).toMatch(/^vmi-qo115-[0-9a-f]{8}$/);
    expect(vmiPolicyId("QO115", "cust1", "br2")).not.toBe(vmiPolicyId("QO115", null, null));
  });
  it("does not collide on the customer/branch delimiter boundary", () => {
    expect(vmiPolicyId("QO115", "acme-west", "01")).not.toBe(vmiPolicyId("QO115", "acme", "west-01"));
  });
});

describe("reorderSuggestion", () => {
  it("ok when available stays above min", () => {
    const r = reorderSuggestion(policy(), 50, 5); // available 45 > min 10
    expect(r.status).toBe("ok");
    expect(r.reorderQty).toBe(0);
  });

  it("reorders to max when available is at/below min but positive", () => {
    const r = reorderSuggestion(policy(), 20, 12); // available 8 ≤ min 10, onHand 20 ≥ min
    expect(r.status).toBe("reorder");
    expect(r.available).toBe(8);
    expect(r.reorderQty).toBe(32); // max 40 − available 8
  });

  it("critical when on-hand is already below min", () => {
    const r = reorderSuggestion(policy(), 6, 0); // onHand 6 < min 10
    expect(r.status).toBe("critical");
    expect(r.reorderQty).toBe(34); // 40 − 6
  });

  it("critical and covers backlog when projected to stock out", () => {
    const r = reorderSuggestion(policy(), 15, 25); // available -10
    expect(r.status).toBe("critical");
    expect(r.available).toBe(-10);
    expect(r.reorderQty).toBe(50); // 40 − (−10)
  });
});

describe("demandFromOrders", () => {
  const NOW = 1_000 * 86_400_000;
  const orders = [
    { placedAt: NOW - 5 * 86_400_000, lines: [{ sku: "A-1", qty: 4 }, { sku: "B-2", qty: 1 }] },
    { placedAt: NOW - 20 * 86_400_000, lines: [{ sku: "A-1", qty: 3 }] },
    { placedAt: NOW - 90 * 86_400_000, lines: [{ sku: "A-1", qty: 99 }] }, // outside 30d window
  ];

  it("sums one SKU's qty within the window only", () => {
    expect(demandFromOrders(orders, "A-1", NOW, 30)).toBe(7);
    expect(demandFromOrders(orders, "B-2", NOW, 30)).toBe(1);
    expect(demandFromOrders(orders, "A-1", NOW, 365)).toBe(106);
  });

  it("is zero for an unseen SKU", () => {
    expect(demandFromOrders(orders, "ZZZ", NOW, 30)).toBe(0);
  });

  it("demandBySku builds the same per-SKU totals in one pass", () => {
    const m = demandBySku(orders, NOW, 30);
    expect(m.get("A-1")).toBe(7);
    expect(m.get("B-2")).toBe(1);
    expect(m.has("ZZZ")).toBe(false);
    // window is respected — the 90-day-old order is excluded at 30 days
    expect(demandBySku(orders, NOW, 365).get("A-1")).toBe(106);
  });
});
