import { describe, it, expect } from "vitest";
import { CATEGORIES, TAXONOMY, ALL_SUBCATEGORIES, ALL_BRANDS, CATEGORY_META } from "@/lib/catalog/taxonomy";

describe("taxonomy", () => {
  it("defines all 6 categories", () => {
    expect(CATEGORIES).toEqual([
      "electrical", "datacom", "oem-electrical", "av", "security", "safety",
    ]);
  });

  it("every category has a label, icon, and at least 2 subcategories", () => {
    for (const cat of CATEGORIES) {
      expect(CATEGORY_META[cat].label.length).toBeGreaterThan(0);
      expect(CATEGORY_META[cat].icon.length).toBeGreaterThan(0);
      expect(TAXONOMY[cat].length).toBeGreaterThanOrEqual(2);
    }
  });

  it("every subcategory has brands and at least one non-negotiable spec", () => {
    for (const cat of CATEGORIES) {
      for (const sub of TAXONOMY[cat]) {
        expect(sub.brands.length).toBeGreaterThan(0);
        expect(sub.specs.some((s) => s.isNonNeg)).toBe(true);
        expect(sub.specs.every((s) => s.values.length > 0)).toBe(true);
      }
    }
  });

  it("has rich subcategory coverage — more than 40 subcategories", () => {
    expect(ALL_SUBCATEGORIES.length).toBeGreaterThan(40);
  });

  it("ALL_SUBCATEGORIES and ALL_BRANDS are sorted, unique, non-empty", () => {
    expect(ALL_SUBCATEGORIES.length).toBeGreaterThan(10);
    expect(new Set(ALL_SUBCATEGORIES).size).toBe(ALL_SUBCATEGORIES.length);
    expect([...ALL_SUBCATEGORIES]).toEqual([...ALL_SUBCATEGORIES].sort());
    expect(ALL_BRANDS.length).toBeGreaterThan(10);
    expect(new Set(ALL_BRANDS).size).toBe(ALL_BRANDS.length);
  });
});
