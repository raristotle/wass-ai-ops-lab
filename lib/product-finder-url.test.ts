import { describe, it, expect } from "vitest";
import type { FilterState, SortKey } from "@/features/product-finder/types";
import {
  emptyFilterState,
  decodeFiltersFromQuery,
  hasFilterParams,
  buildShareQuery,
  categoryShareQuery,
  subcategoryShareQuery,
} from "@/lib/product-finder-url";

// Sets don't deep-equal usefully across encode/decode — compare via sorted arrays.
function normalize(f: FilterState) {
  return {
    ...f,
    categories: [...f.categories].sort(),
    subcategories: [...f.subcategories].sort(),
    brands: [...f.brands].sort(),
  };
}

function expectRoundTrip(state: FilterState) {
  const decoded = decodeFiltersFromQuery(buildShareQuery(state, 24, ""));
  expect(normalize(decoded)).toEqual(normalize(state));
}

describe("emptyFilterState", () => {
  it("returns the canonical defaults", () => {
    const f = emptyFilterState();
    expect(f.query).toBe("");
    expect(f.categories.size).toBe(0);
    expect(f.subcategories.size).toBe(0);
    expect(f.brands.size).toBe(0);
    expect(f.onlyBranchStock).toBe(false);
    expect(f.onlyDCStock).toBe(false);
    expect(f.onlyPreferred).toBe(false);
    expect(f.priceMin).toBeNull();
    expect(f.priceMax).toBeNull();
    expect(f.sortKey).toBe("relevance");
    expect(f.viewMode).toBe("list");
    expect(f.specFilters).toEqual({});
    expect(f.specRanges).toEqual({});
  });

  it("returns fresh instances (no shared Sets/objects)", () => {
    const a = emptyFilterState();
    const b = emptyFilterState();
    expect(a.categories).not.toBe(b.categories);
    expect(a.specFilters).not.toBe(b.specFilters);
  });
});

describe("round-trips: decode(buildShareQuery(s)) ≡ s", () => {
  it("empty state round-trips to emptyFilterState()", () => {
    expectRoundTrip(emptyFilterState());
  });

  it("multi-value Sets: 2 categories + 3 brands + 2 subcategories", () => {
    const s = emptyFilterState();
    s.categories.add("electrical");
    s.categories.add("datacom");
    s.brands.add("Square D");
    s.brands.add("Eaton");
    s.brands.add("Leviton");
    s.subcategories.add("Circuit Breakers");
    s.subcategories.add("Ethernet Cable");
    expectRoundTrip(s);
  });

  it("specFilters including a value containing a comma", () => {
    const s = emptyFilterState();
    s.specFilters = {
      Amperage: ["15A", "20A"],
      Finish: ["Galvanized, Hot-Dip"],
    };
    expectRoundTrip(s);
  });

  it("specRanges: min-only, max-only, and both", () => {
    const s = emptyFilterState();
    s.specRanges = {
      Amperage: { min: 15 },
      Wattage: { max: 600 },
      Voltage: { min: 120, max: 480 },
    };
    expectRoundTrip(s);
  });

  it("priceMin and priceMax", () => {
    const s = emptyFilterState();
    s.priceMin = 10;
    s.priceMax = 99.5;
    expectRoundTrip(s);
  });

  it("query text and stock/preferred toggles", () => {
    const s = emptyFilterState();
    s.query = "20a breaker & more";
    s.onlyBranchStock = true;
    s.onlyDCStock = true;
    s.onlyPreferred = true;
    expectRoundTrip(s);
  });

  it("onlyActive and onlyWithCrosses toggles round-trip (v3-S2 #6)", () => {
    const s = emptyFilterState();
    s.onlyActive = true;
    s.onlyWithCrosses = true;
    expectRoundTrip(s);
  });

  it("every sortKey round-trips (incl. the v3-S2 #6 column sorts)", () => {
    const keys: SortKey[] = [
      "relevance", "preferred", "branchStock", "priceLow", "priceHigh", "brand",
      "nameAsc", "skuAsc", "dcStock", "crosses", "subcatAsc", "uomAsc", "lifecycleActive",
    ];
    for (const k of keys) {
      const s = emptyFilterState();
      s.sortKey = k;
      expectRoundTrip(s);
    }
  });
});

describe("decodeFiltersFromQuery — junk tolerance", () => {
  it("'?bogus=1&category=notreal&sort=zzz' → defaults", () => {
    const decoded = decodeFiltersFromQuery("?bogus=1&category=notreal&sort=zzz");
    expect(normalize(decoded)).toEqual(normalize(emptyFilterState()));
  });

  it("drops unknown category values but keeps valid ones", () => {
    const decoded = decodeFiltersFromQuery("category=electrical,notreal,datacom");
    expect([...decoded.categories].sort()).toEqual(["datacom", "electrical"]);
  });

  it("accepts both leading-'?' and bare inputs", () => {
    const withQ = decodeFiltersFromQuery("?q=breaker");
    const bare = decodeFiltersFromQuery("q=breaker");
    expect(withQ.query).toBe("breaker");
    expect(bare.query).toBe("breaker");
  });

  it("viewMode is always the default and page/pageSize are ignored", () => {
    const decoded = decodeFiltersFromQuery("?q=x&page=5&pageSize=48&viewMode=grid");
    expect(decoded.viewMode).toBe("list");
    expect(decoded.query).toBe("x");
  });

  it("empty input → defaults", () => {
    expect(normalize(decodeFiltersFromQuery(""))).toEqual(normalize(emptyFilterState()));
    expect(normalize(decodeFiltersFromQuery("?"))).toEqual(normalize(emptyFilterState()));
  });
});

describe("hasFilterParams", () => {
  it("cart-only → false", () => {
    expect(hasFilterParams("?cart=eyJsIjpbXX0")).toBe(false);
  });

  it("filters-only → true", () => {
    expect(hasFilterParams("?q=breaker")).toBe(true);
    expect(hasFilterParams("category=electrical")).toBe(true);
    expect(hasFilterParams("?subcategory=Conduit")).toBe(true);
    expect(hasFilterParams("?brand=Eaton")).toBe(true);
    expect(hasFilterParams("?onlyBranchStock=true")).toBe(true);
    expect(hasFilterParams("?onlyDCStock=true")).toBe(true);
    expect(hasFilterParams("?onlyPreferred=true")).toBe(true);
    expect(hasFilterParams("?priceMin=5")).toBe(true);
    expect(hasFilterParams("?priceMax=50")).toBe(true);
    expect(hasFilterParams("?sort=priceLow")).toBe(true);
  });

  it("neither → false", () => {
    expect(hasFilterParams("")).toBe(false);
    expect(hasFilterParams("?")).toBe(false);
    expect(hasFilterParams("?bogus=1")).toBe(false);
  });

  it("spec.Amperage → true; specmin./specmax. → true", () => {
    expect(hasFilterParams("?spec.Amperage=15A")).toBe(true);
    expect(hasFilterParams("?specmin.Amperage=15")).toBe(true);
    expect(hasFilterParams("?specmax.Wattage=600")).toBe(true);
  });

  it("page/pageSize-only → false", () => {
    expect(hasFilterParams("?page=2&pageSize=24")).toBe(false);
    expect(hasFilterParams("?cart=abc&page=2&pageSize=24")).toBe(false);
  });
});

describe("buildShareQuery — cart preservation", () => {
  it("preserves cart=<v> from the current search", () => {
    const q = buildShareQuery(emptyFilterState(), 24, "?cart=eyJsIjpbXX0&page=3");
    const sp = new URLSearchParams(q);
    expect(sp.get("cart")).toBe("eyJsIjpbXX0");
    expect(sp.get("page")).toBe("0"); // share links always start at page 0
  });

  it("omits cart when absent from the current search", () => {
    const q = buildShareQuery(emptyFilterState(), 24, "?page=3");
    expect(new URLSearchParams(q).get("cart")).toBeNull();
  });

  it("URL-encodes a cart value safely", () => {
    const q = buildShareQuery(emptyFilterState(), 24, "?cart=a%2Bb%3D%3D");
    expect(new URLSearchParams(q).get("cart")).toBe("a+b==");
  });
});

describe("categoryShareQuery", () => {
  it("decodes back to a single-category filter state", () => {
    const decoded = decodeFiltersFromQuery(categoryShareQuery("security"));
    expect([...decoded.categories]).toEqual(["security"]);
    const expected = emptyFilterState();
    expected.categories.add("security");
    expect(normalize(decoded)).toEqual(normalize(expected));
  });

  it("counts as filter params", () => {
    expect(hasFilterParams(categoryShareQuery("av"))).toBe(true);
  });
});

describe("subcategoryShareQuery", () => {
  it("decodes back to a single-subcategory filter state (multi-word names survive)", () => {
    const decoded = decodeFiltersFromQuery(subcategoryShareQuery("Wire & Cable"));
    expect([...decoded.subcategories]).toEqual(["Wire & Cable"]);
    const expected = emptyFilterState();
    expected.subcategories.add("Wire & Cable");
    expect(normalize(decoded)).toEqual(normalize(expected));
  });

  it("counts as filter params", () => {
    expect(hasFilterParams(subcategoryShareQuery("Circuit Breakers"))).toBe(true);
  });
});
