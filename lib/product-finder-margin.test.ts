import { describe, it, expect } from "vitest";
import {
  estimatedUnitCost, marginPct, lineMargin, marginTier, basketMargin,
} from "@/lib/product-finder-margin";
import type { CatalogProduct, ProductCategory } from "@/features/product-finder/types";

function prod(id: string, unitPrice: number, category: ProductCategory = "electrical"): CatalogProduct {
  return {
    id, sku: id.toUpperCase(), name: `P ${id}`, brand: "B", category,
    subcategory: "Circuit Breakers", description: "", unitPrice, uom: "EA", specs: [],
    preferred: false, branchStock: [], dcStock: [], externalSources: [], imageIcon: "⚡",
  };
}

describe("estimatedUnitCost", () => {
  it("is deterministic for the same product", () => {
    const p = prod("a", 100);
    expect(estimatedUnitCost(p)).toBe(estimatedUnitCost(p));
  });

  it("is a sensible fraction of list price (0.50–0.92)", () => {
    for (const id of ["a", "b", "c", "d", "e"]) {
      const p = prod(id, 100);
      const cost = estimatedUnitCost(p);
      expect(cost).toBeGreaterThanOrEqual(50);
      expect(cost).toBeLessThanOrEqual(92);
    }
  });

  it("scales with list price", () => {
    expect(estimatedUnitCost(prod("a", 200))).toBeCloseTo(estimatedUnitCost(prod("a", 100)) * 2, 0);
  });
});

describe("marginPct", () => {
  it("computes gross margin fraction", () => {
    expect(marginPct(100, 70)).toBeCloseTo(0.3);
  });
  it("is 0 for a zero/empty price", () => {
    expect(marginPct(0, 10)).toBe(0);
  });
  it("can be negative when sold below cost", () => {
    expect(marginPct(80, 100)).toBeCloseTo(-0.25);
  });
});

describe("lineMargin", () => {
  it("multiplies unit margin by qty", () => {
    expect(lineMargin(10, 6, 5)).toBe(20);
  });
});

describe("marginTier", () => {
  it("buckets by threshold", () => {
    expect(marginTier(0.1)).toBe("low");
    expect(marginTier(0.2)).toBe("ok");
    expect(marginTier(0.35)).toBe("good");
  });
});

describe("basketMargin", () => {
  it("aggregates revenue, cost, and margin across lines", () => {
    const lines = [
      { product: prod("a", 100), qty: 2, effectiveUnitPrice: 100 },
      { product: prod("b", 50), qty: 1, effectiveUnitPrice: 40 },
    ];
    const m = basketMargin(lines);
    expect(m.revenue).toBe(240);
    expect(m.cost).toBeGreaterThan(0);
    expect(m.marginDollars).toBeCloseTo(m.revenue - m.cost, 2);
    expect(m.marginPct).toBeCloseTo(m.marginDollars / m.revenue, 5);
  });

  it("handles an empty basket", () => {
    const m = basketMargin([]);
    expect(m.revenue).toBe(0);
    expect(m.marginPct).toBe(0);
  });
});
