import { describe, it, expect } from "vitest";
import { findEquivalents } from "@/lib/catalog/equivalents";
import { getCatalog } from "@/lib/catalog/index";

describe("findEquivalents", () => {
  const product = getCatalog().products.find((p) => p.subcategory === "Circuit Breakers")!; // 20k catalog always contains Circuit Breakers

  it("excludes the product itself", () => {
    expect(findEquivalents(product, 8).some((p) => p.id === product.id)).toBe(false);
  });
  it("returns up to k results, all same subcategory when possible", () => {
    const r = findEquivalents(product, 8);
    expect(r.length).toBeGreaterThan(0);
    expect(r.length).toBeLessThanOrEqual(8);
    expect(r.every((p) => p.subcategory === product.subcategory)).toBe(true);
  });
});
