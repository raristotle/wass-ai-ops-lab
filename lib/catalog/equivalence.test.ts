import { describe, it, expect } from "vitest";
import {
  isFunctionalEquivalent, functionalEquivalents, sharedNonNegCount,
} from "@/lib/catalog/equivalence";
import { getCatalog } from "@/lib/catalog/index";
import type { CatalogProduct, ProductSpec } from "@/features/product-finder/types";

function make(id: string, subcategory: string, specs: ProductSpec[], extra: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id, sku: id, name: id, brand: "B", category: "electrical", subcategory,
    description: "", unitPrice: 10, uom: "EA", specs, preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "⚡", ...extra,
  };
}

// Canonical keys for Circuit Breakers (from taxonomy): Amperage, Voltage, Poles.
const A = make("a", "Circuit Breakers", [
  { name: "Amperage", value: "20A", isNonNeg: true },
  { name: "Voltage", value: "120/240V", isNonNeg: true },
  { name: "Poles", value: "1-Pole", isNonNeg: true },
  { name: "Int. Rating", value: "22kAIC", isNonNeg: true }, // datasheet extra — ignored for equivalence
  { name: "Color", value: "Black" },
]);

describe("isFunctionalEquivalent", () => {
  it("is true on matching canonical keys even when datasheet extras differ (brand/price/IC/color)", () => {
    const b = make("b", "Circuit Breakers", [
      { name: "Amperage", value: "20A", isNonNeg: true },
      { name: "Voltage", value: "120/240V", isNonNeg: true },
      { name: "Poles", value: "1-Pole", isNonNeg: true },
      { name: "Int. Rating", value: "65kAIC", isNonNeg: true }, // differs — still equivalent
      { name: "Color", value: "White" },
    ], { brand: "Eaton", unitPrice: 99 });
    expect(isFunctionalEquivalent(A, b)).toBe(true);
  });

  it("is false when a canonical key differs", () => {
    const b = make("b", "Circuit Breakers", [
      { name: "Amperage", value: "15A", isNonNeg: true },
      { name: "Voltage", value: "120/240V", isNonNeg: true },
      { name: "Poles", value: "1-Pole", isNonNeg: true },
    ]);
    expect(isFunctionalEquivalent(A, b)).toBe(false);
  });

  it("is false across different subcategories", () => {
    const b = make("b", "Fuses", [{ name: "Amperage", value: "20A", isNonNeg: true }]);
    expect(isFunctionalEquivalent(A, b)).toBe(false);
  });

  it("is false for the product itself and when a canonical key is missing", () => {
    expect(isFunctionalEquivalent(A, A)).toBe(false);
    const noKey = make("n", "Circuit Breakers", [{ name: "Color", value: "Black" }]);
    expect(isFunctionalEquivalent(noKey, A)).toBe(false);
  });
});

describe("sharedNonNegCount", () => {
  it("counts matching canonical key specs", () => {
    const b = make("b", "Circuit Breakers", [
      { name: "Amperage", value: "20A", isNonNeg: true },
      { name: "Voltage", value: "277/480V", isNonNeg: true },
      { name: "Poles", value: "1-Pole", isNonNeg: true },
    ]);
    expect(sharedNonNegCount(A, b)).toBe(2); // amperage + poles match, voltage doesn't
  });
});

describe("functionalEquivalents (over the real catalog)", () => {
  const ref = getCatalog().products.find((p) => p.subcategory === "Circuit Breakers")!;

  it("returns only true functional equivalents", () => {
    const eq = functionalEquivalents(ref, 8);
    expect(eq.length).toBeGreaterThan(0);
    expect(eq.every((p) => isFunctionalEquivalent(ref, p))).toBe(true);
  });

  it("excludes the reference product", () => {
    expect(functionalEquivalents(ref, 8).some((p) => p.id === ref.id)).toBe(false);
  });
});
