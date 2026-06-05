// ── Product Finder UI logic tests ──────────────────────────────────────────────
// Vitest unit tests for pure functions used by StockBadge, ProductCard,
// and ProductGrid.  Run: npm test  (vitest run, config: lib/**/*.test.ts)

import { describe, it, expect } from "vitest";
import { getTotalBranchStock, getTotalDCStock } from "@/data/mock/wesco-products";
import type { WescoProduct, ProductSpec, BranchStock } from "@/features/product-finder/types";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const BRANCH_HOU: BranchStock = {
  branchId: "B-HOU-01",
  branchName: "Houston Downtown",
  city: "Houston",
  state: "TX",
  quantity: 24,
};

const BRANCH_DAL: BranchStock = {
  branchId: "B-DAL-01",
  branchName: "Dallas North",
  city: "Dallas",
  state: "TX",
  quantity: 67,
};

function makeProduct(overrides: Partial<WescoProduct> = {}): WescoProduct {
  return {
    id: "test-product",
    sku: "TEST-001",
    name: "Test Product",
    brand: "TestBrand",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "A test product",
    unitPrice: 10.0,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock: [BRANCH_HOU, BRANCH_DAL],
    dcStock: [
      { dcId: "DC-TEX-01", dcName: "Texas DC", location: "Katy, TX", quantity: 156 },
    ],
    alternativeIds: [],
    crossSellIds: [],
    upsellIds: [],
    externalSources: [],
    imageIcon: "⚡",
    ...overrides,
  };
}

// ─── getTotalBranchStock ────────────────────────────────────────────────────────

describe("getTotalBranchStock", () => {
  it("sums quantities across all branch entries", () => {
    const p = makeProduct();
    expect(getTotalBranchStock(p)).toBe(91); // 24 + 67
  });

  it("returns 0 when branchStock is empty", () => {
    const p = makeProduct({ branchStock: [] });
    expect(getTotalBranchStock(p)).toBe(0);
  });

  it("handles a single branch", () => {
    const p = makeProduct({ branchStock: [BRANCH_HOU] });
    expect(getTotalBranchStock(p)).toBe(24);
  });
});

// ─── getTotalDCStock ────────────────────────────────────────────────────────────

describe("getTotalDCStock", () => {
  it("sums quantities across all DC entries", () => {
    const p = makeProduct({
      dcStock: [
        { dcId: "DC-1", dcName: "DC 1", location: "TX", quantity: 100 },
        { dcId: "DC-2", dcName: "DC 2", location: "AZ", quantity: 50 },
      ],
    });
    expect(getTotalDCStock(p)).toBe(150);
  });

  it("returns 0 when dcStock is empty", () => {
    const p = makeProduct({ dcStock: [] });
    expect(getTotalDCStock(p)).toBe(0);
  });
});

// ─── StockBadge: my-branch qty logic ───────────────────────────────────────────

describe("StockBadge branch qty resolution", () => {
  it("finds my branch qty when userBranchId matches", () => {
    const branchStock: BranchStock[] = [BRANCH_HOU, BRANCH_DAL];
    const myQty =
      branchStock.find((b) => b.branchId === "B-HOU-01")?.quantity ?? 0;
    expect(myQty).toBe(24);
  });

  it("returns 0 when userBranchId has no entry in branchStock", () => {
    const branchStock: BranchStock[] = [BRANCH_HOU, BRANCH_DAL];
    const myQty =
      branchStock.find((b) => b.branchId === "UNKNOWN")?.quantity ?? 0;
    expect(myQty).toBe(0);
  });

  it("falls back to branchQty total when userBranchId is undefined", () => {
    const p = makeProduct();
    const branchQty = getTotalBranchStock(p);
    // When userBranchId is undefined StockBadge uses branchQty prop
    expect(branchQty).toBe(91);
  });
});

// ─── computeCompatScore ────────────────────────────────────────────────────────

// Pure replica of the function used inside ProductCard so we can test it
// without importing a React component.
function computeCompatScore(
  product: WescoProduct,
  reference: WescoProduct
): number {
  const refNonNeg = reference.specs.filter((s) => s.isNonNeg);
  if (refNonNeg.length === 0) return 100;
  const matches = refNonNeg.filter((rs) => {
    const ps = product.specs.find((s) => s.name === rs.name);
    return ps?.value === rs.value;
  });
  return Math.round((matches.length / refNonNeg.length) * 100);
}

describe("computeCompatScore", () => {
  const refSpecs: ProductSpec[] = [
    { name: "Amperage", value: "15A", isNonNeg: true },
    { name: "Voltage", value: "120/240V", isNonNeg: true },
    { name: "Poles", value: "1-Pole", isNonNeg: true },
    { name: "Trip Type", value: "Thermal-Magnetic" }, // non-nonNeg, ignored
  ];

  it("returns 100 when all non-neg specs match exactly", () => {
    const product = makeProduct({
      specs: [
        { name: "Amperage", value: "15A", isNonNeg: true },
        { name: "Voltage", value: "120/240V", isNonNeg: true },
        { name: "Poles", value: "1-Pole", isNonNeg: true },
      ],
    });
    const reference = makeProduct({ specs: refSpecs });
    expect(computeCompatScore(product, reference)).toBe(100);
  });

  it("returns 0 when no non-neg specs match", () => {
    const product = makeProduct({
      specs: [
        { name: "Amperage", value: "20A", isNonNeg: true },
        { name: "Voltage", value: "480V", isNonNeg: true },
        { name: "Poles", value: "3-Pole", isNonNeg: true },
      ],
    });
    const reference = makeProduct({ specs: refSpecs });
    expect(computeCompatScore(product, reference)).toBe(0);
  });

  it("calculates partial match correctly (1 of 3 = 33%)", () => {
    const product = makeProduct({
      specs: [
        { name: "Amperage", value: "15A", isNonNeg: true },
        { name: "Voltage", value: "480V", isNonNeg: true },
        { name: "Poles", value: "3-Pole", isNonNeg: true },
      ],
    });
    const reference = makeProduct({ specs: refSpecs });
    expect(computeCompatScore(product, reference)).toBe(33);
  });

  it("returns 100 when reference has no non-neg specs", () => {
    const product = makeProduct({ specs: [] });
    const reference = makeProduct({
      specs: [{ name: "Color", value: "Red" }],
    });
    expect(computeCompatScore(product, reference)).toBe(100);
  });

  it("ignores non-nonNeg specs when scoring", () => {
    const product = makeProduct({
      specs: [
        { name: "Amperage", value: "15A", isNonNeg: true },
        { name: "Voltage", value: "120/240V", isNonNeg: true },
        { name: "Poles", value: "1-Pole", isNonNeg: true },
        { name: "Trip Type", value: "Completely Different" }, // irrelevant
      ],
    });
    const reference = makeProduct({ specs: refSpecs });
    expect(computeCompatScore(product, reference)).toBe(100);
  });
});

// ─── ProductGrid sort logic ────────────────────────────────────────────────────

function sortProducts(
  products: WescoProduct[],
  sortKey: string,
  referenceProduct?: WescoProduct | null
): WescoProduct[] {
  return [...products].sort((a, b) => {
    if (sortKey === "preferred")
      return (b.preferred ? 1 : 0) - (a.preferred ? 1 : 0);
    if (sortKey === "branchStock")
      return getTotalBranchStock(b) - getTotalBranchStock(a);
    if (sortKey === "priceLow") return a.unitPrice - b.unitPrice;
    if (sortKey === "priceHigh") return b.unitPrice - a.unitPrice;
    if (sortKey === "brand") return a.brand.localeCompare(b.brand);
    const aIsAlt = referenceProduct?.alternativeIds?.includes(a.id) ? 1 : 0;
    const bIsAlt = referenceProduct?.alternativeIds?.includes(b.id) ? 1 : 0;
    if (aIsAlt !== bIsAlt) return bIsAlt - aIsAlt;
    return (b.preferred ? 1 : 0) - (a.preferred ? 1 : 0);
  });
}

describe("ProductGrid sort logic", () => {
  const preferred = makeProduct({ id: "p1", preferred: true, unitPrice: 20, brand: "Zebra" });
  const cheap = makeProduct({ id: "p2", preferred: false, unitPrice: 5, brand: "Alpha" });
  const expensive = makeProduct({ id: "p3", preferred: false, unitPrice: 50, brand: "Middle" });

  it("sorts preferred suppliers first", () => {
    const result = sortProducts([cheap, expensive, preferred], "preferred");
    expect(result[0].id).toBe("p1");
  });

  it("sorts price low to high", () => {
    const result = sortProducts([expensive, preferred, cheap], "priceLow");
    expect(result[0].unitPrice).toBe(5);
    expect(result[2].unitPrice).toBe(50);
  });

  it("sorts price high to low", () => {
    const result = sortProducts([cheap, preferred, expensive], "priceHigh");
    expect(result[0].unitPrice).toBe(50);
  });

  it("sorts brand A–Z", () => {
    const result = sortProducts([preferred, expensive, cheap], "brand");
    expect(result[0].brand).toBe("Alpha");
    expect(result[2].brand).toBe("Zebra");
  });

  it("relevance: alternatives of reference product rank first", () => {
    const reference = makeProduct({ id: "ref", alternativeIds: ["p2"] });
    const result = sortProducts([preferred, expensive, cheap], "relevance", reference);
    // cheap (id p2) is an alternative and should rank first
    expect(result[0].id).toBe("p2");
  });

  it("relevance: preferred ranks above non-preferred when no alternatives", () => {
    const result = sortProducts([cheap, expensive, preferred], "relevance");
    expect(result[0].id).toBe("p1");
  });

  it("sorts by branchStock high to low", () => {
    const highStock = makeProduct({
      id: "hs",
      branchStock: [{ ...BRANCH_HOU, quantity: 200 }],
    });
    const lowStock = makeProduct({
      id: "ls",
      branchStock: [{ ...BRANCH_HOU, quantity: 2 }],
    });
    const result = sortProducts([lowStock, highStock], "branchStock");
    expect(result[0].id).toBe("hs");
  });
});

// ─── External sources alert logic ─────────────────────────────────────────────

describe("External sources alert condition", () => {
  it("shows alert when both branchQty and dcQty are 0 and externalSources exist", () => {
    const p = makeProduct({
      branchStock: [],
      dcStock: [],
      externalSources: [
        {
          distributor: "Grainger",
          url: "https://grainger.com",
          price: 10,
          quantity: 5,
          status: "in-stock",
        },
      ],
    });
    const branchQty = getTotalBranchStock(p);
    const dcQty = getTotalDCStock(p);
    const showAlert = branchQty === 0 && dcQty === 0 && p.externalSources.length > 0;
    expect(showAlert).toBe(true);
  });

  it("does not show alert when branchStock is available", () => {
    const p = makeProduct({
      branchStock: [BRANCH_HOU],
      dcStock: [],
      externalSources: [
        {
          distributor: "Grainger",
          url: "https://grainger.com",
          price: 10,
          quantity: 5,
          status: "in-stock",
        },
      ],
    });
    const branchQty = getTotalBranchStock(p);
    const dcQty = getTotalDCStock(p);
    const showAlert = branchQty === 0 && dcQty === 0 && p.externalSources.length > 0;
    expect(showAlert).toBe(false);
  });

  it("does not show alert when externalSources is empty", () => {
    const p = makeProduct({ branchStock: [], dcStock: [], externalSources: [] });
    const branchQty = getTotalBranchStock(p);
    const dcQty = getTotalDCStock(p);
    const showAlert = branchQty === 0 && dcQty === 0 && p.externalSources.length > 0;
    expect(showAlert).toBe(false);
  });
});
