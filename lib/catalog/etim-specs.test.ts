import { describe, it, expect } from "vitest";
import { etimClassFor, etimCoverage } from "@/lib/catalog/etim-specs";
import { ETIM_CLASS_ENTRIES } from "@/data/real/etim-classes";
import type { CatalogProduct } from "@/features/product-finder/types";

function product(subcategory: string, specNames: string[]): CatalogProduct {
  return {
    id: "p1", sku: "SKU1", name: "Test", brand: "Square D", category: "electrical",
    subcategory, description: "", unitPrice: 10, uom: "EA",
    specs: specNames.map((n) => ({ name: n, value: "x" })),
    preferred: false, branchStock: [], dcStock: [], externalSources: [], imageIcon: "🔌",
  } as unknown as CatalogProduct;
}

describe("ETIM dataset", () => {
  it("maps many subcategories with non-empty required features", () => {
    expect(ETIM_CLASS_ENTRIES.length).toBeGreaterThan(30);
    for (const c of ETIM_CLASS_ENTRIES) {
      expect(c.requiredFeatures.length, c.subcategory).toBeGreaterThan(0);
      expect(["high", "medium", "low"]).toContain(c.confidence);
    }
  });
});

describe("etimClassFor", () => {
  it("resolves a known electrical subcategory", () => {
    const cb = etimClassFor("Circuit Breakers");
    expect(cb).not.toBeNull();
    expect(cb!.requiredFeatures.join(" ").toLowerCase()).toContain("pole");
  });
  it("returns null for an unmapped subcategory", () => {
    expect(etimClassFor("Nonexistent Subcat ZZZ")).toBeNull();
  });
});

describe("etimCoverage", () => {
  it("matches a breaker's amperage/poles/voltage specs to ETIM required features", () => {
    const cov = etimCoverage(product("Circuit Breakers", ["Amperage", "Poles", "Voltage"]))!;
    expect(cov).not.toBeNull();
    expect(cov.classCode).toMatch(/EC\d+/);
    expect(cov.coveragePct).toBeGreaterThan(0);
    // current / poles / voltage should all be recognized as present.
    expect(cov.present.length).toBeGreaterThanOrEqual(3);
  });
  it("a product with no matching specs has low coverage + a full missing list", () => {
    const cov = etimCoverage(product("Circuit Breakers", []))!;
    expect(cov.present).toEqual([]);
    expect(cov.missing.length).toBe(cov.required.length);
    expect(cov.coveragePct).toBe(0);
  });
  it("returns null for an unmapped subcategory", () => {
    expect(etimCoverage(product("Nonexistent Subcat ZZZ", ["x"]))).toBeNull();
  });
});
