import { describe, it, expect } from "vitest";
import { gradeLine, rollupHealth } from "@/lib/catalog/bom-health";

describe("gradeLine", () => {
  it("grades a healthy line A", () => {
    const h = gradeLine({ lifecycleStatus: "Active", stockQty: 100, qty: 5, sourcingScore: 5, hasActiveSuccessor: false });
    expect(h.grade).toBe("A");
    expect(h.score).toBe(100);
    expect(h.flags).toEqual([]);
  });

  it("flags an EOL single-source out-of-stock line as C with the successor action", () => {
    const h = gradeLine({ lifecycleStatus: "EOL", stockQty: 0, qty: 10, sourcingScore: 1, hasActiveSuccessor: true });
    // 100 -40 (EOL) -25 (OOS) -25 (single-source) = 10 → C
    expect(h.grade).toBe("C");
    expect(h.flags).toContain("EOL");
    expect(h.flags).toContain("Out of stock");
    expect(h.flags).toContain("Single-source");
    expect(h.action).toMatch(/successor/i);
  });

  it("recommends qualifying a second source when single-sourced but active", () => {
    const h = gradeLine({ lifecycleStatus: "Active", stockQty: 50, qty: 5, sourcingScore: 1, hasActiveSuccessor: false });
    expect(h.action).toMatch(/second source/i);
  });

  it("surfaces a savings action when a cheaper cross exists", () => {
    const h = gradeLine({ lifecycleStatus: "Active", stockQty: 50, qty: 5, sourcingScore: 4, hasActiveSuccessor: false, cheaperCrossSavingPct: 12 });
    expect(h.action).toMatch(/saves 12%/);
  });

  it("dings short stock to a B", () => {
    const h = gradeLine({ lifecycleStatus: "NRND", stockQty: 3, qty: 10, sourcingScore: 3, hasActiveSuccessor: false });
    // 100 -20 (NRND) -15 (short) = 65 → B
    expect(h.grade).toBe("B");
  });
});

describe("rollupHealth", () => {
  it("summarizes an empty BOM", () => {
    expect(rollupHealth([])).toEqual({ lines: 0, a: 0, b: 0, c: 0, needsAttention: 0, worstGrade: "A", avgScore: 0 });
  });

  it("counts grades, needs-attention, worst grade, and average", () => {
    const grades = [
      gradeLine({ stockQty: 100, qty: 1, sourcingScore: 5, hasActiveSuccessor: false }), // A 100
      gradeLine({ lifecycleStatus: "NRND", stockQty: 3, qty: 10, sourcingScore: 3, hasActiveSuccessor: false }), // B 65
      gradeLine({ lifecycleStatus: "EOL", stockQty: 0, qty: 10, sourcingScore: 1, hasActiveSuccessor: true }), // C 10
    ];
    const r = rollupHealth(grades);
    expect([r.a, r.b, r.c]).toEqual([1, 1, 1]);
    expect(r.needsAttention).toBe(2);
    expect(r.worstGrade).toBe("C");
    expect(r.avgScore).toBe(Math.round((100 + 65 + 10) / 3));
  });
});
