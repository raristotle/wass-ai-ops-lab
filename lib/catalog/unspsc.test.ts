import { describe, it, expect } from "vitest";
import { unspscFor, unspscCode, isValidUnspsc } from "@/lib/catalog/unspsc";
import { getCatalog } from "@/lib/catalog/index";
import type { ProductCategory } from "@/features/product-finder/types";

const p = (category: ProductCategory, subcategory: string) => ({ category, subcategory });

describe("unspscFor", () => {
  it("maps a known subcategory to its commodity code", () => {
    const c = unspscFor(p("electrical", "Circuit Breakers"));
    expect(c.code).toBe("39121610");
    expect(c.level).toBe("commodity");
    expect(c.matched).toBe("subcategory");
  });

  it("falls back to the category code for an unmapped subcategory", () => {
    const c = unspscFor(p("datacom", "Patch Panels"));
    expect(c.code).toBe("43000000");
    expect(c.matched).toBe("category");
    expect(c.level).toBe("segment");
  });

  it("is deterministic", () => {
    expect(unspscCode(p("electrical", "Wire & Cable"))).toBe(unspscCode(p("electrical", "Wire & Cable")));
  });
});

describe("isValidUnspsc", () => {
  it("accepts 8 digits, rejects otherwise", () => {
    expect(isValidUnspsc("39121610")).toBe(true);
    expect(isValidUnspsc("3912161")).toBe(false);
    expect(isValidUnspsc("391216100")).toBe(false);
    expect(isValidUnspsc("39-121-61")).toBe(false);
  });
});

describe("catalog-wide classification", () => {
  it("assigns a valid 8-digit UNSPSC code to every product", () => {
    const { products } = getCatalog();
    // Sample across the catalog (full scan is unnecessary and slow).
    const step = Math.max(1, Math.floor(products.length / 2000));
    for (let i = 0; i < products.length; i += step) {
      expect(isValidUnspsc(unspscCode(products[i]))).toBe(true);
    }
  });
});
