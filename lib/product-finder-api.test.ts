import { describe, it, expect } from "vitest";
import { filtersToQuery } from "@/lib/product-finder-api";
import { parseSearchQuery } from "@/lib/catalog/schemas";
import type { FilterState } from "@/features/product-finder/types";

/** Minimal valid FilterState with only the fields needed for the round-trip test */
function makeFilters(
  specFilters: Record<string, string[]>,
  specRanges: Record<string, { min?: number; max?: number }> = {}
): FilterState {
  return {
    query: "",
    categories: new Set(),
    subcategories: new Set(),
    brands: new Set(),
    onlyBranchStock: false,
    onlyDCStock: false,
    onlyPreferred: false,
    priceMin: null,
    priceMax: null,
    sortKey: "relevance",
    viewMode: "list",
    specFilters,
    specRanges,
  };
}

describe("filtersToQuery → parseSearchQuery round-trip (spec name encoding)", () => {
  it("round-trips multi-word spec names and special-char values without double-encoding", () => {
    const inputSpecFilters: Record<string, string[]> = {
      "Mount Type": ["Wall Mount"],
      "Amperage": ["15A", "20A"],
      'Trade Size': ['3/4"'],
    };

    const filters = makeFilters(inputSpecFilters);
    const qs = filtersToQuery(filters, 0, 24);

    // Parse the query string via URLSearchParams then parseSearchQuery — exactly as the server does
    const sp = new URLSearchParams(qs);
    const parsed = parseSearchQuery(sp);

    expect(parsed.filters.specFilters).toEqual(inputSpecFilters);
  });

  it("spec names with spaces are NOT percent-encoded in the raw query string key", () => {
    // Verifies the fix: the key in the serialized query string must decode to the original name.
    // Before fix: key was 'spec.Mount%2520Type' (double-encoded), so after one URLSearchParams
    // decode the key would still contain a literal '%20', not a space.
    const filters = makeFilters({ "Mount Type": ["Wall Mount"] });
    const qs = filtersToQuery(filters, 0, 24);
    const sp = new URLSearchParams(qs);

    // URLSearchParams.get decodes once — we should get back 'Wall Mount' for key 'spec.Mount Type'
    const rawVal = sp.get("spec.Mount Type");
    // The value is encodeURIComponent'd per-value; 'Wall Mount' has no special chars so it survives as-is
    expect(rawVal).not.toBeNull();
  });

  it("values with special chars (slash and double-quote) survive the round-trip", () => {
    const filters = makeFilters({ "Trade Size": ['3/4"'] });
    const qs = filtersToQuery(filters, 0, 24);
    const sp = new URLSearchParams(qs);
    const parsed = parseSearchQuery(sp);

    expect(parsed.filters.specFilters?.["Trade Size"]).toEqual(['3/4"']);
  });

  it("multi-value spec filter round-trips correctly", () => {
    const filters = makeFilters({ "Coil Voltage": ["24V", "120V"] });
    const qs = filtersToQuery(filters, 0, 24);
    const sp = new URLSearchParams(qs);
    const parsed = parseSearchQuery(sp);

    expect(parsed.filters.specFilters?.["Coil Voltage"]).toEqual(["24V", "120V"]);
  });
});

// ─── specRanges round-trip ─────────────────────────────────────────────────────

describe("filtersToQuery → parseSearchQuery round-trip (specRanges)", () => {
  it("round-trips a specRange with both min and max", () => {
    const filters = makeFilters({}, { Amperage: { min: 15, max: 30 } });
    const qs = filtersToQuery(filters, 0, 24);
    const sp = new URLSearchParams(qs);
    const parsed = parseSearchQuery(sp);

    expect(parsed.filters.specRanges?.["Amperage"]).toEqual({ min: 15, max: 30 });
  });

  it("round-trips a specRange with min only", () => {
    const filters = makeFilters({}, { Voltage: { min: 120 } });
    const qs = filtersToQuery(filters, 0, 24);
    const sp = new URLSearchParams(qs);
    const parsed = parseSearchQuery(sp);

    expect(parsed.filters.specRanges?.["Voltage"]).toEqual({ min: 120 });
    expect(parsed.filters.specRanges?.["Voltage"]?.max).toBeUndefined();
  });

  it("round-trips a specRange with max only", () => {
    const filters = makeFilters({}, { Wattage: { max: 600 } });
    const qs = filtersToQuery(filters, 0, 24);
    const sp = new URLSearchParams(qs);
    const parsed = parseSearchQuery(sp);

    expect(parsed.filters.specRanges?.["Wattage"]).toEqual({ max: 600 });
    expect(parsed.filters.specRanges?.["Wattage"]?.min).toBeUndefined();
  });

  it("multi-word spec name in specRange round-trips without double-encoding", () => {
    const filters = makeFilters({}, { "Output Current": { min: 16, max: 48 } });
    const qs = filtersToQuery(filters, 0, 24);
    const sp = new URLSearchParams(qs);
    const parsed = parseSearchQuery(sp);

    expect(parsed.filters.specRanges?.["Output Current"]).toEqual({ min: 16, max: 48 });
  });

  it("multiple specRange entries all survive the round-trip", () => {
    const filters = makeFilters(
      {},
      {
        Amperage: { min: 15, max: 30 },
        Lumens: { min: 3300 },
        kVA: { max: 75 },
      }
    );
    const qs = filtersToQuery(filters, 0, 24);
    const sp = new URLSearchParams(qs);
    const parsed = parseSearchQuery(sp);

    expect(parsed.filters.specRanges?.["Amperage"]).toEqual({ min: 15, max: 30 });
    expect(parsed.filters.specRanges?.["Lumens"]).toEqual({ min: 3300 });
    expect(parsed.filters.specRanges?.["kVA"]).toEqual({ max: 75 });
  });
});
