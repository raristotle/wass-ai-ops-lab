import { describe, it, expect } from "vitest";
import { summarizeFilters, hasAnyFilter } from "@/lib/product-finder-saved-search";
import { emptyFilterState } from "@/lib/product-finder-url";
import type { FilterState } from "@/features/product-finder/types";

const withFilters = (over: Partial<FilterState>): FilterState => ({ ...emptyFilterState(), ...over });

describe("summarizeFilters", () => {
  it("summarizes query, category, stock, and price", () => {
    const f = withFilters({
      query: "breaker",
      categories: new Set(["electrical"]),
      onlyBranchStock: true,
      priceMax: 50,
    });
    const s = summarizeFilters(f);
    expect(s).toContain("breaker");
    expect(s).toContain("electrical");
    expect(s).toContain("in stock");
    expect(s).toContain("≤$50");
  });

  it("falls back to 'All products' for the empty state", () => {
    expect(summarizeFilters(emptyFilterState())).toBe("All products");
  });

  it("renders a bounded price range and spec facets", () => {
    const f = withFilters({ priceMin: 10, priceMax: 100, specFilters: { Amperage: ["20A"] } });
    const s = summarizeFilters(f);
    expect(s).toContain("$10–$100");
    expect(s).toContain("Amperage: 20A");
  });
});

describe("hasAnyFilter", () => {
  it("is false for the empty state and true once a filter is set", () => {
    expect(hasAnyFilter(emptyFilterState())).toBe(false);
    expect(hasAnyFilter(withFilters({ query: "x" }))).toBe(true);
    expect(hasAnyFilter(withFilters({ onlyPreferred: true }))).toBe(true);
    expect(hasAnyFilter(withFilters({ brands: new Set(["Square D"]) }))).toBe(true);
  });
});
