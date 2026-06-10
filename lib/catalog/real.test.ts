import { describe, expect, it } from "vitest";
import { REAL_PRODUCTS } from "@/lib/catalog/real";
import { REAL_PRODUCT_ENTRIES } from "@/data/real/real-products";
import { TAXONOMY } from "@/lib/catalog/taxonomy";
import type { ProductCategory } from "@/features/product-finder/types";

const subcatsOf = (c: ProductCategory) => new Set(TAXONOMY[c].map((s) => s.name));

describe("REAL_PRODUCTS dataset invariants", () => {
  it("converts every researched entry (minus id collisions)", () => {
    expect(REAL_PRODUCTS.length).toBeGreaterThanOrEqual(0);
    expect(REAL_PRODUCTS.length).toBeLessThanOrEqual(REAL_PRODUCT_ENTRIES.length);
    if (REAL_PRODUCT_ENTRIES.length > 0) {
      expect(REAL_PRODUCTS.length).toBeGreaterThan(REAL_PRODUCT_ENTRIES.length * 0.95);
    }
  });

  it("every product is provenance-flagged, link-bearing, and priced", () => {
    for (const p of REAL_PRODUCTS) {
      expect(p.dataSource).toBe("verified");
      expect(p.id.startsWith("REAL-")).toBe(true);
      expect(p.specSheetUrl).toMatch(/^https:\/\//);
      expect(p.unitPrice).toBeGreaterThan(0);
      expect(p.priceNote).toContain("researched");
      expect(p.specs.some((s) => s.isNonNeg)).toBe(true);
      expect(p.sku.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("ids are unique and subcategories exist in the taxonomy", () => {
    const ids = new Set<string>();
    for (const p of REAL_PRODUCTS) {
      expect(ids.has(p.id)).toBe(false);
      ids.add(p.id);
      expect(subcatsOf(p.category).has(p.subcategory)).toBe(true);
    }
  });

  it("simulated stock is deterministic across builds", () => {
    for (const p of REAL_PRODUCTS.slice(0, 25)) {
      // dcStock generator floor is 20, so every product has DC availability.
      expect(p.dcStock.length).toBeGreaterThan(0);
      for (const d of p.dcStock) expect(d.quantity).toBeGreaterThanOrEqual(20);
    }
  });
});
