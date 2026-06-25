import { describe, it, expect } from "vitest";
import { resolveBySku } from "@/lib/catalog/sku-index";
import { searchCatalog } from "@/lib/catalog/search";
import { BOM_PRODUCTS } from "@/data/real/bom-products";

/**
 * Part-number search guardrail — reps search/quote by part number, not name, and they
 * use BOTH the manufacturer part number AND the Wesco stock number. This proves every
 * part-number identity resolves and that an exact part number wins outright.
 */

describe("part-number search (mfr + Wesco numbers)", () => {
  it("the BOM data carries both identities for every part", () => {
    expect(BOM_PRODUCTS.length).toBeGreaterThanOrEqual(40);
    for (const p of BOM_PRODUCTS) {
      expect(p.mpn.trim().length).toBeGreaterThan(0);
      expect(p.wescoSku).toMatch(/^\d{6,}$/); // Wesco stock numbers are digit strings
    }
    const skus = BOM_PRODUCTS.map((p) => p.mpn.toUpperCase());
    expect(new Set(skus).size).toBe(skus.length); // no duplicate part numbers
  });

  it("resolves a MANUFACTURER part number to the exact part", () => {
    expect(resolveBySku("461")?.sku).toBe("461");
    expect(resolveBySku("461")?.brand).toMatch(/Crouse-Hinds/);
    expect(resolveBySku("5075S")?.brand).toMatch(/Appleton/);
  });

  it("resolves a WESCO stock number to the same part (the rep convention)", () => {
    const byWesco = resolveBySku("78456410461");
    expect(byWesco).not.toBeNull();
    expect(byWesco?.sku).toBe("461"); // the Crouse-Hinds 461 fitting
    expect(byWesco?.wescoSku).toBe("78456410461");
  });

  it("free-text search finds a part by its Wesco SKU", () => {
    const r = searchCatalog({ text: "78456410461", pageSize: 5 });
    expect(r.total).toBeGreaterThan(0);
    expect(r.items[0]?.sku).toBe("461");
  });

  it("an exact manufacturer part number ranks first (not a fuzzy substring)", () => {
    const r = searchCatalog({ text: "461", pageSize: 5 });
    expect(r.items[0]?.sku).toBe("461");
  });
});
