import { describe, it, expect } from "vitest";
import { priceTiers, tierUnitPrice } from "@/lib/product-finder-pricing";
import type { CatalogProduct } from "@/features/product-finder/types";

// ─── Minimal product fixture ──────────────────────────────────────────────────

function makeProduct(unitPrice: number): CatalogProduct {
  return {
    id: "test-1",
    sku: "TEST-001",
    name: "Test Product",
    brand: "TestBrand",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "A test product",
    unitPrice,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "🔌",
  };
}

// ─── priceTiers ───────────────────────────────────────────────────────────────

describe("priceTiers", () => {
  it("always returns exactly 4 tiers", () => {
    const tiers = priceTiers(makeProduct(100));
    expect(tiers).toHaveLength(4);
  });

  it("tiers have ascending minQty values: 1, 10, 50, 100", () => {
    const tiers = priceTiers(makeProduct(100));
    expect(tiers[0].minQty).toBe(1);
    expect(tiers[1].minQty).toBe(10);
    expect(tiers[2].minQty).toBe(50);
    expect(tiers[3].minQty).toBe(100);
  });

  it("tier 1 (qty 1) is 0% off — same as unitPrice", () => {
    const product = makeProduct(100);
    const tiers = priceTiers(product);
    expect(tiers[0].unitPrice).toBe(100.00);
  });

  it("tier 2 (qty 10) is 5% off, rounded to 2 decimal places", () => {
    const product = makeProduct(100);
    const tiers = priceTiers(product);
    expect(tiers[1].unitPrice).toBe(95.00);
  });

  it("tier 3 (qty 50) is 10% off, rounded to 2 decimal places", () => {
    const product = makeProduct(100);
    const tiers = priceTiers(product);
    expect(tiers[2].unitPrice).toBe(90.00);
  });

  it("tier 4 (qty 100) is 15% off, rounded to 2 decimal places", () => {
    const product = makeProduct(100);
    const tiers = priceTiers(product);
    expect(tiers[3].unitPrice).toBe(85.00);
  });

  it("unitPrices are monotonically non-increasing (tier1 >= tier2 >= tier3 >= tier4)", () => {
    const tiers = priceTiers(makeProduct(37.49));
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].unitPrice).toBeLessThanOrEqual(tiers[i - 1].unitPrice);
    }
  });

  it("rounds unitPrice to exactly 2 decimal places (cents)", () => {
    // $33.33 -> 5% off = 31.6635 -> $31.66
    const tiers = priceTiers(makeProduct(33.33));
    for (const tier of tiers) {
      const str = tier.unitPrice.toFixed(2);
      expect(parseFloat(str)).toBe(tier.unitPrice);
    }
  });

  it("rounds half-cent up (round-half-away-from-zero): 5% off $2.10 = $2.00", () => {
    expect(priceTiers(makeProduct(2.10))[1].unitPrice).toBe(2.0);
  });

  it("discount math: 5% off $37.49 = $35.62 (rounded)", () => {
    // 37.49 * 0.95 = 35.6155 -> rounds to 35.62
    const tiers = priceTiers(makeProduct(37.49));
    expect(tiers[1].unitPrice).toBe(35.62);
  });

  it("discount math: 10% off $37.49 = $33.74 (rounded)", () => {
    // 37.49 * 0.90 = 33.741 -> rounds to 33.74
    const tiers = priceTiers(makeProduct(37.49));
    expect(tiers[2].unitPrice).toBe(33.74);
  });

  it("discount math: 15% off $37.49 = $31.87 (rounded)", () => {
    // 37.49 * 0.85 = 31.8665 -> rounds to 31.87
    const tiers = priceTiers(makeProduct(37.49));
    expect(tiers[3].unitPrice).toBe(31.87);
  });

  it("works for a product with a price that rounds differently at each tier", () => {
    // $1.00: 0%->1.00, 5%->0.95, 10%->0.90, 15%->0.85
    const tiers = priceTiers(makeProduct(1.00));
    expect(tiers[0].unitPrice).toBe(1.00);
    expect(tiers[1].unitPrice).toBe(0.95);
    expect(tiers[2].unitPrice).toBe(0.90);
    expect(tiers[3].unitPrice).toBe(0.85);
  });
});

// ─── tierUnitPrice ────────────────────────────────────────────────────────────

describe("tierUnitPrice", () => {
  const product = makeProduct(100);

  it("qty 1 → tier 1 price (0% off)", () => {
    expect(tierUnitPrice(product, 1)).toBe(100.00);
  });

  it("qty 9 → tier 1 price (boundary: just below tier 2)", () => {
    expect(tierUnitPrice(product, 9)).toBe(100.00);
  });

  it("qty 10 → tier 2 price (5% off) — lower boundary of tier 2", () => {
    expect(tierUnitPrice(product, 10)).toBe(95.00);
  });

  it("qty 49 → tier 2 price (boundary: just below tier 3)", () => {
    expect(tierUnitPrice(product, 49)).toBe(95.00);
  });

  it("qty 50 → tier 3 price (10% off) — lower boundary of tier 3", () => {
    expect(tierUnitPrice(product, 50)).toBe(90.00);
  });

  it("qty 99 → tier 3 price (boundary: just below tier 4)", () => {
    expect(tierUnitPrice(product, 99)).toBe(90.00);
  });

  it("qty 100 → tier 4 price (15% off) — lower boundary of tier 4", () => {
    expect(tierUnitPrice(product, 100)).toBe(85.00);
  });

  it("qty 200 → tier 4 price (15% off) — well above tier 4 break", () => {
    expect(tierUnitPrice(product, 200)).toBe(85.00);
  });

  it("qty < 1 (e.g. 0) is treated as qty 1 → tier 1 price", () => {
    expect(tierUnitPrice(product, 0)).toBe(100.00);
  });

  it("qty -5 is treated as qty 1 → tier 1 price", () => {
    expect(tierUnitPrice(product, -5)).toBe(100.00);
  });

  it("returns the correct tiered price for a non-round base price", () => {
    const p = makeProduct(37.49);
    // qty 10 → 5% off $37.49 = $35.62
    expect(tierUnitPrice(p, 10)).toBe(35.62);
    // qty 50 → 10% off $37.49 = $33.74
    expect(tierUnitPrice(p, 50)).toBe(33.74);
    // qty 100 → 15% off $37.49 = $31.87
    expect(tierUnitPrice(p, 100)).toBe(31.87);
  });
});
