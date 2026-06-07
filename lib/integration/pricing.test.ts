/**
 * TDD tests for the mock PricingProvider (lib/integration/pricing.ts).
 * Written BEFORE implementation — these tests must fail first.
 */

import { describe, it, expect } from "vitest";
import { mockPricingProvider } from "@/lib/integration/pricing";
import type { CatalogProduct } from "@/features/product-finder/types";
import type { CustomerAccount } from "@/lib/integration/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeProduct(
  overrides: Partial<CatalogProduct> & { id?: string; unitPrice?: number; category?: CatalogProduct["category"] } = {}
): CatalogProduct {
  return {
    id: overrides.id ?? "TEST-001",
    sku: overrides.id ?? "TEST-001",
    name: "Test Product",
    brand: "TestBrand",
    category: overrides.category ?? "electrical",
    subcategory: "Circuit Breakers",
    description: "A test product",
    unitPrice: overrides.unitPrice ?? 100,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "🔌",
    ...overrides,
  };
}

const CONTRACT_CUSTOMER: CustomerAccount = {
  id: "CUST-001",
  name: "Gulf Coast Industrial",
  tier: "contract",
  discountByCategory: {
    electrical: 0.15,
    "oem-electrical": 0.12,
  },
  netPrices: {
    "NET-PROD-1": 6.00, // special net price — overrides category discount
  },
  shipToCity: "Houston, TX",
  terms: "Net 30",
};

const STANDARD_CUSTOMER: CustomerAccount = {
  id: "CUST-000",
  name: "Walk-in / Standard",
  tier: "standard",
  discountByCategory: {},
  netPrices: {},
  shipToCity: "—",
  terms: "Prepaid",
};

// ─── No customer (null) path ──────────────────────────────────────────────────

describe("mockPricingProvider — no customer", () => {
  const product = makeProduct({ unitPrice: 100 });

  it("returns listPrice = product.unitPrice", () => {
    const result = mockPricingProvider.getPricing(product, { customer: null, qty: 1 });
    expect(result.listPrice).toBe(100);
  });

  it("returns contractPrice = null when no customer", () => {
    const result = mockPricingProvider.getPricing(product, { customer: null, qty: 1 });
    expect(result.contractPrice).toBeNull();
  });

  it("effectiveUnitPrice = listPrice at qty 1 (no discount)", () => {
    const result = mockPricingProvider.getPricing(product, { customer: null, qty: 1 });
    expect(result.effectiveUnitPrice).toBe(100);
  });

  it("savingsPct = 0 at qty 1 with no customer", () => {
    const result = mockPricingProvider.getPricing(product, { customer: null, qty: 1 });
    expect(result.savingsPct).toBe(0);
  });

  it("source = 'list' at qty 1 with no customer", () => {
    const result = mockPricingProvider.getPricing(product, { customer: null, qty: 1 });
    expect(result.source).toBe("list");
  });

  it("effectiveUnitPrice applies volume tier at qty 10 (5% off list)", () => {
    const result = mockPricingProvider.getPricing(product, { customer: null, qty: 10 });
    // 5% off $100 = $95
    expect(result.effectiveUnitPrice).toBe(95);
  });

  it("effectiveUnitPrice applies volume tier at qty 50 (10% off list)", () => {
    const result = mockPricingProvider.getPricing(product, { customer: null, qty: 50 });
    // 10% off $100 = $90
    expect(result.effectiveUnitPrice).toBe(90);
  });

  it("effectiveUnitPrice applies volume tier at qty 100 (15% off list)", () => {
    const result = mockPricingProvider.getPricing(product, { customer: null, qty: 100 });
    // 15% off $100 = $85
    expect(result.effectiveUnitPrice).toBe(85);
  });

  it("savingsPct reflects volume discount at qty 10", () => {
    const result = mockPricingProvider.getPricing(product, { customer: null, qty: 10 });
    // (100 - 95) / 100 * 100 = 5
    expect(result.savingsPct).toBe(5);
  });

  it("source = 'volume' when volume tier applies with no customer", () => {
    const result = mockPricingProvider.getPricing(product, { customer: null, qty: 10 });
    expect(result.source).toBe("volume");
  });
});

// ─── Standard-tier customer (behaves like no customer) ────────────────────────

describe("mockPricingProvider — standard-tier customer", () => {
  const product = makeProduct({ unitPrice: 100 });

  it("contractPrice = null for a standard-tier customer (no contract)", () => {
    const result = mockPricingProvider.getPricing(product, { customer: STANDARD_CUSTOMER, qty: 1 });
    expect(result.contractPrice).toBeNull();
  });

  it("effectiveUnitPrice = list price at qty 1 for standard customer", () => {
    const result = mockPricingProvider.getPricing(product, { customer: STANDARD_CUSTOMER, qty: 1 });
    expect(result.effectiveUnitPrice).toBe(100);
  });

  it("source = 'list' at qty 1 for standard customer", () => {
    const result = mockPricingProvider.getPricing(product, { customer: STANDARD_CUSTOMER, qty: 1 });
    expect(result.source).toBe("list");
  });

  it("volume still applies for a standard customer at qty 10", () => {
    const result = mockPricingProvider.getPricing(product, { customer: STANDARD_CUSTOMER, qty: 10 });
    expect(result.effectiveUnitPrice).toBe(95);
    expect(result.source).toBe("volume");
  });
});

// ─── Contract customer with category discount ─────────────────────────────────

describe("mockPricingProvider — contract customer, category discount", () => {
  const product = makeProduct({ unitPrice: 100, category: "electrical" });

  it("contractPrice = listPrice * (1 - categoryDiscount) for electrical category", () => {
    const result = mockPricingProvider.getPricing(product, { customer: CONTRACT_CUSTOMER, qty: 1 });
    // 15% off $100 = $85.00
    expect(result.contractPrice).toBe(85);
  });

  it("effectiveUnitPrice = contractPrice at qty 1 (contract-only, no volume)", () => {
    const result = mockPricingProvider.getPricing(product, { customer: CONTRACT_CUSTOMER, qty: 1 });
    expect(result.effectiveUnitPrice).toBe(85);
  });

  it("source = 'contract' at qty 1 with category discount", () => {
    const result = mockPricingProvider.getPricing(product, { customer: CONTRACT_CUSTOMER, qty: 1 });
    expect(result.source).toBe("contract");
  });

  it("savingsPct reflects savings vs listPrice at qty 1", () => {
    const result = mockPricingProvider.getPricing(product, { customer: CONTRACT_CUSTOMER, qty: 1 });
    // (100 - 85) / 100 * 100 = 15
    expect(result.savingsPct).toBe(15);
  });

  it("contractPrice is null for a category with no discount defined (datacom not in CONTRACT_CUSTOMER)", () => {
    const datacomProduct = makeProduct({ unitPrice: 100, category: "datacom" });
    const result = mockPricingProvider.getPricing(datacomProduct, { customer: CONTRACT_CUSTOMER, qty: 1 });
    expect(result.contractPrice).toBeNull();
  });

  it("effectiveUnitPrice falls back to listPrice when no category or net discount applies", () => {
    const datacomProduct = makeProduct({ unitPrice: 100, category: "datacom" });
    const result = mockPricingProvider.getPricing(datacomProduct, { customer: CONTRACT_CUSTOMER, qty: 1 });
    expect(result.effectiveUnitPrice).toBe(100);
  });
});

// ─── Net price override wins over category discount ───────────────────────────

describe("mockPricingProvider — net price override", () => {
  const netProduct = makeProduct({ id: "NET-PROD-1", unitPrice: 100, category: "electrical" });

  it("contractPrice = netPrice when product has a net price override", () => {
    // NET-PROD-1 has netPrice $6.00 in CONTRACT_CUSTOMER
    const result = mockPricingProvider.getPricing(netProduct, { customer: CONTRACT_CUSTOMER, qty: 1 });
    expect(result.contractPrice).toBe(6);
  });

  it("contractPrice from netPrice wins over category discount", () => {
    // Category discount: 15% off $100 = $85; net price $6 should win
    const result = mockPricingProvider.getPricing(netProduct, { customer: CONTRACT_CUSTOMER, qty: 1 });
    expect(result.contractPrice).toBe(6);
    // 6 < 85, and net price is explicitly set
  });

  it("effectiveUnitPrice = netPrice at qty 1", () => {
    const result = mockPricingProvider.getPricing(netProduct, { customer: CONTRACT_CUSTOMER, qty: 1 });
    expect(result.effectiveUnitPrice).toBe(6);
  });
});

// ─── Contract + volume stacking ───────────────────────────────────────────────

describe("mockPricingProvider — contract + volume stacking", () => {
  const product = makeProduct({ unitPrice: 100, category: "electrical" });

  it("at qty 50: contract base (15% off $100 = $85) then 10% volume multiplier applied → $76.50", () => {
    // contract base = $85; volume multiplier at qty 50 = 0.90 → $85 * 0.90 = $76.50
    const result = mockPricingProvider.getPricing(product, { customer: CONTRACT_CUSTOMER, qty: 50 });
    expect(result.effectiveUnitPrice).toBe(76.5);
  });

  it("contractPrice is still the base contract price (pre-volume), not the stacked price", () => {
    const result = mockPricingProvider.getPricing(product, { customer: CONTRACT_CUSTOMER, qty: 50 });
    expect(result.contractPrice).toBe(85);
  });

  it("source = 'contract+volume' when both apply", () => {
    const result = mockPricingProvider.getPricing(product, { customer: CONTRACT_CUSTOMER, qty: 50 });
    expect(result.source).toBe("contract+volume");
  });

  it("savingsPct at qty 50 vs listPrice (100): (100 - 76.5)/100 * 100 = 23.5", () => {
    const result = mockPricingProvider.getPricing(product, { customer: CONTRACT_CUSTOMER, qty: 50 });
    expect(result.savingsPct).toBe(24); // Math.round(23.5) = 24
  });

  it("at qty 100: contract base $85 * 0.85 (15% vol) = $72.25", () => {
    const result = mockPricingProvider.getPricing(product, { customer: CONTRACT_CUSTOMER, qty: 100 });
    expect(result.effectiveUnitPrice).toBe(72.25);
  });
});

// ─── Rounding — 2 decimal places ─────────────────────────────────────────────

describe("mockPricingProvider — rounding", () => {
  it("contractPrice is rounded to 2 decimal places", () => {
    const product = makeProduct({ unitPrice: 33.33, category: "electrical" });
    // 33.33 * (1 - 0.15) = 33.33 * 0.85 = 28.3305 → rounds to 28.33
    const result = mockPricingProvider.getPricing(product, { customer: CONTRACT_CUSTOMER, qty: 1 });
    expect(result.contractPrice).toBe(28.33);
    // Verify it's exactly 2dp
    expect(result.contractPrice!.toFixed(2)).toBe("28.33");
  });

  it("effectiveUnitPrice is rounded to 2 decimal places", () => {
    const product = makeProduct({ unitPrice: 33.33, category: "electrical" });
    const result = mockPricingProvider.getPricing(product, { customer: CONTRACT_CUSTOMER, qty: 1 });
    expect(parseFloat(result.effectiveUnitPrice.toFixed(2))).toBe(result.effectiveUnitPrice);
  });

  it("deterministic: calling twice with same args gives same result", () => {
    const product = makeProduct({ unitPrice: 37.49, category: "electrical" });
    const r1 = mockPricingProvider.getPricing(product, { customer: CONTRACT_CUSTOMER, qty: 10 });
    const r2 = mockPricingProvider.getPricing(product, { customer: CONTRACT_CUSTOMER, qty: 10 });
    expect(r1.effectiveUnitPrice).toBe(r2.effectiveUnitPrice);
    expect(r1.savingsPct).toBe(r2.savingsPct);
  });
});

// ─── savingsPct edge cases ────────────────────────────────────────────────────

describe("mockPricingProvider — savingsPct edge cases", () => {
  it("savingsPct = 0 when effective equals list (no discounts)", () => {
    const product = makeProduct({ unitPrice: 100 });
    const result = mockPricingProvider.getPricing(product, { customer: null, qty: 1 });
    expect(result.savingsPct).toBe(0);
  });

  it("savingsPct = 0 when listPrice = 0 (no division by zero)", () => {
    const product = makeProduct({ unitPrice: 0 });
    const result = mockPricingProvider.getPricing(product, { customer: null, qty: 1 });
    expect(result.savingsPct).toBe(0);
  });
});

// ─── getPricingProvider registry integration ──────────────────────────────────

describe("getPricingProvider from index", () => {
  it("getPricingProvider() returns a provider with a getPricing function", async () => {
    const { getPricingProvider } = await import("@/lib/integration/index");
    const provider = getPricingProvider();
    expect(typeof provider.getPricing).toBe("function");
  });

  it("getPricingProvider().getPricing works end-to-end (no customer, list price)", async () => {
    const { getPricingProvider } = await import("@/lib/integration/index");
    const product = makeProduct({ unitPrice: 50 });
    const result = getPricingProvider().getPricing(product, { customer: null, qty: 1 });
    expect(result.listPrice).toBe(50);
    expect(result.contractPrice).toBeNull();
    expect(result.effectiveUnitPrice).toBe(50);
  });
});
