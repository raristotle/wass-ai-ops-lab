import { describe, it, expect } from "vitest";
import { bestCrossSaving, totalCrossSavings, type CrossCandidate } from "@/lib/catalog/cross-savings";
import type { CatalogProduct } from "@/features/product-finder/types";

const product = (sku: string, brand: string): CatalogProduct => ({
  id: `T-${sku}`,
  sku,
  name: `${brand} ${sku}`,
  brand,
  category: "electrical",
  subcategory: "Fuses",
  description: "",
  unitPrice: 10,
  uom: "EA",
  specs: [],
  preferred: true,
  branchStock: [],
  dcStock: [],
  externalSources: [],
  imageIcon: "⚡",
});

const candidate = (sku: string, brand: string, relation: CrossCandidate["relation"] = "equivalent"): CrossCandidate => ({
  product: product(sku, brand),
  relation,
  sourceKind: "manufacturer-cross",
  sourceUrl: "https://example.com/cross.pdf",
  confidence: 97,
  matchReason: "Documented equivalent per manufacturer cross-reference",
});

describe("bestCrossSaving", () => {
  it("returns the cheaper documented cross with unit + line savings", () => {
    const s = bestCrossSaving(10, 4, [{ candidate: candidate("TR30R", "Mersen"), substituteUnit: 8 }]);
    expect(s).not.toBeNull();
    expect(s?.unitSavings).toBe(2);
    expect(s?.lineSavings).toBe(8);
    expect(s?.substituteUnit).toBe(8);
    expect(s?.pctSavings).toBeCloseTo(0.2);
    expect(s?.candidate.product.sku).toBe("TR30R");
  });

  it("returns null when no candidate is cheaper", () => {
    expect(bestCrossSaving(10, 1, [{ candidate: candidate("X", "B"), substituteUnit: 10 }])).toBeNull();
    expect(bestCrossSaving(10, 1, [{ candidate: candidate("X", "B"), substituteUnit: 12 }])).toBeNull();
  });

  it("ignores savings below the 2% floor", () => {
    expect(bestCrossSaving(100, 1, [{ candidate: candidate("X", "B"), substituteUnit: 99 }])).toBeNull(); // 1%
    expect(bestCrossSaving(100, 1, [{ candidate: candidate("X", "B"), substituteUnit: 97 }])).not.toBeNull(); // 3%
  });

  it("picks the largest unit saving among multiple candidates", () => {
    const s = bestCrossSaving(10, 1, [
      { candidate: candidate("A", "B"), substituteUnit: 9 },
      { candidate: candidate("C", "D"), substituteUnit: 6 },
      { candidate: candidate("E", "F"), substituteUnit: 8 },
    ]);
    expect(s?.candidate.product.sku).toBe("C");
    expect(s?.unitSavings).toBe(4);
  });

  it("breaks ties by preferring a documented equivalent over a functional substitute", () => {
    const s = bestCrossSaving(10, 1, [
      { candidate: candidate("SUB", "B", "functional-substitute"), substituteUnit: 8 },
      { candidate: candidate("EQ", "C", "equivalent"), substituteUnit: 8 },
    ]);
    expect(s?.candidate.product.sku).toBe("EQ");
  });

  it("guards against non-positive prices", () => {
    expect(bestCrossSaving(0, 1, [{ candidate: candidate("X", "B"), substituteUnit: 5 }])).toBeNull();
  });
});

describe("totalCrossSavings", () => {
  it("sums line savings across a basket, ignoring nulls", () => {
    const a = bestCrossSaving(10, 2, [{ candidate: candidate("A", "B"), substituteUnit: 8 }]); // 4
    const b = bestCrossSaving(20, 1, [{ candidate: candidate("C", "D"), substituteUnit: 15 }]); // 5
    expect(totalCrossSavings([a, null, b])).toBe(9);
  });
});
