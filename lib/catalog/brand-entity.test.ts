import { describe, it, expect } from "vitest";
import {
  brandEntityFor,
  resolveBrandAlias,
  siblingBrands,
  entityCoverage,
  validateEntities,
  expandBrandAliases,
} from "@/lib/catalog/brand-entity";
import { BRAND_ENTITY_ENTRIES } from "@/data/real/brand-entities";

describe("brand-entity dataset", () => {
  it("has a meaningful number of real entries", () => {
    expect(BRAND_ENTITY_ENTRIES.length).toBeGreaterThan(100);
  });

  it("passes structural validation (https sources, valid LEIs, no dup brands)", () => {
    expect(validateEntities(BRAND_ENTITY_ENTRIES)).toEqual([]);
  });

  it("every LEI present is the 20-char GLEIF format", () => {
    for (const e of BRAND_ENTITY_ENTRIES) {
      if (e.lei) expect(e.lei, e.brand).toMatch(/^[A-Z0-9]{20}$/);
    }
  });
});

describe("brandEntityFor", () => {
  it("resolves a known catalog brand (case-insensitive)", () => {
    const first = BRAND_ENTITY_ENTRIES[0];
    expect(brandEntityFor(first.brand)?.brand).toBe(first.brand);
    expect(brandEntityFor(first.brand.toUpperCase())?.brand).toBe(first.brand);
  });
  it("returns null for an unmodeled brand", () => {
    expect(brandEntityFor("Definitely Not A Real Brand ZZZ")).toBeNull();
  });
});

describe("resolveBrandAlias", () => {
  it("resolves a former name to its canonical brand", () => {
    const withFormer = BRAND_ENTITY_ENTRIES.find((e) => e.formerNames.length > 0)!;
    expect(withFormer).toBeDefined();
    expect(resolveBrandAlias(withFormer.formerNames[0])).toBe(withFormer.brand);
  });
  it("resolves an alias to its canonical brand", () => {
    const withAlias = BRAND_ENTITY_ENTRIES.find((e) => e.aliases.length > 0)!;
    expect(resolveBrandAlias(withAlias.aliases[0])).toBeTruthy();
  });
  it("a real catalog brand resolves to itself", () => {
    const b = BRAND_ENTITY_ENTRIES[0].brand;
    expect(resolveBrandAlias(b)).toBe(b);
  });
  it("returns null for an unknown name", () => {
    expect(resolveBrandAlias("nonexistent-zzz")).toBeNull();
  });
});

describe("siblingBrands", () => {
  it("groups catalog brands under the same ultimate parent", () => {
    // Find a parent shared by at least two brands.
    const byParent = new Map<string, string[]>();
    for (const e of BRAND_ENTITY_ENTRIES) {
      const p = e.ultimateParent || e.parentCompany;
      if (!p) continue;
      byParent.set(p, [...(byParent.get(p) ?? []), e.brand]);
    }
    const shared = [...byParent.entries()].find(([, brands]) => brands.length >= 2);
    expect(shared).toBeDefined();
    const [, brands] = shared!;
    const sibs = siblingBrands(brands[0]);
    expect(sibs).toContain(brands[1]);
    expect(sibs).not.toContain(brands[0]); // excludes itself
  });
});

describe("expandBrandAliases (search lift)", () => {
  it("appends the canonical brand when a former name appears in the query", () => {
    const withFormer = BRAND_ENTITY_ENTRIES.find((e) => e.formerNames.some((n) => n.length >= 4))!;
    const former = withFormer.formerNames.find((n) => n.length >= 4)!;
    const out = expandBrandAliases(`${former} 20A breaker`);
    expect(out.brands).toContain(withFormer.brand);
    expect(out.text.toLowerCase()).toContain(withFormer.brand.toLowerCase());
  });
  it("leaves an unrelated query unchanged", () => {
    const out = expandBrandAliases("20 amp circuit breaker");
    expect(out.text).toBe("20 amp circuit breaker");
    expect(out.brands).toEqual([]);
  });
});

describe("entityCoverage", () => {
  it("counts parent / LEI / alias coverage over a brand set", () => {
    const brands = BRAND_ENTITY_ENTRIES.slice(0, 20).map((e) => e.brand);
    const cov = entityCoverage(brands);
    expect(cov.total).toBe(20);
    expect(cov.withParent).toBeGreaterThan(0);
  });
});
