import { describe, it, expect } from "vitest";
import { isPriceOnRequest } from "@/lib/product-finder-price-status";
import { selectCartTotal, selectPendingPriceCount, type ProductFinderState } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";

function prod(over: Partial<CatalogProduct>): CatalogProduct {
  return {
    id: "P", sku: "P", name: "P", brand: "B", category: "electrical", subcategory: "S",
    description: "", unitPrice: 10, uom: "EA", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x", ...over,
  };
}

describe("isPriceOnRequest (B13)", () => {
  it("is true for a real (verified/curated) part with no list price", () => {
    expect(isPriceOnRequest(prod({ unitPrice: 0, dataSource: "verified" }))).toBe(true);
    expect(isPriceOnRequest(prod({ unitPrice: 0, dataSource: "curated" }))).toBe(true);
  });

  it("is false when priced, or when the part is simulated / has no provenance", () => {
    expect(isPriceOnRequest(prod({ unitPrice: 10, dataSource: "verified" }))).toBe(false);
    expect(isPriceOnRequest(prod({ unitPrice: 0, dataSource: "simulated" }))).toBe(false);
    expect(isPriceOnRequest(prod({ unitPrice: 0 }))).toBe(false);
  });
});

describe("cart total + pending count (B13)", () => {
  const priced = prod({ id: "priced", sku: "priced", unitPrice: 100, dataSource: "verified" });
  const pending = prod({ id: "pending", sku: "pending", unitPrice: 0, dataSource: "verified" });
  // Give the priced line a manual override so the total is deterministic without loading the
  // pricing provider; the pending line has no override → quoted "price on request".
  const base = {
    cart: { priced: { product: priced, qty: 2 }, pending: { product: pending, qty: 5 } },
    priceOverrides: { priced: 100 } as Record<string, number>,
    customers: [],
    activeCustomerId: null,
  } as unknown as ProductFinderState;

  it("excludes price-on-request lines from the subtotal", () => {
    expect(selectCartTotal(base)).toBe(200); // 100×2; the $0 pending line contributes nothing
  });

  it("counts the price-on-request lines", () => {
    expect(selectPendingPriceCount(base)).toBe(1);
  });

  it("a manual override turns a pending line into a normal priced line", () => {
    const withOverride = {
      ...base,
      priceOverrides: { priced: 100, pending: 7 },
    } as unknown as ProductFinderState;
    expect(selectPendingPriceCount(withOverride)).toBe(0);
    expect(selectCartTotal(withOverride)).toBe(200 + 7 * 5); // pending now priced at the override
  });
});
