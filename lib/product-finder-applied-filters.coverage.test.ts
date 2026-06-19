import { describe, it, expect } from "vitest";
import { buildAppliedChips } from "@/lib/product-finder-applied-filters";
import type { FilterState, ParsedFilter, ProductCategory } from "@/features/product-finder/types";

/**
 * Coverage companion for product-finder-applied-filters.ts.
 *
 * The sibling .test.ts covers the happy-path label formatting and the
 * category/priceMax NL-omission. This file drives the branches it does NOT:
 *  - every coveredByNl() case (subcategory, brand, branchStock, preferred,
 *    priceMin) and the "kind I don't handle" default,
 *  - the onlyWithCrosses toggle and the onlyDCStock toggle (which is NOT
 *    NL-gated),
 *  - stable chip `id`s and full ordering across all groups,
 *  - the empty-spec-range fall-through label (bare spec name),
 *  - that NL coverage never suppresses a toggle the parser cannot represent.
 *
 * Pure + deterministic — no Date/Math/fetch — so assertions are exact.
 */

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
    onlyWithCrosses: false,
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
const ids = (chips: { id: string }[]) => chips.map((c) => c.id);

describe("buildAppliedChips — coveredByNl branches", () => {
  it("omits a subcategory facet an NL chip already set", () => {
    const nl: ParsedFilter[] = [
      { id: "n1", kind: "subcategory", label: "Circuit Breakers", value: "Circuit Breakers" },
    ];
    const chips = buildAppliedChips(
      base({ subcategories: new Set(["Circuit Breakers", "Fuses"]) }),
      nl,
    );
    // The NL-owned subcategory drops out; the other survives.
    expect(labels(chips)).toEqual(["Fuses"]);
  });

  it("omits a brand facet an NL chip already set", () => {
    const nl: ParsedFilter[] = [{ id: "n1", kind: "brand", label: "Square D", value: "Square D" }];
    const chips = buildAppliedChips(base({ brands: new Set(["Square D", "Eaton"]) }), nl);
    expect(labels(chips)).toEqual(["Eaton"]);
  });

  it("omits the branch-stock toggle when an NL branchStock chip owns it", () => {
    const nl: ParsedFilter[] = [
      { id: "n1", kind: "branchStock", label: "In stock at branch", value: true },
    ];
    const chips = buildAppliedChips(base({ onlyBranchStock: true }), nl);
    expect(labels(chips)).toEqual([]);
  });

  it("omits the preferred toggle when an NL preferred chip owns it", () => {
    const nl: ParsedFilter[] = [{ id: "n1", kind: "preferred", label: "Preferred only", value: true }];
    const chips = buildAppliedChips(base({ onlyPreferred: true }), nl);
    expect(labels(chips)).toEqual([]);
  });

  it("omits the price chip when an NL priceMin chip owns the price token", () => {
    const nl: ParsedFilter[] = [{ id: "n1", kind: "priceMin", label: "≥ $10", value: 10 }];
    // Even with a full min+max range set on the facets, the NL chip owns "price".
    const chips = buildAppliedChips(base({ priceMin: 10, priceMax: 99 }), nl);
    expect(labels(chips)).toEqual([]);
  });

  it("ignores NL kinds that map to no covered token (default branch)", () => {
    // A kind the switch does not enumerate must leave all facet chips intact.
    const nl = [{ id: "n1", kind: "weird", label: "?", value: "?" }] as unknown as ParsedFilter[];
    const chips = buildAppliedChips(base({ brands: new Set(["Eaton"]), priceMax: 50 }), nl);
    expect(labels(chips)).toEqual(["Eaton", "≤ $50"]);
  });
});

describe("buildAppliedChips — toggles not gated by NL", () => {
  it("emits the DC-stock toggle (the parser cannot represent it, so it is never suppressed)", () => {
    const chips = buildAppliedChips(base({ onlyDCStock: true }), []);
    expect(chips).toEqual([{ id: "dcStock", label: "In stock at DC", remove: { type: "dcStock" } }]);
  });

  it("emits the onlyWithCrosses chip", () => {
    const chips = buildAppliedChips(base({ onlyWithCrosses: true }), []);
    expect(chips).toEqual([
      { id: "withCrosses", label: "Documented crosses", remove: { type: "withCrosses" } },
    ]);
  });

  it("keeps DC-stock / active / crosses even when an NL chip covers other facets", () => {
    const nl: ParsedFilter[] = [
      { id: "n1", kind: "branchStock", label: "In stock at branch", value: true },
    ];
    const chips = buildAppliedChips(
      base({ onlyBranchStock: true, onlyDCStock: true, onlyActive: true, onlyWithCrosses: true }),
      nl,
    );
    // branchStock suppressed by NL; the three the parser can't represent remain.
    expect(labels(chips)).toEqual(["In stock at DC", "Active only", "Documented crosses"]);
  });
});

describe("buildAppliedChips — spec ranges edge cases", () => {
  it("falls through to the bare spec name when a range has neither bound", () => {
    const chips = buildAppliedChips(base({ specRanges: { Amperage: {} } }), []);
    expect(chips).toEqual([
      { id: "specRange:Amperage", label: "Amperage", remove: { type: "specRange", name: "Amperage" } },
    ]);
  });

  it("treats undefined bounds the same as missing (no NaN, no dash)", () => {
    const chips = buildAppliedChips(
      base({ specRanges: { Voltage: { min: undefined, max: undefined } } }),
      [],
    );
    expect(labels(chips)).toEqual(["Voltage"]);
  });
});

describe("buildAppliedChips — ids and full ordering", () => {
  it("produces stable, namespaced ids in the documented group order", () => {
    const chips = buildAppliedChips(
      base({
        categories: new Set(["electrical"] as ProductCategory[]),
        subcategories: new Set(["Fuses"]),
        brands: new Set(["Eaton"]),
        onlyBranchStock: true,
        onlyDCStock: true,
        onlyPreferred: true,
        onlyActive: true,
        onlyWithCrosses: true,
        priceMin: 5,
        priceMax: 25,
        specFilters: { Poles: ["1"] },
        specRanges: { Amperage: { min: 20, max: 60 } },
      }),
      [],
    );
    expect(ids(chips)).toEqual([
      "category:electrical",
      "subcategory:Fuses",
      "brand:Eaton",
      "branchStock",
      "dcStock",
      "preferred",
      "active",
      "withCrosses",
      "price",
      "spec:Poles:1",
      "specRange:Amperage",
    ]);
  });

  it("category chip carries the Category-prefixed label and category remove", () => {
    const chips = buildAppliedChips(
      base({ categories: new Set(["datacom"] as ProductCategory[]) }),
      [],
    );
    expect(chips[0]).toEqual({
      id: "category:datacom",
      label: "Category: datacom",
      remove: { type: "category", value: "datacom" },
    });
  });

  it("emits no price chip when both bounds are null (priceLabel returns null)", () => {
    // price is not NL-covered here, exercising the `if (pl)` false branch.
    const chips = buildAppliedChips(base({ onlyActive: true }), []);
    expect(labels(chips)).toEqual(["Active only"]);
  });
});
