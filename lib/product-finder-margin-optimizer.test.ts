import { describe, it, expect } from "vitest";
import { optimizeMargin, type OptimizerLineInput } from "@/lib/product-finder-margin-optimizer";
import { estimatedUnitCost, marginPct } from "@/lib/product-finder-margin";
import type { CatalogProduct } from "@/features/product-finder/types";

function prod(id: string, unitPrice: number, category: CatalogProduct["category"] = "electrical"): CatalogProduct {
  return {
    id, sku: id, name: `Product ${id}`, brand: "Acme", category, subcategory: "Circuit Breakers",
    description: "", unitPrice, uom: "ea", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

describe("optimizeMargin", () => {
  it("flags low-margin lines and suggests the highest-margin equivalent swap", () => {
    // base = the line product; alt has a higher margin at its effective price.
    const base = prod("BASE", 100);
    // safety category has the lowest cost ratio (0.65) → higher margin at the same price.
    const alt = prod("ALT", 100, "safety");
    const line: OptimizerLineInput = {
      product: base,
      qty: 4,
      effectiveUnitPrice: 100,
      candidates: [{ product: alt, effectiveUnitPrice: 100, relation: "equivalent" }],
    };
    const r = optimizeMargin([line], { minLiftPct: 0.01, floorPct: 1 }); // floor 1 → always "flagged" for the assertion
    expect(r.lines).toHaveLength(1);
    const swap = r.lines[0].bestSwap;
    expect(swap).not.toBeNull();
    expect(swap?.to.id).toBe("ALT");
    // Margin lift is positive and the optimized basket margin exceeds the current.
    expect(swap!.marginLiftPct).toBeGreaterThan(0);
    expect(r.optimized.marginDollars).toBeGreaterThan(r.current.marginDollars);
    expect(r.totalMarginGain).toBeGreaterThan(0);
    expect(r.swapCount).toBe(1);
  });

  it("suggests no swap when no candidate beats the line by the minimum lift", () => {
    const base = prod("BASE", 100);
    const worse = prod("WORSE", 100, "av"); // av has a higher cost ratio (0.75) → lower margin
    const r = optimizeMargin(
      [{ product: base, qty: 1, effectiveUnitPrice: 100, candidates: [{ product: worse, effectiveUnitPrice: 100, relation: "equivalent" }] }],
      { minLiftPct: 0.02 },
    );
    expect(r.lines[0].bestSwap).toBeNull();
    expect(r.swapCount).toBe(0);
    expect(r.totalMarginGain).toBe(0);
  });

  it("computes current vs optimized basket margin and the customer price delta", () => {
    const base = prod("BASE", 100);
    const alt = prod("ALT", 120, "safety"); // pricier to the customer but higher margin
    const r = optimizeMargin(
      [{ product: base, qty: 2, effectiveUnitPrice: 100, candidates: [{ product: alt, effectiveUnitPrice: 120, relation: "functional-substitute" }] }],
      { minLiftPct: 0.01 },
    );
    const swap = r.lines[0].bestSwap;
    expect(swap?.customerPriceDeltaUnit).toBe(20); // +$20/unit to the customer
    // Sanity-check the margin math against the underlying lib.
    const expectedCur = marginPct(100, estimatedUnitCost(base));
    expect(r.lines[0].currentMarginPct).toBeCloseTo(expectedCur, 5);
  });

  it("ranks swaps by margin DOLLARS at qty, not margin %", () => {
    const base = prod("BASE", 100);
    const hiPctLoDollar = prod("HIPCT", 70, "safety"); // cheaper equivalent: higher %, fewer $
    const loPctHiDollar = prod("HIDOLLAR", 220, "av"); // pricier equivalent: lower %, more $
    const qty = 5;
    const r = optimizeMargin(
      [
        {
          product: base,
          qty,
          effectiveUnitPrice: 100,
          candidates: [
            { product: hiPctLoDollar, effectiveUnitPrice: 70, relation: "equivalent" },
            { product: loPctHiDollar, effectiveUnitPrice: 220, relation: "equivalent" },
          ],
        },
      ],
      { minLiftPct: -1 }, // disable the %-improvement gate; only $-positive swaps qualify
    );
    const gain = (p: CatalogProduct, eff: number) => (eff - estimatedUnitCost(p) - (100 - estimatedUnitCost(base))) * qty;
    const gHi = gain(loPctHiDollar, 220);
    expect(gHi).toBeGreaterThan(gain(hiPctLoDollar, 70));
    // The pricier candidate nets far more margin dollars → it must be the pick
    // (the old margin-% ranking would have chosen the higher-% cheaper one).
    expect(r.lines[0].bestSwap?.to.id).toBe("HIDOLLAR");
    expect(r.lines[0].bestSwap?.lineMarginGain).toBeCloseTo(gHi, 1);
  });

  it("counts flagged lines below the floor", () => {
    const cheap = prod("CHEAP", 100); // electrical cost ~0.72 → ~28% margin
    // Sell near cost → very low margin, below a 15% floor.
    const r = optimizeMargin([{ product: cheap, qty: 1, effectiveUnitPrice: estimatedUnitCost(cheap) + 1, candidates: [] }], { floorPct: 0.15 });
    expect(r.flaggedCount).toBe(1);
    expect(r.lines[0].flagged).toBe(true);
  });
});
