import { describe, it, expect } from "vitest";
import { buildAppliedChips } from "@/lib/product-finder-applied-filters";
import type { FilterState, ParsedFilter, ProductCategory } from "@/features/product-finder/types";

function base(overrides: Partial<FilterState> = {}): FilterState {
  return {
    query: "",
    categories: new Set<ProductCategory>(),
    subcategories: new Set<string>(),
    brands: new Set<string>(),
    onlyBranchStock: false,
    onlyDCStock: false,
    onlyPreferred: false,
    onlyActive: false,
    priceMin: null,
    priceMax: null,
    sortKey: "relevance",
    viewMode: "grid",
    specFilters: {},
    specRanges: {},
    ...overrides,
  };
}

const labels = (chips: { label: string }[]) => chips.map((c) => c.label);

describe("buildAppliedChips", () => {
  it("returns nothing when no facets are active", () => {
    expect(buildAppliedChips(base(), [])).toEqual([]);
  });

  it("emits chips for categories, subcategories and brands", () => {
    const chips = buildAppliedChips(
      base({
        categories: new Set(["electrical"] as ProductCategory[]),
        subcategories: new Set(["Circuit Breakers"]),
        brands: new Set(["Square D"]),
      }),
      [],
    );
    expect(labels(chips)).toEqual(["Category: electrical", "Circuit Breakers", "Square D"]);
  });

  it("emits chips for the boolean toggles", () => {
    const chips = buildAppliedChips(
      base({ onlyBranchStock: true, onlyDCStock: true, onlyPreferred: true, onlyActive: true }),
      [],
    );
    expect(labels(chips)).toEqual(["In stock at branch", "In stock at DC", "Preferred only", "Active only"]);
  });

  it("formats the price chip for both-bounds, max-only and min-only", () => {
    expect(labels(buildAppliedChips(base({ priceMin: 10, priceMax: 50 }), []))).toEqual(["$10–$50"]);
    expect(labels(buildAppliedChips(base({ priceMax: 50 }), []))).toEqual(["≤ $50"]);
    expect(labels(buildAppliedChips(base({ priceMin: 10 }), []))).toEqual(["≥ $10"]);
  });

  it("emits a chip per spec value and per numeric range", () => {
    const chips = buildAppliedChips(
      base({ specFilters: { Poles: ["1", "2"] }, specRanges: { Amperage: { min: 20, max: 60 } } }),
      [],
    );
    expect(labels(chips)).toEqual(["Poles: 1", "Poles: 2", "Amperage 20–60"]);
  });

  it("formats one-sided spec ranges with ≥ / ≤ (never a bare dash)", () => {
    expect(labels(buildAppliedChips(base({ specRanges: { Amperage: { min: 20 } } }), []))).toEqual(["Amperage ≥ 20"]);
    expect(labels(buildAppliedChips(base({ specRanges: { Amperage: { max: 60 } } }), []))).toEqual(["Amperage ≤ 60"]);
  });

  it("omits a facet already represented by a natural-language chip (no duplicate)", () => {
    const nl: ParsedFilter[] = [
      { id: "n1", kind: "category", label: "Circuit Breakers", value: "electrical" },
      { id: "n2", kind: "priceMax", label: "≤ $50", value: 50 },
    ];
    const chips = buildAppliedChips(
      base({
        categories: new Set(["electrical"] as ProductCategory[]), // set by the NL chip → omit
        brands: new Set(["Eaton"]), // not from NL → keep
        priceMax: 50, // set by the NL chip → omit
      }),
      nl,
    );
    expect(labels(chips)).toEqual(["Eaton"]);
  });

  it("remove descriptors carry the data the bar needs to undo each filter", () => {
    const chips = buildAppliedChips(base({ brands: new Set(["Eaton"]), specFilters: { Poles: ["2"] } }), []);
    expect(chips[0].remove).toEqual({ type: "brand", value: "Eaton" });
    expect(chips[1].remove).toEqual({ type: "spec", name: "Poles", value: "2" });
  });
});
