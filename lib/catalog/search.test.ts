import { describe, it, expect } from "vitest";
import { searchCatalog } from "@/lib/catalog/search";

describe("searchCatalog", () => {
  it("paginates: total reflects all matches, items is one page", () => {
    const r = searchCatalog({ pageSize: 24, page: 0 });
    expect(r.total).toBe(60000);
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

    // Facets are over pre-specFilter set — Amperage facet should show ALL amp values,
    // not just 15A
    const ampFacet = r.facets.find((f) => f.name === "Amperage");
    expect(ampFacet).toBeDefined();
    expect(ampFacet!.values.length).toBeGreaterThan(1); // not just 15A
  });

  it("facets present even when no specFilters applied", () => {
    const r = searchCatalog({ filters: { subcategories: ["Circuit Breakers"] }, pageSize: 10 });
    expect(Array.isArray(r.facets)).toBe(true);
    expect(r.facets.length).toBeGreaterThan(0);
  });
});
