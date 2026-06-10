import { describe, it, expect } from "vitest";
import { searchCatalog } from "@/lib/catalog/search";
import type { RangeFacet } from "@/features/product-finder/types";

describe("searchCatalog", () => {
  it("paginates: total reflects all matches, items is one page", () => {
    const r = searchCatalog({ pageSize: 24, page: 0 });
    expect(r.total).toBe(200000);
    expect(r.items).toHaveLength(24);
    expect(r.page).toBe(0);
  });

  it("page 1 returns the next slice, no overlap", () => {
    const a = searchCatalog({ pageSize: 10, page: 0 });
    const b = searchCatalog({ pageSize: 10, page: 1 });
    expect(a.items.map((p) => p.id)).not.toEqual(b.items.map((p) => p.id));
  });

  it("filters by category", () => {
    const r = searchCatalog({ filters: { categories: ["security"] }, pageSize: 50 });
    expect(r.items.every((p) => p.category === "security")).toBe(true);
    expect(r.total).toBeGreaterThan(0);
  });

  it("filters by onlyPreferred and priceMax", () => {
    const r = searchCatalog({ filters: { onlyPreferred: true, priceMax: 20 }, pageSize: 50 });
    expect(r.items.every((p) => p.preferred && p.unitPrice <= 20)).toBe(true);
  });

  it("text search matches the haystack", () => {
    const r = searchCatalog({ text: "circuit breaker", pageSize: 10 });
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.every((p) => /breaker/i.test(p.name + p.subcategory + p.description))).toBe(true);
  });

  it("sorts by priceLow", () => {
    const r = searchCatalog({ sort: "priceLow", pageSize: 20 });
    for (let i = 1; i < r.items.length; i++) {
      expect(r.items[i].unitPrice).toBeGreaterThanOrEqual(r.items[i - 1].unitPrice);
    }
  });

  it("multi-word tokenized AND: 'gfci receptacle' returns results", () => {
    const r = searchCatalog({ text: "gfci receptacle", pageSize: 24 });
    expect(r.total).toBeGreaterThan(0);
    r.items.forEach((p) => {
      const haystack = (p.name + " " + JSON.stringify(p.specs ?? {}) + " " + (p.description ?? "")).toLowerCase();
      const subcat = (p.subcategory ?? "").toLowerCase();
      expect(/gfci/.test(haystack) || /gfci/.test(subcat)).toBe(true);
      expect(/receptacle/.test(haystack) || /receptacle/.test(subcat)).toBe(true);
    });
  });

  it("multi-word tokenized AND: term order is irrelevant", () => {
    const forward = searchCatalog({ text: "gfci receptacle" });
    const backward = searchCatalog({ text: "receptacle gfci" });
    expect(forward.total).toBe(backward.total);
    expect(forward.total).toBeGreaterThan(0);
  });
});

// ─── specFilters + facets ──────────────────────────────────────────────────────

describe("searchCatalog – specFilters", () => {
  it("narrows results when a specFilter matches only a subset", () => {
    // Circuit Breakers have Amperage: 15A, 20A, 30A, 40A, 50A, 60A
    const all = searchCatalog({ filters: { categories: ["electrical"], subcategories: ["Circuit Breakers"] }, pageSize: 100 });
    const filtered = searchCatalog({
      filters: { categories: ["electrical"], subcategories: ["Circuit Breakers"], specFilters: { Amperage: ["15A"] } },
      pageSize: 100,
    });
    expect(filtered.total).toBeGreaterThan(0);
    expect(filtered.total).toBeLessThan(all.total);
    expect(filtered.items.every((p) => p.specs.some((s) => s.name === "Amperage" && s.value === "15A"))).toBe(true);
  });

  it("OR within a spec name: selecting two values returns products with either value", () => {
    const r15 = searchCatalog({
      filters: { subcategories: ["Circuit Breakers"], specFilters: { Amperage: ["15A"] } },
      pageSize: 200,
    });
    const r20 = searchCatalog({
      filters: { subcategories: ["Circuit Breakers"], specFilters: { Amperage: ["20A"] } },
      pageSize: 200,
    });
    const r1520 = searchCatalog({
      filters: { subcategories: ["Circuit Breakers"], specFilters: { Amperage: ["15A", "20A"] } },
      pageSize: 200,
    });
    expect(r1520.total).toBe(r15.total + r20.total);
  });

  it("AND across spec names: product must satisfy all spec name filters", () => {
    // Circuit breakers have both Amperage and Poles specs
    const ampOnly = searchCatalog({
      filters: { subcategories: ["Circuit Breakers"], specFilters: { Amperage: ["15A"] } },
      pageSize: 200,
    });
    const bothFilters = searchCatalog({
      filters: { subcategories: ["Circuit Breakers"], specFilters: { Amperage: ["15A"], Poles: ["1-Pole"] } },
      pageSize: 200,
    });
    // AND: result must be <= amp-only count
    expect(bothFilters.total).toBeGreaterThan(0);
    expect(bothFilters.total).toBeLessThanOrEqual(ampOnly.total);
    expect(bothFilters.items.every((p) =>
      p.specs.some((s) => s.name === "Amperage" && s.value === "15A") &&
      p.specs.some((s) => s.name === "Poles" && s.value === "1-Pole")
    )).toBe(true);
  });

  it("specFilters with empty values array is ignored (no narrowing)", () => {
    const base = searchCatalog({ filters: { subcategories: ["Circuit Breakers"] }, pageSize: 100 });
    const noNarrow = searchCatalog({
      filters: { subcategories: ["Circuit Breakers"], specFilters: { Amperage: [] } },
      pageSize: 100,
    });
    expect(noNarrow.total).toBe(base.total);
  });

  it("response includes facets array computed over pre-specFilter matched set", () => {
    const r = searchCatalog({
      filters: { subcategories: ["Circuit Breakers"], specFilters: { Amperage: ["15A"] } },
      pageSize: 10,
    });

    expect(Array.isArray(r.facets)).toBe(true);
    expect(r.facets.length).toBeGreaterThan(0);

    // Facets are over pre-specFilter set — Amperage facet should cover ALL amp values.
    // Amperage is now a RANGE facet (numeric), so we check it has min < max (not just 15).
    const ampFacet = r.facets.find((f) => f.name === "Amperage");
    expect(ampFacet).toBeDefined();
    // Amperage is a numeric spec → should be a range facet spanning the full pre-filter range
    expect(ampFacet!.type).toBe("range");
    const ampRange = ampFacet as RangeFacet;
    // Range covers more than just 15 (pre-filter base has 15A, 20A, 30A, 40A, 50A, 60A)
    expect(ampRange.max).toBeGreaterThan(ampRange.min);
    expect(ampRange.max).toBeGreaterThan(15); // not just 15A
  });

  it("facets present even when no specFilters applied", () => {
    const r = searchCatalog({ filters: { subcategories: ["Circuit Breakers"] }, pageSize: 10 });
    expect(Array.isArray(r.facets)).toBe(true);
    expect(r.facets.length).toBeGreaterThan(0);
  });
});

// ─── specRanges – range filtering ─────────────────────────────────────────────

describe("searchCatalog – specRanges", () => {
  it("range min-only: filters out products below the minimum", () => {
    const base = searchCatalog({
      filters: { subcategories: ["Circuit Breakers"] },
      pageSize: 500,
    });
    const filtered = searchCatalog({
      filters: { subcategories: ["Circuit Breakers"], specRanges: { Amperage: { min: 30 } } },
      pageSize: 500,
    });
    expect(filtered.total).toBeGreaterThan(0);
    expect(filtered.total).toBeLessThan(base.total);
    // Every matched product must have a numeric Amperage >= 30
    expect(filtered.items.every((p) => {
      const spec = p.specs.find((s) => s.name === "Amperage");
      if (!spec) return false;
      const match = spec.value.match(/(\d+)/);
      return match ? parseInt(match[1]) >= 30 : false;
    })).toBe(true);
  });

  it("range max-only: filters out products above the maximum", () => {
    const filtered = searchCatalog({
      filters: { subcategories: ["Circuit Breakers"], specRanges: { Amperage: { max: 20 } } },
      pageSize: 500,
    });
    expect(filtered.total).toBeGreaterThan(0);
    // Every matched product must have Amperage <= 20
    expect(filtered.items.every((p) => {
      const spec = p.specs.find((s) => s.name === "Amperage");
      if (!spec) return false;
      const match = spec.value.match(/(\d+)/);
      return match ? parseInt(match[1]) <= 20 : false;
    })).toBe(true);
  });

  it("range both min and max (inclusive bounds): only products in [min,max] pass", () => {
    const filtered = searchCatalog({
      filters: { subcategories: ["Circuit Breakers"], specRanges: { Amperage: { min: 20, max: 30 } } },
      pageSize: 500,
    });
    expect(filtered.total).toBeGreaterThan(0);
    expect(filtered.items.every((p) => {
      const spec = p.specs.find((s) => s.name === "Amperage");
      if (!spec) return false;
      const match = spec.value.match(/(\d+)/);
      if (!match) return false;
      const v = parseInt(match[1]);
      return v >= 20 && v <= 30;
    })).toBe(true);
  });

  it("inclusive lower bound: a product with value exactly at min is included", () => {
    const filtered = searchCatalog({
      filters: { subcategories: ["Circuit Breakers"], specRanges: { Amperage: { min: 15, max: 15 } } },
      pageSize: 500,
    });
    // 15A exactly at min (and max) must be included
    expect(filtered.total).toBeGreaterThan(0);
    expect(filtered.items.every((p) => p.specs.some((s) => s.name === "Amperage" && s.value === "15A"))).toBe(true);
  });

  it("products lacking the ranged spec are excluded by range filter", () => {
    // Query across both electrical (Circuit Breakers have Amperage) and datacom
    // subcategories (e.g. Ethernet Cable — no Amperage spec at all).
    // When Amperage: { min:15, max:20 } is active:
    //   1. results are non-empty (electrical products satisfy the range)
    //   2. every returned item has an Amperage spec whose parsed value is in [15,20]
    //   3. no returned item is from a datacom subcategory that lacks Amperage
    //      (products without the ranged spec must be excluded, not passed through)
    const withRange = searchCatalog({
      filters: {
        subcategories: ["Circuit Breakers", "Ethernet Cable"],
        specRanges: { Amperage: { min: 15, max: 20 } },
      },
      pageSize: 500,
    });

    // Must be non-empty — proves the filter isn't just discarding everything.
    expect(withRange.total).toBeGreaterThan(0);

    // Every result must have a parseable Amperage within [15, 20].
    // This assertion fails if the range logic were removed or inverted.
    expect(withRange.items.every((p) => {
      const spec = p.specs.find((s) => s.name === "Amperage");
      if (!spec) return false; // products without the spec must not appear
      const parsed = parseFloat(spec.value);
      return Number.isFinite(parsed) && parsed >= 15 && parsed <= 20;
    })).toBe(true);

    // No result should be from "Ethernet Cable" — those products carry no
    // Amperage spec and must be excluded when a range filter is active.
    expect(withRange.items.every((p) => p.subcategory !== "Ethernet Cable")).toBe(true);
  });

  it("AND with enum specFilters: both must narrow simultaneously", () => {
    const rangeOnly = searchCatalog({
      filters: { subcategories: ["Circuit Breakers"], specRanges: { Amperage: { min: 15, max: 20 } } },
      pageSize: 500,
    });
    const combined = searchCatalog({
      filters: {
        subcategories: ["Circuit Breakers"],
        specFilters: { Poles: ["1-Pole"] },
        specRanges: { Amperage: { min: 15, max: 20 } },
      },
      pageSize: 500,
    });
    expect(combined.total).toBeGreaterThan(0);
    expect(combined.total).toBeLessThanOrEqual(rangeOnly.total);
    // Every result must satisfy both conditions
    expect(combined.items.every((p) => {
      const hasPoles = p.specs.some((s) => s.name === "Poles" && s.value === "1-Pole");
      const ampSpec = p.specs.find((s) => s.name === "Amperage");
      const match = ampSpec?.value.match(/(\d+)/);
      const inRange = match ? parseInt(match[1]) >= 15 && parseInt(match[1]) <= 20 : false;
      return hasPoles && inRange;
    })).toBe(true);
  });

  it("facets are computed over the base set (before specRanges): Amperage range facet spans full range", () => {
    const filtered = searchCatalog({
      filters: {
        subcategories: ["Circuit Breakers"],
        specRanges: { Amperage: { min: 30, max: 30 } },
      },
      pageSize: 10,
    });

    const ampFacet = filtered.facets.find((f) => f.name === "Amperage");
    expect(ampFacet).toBeDefined();
    expect(ampFacet!.type).toBe("range");
    const ampRange = ampFacet as RangeFacet;
    // Should span the full pre-filter range (15–60), not just 30
    expect(ampRange.min).toBe(15);
    expect(ampRange.max).toBe(60);
  });

  it("specRanges entry with no bounds (both undefined) does not narrow results", () => {
    const base = searchCatalog({ filters: { subcategories: ["Circuit Breakers"] }, pageSize: 500 });
    const noNarrow = searchCatalog({
      filters: { subcategories: ["Circuit Breakers"], specRanges: { Amperage: {} } },
      pageSize: 500,
    });
    expect(noNarrow.total).toBe(base.total);
  });
});
