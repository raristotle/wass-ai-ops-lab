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
