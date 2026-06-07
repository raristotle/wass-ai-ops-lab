import { describe, it, expect } from "vitest";
import { TAXONOMY, CATEGORIES } from "@/lib/catalog/taxonomy";
import {
  GLYPH_IDS,
  SUBCATEGORY_GLYPH,
  CATEGORY_GLYPH,
  glyphIdFor,
} from "@/lib/product-finder-glyph-map";

describe("SUBCATEGORY_GLYPH", () => {
  it("has an explicit glyph for every taxonomy subcategory", () => {
    for (const category of CATEGORIES) {
      for (const sub of TAXONOMY[category]) {
        expect(SUBCATEGORY_GLYPH[sub.name], `missing glyph for "${sub.name}"`).toBeDefined();
      }
    }
  });

  it("only references glyph IDs that exist in the vocabulary", () => {
    const ids = new Set<string>(GLYPH_IDS);
    for (const [sub, glyph] of Object.entries(SUBCATEGORY_GLYPH)) {
      expect(ids.has(glyph), `"${sub}" → unknown glyph "${glyph}"`).toBe(true);
    }
  });

  it("has no stale entries for subcategories not in the taxonomy", () => {
    const known = new Set(CATEGORIES.flatMap((c) => TAXONOMY[c].map((s) => s.name)));
    for (const sub of Object.keys(SUBCATEGORY_GLYPH)) {
      expect(known.has(sub), `stale glyph entry "${sub}"`).toBe(true);
    }
  });
});

describe("glyphIdFor", () => {
  it("resolves a mapped subcategory", () => {
    expect(glyphIdFor("Circuit Breakers", "electrical")).toBe("breaker");
  });

  it("falls back to the category glyph for unknown subcategories", () => {
    for (const category of CATEGORIES) {
      expect(glyphIdFor("Not A Real Subcategory", category)).toBe(CATEGORY_GLYPH[category]);
    }
  });
});
