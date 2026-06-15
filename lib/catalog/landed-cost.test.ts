import { describe, it, expect } from "vitest";
import { landedCost, bestAward, estimateFreightPerUnit, type SupplyOption } from "@/lib/catalog/landed-cost";

function opt(over: Partial<SupplyOption>): SupplyOption {
  return { id: "x", label: "x", unitPrice: 10, qty: 1, leadDays: 0, freightPerUnit: 1, kind: "current", ...over };
}

describe("landedCost", () => {
  it("sums price + freight + lead-time carry", () => {
    const lc = landedCost(opt({ unitPrice: 100, qty: 2, leadDays: 10, freightPerUnit: 5 }), 0.001);
    // carry = 100 * 10 * 0.001 = 1.00; unit = 100 + 5 + 1 = 106; line = 212
    expect(lc.breakdown.carry).toBe(1);
    expect(lc.unit).toBe(106);
    expect(lc.line).toBe(212);
  });

  it("a zero-lead in-stock option has no carry penalty", () => {
    const lc = landedCost(opt({ unitPrice: 50, leadDays: 0, freightPerUnit: 2 }));
    expect(lc.breakdown.carry).toBe(0);
    expect(lc.unit).toBe(52);
  });
});

describe("bestAward", () => {
  it("keeps the current part when it is already cheapest landed", () => {
    const a = bestAward([
      opt({ id: "cur", label: "Current", unitPrice: 10, leadDays: 0, freightPerUnit: 1 }),
      opt({ id: "alt", label: "Alt", unitPrice: 12, leadDays: 0, freightPerUnit: 1, kind: "cross" }),
    ])!;
    expect(a.switch).toBe(false);
    expect(a.best.id).toBe("cur");
    expect(a.lineSavings).toBe(0);
    expect(a.rationale).toMatch(/already the best/);
  });

  it("recommends a cheaper-landed cross and reports the savings", () => {
    const a = bestAward([
      opt({ id: "cur", label: "Current", unitPrice: 20, qty: 4, leadDays: 0, freightPerUnit: 1 }),
      opt({ id: "alt", label: "Stocked cross", unitPrice: 15, qty: 4, leadDays: 0, freightPerUnit: 1, kind: "cross" }),
    ])!;
    expect(a.switch).toBe(true);
    expect(a.best.id).toBe("alt");
    expect(a.lineSavings).toBe(20); // (21-16)*4
    expect(a.rationale).toMatch(/cheaper/);
  });

  it("penalizes a cheaper part that has a long lead time via carry", () => {
    const a = bestAward([
      opt({ id: "cur", label: "In stock", unitPrice: 100, qty: 1, leadDays: 0, freightPerUnit: 0 }),
      opt({ id: "alt", label: "Backordered", unitPrice: 95, qty: 1, leadDays: 60, freightPerUnit: 0, kind: "cross" }),
    ], 0.001)!;
    // alt carry = 95*60*0.001 = 5.7 → landed 100.7 > current 100 → keep current
    expect(a.switch).toBe(false);
    expect(a.best.id).toBe("cur");
  });

  it("returns null for no options", () => {
    expect(bestAward([])).toBeNull();
  });
});

describe("estimateFreightPerUnit", () => {
  it("charges heavier categories more and adds a value component", () => {
    expect(estimateFreightPerUnit("electrical", 100)).toBeGreaterThan(estimateFreightPerUnit("safety", 100));
    expect(estimateFreightPerUnit("datacom", 0)).toBe(0.4);
  });
});
