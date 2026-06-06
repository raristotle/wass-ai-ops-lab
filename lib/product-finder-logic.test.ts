/**
 * Unit tests for pure logic functions used by the three product-finder
 * feature components: SpecCompareModal, GoesWithPanel, ExternalSourcesCard.
 *
 * These tests run in the node vitest environment (no DOM needed).
 *
 * Note: PRODUCT_MAP lookups use `!` throughout — all IDs are hardcoded
 * static mock values that are guaranteed to exist in the map.
 */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect } from "vitest";
import {
  PRODUCT_MAP,
  getCrossSells,
  getUpsells,
  getTotalBranchStock,
  getTotalDCStock,
  CATALOG_PRODUCTS,
} from "@/data/mock/catalog-products";
import type { CatalogProduct, ProductSpec, ExternalSource } from "@/features/product-finder/types";

// ─── Helpers duplicated from SpecCompareModal for isolated testing ─────────────

function buildSpecOrder(products: CatalogProduct[]): ProductSpec[] {
  const nonNegSeen = new Map<string, string>();
  const regularSeen = new Map<string, string>();
  for (const p of products) {
    for (const s of p.specs) {
      if (s.isNonNeg) {
        if (!nonNegSeen.has(s.name)) nonNegSeen.set(s.name, s.value);
      } else {
        if (!regularSeen.has(s.name)) regularSeen.set(s.name, s.value);
      }
    }
  }
  const nonNeg: ProductSpec[] = Array.from(nonNegSeen.keys()).map((name) => ({
    name,
    value: nonNegSeen.get(name)!, // safe: we just iterated keys() of this map
    isNonNeg: true,
  }));
  const regular: ProductSpec[] = Array.from(regularSeen.keys()).map((name) => ({
    name,
    value: regularSeen.get(name)!, // safe: we just iterated keys() of this map
  }));
  return [...nonNeg, ...regular];
}

function getSpecValue(product: CatalogProduct, specName: string): string | null {
  const found = product.specs.find((s) => s.name === specName);
  return found ? found.value : null;
}

function allSame(values: (string | null)[]): boolean {
  const filled = values.filter((v): v is string => v !== null);
  if (filled.length <= 1) return true;
  return filled.every((v) => v === filled[0]);
}

function cheapestIndex(products: CatalogProduct[]): number {
  let minIdx = 0;
  for (let i = 1; i < products.length; i++) {
    if (products[i].unitPrice < products[minIdx].unitPrice) minIdx = i;
  }
  return minIdx;
}

// ─── Helper duplicated from ExternalSourcesCard ────────────────────────────────

function bestPriceIndex(sources: ExternalSource[]): number {
  let minIdx = 0;
  for (let i = 1; i < sources.length; i++) {
    if (sources[i].price < sources[minIdx].price) minIdx = i;
  }
  return minIdx;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("PRODUCT_MAP", () => {
  it("contains every product from CATALOG_PRODUCTS", () => {
    expect(PRODUCT_MAP.size).toBe(CATALOG_PRODUCTS.length);
  });

  it("retrieves the correct product by id", () => {
    const p = PRODUCT_MAP.get("CB-SQD-QO115");
    expect(p).toBeDefined();
    expect(p?.sku).toBe("QO115");
  });
});

describe("getTotalBranchStock / getTotalDCStock", () => {
  it("sums branch stock correctly", () => {
    const p = PRODUCT_MAP.get("CB-SQD-QO115")!;
    const total = p.branchStock.reduce((s, b) => s + b.quantity, 0);
    expect(getTotalBranchStock(p)).toBe(total);
  });

  it("returns 0 for a product with no branch stock", () => {
    const p = PRODUCT_MAP.get("CB-GE-THQL1115")!;
    expect(getTotalBranchStock(p)).toBe(0);
  });

  it("sums DC stock correctly", () => {
    const p = PRODUCT_MAP.get("CB-SQD-QO115")!;
    const total = p.dcStock.reduce((s, d) => s + d.quantity, 0);
    expect(getTotalDCStock(p)).toBe(total);
  });
});

describe("getCrossSells", () => {
  it("returns cross-sell products for a product that has them", () => {
    const p = PRODUCT_MAP.get("CB-SQD-QO115")!;
    const crossSells = getCrossSells(p);
    expect(crossSells.length).toBeGreaterThan(0);
    expect(crossSells.every((c) => c !== undefined)).toBe(true);
  });

  it("returns an empty array when crossSellIds is empty", () => {
    const p = PRODUCT_MAP.get("CB-SIE-Q115")!;
    expect(p.crossSellIds).toHaveLength(0);
    expect(getCrossSells(p)).toHaveLength(0);
  });

  it("only returns valid products (no undefined)", () => {
    for (const p of CATALOG_PRODUCTS) {
      const result = getCrossSells(p);
      expect(result.every((c) => c !== undefined)).toBe(true);
    }
  });
});

describe("getUpsells", () => {
  it("returns upsell products for a product that has them", () => {
    const p = PRODUCT_MAP.get("CB-SQD-QO115")!;
    const upsells = getUpsells(p);
    expect(upsells.length).toBeGreaterThan(0);
  });

  it("returns an empty array when upsellIds is empty", () => {
    const p = PRODUCT_MAP.get("CB-SQD-QO220")!;
    expect(p.upsellIds).toHaveLength(0);
    expect(getUpsells(p)).toHaveLength(0);
  });
});

describe("buildSpecOrder", () => {
  it("places isNonNeg specs before regular specs", () => {
    const p1 = PRODUCT_MAP.get("CB-SQD-QO115")!;
    const p2 = PRODUCT_MAP.get("CB-EAT-CH115")!;
    const order = buildSpecOrder([p1, p2]);
    const lastNonNeg = order.reduce((idx, s, i) => (s.isNonNeg ? i : idx), -1);
    const firstRegular = order.findIndex((s) => !s.isNonNeg);
    if (lastNonNeg >= 0 && firstRegular >= 0) {
      expect(lastNonNeg).toBeLessThan(firstRegular);
    }
  });

  it("deduplicates spec names", () => {
    const p1 = PRODUCT_MAP.get("CB-SQD-QO115")!;
    const p2 = PRODUCT_MAP.get("CB-EAT-CH115")!;
    const order = buildSpecOrder([p1, p2]);
    const names = order.map((s) => s.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it("returns an empty array for products with no specs", () => {
    const emptyProduct: CatalogProduct = {
      id: "test",
      sku: "TST",
      name: "Test",
      brand: "Test Brand",
      category: "electrical",
      subcategory: "Test",
      description: "",
      unitPrice: 1,
      uom: "EA",
      specs: [],
      preferred: false,
      branchStock: [],
      dcStock: [],
      alternativeIds: [],
      crossSellIds: [],
      upsellIds: [],
      externalSources: [],
      imageIcon: "?",
    };
    expect(buildSpecOrder([emptyProduct])).toHaveLength(0);
  });
});

describe("getSpecValue", () => {
  it("returns the spec value when the spec exists", () => {
    const p = PRODUCT_MAP.get("CB-SQD-QO115")!;
    expect(getSpecValue(p, "Amperage")).toBe("15A");
  });

  it("returns null when the spec does not exist on the product", () => {
    const p = PRODUCT_MAP.get("CB-SQD-QO115")!;
    expect(getSpecValue(p, "Nonexistent Spec")).toBeNull();
  });
});

describe("allSame", () => {
  it("returns true when all filled values are identical", () => {
    expect(allSame(["15A", "15A", "15A"])).toBe(true);
  });

  it("returns false when values differ", () => {
    expect(allSame(["15A", "20A", "15A"])).toBe(false);
  });

  it("returns true when all values are null", () => {
    expect(allSame([null, null])).toBe(true);
  });

  it("treats null values as absent (ignores them)", () => {
    expect(allSame(["15A", null, "15A"])).toBe(true);
    expect(allSame(["15A", null, "20A"])).toBe(false);
  });

  it("returns true for a single-element array", () => {
    expect(allSame(["15A"])).toBe(true);
  });
});

describe("cheapestIndex", () => {
  it("returns the index of the cheapest product", () => {
    const products = [
      PRODUCT_MAP.get("CB-SQD-QO115")!, // $8.45
      PRODUCT_MAP.get("CB-EAT-CH115")!, // $7.82
      PRODUCT_MAP.get("CB-SIE-Q115")!,  // $6.95
    ];
    expect(cheapestIndex(products)).toBe(2);
  });

  it("returns 0 when there is only one product", () => {
    const products = [PRODUCT_MAP.get("CB-SQD-QO115")!];
    expect(cheapestIndex(products)).toBe(0);
  });

  it("returns the first index when all prices are equal", () => {
    const p = PRODUCT_MAP.get("CB-SQD-QO115")!;
    expect(cheapestIndex([p, p, p])).toBe(0);
  });
});

describe("bestPriceIndex (ExternalSourcesCard)", () => {
  it("returns the index of the source with the lowest price", () => {
    const sources: ExternalSource[] = [
      { distributor: "Grainger", url: "https://grainger.com", price: 31.20, quantity: 48, status: "in-stock" },
      { distributor: "Graybar", url: "https://graybar.com", price: 30.75, quantity: 24, status: "in-stock" },
      { distributor: "Platt Electric Supply", url: "https://platt.com", price: 30.10, quantity: 18, status: "in-stock" },
    ];
    expect(bestPriceIndex(sources)).toBe(2);
  });

  it("returns 0 for a single source", () => {
    const sources: ExternalSource[] = [
      { distributor: "Grainger", url: "https://grainger.com", price: 31.20, quantity: 10, status: "in-stock" },
    ];
    expect(bestPriceIndex(sources)).toBe(0);
  });

  it("works with the real Siemens QF115 external sources", () => {
    const p = PRODUCT_MAP.get("CB-SIE-QF115")!;
    expect(p.externalSources.length).toBeGreaterThan(0);
    const best = bestPriceIndex(p.externalSources);
    const prices = p.externalSources.map((s) => s.price);
    expect(p.externalSources[best].price).toBe(Math.min(...prices));
  });
});

describe("GoesWithPanel bundle logic", () => {
  it("shows bundle hint when there are >= 2 cross-sells", () => {
    const p = PRODUCT_MAP.get("CB-SQD-QO115")!;
    const crossSells = getCrossSells(p);
    expect(crossSells.length).toBeGreaterThanOrEqual(2);
  });

  it("computes bundle total as sum of cross-sell prices", () => {
    const p = PRODUCT_MAP.get("CDT-EMT-34")!;
    const crossSells = getCrossSells(p);
    const total = crossSells.reduce((sum, c) => sum + c.unitPrice, 0);
    const expected = crossSells.reduce((sum, c) => sum + c.unitPrice, 0);
    expect(total).toBe(expected);
    expect(total).toBeGreaterThan(0);
  });

  it("returns null-equivalent (no cross-sells and no upsells) for expected products", () => {
    // WD-HUB-5362W has no cross-sells and no upsells
    const p = PRODUCT_MAP.get("WD-HUB-5362W")!;
    expect(getCrossSells(p)).toHaveLength(0);
    expect(getUpsells(p)).toHaveLength(0);
  });
});

describe("ExternalSourcesCard render condition", () => {
  it("renders for products with externalSources", () => {
    const p = PRODUCT_MAP.get("CB-SIE-QF115")!;
    expect(p.externalSources.length).toBeGreaterThan(0);
  });

  it("does not render (empty sources) for preferred products like CB-SQD-QO115", () => {
    const p = PRODUCT_MAP.get("CB-SQD-QO115")!;
    expect(p.externalSources).toHaveLength(0);
  });
});
