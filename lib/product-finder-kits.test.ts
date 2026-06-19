import { describe, it, expect } from "vitest";
import { KIT_DEFS, kitRollup } from "@/lib/product-finder-kits";

describe("KIT_DEFS", () => {
  it("contains at least 6 kits", () => {
    expect(KIT_DEFS.length).toBeGreaterThanOrEqual(6);
  });

  it("every kit has a unique id", () => {
    const ids = KIT_DEFS.map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every kit has at least one required (non-optional) line", () => {
    for (const kit of KIT_DEFS) {
      const required = kit.lines.filter((l) => !l.optional);
      expect(required.length, `kit "${kit.id}" has no required lines`).toBeGreaterThan(0);
    }
  });

  it("every line has a non-empty searchQuery and subcategory", () => {
    for (const kit of KIT_DEFS) {
      for (const line of kit.lines) {
        expect(line.searchQuery.trim(), `kit ${kit.id} line "${line.label}" has empty searchQuery`).toBeTruthy();
        expect(line.subcategory.trim(), `kit ${kit.id} line "${line.label}" has empty subcategory`).toBeTruthy();
      }
    }
  });
});

describe("kitRollup", () => {
  const lines = [
    { def: { label: "A", searchQuery: "x", subcategory: "s", qty: 2 }, unitPrice: 10, inStock: true },
    { def: { label: "B", searchQuery: "y", subcategory: "s", qty: 1, optional: true }, unitPrice: 5, inStock: false },
  ];

  it("sums price × qty across all lines", () => {
    expect(kitRollup(lines).totalPrice).toBe(2 * 10 + 1 * 5);
  });

  it("inStock is true when all REQUIRED lines are in stock (optional OOS is ignored)", () => {
    expect(kitRollup(lines).inStock).toBe(true);
  });

  it("inStock is false when any required line is OOS", () => {
    const withOOS = [
      { def: { label: "A", searchQuery: "x", subcategory: "s", qty: 1 }, unitPrice: 10, inStock: false },
    ];
    expect(kitRollup(withOOS).inStock).toBe(false);
  });

  it("handles null unitPrice (unresolved line) by treating as 0", () => {
    const withNull = [
      { def: { label: "A", searchQuery: "x", subcategory: "s", qty: 3 }, unitPrice: null, inStock: true },
    ];
    expect(kitRollup(withNull).totalPrice).toBe(0);
  });
});
