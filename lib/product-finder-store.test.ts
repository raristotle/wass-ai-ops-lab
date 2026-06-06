import { describe, it, expect, beforeEach, vi } from "vitest";
import { useProductFinder, selectCartCount, selectCartTotal, hydrateSavedState } from "@/lib/product-finder-store";
import { WESCO_PRODUCTS } from "@/data/mock/wesco-products";
import { tierUnitPrice } from "@/lib/product-finder-pricing";

// ─── Fetch mock ───────────────────────────────────────────────────────────────

// detail mock echoes whatever product was last set here, with a companion equivalents list
let detailProduct: unknown = null;
let detailEquivalents: unknown[] = [];

// search mock — configurable so tests can verify what runSearch returns
let searchItems: unknown[] = [];
let searchTotal = 0;

globalThis.fetch = vi.fn(async (url: string | URL) => {
  const u = String(url);
  if (u.includes("/api/products/search")) {
    return { ok: true, json: async () => ({ items: searchItems, total: searchTotal, page: 0, pageSize: 24 }) } as Response;
  }
  // detail endpoint — returns the product set by tests so activeProduct enriches correctly
  return { ok: true, json: async () => ({ product: detailProduct, equivalents: detailEquivalents }) } as Response;
}) as typeof fetch;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resetStore() {
  useProductFinder.setState({
    cart: {},
    cartOpen: false,
    user: null,
    authError: null,
    query: "",
    bomMode: false,
    bomText: "",
    bomLines: [],
    activeProduct: null,
    compareIds: new Set(),
    compareModalOpen: false,
    detailModalProduct: null,
    results: [],
    appliedNlFilters: [],
    favorites: [],
    favoriteSnapshots: {},
    recentSnapshots: {},
    recentlyViewed: [],
    searchHistory: [],
    loading: false,
    error: null,
    page: 0,
    total: 0,
    pageSize: 24,
    filters: {
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
    },
  });
}

// ─── selectCartCount ──────────────────────────────────────────────────────────

describe("selectCartCount", () => {
  beforeEach(resetStore);

  it("returns 0 for an empty cart", () => {
    const state = useProductFinder.getState();
    expect(selectCartCount(state)).toBe(0);
  });

  it("returns total quantity across multiple items", () => {
    const p1 = WESCO_PRODUCTS[0];
    const p2 = WESCO_PRODUCTS[1];
    useProductFinder.getState().addToCart(p1, 3);
    useProductFinder.getState().addToCart(p2, 7);
    const state = useProductFinder.getState();
    expect(selectCartCount(state)).toBe(10);
  });

  it("increments correctly when adding the same product twice", () => {
    const p = WESCO_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 2);
    useProductFinder.getState().addToCart(p, 5);
    const state = useProductFinder.getState();
    expect(selectCartCount(state)).toBe(7);
  });
});

// ─── selectCartTotal ──────────────────────────────────────────────────────────

describe("selectCartTotal", () => {
  beforeEach(resetStore);

  it("returns 0 for an empty cart", () => {
    const state = useProductFinder.getState();
    expect(selectCartTotal(state)).toBe(0);
  });

  it("returns unit price × qty for a single item", () => {
    const p = WESCO_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 4);
    const state = useProductFinder.getState();
    expect(selectCartTotal(state)).toBeCloseTo(p.unitPrice * 4, 5);
  });

  it("sums across multiple items", () => {
    const p1 = WESCO_PRODUCTS[0];
    const p2 = WESCO_PRODUCTS[1];
    useProductFinder.getState().addToCart(p1, 2);
    useProductFinder.getState().addToCart(p2, 3);
    const state = useProductFinder.getState();
    const expected = p1.unitPrice * 2 + p2.unitPrice * 3;
    expect(selectCartTotal(state)).toBeCloseTo(expected, 5);
  });

  it("applies tiered (5% off) pricing when qty >= 10", () => {
    const p = WESCO_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 10);
    const state = useProductFinder.getState();
    const expectedUnitPrice = tierUnitPrice(p, 10); // 5% off
    expect(expectedUnitPrice).toBeLessThan(p.unitPrice);
    expect(selectCartTotal(state)).toBeCloseTo(expectedUnitPrice * 10, 5);
  });

  it("applies tiered (10% off) pricing when qty >= 50", () => {
    const p = WESCO_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 50);
    const state = useProductFinder.getState();
    const expectedUnitPrice = tierUnitPrice(p, 50); // 10% off
    expect(selectCartTotal(state)).toBeCloseTo(expectedUnitPrice * 50, 5);
  });

  it("applies tiered (15% off) pricing when qty >= 100", () => {
    const p = WESCO_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 100);
    const state = useProductFinder.getState();
    const expectedUnitPrice = tierUnitPrice(p, 100); // 15% off
    expect(selectCartTotal(state)).toBeCloseTo(expectedUnitPrice * 100, 5);
  });

  it("tiered total is less than flat total when qty triggers a break", () => {
    const p = WESCO_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 10);
    const state = useProductFinder.getState();
    const tieredTotal = selectCartTotal(state);
    const flatTotal = p.unitPrice * 10;
    expect(tieredTotal).toBeLessThan(flatTotal);
  });
});

// ─── Cart mutations ───────────────────────────────────────────────────────────

describe("cart mutations", () => {
  beforeEach(resetStore);

  it("removeFromCart deletes the item", () => {
    const p = WESCO_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 2);
    useProductFinder.getState().removeFromCart(p.id);
    const state = useProductFinder.getState();
    expect(state.cart[p.id]).toBeUndefined();
    expect(selectCartCount(state)).toBe(0);
  });

  it("updateCartQty changes quantity", () => {
    const p = WESCO_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 2);
    useProductFinder.getState().updateCartQty(p.id, 10);
    const state = useProductFinder.getState();
    expect(state.cart[p.id]?.qty).toBe(10);
  });

  it("updateCartQty with qty <= 0 removes item", () => {
    const p = WESCO_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 2);
    useProductFinder.getState().updateCartQty(p.id, 0);
    const state = useProductFinder.getState();
    expect(state.cart[p.id]).toBeUndefined();
  });

  it("clearCart empties everything", () => {
    const p1 = WESCO_PRODUCTS[0];
    const p2 = WESCO_PRODUCTS[1];
    useProductFinder.getState().addToCart(p1, 1);
    useProductFinder.getState().addToCart(p2, 1);
    useProductFinder.getState().clearCart();
    const state = useProductFinder.getState();
    expect(Object.keys(state.cart).length).toBe(0);
    expect(selectCartCount(state)).toBe(0);
  });
});

// ─── Filter actions ───────────────────────────────────────────────────────────

describe("filter actions", () => {
  beforeEach(resetStore);

  it("toggleCategory adds a category when not present", () => {
    useProductFinder.getState().toggleCategory("electrical");
    const { filters } = useProductFinder.getState();
    expect(filters.categories.has("electrical")).toBe(true);
  });

  it("toggleCategory removes a category when already present", () => {
    useProductFinder.getState().toggleCategory("electrical");
    useProductFinder.getState().toggleCategory("electrical");
    const { filters } = useProductFinder.getState();
    expect(filters.categories.has("electrical")).toBe(false);
  });

  it("toggleBrand adds a brand when not present", () => {
    const brand = WESCO_PRODUCTS[0].brand;
    useProductFinder.getState().toggleBrand(brand);
    const { filters } = useProductFinder.getState();
    expect(filters.brands.has(brand)).toBe(true);
  });

  it("toggleSubcategory adds a subcategory when not present", () => {
    const sub = WESCO_PRODUCTS[0].subcategory;
    useProductFinder.getState().toggleSubcategory(sub);
    const { filters } = useProductFinder.getState();
    expect(filters.subcategories.has(sub)).toBe(true);
  });

  it("setPriceRange stores min and max", () => {
    useProductFinder.getState().setPriceRange(10, 100);
    const { filters } = useProductFinder.getState();
    expect(filters.priceMin).toBe(10);
    expect(filters.priceMax).toBe(100);
  });

  it("clearFilters resets all filter values", () => {
    useProductFinder.getState().toggleCategory("electrical");
    useProductFinder.getState().toggleBrand(WESCO_PRODUCTS[0].brand);
    useProductFinder.getState().setOnlyPreferred(true);
    useProductFinder.getState().setPriceRange(5, 50);
    useProductFinder.getState().clearFilters();
    const { filters } = useProductFinder.getState();
    expect(filters.categories.size).toBe(0);
    expect(filters.brands.size).toBe(0);
    expect(filters.onlyPreferred).toBe(false);
    expect(filters.priceMin).toBeNull();
    expect(filters.priceMax).toBeNull();
  });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe("auth", () => {
  beforeEach(resetStore);

  it("login succeeds with correct credentials", () => {
    const result = useProductFinder.getState().login("sales@wesco.com", "wesco2024");
    expect(result).toBe(true);
    const { user } = useProductFinder.getState();
    expect(user).not.toBeNull();
    expect(user?.email).toBe("sales@wesco.com");
  });

  it("login fails with wrong password", () => {
    const result = useProductFinder.getState().login("sales@wesco.com", "wrongpassword");
    expect(result).toBe(false);
    const { user, authError } = useProductFinder.getState();
    expect(user).toBeNull();
    expect(authError).toBeTruthy();
  });

  it("logout clears user", () => {
    useProductFinder.getState().login("sales@wesco.com", "wesco2024");
    useProductFinder.getState().logout();
    const { user } = useProductFinder.getState();
    expect(user).toBeNull();
  });
});

// ─── favorites & recently viewed ─────────────────────────────────────────────

describe("favorites & recently viewed", () => {
  beforeEach(resetStore);

  it("toggleFavorite adds then removes a product", () => {
    const product = WESCO_PRODUCTS[0];
    useProductFinder.getState().toggleFavorite(product);
    expect(useProductFinder.getState().isFavorite(product.id)).toBe(true);
    useProductFinder.getState().toggleFavorite(product);
    expect(useProductFinder.getState().isFavorite(product.id)).toBe(false);
  });

  it("setActiveProduct records recently viewed, most-recent-first, deduped", async () => {
    const [a, b] = WESCO_PRODUCTS;
    await useProductFinder.getState().setActiveProduct(a);
    await useProductFinder.getState().setActiveProduct(b);
    await useProductFinder.getState().setActiveProduct(a);
    expect(useProductFinder.getState().recentlyViewed).toEqual([a.id, b.id]);
  });

  it("recentlyViewed caps at 12 entries", async () => {
    for (let i = 0; i < WESCO_PRODUCTS.length && i < 15; i++) {
      await useProductFinder.getState().setActiveProduct(WESCO_PRODUCTS[i]);
    }
    expect(useProductFinder.getState().recentlyViewed.length).toBeLessThanOrEqual(12);
  });
});

// ─── setActiveProduct enrichment ─────────────────────────────────────────────

describe("setActiveProduct enrichment", () => {
  beforeEach(() => {
    resetStore();
    detailProduct = null;
    detailEquivalents = [];
    searchItems = [];
    searchTotal = 0;
  });

  it("enriches activeProduct and results from the detail API response", async () => {
    const product = WESCO_PRODUCTS[0];
    const enriched = { ...product, description: "enriched-description" };
    const equivalents = [WESCO_PRODUCTS[1], WESCO_PRODUCTS[2]];
    detailProduct = enriched;
    detailEquivalents = equivalents;

    await useProductFinder.getState().setActiveProduct(product);

    const state = useProductFinder.getState();
    expect(state.activeProduct).toEqual(enriched);
    expect(state.results).toEqual(equivalents);
    expect(state.total).toBe(equivalents.length);
  });

  it("setActiveProduct(null) clears activeProduct and restores prior search results", async () => {
    // Step 1: simulate viewing equivalents for a product
    const product = WESCO_PRODUCTS[0];
    const enriched = { ...product, description: "enriched" };
    const equivalents = [WESCO_PRODUCTS[1], WESCO_PRODUCTS[2]];
    detailProduct = enriched;
    detailEquivalents = equivalents;
    await useProductFinder.getState().setActiveProduct(product);

    // Confirm we're in the equivalents view
    expect(useProductFinder.getState().results).toEqual(equivalents);

    // Step 2: configure the search mock to return distinct prior-search items
    const priorSearchItems = [WESCO_PRODUCTS[3], WESCO_PRODUCTS[4]];
    const priorSearchTotal = 42;
    searchItems = priorSearchItems;
    searchTotal = priorSearchTotal;

    // Step 3: call setActiveProduct(null) — "Change Product" button
    await useProductFinder.getState().setActiveProduct(null);

    const state = useProductFinder.getState();
    expect(state.activeProduct).toBeNull();
    expect(state.results).toEqual(priorSearchItems);
    expect(state.total).toBe(priorSearchTotal);
    expect(state.page).toBe(0);
  });
});

// ─── natural-language search ──────────────────────────────────────────────────

describe("natural-language search", () => {
  beforeEach(resetStore);

  it("runNlSearch applies parsed filters to FilterState and stores chips", async () => {
    await useProductFinder.getState().runNlSearch("preferred breaker under $50");
    const { filters, appliedNlFilters } = useProductFinder.getState();
    expect(filters.onlyPreferred).toBe(true);
    expect(filters.priceMax).toBe(50);
    expect(appliedNlFilters).toHaveLength(2);
  });

  it("removeNlFilter clears that filter's effect and re-runs search", async () => {
    await useProductFinder.getState().runNlSearch("preferred under $50");
    const pref = useProductFinder.getState().appliedNlFilters.find((f) => f.kind === "preferred");
    expect(pref).toBeDefined();
    await useProductFinder.getState().removeNlFilter(pref!.id);
    const { filters, appliedNlFilters } = useProductFinder.getState();
    expect(filters.onlyPreferred).toBe(false);
    expect(appliedNlFilters.some((f) => f.kind === "preferred")).toBe(false);
  });

  it("removeNlFilter for a price chip resets priceMax to null", async () => {
    await useProductFinder.getState().runNlSearch("breaker under $50");
    const priceChip = useProductFinder.getState().appliedNlFilters.find((f) => f.kind === "priceMax");
    expect(priceChip).toBeDefined();
    expect(useProductFinder.getState().filters.priceMax).toBe(50);
    await useProductFinder.getState().removeNlFilter(priceChip!.id);
    expect(useProductFinder.getState().filters.priceMax).toBeNull();
    expect(useProductFinder.getState().appliedNlFilters.some((f) => f.kind === "priceMax")).toBe(false);
  });

  it("a new NL search replaces the previous one's filters (no stuck filters)", async () => {
    await useProductFinder.getState().runNlSearch("preferred");
    expect(useProductFinder.getState().filters.onlyPreferred).toBe(true);
    await useProductFinder.getState().runNlSearch("under $50");
    const { filters, appliedNlFilters } = useProductFinder.getState();
    expect(filters.onlyPreferred).toBe(false); // previous NL filter cleared
    expect(filters.priceMax).toBe(50);
    expect(appliedNlFilters.every((f) => f.kind !== "preferred")).toBe(true);
  });

  it("removeNlFilter re-runs the search (async, no error)", async () => {
    await useProductFinder.getState().runNlSearch("preferred");
    const prefChip = useProductFinder.getState().appliedNlFilters.find((f) => f.kind === "preferred");
    await useProductFinder.getState().removeNlFilter(prefChip!.id);
    // search is now server-side; assert no error and preferred filter is gone
    expect(useProductFinder.getState().error).toBeNull();
    expect(useProductFinder.getState().filters.onlyPreferred).toBe(false);
  });

  it("clearFilters also clears applied NL filter chips", async () => {
    await useProductFinder.getState().runNlSearch("preferred under $50");
    expect(useProductFinder.getState().appliedNlFilters.length).toBeGreaterThan(0);
    useProductFinder.getState().clearFilters();
    expect(useProductFinder.getState().appliedNlFilters).toHaveLength(0);
  });
});

// ─── detailModalProduct ───────────────────────────────────────────────────────

describe("detailModalProduct", () => {
  beforeEach(resetStore);

  it("starts as null", () => {
    expect(useProductFinder.getState().detailModalProduct).toBeNull();
  });

  it("setDetailModalProduct stores the product in state", () => {
    const product = WESCO_PRODUCTS[0];
    useProductFinder.getState().setDetailModalProduct(product);
    expect(useProductFinder.getState().detailModalProduct).toEqual(product);
  });

  it("setDetailModalProduct(null) clears the product", () => {
    const product = WESCO_PRODUCTS[0];
    useProductFinder.getState().setDetailModalProduct(product);
    useProductFinder.getState().setDetailModalProduct(null);
    expect(useProductFinder.getState().detailModalProduct).toBeNull();
  });
});

// ─── searchHistory – addSearchTerm ────────────────────────────────────────────

describe("searchHistory – addSearchTerm", () => {
  beforeEach(resetStore);

  it("records a term and places it at the front", () => {
    useProductFinder.getState().addSearchTerm("breaker");
    expect(useProductFinder.getState().searchHistory[0]).toBe("breaker");
    expect(useProductFinder.getState().searchHistory.length).toBe(1);
  });

  it("case-insensitive dedupe: adding a variant of an existing term moves it to front with new casing", () => {
    useProductFinder.getState().addSearchTerm("GFCI");
    useProductFinder.getState().addSearchTerm("gfci");
    const history = useProductFinder.getState().searchHistory;
    expect(history.length).toBe(1);
    expect(history[0]).toBe("gfci");
  });

  it("empty string is a no-op", () => {
    useProductFinder.getState().addSearchTerm("");
    expect(useProductFinder.getState().searchHistory.length).toBe(0);
  });

  it("whitespace-only is a no-op", () => {
    useProductFinder.getState().addSearchTerm("   ");
    expect(useProductFinder.getState().searchHistory.length).toBe(0);
  });

  it("caps at MAX_SEARCH_HISTORY (12): adding 15 terms yields length 12, newest first, oldest dropped", () => {
    for (let i = 1; i <= 15; i++) {
      useProductFinder.getState().addSearchTerm(`term${i}`);
    }
    const history = useProductFinder.getState().searchHistory;
    expect(history.length).toBe(12);
    expect(history[0]).toBe("term15");
    expect(history[11]).toBe("term4");
    // term1, term2, term3 should have been dropped
    expect(history.includes("term1")).toBe(false);
    expect(history.includes("term2")).toBe(false);
    expect(history.includes("term3")).toBe(false);
  });

  it("preserves original casing of subsequent unique terms", () => {
    useProductFinder.getState().addSearchTerm("Breaker");
    useProductFinder.getState().addSearchTerm("GFCI");
    const history = useProductFinder.getState().searchHistory;
    expect(history[0]).toBe("GFCI");
    expect(history[1]).toBe("Breaker");
  });
});

// ─── searchHistory – runNlSearch integration ──────────────────────────────────

describe("searchHistory – runNlSearch integration", () => {
  beforeEach(() => {
    resetStore();
  });

  it('runNlSearch("gfci receptacle") records "gfci receptacle" as first history entry', async () => {
    await useProductFinder.getState().runNlSearch("gfci receptacle");
    expect(useProductFinder.getState().searchHistory[0]).toBe("gfci receptacle");
  });

  it('runNlSearch("   ") records nothing', async () => {
    await useProductFinder.getState().runNlSearch("   ");
    expect(useProductFinder.getState().searchHistory.length).toBe(0);
  });

  it('runNlSearch("") records nothing', async () => {
    await useProductFinder.getState().runNlSearch("");
    expect(useProductFinder.getState().searchHistory.length).toBe(0);
  });
});

// ─── searchHistory – clearSearchHistory ──────────────────────────────────────

describe("clearSearchHistory", () => {
  beforeEach(resetStore);

  it("empties the search history", () => {
    useProductFinder.getState().addSearchTerm("breaker");
    useProductFinder.getState().addSearchTerm("gfci");
    useProductFinder.getState().clearSearchHistory();
    expect(useProductFinder.getState().searchHistory).toEqual([]);
  });
});

// ─── clearRecentlyViewed ──────────────────────────────────────────────────────

describe("clearRecentlyViewed", () => {
  beforeEach(resetStore);

  it("empties recentlyViewed and recentSnapshots", async () => {
    const [a, b] = WESCO_PRODUCTS;
    await useProductFinder.getState().setActiveProduct(a);
    await useProductFinder.getState().setActiveProduct(b);
    expect(useProductFinder.getState().recentlyViewed.length).toBeGreaterThan(0);
    useProductFinder.getState().clearRecentlyViewed();
    expect(useProductFinder.getState().recentlyViewed).toEqual([]);
    expect(useProductFinder.getState().recentSnapshots).toEqual({});
  });
});

// ─── hydrateSavedState loads searchHistory ────────────────────────────────────

describe("hydrateSavedState – searchHistory", () => {
  beforeEach(resetStore);

  it("loads searchHistory from the pf_search_history key when localStorage has valid data", () => {
    // Simulate a localStorage with search history already stored
    const stored = ["breaker", "gfci", "wire nut"];
    const mockStorage: Record<string, string> = {
      pf_search_history: JSON.stringify(stored),
    };
    const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    hydrateSavedState();
    expect(useProductFinder.getState().searchHistory).toEqual(stored);

    // Restore
    (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
  });
});
