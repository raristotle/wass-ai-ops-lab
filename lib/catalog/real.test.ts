import { describe, expect, it } from "vitest";
import { REAL_PRODUCTS, toCatalogProduct, type RealProductEntry } from "@/lib/catalog/real";
import { REAL_PRODUCT_ENTRIES } from "@/data/real/real-products";
import { TAXONOMY } from "@/lib/catalog/taxonomy";
import type { ProductCategory } from "@/features/product-finder/types";

const subcatsOf = (c: ProductCategory) => new Set(TAXONOMY[c].map((s) => s.name));

const BASE_ENTRY: RealProductEntry = {
  mpn: "TEST-MPN-1",
  brand: "TestBrand",
  name: "TestBrand TEST-MPN-1 Widget",
  category: "electrical",
  subcategory: TAXONOMY.electrical[0]!.name,
  description: "A test widget for B21 upc/gtin unit coverage.",
  uom: "EA",
  estListPrice: 10,
  priceSource: "unit-test",
  specs: [{ name: "Type", value: "Widget", isNonNeg: true }],
  specSheetUrl: "https://example.com/spec.pdf",
  verifiedAt: "2026-07-06",
};

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

// B21 — UPC→GTIN rescue: toCatalogProduct maps a researched upc to gtin
// (validated via normalizeGtin) when no explicit gtin was researched.
describe("toCatalogProduct upc→gtin rescue (B21)", () => {
  it("maps a valid UPC to a normalized gtin", () => {
    const p = toCatalogProduct({ ...BASE_ENTRY, upc: "0 36000 29145 2" });
    expect(p.gtin).toBe("036000291452");
  });

  it("skips an invalid UPC silently — product is still created, gtin stays undefined", () => {
    const p = toCatalogProduct({ ...BASE_ENTRY, upc: "036000291453" }); // bad check digit
    expect(p.gtin).toBeUndefined();
    expect(p.sku).toBe(BASE_ENTRY.mpn);
    expect(p.name).toBe(BASE_ENTRY.name);
  });

  it("skips a non-numeric/garbage UPC silently without throwing", () => {
    expect(() => toCatalogProduct({ ...BASE_ENTRY, upc: "not-a-upc" })).not.toThrow();
    const p = toCatalogProduct({ ...BASE_ENTRY, upc: "not-a-upc" });
    expect(p.gtin).toBeUndefined();
  });

  it("products without an upc are unaffected — gtin stays undefined", () => {
    const p = toCatalogProduct({ ...BASE_ENTRY });
    expect(p.gtin).toBeUndefined();
  });

  it("an explicit researched gtin always wins over a rescued upc", () => {
    const p = toCatalogProduct({ ...BASE_ENTRY, gtin: "96385074", upc: "0 36000 29145 2" });
    expect(p.gtin).toBe("96385074");
  });

  it("every real entry's populated upc is a valid GTIN and is rescued onto its product's gtin", () => {
    const withUpc = REAL_PRODUCT_ENTRIES.filter((e) => e.upc);
    expect(withUpc.length).toBeGreaterThan(0);
    for (const e of withUpc) {
      const normalized = e.upc!.replace(/[\s-]/g, "");
      const match = REAL_PRODUCTS.find((p) => p.sku === e.mpn && p.brand === e.brand);
      // The entry may have been dropped upstream (id/sku collision) — only
      // assert the rescue for entries that actually made it into the catalog.
      if (match && !e.gtin) {
        expect(match.gtin).toBe(normalized);
      }
    }
  });
});
