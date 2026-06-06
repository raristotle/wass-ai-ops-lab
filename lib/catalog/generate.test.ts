import { describe, it, expect } from "vitest";
import { generateCatalog, CATALOG_SIZE } from "@/lib/catalog/generate";
import { CATEGORIES } from "@/lib/catalog/taxonomy";

describe("generateCatalog", () => {
  it("is deterministic — same products on every call", () => {
    const a = generateCatalog(500);
    const b = generateCatalog(500);
    expect(a.map((p) => p.id)).toEqual(b.map((p) => p.id));
    expect(a.map((p) => p.sku)).toEqual(b.map((p) => p.sku));
  });

  it("generates the requested size", () => {
    expect(generateCatalog(500)).toHaveLength(500);
  });

  it("default CATALOG_SIZE is 50000", () => {
    expect(CATALOG_SIZE).toBe(50000);
  });

  it("electrical dominates — more than 65% of products are electrical", () => {
    const cat = generateCatalog(10000);
    const electrical = cat.filter((p) => p.category === "electrical").length;
    expect(electrical / cat.length).toBeGreaterThan(0.65);
  });

  it("covers all 6 categories", () => {
    const cats = new Set(generateCatalog(2000).map((p) => p.category));
    for (const c of CATEGORIES) expect(cats.has(c)).toBe(true);
  });

  it("has unique ids and skus", () => {
    const cat = generateCatalog(3000);
    expect(new Set(cat.map((p) => p.id)).size).toBe(cat.length);
    expect(new Set(cat.map((p) => p.sku)).size).toBe(cat.length);
  });

  it("folds in the 46 featured curated products", () => {
    const cat = generateCatalog(2000);
    expect(cat.some((p) => p.id === "CB-SQD-QO115")).toBe(true);
  });

  it("every product has valid shape", () => {
    for (const p of generateCatalog(300)) {
      expect(p.id).toBeTruthy();
      expect(p.sku).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.unitPrice).toBeGreaterThan(0);
      expect(Array.isArray(p.specs)).toBe(true);
      expect(p.specs.length).toBeGreaterThan(0);
      expect(p.specs.some((s) => s.isNonNeg)).toBe(true);
      expect(typeof p.preferred).toBe("boolean");
      expect(p.imageIcon).toBeTruthy();
    }
  });
});
