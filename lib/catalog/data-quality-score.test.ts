import { describe, it, expect } from "vitest";
import {
  computeProductQualityScore,
  summarizeQuality,
  tierFor,
} from "@/lib/catalog/data-quality-score";
import type { CatalogProduct } from "@/features/product-finder/types";

function product(p: Partial<CatalogProduct>): CatalogProduct {
  return {
    id: "p1",
    sku: "SKU1",
    name: "Test product",
    brand: "Square D",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "",
    unitPrice: 10,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "🔌",
    ...p,
  } as unknown as CatalogProduct;
}

const fullSpecs = [
  { name: "A", value: "1" },
  { name: "B", value: "2" },
  { name: "C", value: "3" },
  { name: "D", value: "4" },
  { name: "E", value: "5" },
];

describe("computeProductQualityScore", () => {
  it("scores a fully-populated verified product as excellent (100)", () => {
    const q = computeProductQualityScore(
      product({ specs: fullSpecs, specSheetUrl: "https://x/d.pdf", dataSource: "verified", lifecycleStatus: "Active" }),
    );
    expect(q.score).toBe(100);
    expect(q.tier).toBe("excellent");
    expect(q.missing).toEqual([]);
  });

  it("scores a bare simulated product as incomplete and lists gaps", () => {
    const q = computeProductQualityScore(product({ specs: [], dataSource: "simulated" }));
    // specs 0 + datasheet 0 + provenance 4 + lifecycle 10 + identifier 10 = 24
    expect(q.score).toBe(24);
    expect(q.tier).toBe("incomplete");
    expect(q.missing).toContain("Datasheet link");
    expect(q.missing.some((m) => m.startsWith("Specifications"))).toBe(true);
  });

  it("rewards a datasheet link (30 pts)", () => {
    const withSheet = computeProductQualityScore(product({ dataSource: "simulated", specSheetUrl: "https://x/d.pdf" }));
    const without = computeProductQualityScore(product({ dataSource: "simulated" }));
    expect(withSheet.score - without.score).toBe(30);
  });

  it("ranks provenance verified > curated > simulated", () => {
    const v = computeProductQualityScore(product({ dataSource: "verified" })).score;
    const c = computeProductQualityScore(product({ dataSource: "curated" })).score;
    const s = computeProductQualityScore(product({ dataSource: "simulated" })).score;
    expect(v).toBeGreaterThan(c);
    expect(c).toBeGreaterThan(s);
  });

  it("penalizes an obsolescent lifecycle", () => {
    const active = computeProductQualityScore(product({ lifecycleStatus: "Active" })).score;
    const eol = computeProductQualityScore(product({ lifecycleStatus: "Discontinued" })).score;
    expect(active - eol).toBe(10);
  });

  it("caps spec points at 30 (5+ specs)", () => {
    const five = computeProductQualityScore(product({ specs: fullSpecs }));
    const ten = computeProductQualityScore(product({ specs: [...fullSpecs, ...fullSpecs] }));
    expect(five.factors.find((f) => f.key === "specs")!.points).toBe(30);
    expect(ten.factors.find((f) => f.key === "specs")!.points).toBe(30);
  });
});

describe("tierFor", () => {
  it("maps score ranges to tiers", () => {
    expect(tierFor(90)).toBe("excellent");
    expect(tierFor(85)).toBe("excellent");
    expect(tierFor(70)).toBe("good");
    expect(tierFor(50)).toBe("partial");
    expect(tierFor(49)).toBe("incomplete");
  });
});

describe("summarizeQuality", () => {
  it("aggregates scores, tier counts, and top gaps", () => {
    const products = [
      product({ specs: fullSpecs, specSheetUrl: "https://x/d.pdf", dataSource: "verified", lifecycleStatus: "Active" }),
      product({ specs: [], dataSource: "simulated" }),
      product({ specs: [], dataSource: "simulated" }),
    ];
    const s = summarizeQuality(products);
    expect(s.count).toBe(3);
    expect(s.byTier.excellent).toBe(1);
    expect(s.byTier.incomplete).toBe(2);
    expect(s.averageScore).toBeGreaterThan(0);
    // Datasheet is missing on 2 of 3 → a top gap.
    const datasheetGap = s.topGaps.find((g) => g.key === "datasheet");
    expect(datasheetGap?.missingPct).toBeCloseTo(2 / 3, 5);
  });

  it("handles an empty catalog", () => {
    expect(summarizeQuality([])).toEqual({
      count: 0,
      averageScore: 0,
      byTier: { excellent: 0, good: 0, partial: 0, incomplete: 0 },
      topGaps: [],
    });
  });
});
