import { describe, it, expect } from "vitest";
import { buildRefineChips } from "@/lib/product-finder-refine";
import type { Facet, EnumFacet } from "@/features/product-finder/types";

const specFacets: Facet[] = [
  { type: "enum", name: "Voltage", values: [{ value: "277/480V", count: 412 }, { value: "120/240V", count: 90 }] },
  { type: "range", name: "Amperage", unit: "A", min: 15, max: 200 }, // range facets are ignored
];
const refineFacets: EnumFacet[] = [
  { type: "enum", name: "Brand", values: [{ value: "Square D", count: 188 }, { value: "Eaton", count: 70 }] },
  { type: "enum", name: "Subcategory", values: [{ value: "Circuit Breakers", count: 903 }] },
];
const noneApplied = { specFilters: {}, brands: [] as string[], subcategories: [] as string[] };

describe("buildRefineChips", () => {
  it("surfaces the top value from each facet first, ranked by count (diversity + signal)", () => {
    const chips = buildRefineChips(specFacets, refineFacets, noneApplied, 6);
    // Round 0 (top of each facet) ranked by count: Subcategory 903, Voltage 412, Brand 188.
    expect(chips.slice(0, 3)).toEqual([
      { kind: "subcategory", name: "Subcategory", value: "Circuit Breakers", count: 903 },
      { kind: "spec", name: "Voltage", value: "277/480V", count: 412 },
      { kind: "brand", name: "Brand", value: "Square D", count: 188 },
    ]);
  });

  it("then takes each facet's next value in later rounds", () => {
    const chips = buildRefineChips(specFacets, refineFacets, noneApplied, 6);
    // Round 1: Voltage 120/240V (90), Brand Eaton (70) — Subcategory has no 2nd value.
    expect(chips.slice(3)).toEqual([
      { kind: "spec", name: "Voltage", value: "120/240V", count: 90 },
      { kind: "brand", name: "Brand", value: "Eaton", count: 70 },
    ]);
  });

  it("excludes already-applied brand/subcategory/spec values", () => {
    const chips = buildRefineChips(specFacets, refineFacets, {
      specFilters: { Voltage: ["277/480V"] },
      brands: ["Square D"],
      subcategories: ["Circuit Breakers"],
    });
    const labels = chips.map((c) => `${c.kind}:${c.value}`);
    expect(labels).not.toContain("brand:Square D");
    expect(labels).not.toContain("subcategory:Circuit Breakers");
    expect(labels).not.toContain("spec:277/480V");
    expect(labels).toContain("spec:120/240V");
    expect(labels).toContain("brand:Eaton");
  });

  it("respects the max cap", () => {
    expect(buildRefineChips(specFacets, refineFacets, noneApplied, 2)).toHaveLength(2);
  });

  it("returns nothing when there are no facets", () => {
    expect(buildRefineChips([], [], noneApplied)).toEqual([]);
  });
});
