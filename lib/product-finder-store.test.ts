import { describe, it, expect, beforeEach, vi } from "vitest";
import { useProductFinder, selectCartCount, selectCartTotal, selectActiveCustomer, selectVisibleOrders, hydrateSavedState, buildDemoOrders, buildDemoQuotes, DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/product-finder-store";
import type { SavedBasket, Order } from "@/lib/product-finder-store";
import { emptyFilterState } from "@/lib/product-finder-url";
import { ordersOverTime } from "@/lib/analytics";
import { CATALOG_PRODUCTS } from "@/data/mock/catalog-products";
import { tierUnitPrice } from "@/lib/product-finder-pricing";
import { CUSTOMER_ACCOUNTS } from "@/lib/integration/customers";
import { getPricingProvider } from "@/lib/integration/index";

// ─── Fetch mock ───────────────────────────────────────────────────────────────

// detail mock echoes whatever product was last set here, with a companion equivalents list
let detailProduct: unknown = null;
let detailEquivalents: unknown[] = [];

// search mock — configurable so tests can verify what runSearch returns
let searchItems: unknown[] = [];
let searchTotal = 0;
let searchFacets: unknown[] = [];

globalThis.fetch = vi.fn(async (url: string | URL) => {
  const u = String(url);
  if (u.includes("/api/products/search")) {
    return { ok: true, json: async () => ({ items: searchItems, total: searchTotal, page: 0, pageSize: 24, facets: searchFacets }) } as Response;
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
    bomModalOpen: false,
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
    savedBaskets: [],
    watches: [],
    orders: [],
    activeCustomerId: null,
    correction: null,
    tourOpen: false,
    tourStep: 0,
    paletteOpen: false,
    cartSection: null,
    cartQuoteStatusFilter: null,
    cartOrderMonthFilter: null,
    filters: {
      query: "",
      categories: new Set(),
      subcategories: new Set(),
      brands: new Set(),
      onlyBranchStock: false,
      onlyDCStock: false,
      onlyPreferred: false,
      onlyActive: false,
      priceMin: null,
      priceMax: null,
      sortKey: "relevance",
      viewMode: "list",
      specFilters: {},
      specRanges: {},
    },
    facets: [],
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
    const p1 = CATALOG_PRODUCTS[0];
    const p2 = CATALOG_PRODUCTS[1];
    useProductFinder.getState().addToCart(p1, 3);
    useProductFinder.getState().addToCart(p2, 7);
    const state = useProductFinder.getState();
    expect(selectCartCount(state)).toBe(10);
  });

  it("increments correctly when adding the same product twice", () => {
    const p = CATALOG_PRODUCTS[0];
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
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 4);
    const state = useProductFinder.getState();
    expect(selectCartTotal(state)).toBeCloseTo(p.unitPrice * 4, 5);
  });

  it("sums across multiple items", () => {
    const p1 = CATALOG_PRODUCTS[0];
    const p2 = CATALOG_PRODUCTS[1];
    useProductFinder.getState().addToCart(p1, 2);
    useProductFinder.getState().addToCart(p2, 3);
    const state = useProductFinder.getState();
    const expected = p1.unitPrice * 2 + p2.unitPrice * 3;
    expect(selectCartTotal(state)).toBeCloseTo(expected, 5);
  });

  it("applies tiered (5% off) pricing when qty >= 10", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 10);
    const state = useProductFinder.getState();
    const expectedUnitPrice = tierUnitPrice(p, 10); // 5% off
    expect(expectedUnitPrice).toBeLessThan(p.unitPrice);
    expect(selectCartTotal(state)).toBeCloseTo(expectedUnitPrice * 10, 5);
  });

  it("applies tiered (10% off) pricing when qty >= 50", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 50);
    const state = useProductFinder.getState();
    const expectedUnitPrice = tierUnitPrice(p, 50); // 10% off
    expect(selectCartTotal(state)).toBeCloseTo(expectedUnitPrice * 50, 5);
  });

  it("applies tiered (15% off) pricing when qty >= 100", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 100);
    const state = useProductFinder.getState();
    const expectedUnitPrice = tierUnitPrice(p, 100); // 15% off
    expect(selectCartTotal(state)).toBeCloseTo(expectedUnitPrice * 100, 5);
  });

  it("tiered total is less than flat total when qty triggers a break", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 10);
    const state = useProductFinder.getState();
    const tieredTotal = selectCartTotal(state);
    const flatTotal = p.unitPrice * 10;
    expect(tieredTotal).toBeLessThan(flatTotal);
  });
});

// ─── selectCartTotal — contract pricing ───────────────────────────────────────

describe("selectCartTotal — contract pricing", () => {
  beforeEach(resetStore);

  // Find a product in the "electrical" category so the Gulf Coast contract applies
  function findElectricalProduct() {
    const p = CATALOG_PRODUCTS.find((x) => x.category === "electrical");
    if (!p) throw new Error("No electrical product found in CATALOG_PRODUCTS");
    return p;
  }

  it("selectCartTotal uses effectiveUnitPrice from pricing provider, not raw tierUnitPrice", () => {
    const p = findElectricalProduct();
    const gulfCoast = CUSTOMER_ACCOUNTS.find((c) => c.id === "CUST-001")!;
    useProductFinder.getState().setActiveCustomer(gulfCoast.id);
    useProductFinder.getState().addToCart(p, 1);

    const state = useProductFinder.getState();
    const activeCustomer = CUSTOMER_ACCOUNTS.find((c) => c.id === state.activeCustomerId) ?? null;
    const expected = getPricingProvider().getPricing(p, { customer: activeCustomer, qty: 1 }).effectiveUnitPrice * 1;
    expect(selectCartTotal(state)).toBeCloseTo(expected, 5);
  });

  it("with a contract customer who has a category discount, cart total is lower than list×qty", () => {
    const p = findElectricalProduct();
    const gulfCoast = CUSTOMER_ACCOUNTS.find((c) => c.id === "CUST-001")!;
    useProductFinder.getState().setActiveCustomer(gulfCoast.id);
    useProductFinder.getState().addToCart(p, 1);

    const state = useProductFinder.getState();
    const contractTotal = selectCartTotal(state);
    const listTotal = p.unitPrice * 1;
    // Gulf Coast has ≥ 15% off electrical — contract total should be lower
    expect(contractTotal).toBeLessThan(listTotal);
  });

  it("with no active customer, selectCartTotal matches tierUnitPrice×qty (unchanged path)", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 10);
    const state = useProductFinder.getState();
    const expected = tierUnitPrice(p, 10) * 10;
    expect(selectCartTotal(state)).toBeCloseTo(expected, 5);
  });

  it("sums contract totals across multiple items for an active contract customer", () => {
    const p1 = findElectricalProduct();
    // Use a second electrical product if available, otherwise same product is fine
    const allElec = CATALOG_PRODUCTS.filter((x) => x.category === "electrical");
    const p2 = allElec.length > 1 ? allElec[1] : p1;

    const gulfCoast = CUSTOMER_ACCOUNTS.find((c) => c.id === "CUST-001")!;
    useProductFinder.getState().setActiveCustomer(gulfCoast.id);
    useProductFinder.getState().addToCart(p1, 2);
    // Only add p2 to cart if it's a different product
    if (p2.id !== p1.id) {
      useProductFinder.getState().addToCart(p2, 3);
    }

    const state = useProductFinder.getState();
    const activeCustomer = CUSTOMER_ACCOUNTS.find((c) => c.id === state.activeCustomerId) ?? null;
    const items = Object.values(state.cart);
    const expected = items.reduce((sum, { product, qty }) => {
      return sum + getPricingProvider().getPricing(product, { customer: activeCustomer, qty }).effectiveUnitPrice * qty;
    }, 0);
    expect(selectCartTotal(state)).toBeCloseTo(expected, 5);
  });
});

// ─── Cart mutations ───────────────────────────────────────────────────────────

describe("cart mutations", () => {
  beforeEach(resetStore);

  it("removeFromCart deletes the item", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 2);
    useProductFinder.getState().removeFromCart(p.id);
    const state = useProductFinder.getState();
    expect(state.cart[p.id]).toBeUndefined();
    expect(selectCartCount(state)).toBe(0);
  });

  it("updateCartQty changes quantity", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 2);
    useProductFinder.getState().updateCartQty(p.id, 10);
    const state = useProductFinder.getState();
    expect(state.cart[p.id]?.qty).toBe(10);
  });

  it("updateCartQty with qty <= 0 removes item", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 2);
    useProductFinder.getState().updateCartQty(p.id, 0);
    const state = useProductFinder.getState();
    expect(state.cart[p.id]).toBeUndefined();
  });

  it("clearCart empties everything", () => {
    const p1 = CATALOG_PRODUCTS[0];
    const p2 = CATALOG_PRODUCTS[1];
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
    const brand = CATALOG_PRODUCTS[0].brand;
    useProductFinder.getState().toggleBrand(brand);
    const { filters } = useProductFinder.getState();
    expect(filters.brands.has(brand)).toBe(true);
  });

  it("toggleSubcategory adds a subcategory when not present", () => {
    const sub = CATALOG_PRODUCTS[0].subcategory;
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
    useProductFinder.getState().toggleBrand(CATALOG_PRODUCTS[0].brand);
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
    const result = useProductFinder.getState().login("sales@meridiansupply.com", "meridian2024");
    expect(result).toBe(true);
    const { user } = useProductFinder.getState();
    expect(user).not.toBeNull();
    expect(user?.email).toBe("sales@meridiansupply.com");
  });

  it("login fails with wrong password", () => {
    const result = useProductFinder.getState().login("sales@meridiansupply.com", "wrongpassword");
    expect(result).toBe(false);
    const { user, authError } = useProductFinder.getState();
    expect(user).toBeNull();
    expect(authError).toBeTruthy();
  });

  it("logout clears user", () => {
    useProductFinder.getState().login("sales@meridiansupply.com", "meridian2024");
    useProductFinder.getState().logout();
    const { user } = useProductFinder.getState();
    expect(user).toBeNull();
  });
});

// ─── favorites & recently viewed ─────────────────────────────────────────────

describe("favorites & recently viewed", () => {
  beforeEach(resetStore);

  it("toggleFavorite adds then removes a product", () => {
    const product = CATALOG_PRODUCTS[0];
    useProductFinder.getState().toggleFavorite(product);
    expect(useProductFinder.getState().isFavorite(product.id)).toBe(true);
    useProductFinder.getState().toggleFavorite(product);
    expect(useProductFinder.getState().isFavorite(product.id)).toBe(false);
  });

  it("setActiveProduct records recently viewed, most-recent-first, deduped", async () => {
    const [a, b] = CATALOG_PRODUCTS;
    await useProductFinder.getState().setActiveProduct(a);
    await useProductFinder.getState().setActiveProduct(b);
    await useProductFinder.getState().setActiveProduct(a);
    expect(useProductFinder.getState().recentlyViewed).toEqual([a.id, b.id]);
  });

  it("recentlyViewed caps at 12 entries", async () => {
    for (let i = 0; i < CATALOG_PRODUCTS.length && i < 15; i++) {
      await useProductFinder.getState().setActiveProduct(CATALOG_PRODUCTS[i]);
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
    const product = CATALOG_PRODUCTS[0];
    const enriched = { ...product, description: "enriched-description" };
    const equivalents = [CATALOG_PRODUCTS[1], CATALOG_PRODUCTS[2]];
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
    const product = CATALOG_PRODUCTS[0];
    const enriched = { ...product, description: "enriched" };
    const equivalents = [CATALOG_PRODUCTS[1], CATALOG_PRODUCTS[2]];
    detailProduct = enriched;
    detailEquivalents = equivalents;
    await useProductFinder.getState().setActiveProduct(product);

    // Confirm we're in the equivalents view
    expect(useProductFinder.getState().results).toEqual(equivalents);

    // Step 2: configure the search mock to return distinct prior-search items
    const priorSearchItems = [CATALOG_PRODUCTS[3], CATALOG_PRODUCTS[4]];
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
    const product = CATALOG_PRODUCTS[0];
    useProductFinder.getState().setDetailModalProduct(product);
    expect(useProductFinder.getState().detailModalProduct).toEqual(product);
  });

  it("setDetailModalProduct(null) clears the product", () => {
    const product = CATALOG_PRODUCTS[0];
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
    const [a, b] = CATALOG_PRODUCTS;
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

// ─── savedBaskets ─────────────────────────────────────────────────────────────

describe("savedBaskets – saveCurrentBasket", () => {
  beforeEach(resetStore);

  it("snapshots cart lines into a new saved basket with the given name", () => {
    const p1 = CATALOG_PRODUCTS[0];
    const p2 = CATALOG_PRODUCTS[1];
    useProductFinder.getState().addToCart(p1, 3);
    useProductFinder.getState().addToCart(p2, 7);

    useProductFinder.getState().saveCurrentBasket("My Basket", "id-001", 1000000);

    const { savedBaskets } = useProductFinder.getState();
    expect(savedBaskets).toHaveLength(1);
    const basket = savedBaskets[0];
    expect(basket.name).toBe("My Basket");
    expect(basket.id).toBe("id-001");
    expect(basket.savedAt).toBe(1000000);
    expect(basket.lines).toHaveLength(2);
    const lineIds = basket.lines.map((l) => l.product.id);
    expect(lineIds).toContain(p1.id);
    expect(lineIds).toContain(p2.id);
    const p1Line = basket.lines.find((l) => l.product.id === p1.id)!;
    expect(p1Line.qty).toBe(3);
  });

  it("is a no-op when the name is empty after trimming", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 1);
    useProductFinder.getState().saveCurrentBasket("  ", "id-002", 1000001);
    expect(useProductFinder.getState().savedBaskets).toHaveLength(0);
  });

  it("is a no-op when the cart is empty", () => {
    useProductFinder.getState().saveCurrentBasket("Full Name", "id-003", 1000002);
    expect(useProductFinder.getState().savedBaskets).toHaveLength(0);
  });

  it("overwrites (does not duplicate) a basket with the same name case-insensitively", () => {
    const p1 = CATALOG_PRODUCTS[0];
    const p2 = CATALOG_PRODUCTS[1];

    useProductFinder.getState().addToCart(p1, 2);
    useProductFinder.getState().saveCurrentBasket("Electrical Run", "id-010", 1000010);

    // Clear cart, add different product, save with same name (different case)
    useProductFinder.getState().clearCart();
    useProductFinder.getState().addToCart(p2, 5);
    useProductFinder.getState().saveCurrentBasket("ELECTRICAL RUN", "id-011", 1000011);

    const { savedBaskets } = useProductFinder.getState();
    // Must still be exactly one basket — no duplicate
    expect(savedBaskets).toHaveLength(1);
    // Lines should reflect the second save
    expect(savedBaskets[0].lines).toHaveLength(1);
    expect(savedBaskets[0].lines[0].product.id).toBe(p2.id);
    expect(savedBaskets[0].lines[0].qty).toBe(5);
    expect(savedBaskets[0].savedAt).toBe(1000011);
  });

  it("prepends a new basket at the front of the list", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 1);
    useProductFinder.getState().saveCurrentBasket("First", "id-100", 1000100);
    useProductFinder.getState().saveCurrentBasket("Second", "id-101", 1000101);

    const { savedBaskets } = useProductFinder.getState();
    expect(savedBaskets[0].name).toBe("Second");
    expect(savedBaskets[1].name).toBe("First");
  });
});

describe("savedBaskets – loadBasket", () => {
  beforeEach(resetStore);

  it("replaces the current cart with the saved basket lines (deep clone)", () => {
    const p1 = CATALOG_PRODUCTS[0];
    const p2 = CATALOG_PRODUCTS[1];

    // Save a basket with p1 qty 4
    useProductFinder.getState().addToCart(p1, 4);
    useProductFinder.getState().saveCurrentBasket("Saved", "basket-load-1", 2000000);

    // Change cart
    useProductFinder.getState().clearCart();
    useProductFinder.getState().addToCart(p2, 9);

    // Load the saved basket
    useProductFinder.getState().loadBasket("basket-load-1");

    const { cart } = useProductFinder.getState();
    expect(cart[p1.id]).toBeDefined();
    expect(cart[p1.id].qty).toBe(4);
    expect(cart[p2.id]).toBeUndefined();
  });

  it("loadBasket is independent: mutating cart after load does not change the saved basket", () => {
    const p1 = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p1, 3);
    useProductFinder.getState().saveCurrentBasket("Isolated", "basket-iso", 2000100);

    useProductFinder.getState().loadBasket("basket-iso");
    // Mutate the loaded cart
    useProductFinder.getState().updateCartQty(p1.id, 99);

    // The saved basket should still have qty 3
    const saved = useProductFinder.getState().savedBaskets.find((b) => b.id === "basket-iso")!;
    expect(saved.lines[0].qty).toBe(3);
  });

  it("is a no-op when the id is not found", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 2);
    useProductFinder.getState().loadBasket("does-not-exist");
    // cart should be unchanged
    expect(useProductFinder.getState().cart[p.id]?.qty).toBe(2);
  });
});

describe("savedBaskets – deleteBasket", () => {
  beforeEach(resetStore);

  it("removes the basket with the given id", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 1);
    useProductFinder.getState().saveCurrentBasket("To Delete", "del-001", 3000000);
    useProductFinder.getState().saveCurrentBasket("To Keep", "keep-001", 3000001);

    useProductFinder.getState().deleteBasket("del-001");

    const { savedBaskets } = useProductFinder.getState();
    expect(savedBaskets).toHaveLength(1);
    expect(savedBaskets[0].id).toBe("keep-001");
  });

  it("is a no-op when the id is not found", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 1);
    useProductFinder.getState().saveCurrentBasket("Existing", "existing-1", 3000100);
    useProductFinder.getState().deleteBasket("ghost-id");
    expect(useProductFinder.getState().savedBaskets).toHaveLength(1);
  });
});

describe("savedBaskets – renameBasket", () => {
  beforeEach(resetStore);

  it("renames the basket with the given id", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 1);
    useProductFinder.getState().saveCurrentBasket("Old Name", "rename-001", 4000000);

    useProductFinder.getState().renameBasket("rename-001", "New Name");

    expect(useProductFinder.getState().savedBaskets[0].name).toBe("New Name");
  });

  it("trims the new name before saving", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 1);
    useProductFinder.getState().saveCurrentBasket("Padded", "rename-002", 4000001);

    useProductFinder.getState().renameBasket("rename-002", "  Trimmed  ");

    expect(useProductFinder.getState().savedBaskets[0].name).toBe("Trimmed");
  });

  it("is a no-op when the trimmed new name is empty", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 1);
    useProductFinder.getState().saveCurrentBasket("Keep This", "rename-003", 4000002);

    useProductFinder.getState().renameBasket("rename-003", "   ");

    expect(useProductFinder.getState().savedBaskets[0].name).toBe("Keep This");
  });
});

describe("savedBaskets – persistence via hydrateSavedState", () => {
  beforeEach(resetStore);

  it("loads savedBaskets from pf_saved_baskets key when localStorage has valid data", () => {
    const p = CATALOG_PRODUCTS[0];
    const storedBaskets: SavedBasket[] = [
      { id: "hydrate-1", name: "Hydrated Basket", lines: [{ product: p, qty: 2 }], savedAt: 5000000 },
    ];
    const mockStorage: Record<string, string> = {
      pf_saved_baskets: JSON.stringify(storedBaskets),
    };
    const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    hydrateSavedState();
    const { savedBaskets } = useProductFinder.getState();
    expect(savedBaskets).toHaveLength(1);
    expect(savedBaskets[0].name).toBe("Hydrated Basket");
    expect(savedBaskets[0].lines[0].qty).toBe(2);

    (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
  });

  it("persists savedBaskets to localStorage when saveCurrentBasket is called", () => {
    const p = CATALOG_PRODUCTS[0];
    const mockStorage: Record<string, string> = {};
    const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    useProductFinder.getState().addToCart(p, 3);
    useProductFinder.getState().saveCurrentBasket("Persist Me", "persist-1", 5000100);

    const raw = mockStorage["pf_saved_baskets"];
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw) as SavedBasket[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe("Persist Me");
    expect(parsed[0].lines[0].qty).toBe(3);

    (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
  });

  it("persists savedBaskets to localStorage when deleteBasket is called", () => {
    const p = CATALOG_PRODUCTS[0];
    const mockStorage: Record<string, string> = {};
    const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    useProductFinder.getState().addToCart(p, 1);
    useProductFinder.getState().saveCurrentBasket("A", "del-persist-1", 5000200);
    useProductFinder.getState().saveCurrentBasket("B", "del-persist-2", 5000201);
    useProductFinder.getState().deleteBasket("del-persist-1");

    const raw = mockStorage["pf_saved_baskets"];
    const parsed = JSON.parse(raw) as SavedBasket[];
    expect(parsed.some((b) => b.id === "del-persist-1")).toBe(false);
    expect(parsed.some((b) => b.id === "del-persist-2")).toBe(true);

    (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
  });
});

// ─── bomModalOpen ─────────────────────────────────────────────────────────────

describe("bomModalOpen", () => {
  beforeEach(resetStore);

  it("starts closed (false)", () => {
    expect(useProductFinder.getState().bomModalOpen).toBe(false);
  });

  it("setBomModalOpen(true) opens the modal", () => {
    useProductFinder.getState().setBomModalOpen(true);
    expect(useProductFinder.getState().bomModalOpen).toBe(true);
  });

  it("setBomModalOpen(false) closes the modal", () => {
    useProductFinder.getState().setBomModalOpen(true);
    useProductFinder.getState().setBomModalOpen(false);
    expect(useProductFinder.getState().bomModalOpen).toBe(false);
  });

  it("resetStore resets bomModalOpen to false", () => {
    useProductFinder.getState().setBomModalOpen(true);
    resetStore();
    expect(useProductFinder.getState().bomModalOpen).toBe(false);
  });
});

// ─── watches (product alert / notify-when-available) ─────────────────────────

describe("watches – toggleWatch", () => {
  beforeEach(resetStore);

  it("starts as an empty array", () => {
    expect(useProductFinder.getState().watches).toEqual([]);
  });

  it("toggleWatch adds a WatchEntry (id, name, addedAt) for a product not yet watched", () => {
    useProductFinder.getState().toggleWatch("prod-001", { name: "Test Breaker", now: 1234 });
    const entry = useProductFinder.getState().watches.find((w) => w.id === "prod-001");
    expect(entry).toEqual({ id: "prod-001", name: "Test Breaker", addedAt: 1234 });
  });

  it("toggleWatch defaults name to the id when no info is passed", () => {
    useProductFinder.getState().toggleWatch("prod-001");
    const entry = useProductFinder.getState().watches.find((w) => w.id === "prod-001");
    expect(entry?.name).toBe("prod-001");
    expect(typeof entry?.addedAt).toBe("number");
  });

  it("toggleWatch removes a product that is already watched (toggle off)", () => {
    useProductFinder.getState().toggleWatch("prod-001");
    useProductFinder.getState().toggleWatch("prod-001");
    expect(useProductFinder.getState().watches.some((w) => w.id === "prod-001")).toBe(false);
  });

  it("toggleWatch does not duplicate: adding the same id twice yields one entry", () => {
    useProductFinder.getState().toggleWatch("prod-002");
    useProductFinder.getState().toggleWatch("prod-002"); // removes
    useProductFinder.getState().toggleWatch("prod-002"); // adds again
    const { watches } = useProductFinder.getState();
    const count = watches.filter((w) => w.id === "prod-002").length;
    expect(count).toBe(1);
  });

  it("persists watches to localStorage via pf_watches key", () => {
    const mockStorage: Record<string, string> = {};
    const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    useProductFinder.getState().toggleWatch("persist-id");
    const raw = mockStorage["pf_watches"];
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw) as { id: string }[];
    expect(parsed.some((w) => w.id === "persist-id")).toBe(true);

    (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
  });

  it("removes id from localStorage when toggled off", () => {
    const mockStorage: Record<string, string> = {};
    const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    useProductFinder.getState().toggleWatch("unwatch-id");
    useProductFinder.getState().toggleWatch("unwatch-id");
    const raw = mockStorage["pf_watches"];
    const parsed = raw ? (JSON.parse(raw) as { id: string }[]) : [];
    expect(parsed.some((w) => w.id === "unwatch-id")).toBe(false);

    (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
  });

  it("resetStore resets watches to []", () => {
    useProductFinder.getState().toggleWatch("reset-id");
    resetStore();
    expect(useProductFinder.getState().watches).toEqual([]);
  });
});

describe("watches – hydrateSavedState loads pf_watches", () => {
  beforeEach(resetStore);

  it("migrates legacy string[] watches to WatchEntry[] on hydrate (one-time upgrade)", () => {
    const stored = ["product-a", "product-b"];
    const mockStorage: Record<string, string> = {
      pf_watches: JSON.stringify(stored),
    };
    const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    hydrateSavedState();
    const { watches } = useProductFinder.getState();
    expect(watches.map((w) => w.id)).toEqual(stored);
    for (const w of watches) {
      expect(typeof w.name).toBe("string");
      expect(typeof w.addedAt).toBe("number");
    }
    // The migrated shape is written back so the upgrade happens exactly once
    const persisted = JSON.parse(mockStorage["pf_watches"]) as { id: string }[];
    expect(persisted.map((w) => w.id)).toEqual(stored);

    (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
  });

  it("loads modern WatchEntry[] watches as-is on hydrate", () => {
    const stored = [{ id: "p1", name: "Widget", addedAt: 555 }];
    const mockStorage: Record<string, string> = {
      pf_watches: JSON.stringify(stored),
    };
    const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    hydrateSavedState();
    expect(useProductFinder.getState().watches).toEqual(stored);

    (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
  });
});

// ─── orders – placeOrder ──────────────────────────────────────────────────────

describe("orders – placeOrder", () => {
  beforeEach(resetStore);

  it("is a no-op when the cart is empty", () => {
    useProductFinder.getState().placeOrder(1000000, "ord-noop");
    expect(useProductFinder.getState().orders).toHaveLength(0);
  });

  it("snapshots cart lines into a new order prepended to history", () => {
    const p1 = CATALOG_PRODUCTS[0];
    const p2 = CATALOG_PRODUCTS[1];
    useProductFinder.getState().addToCart(p1, 2);
    useProductFinder.getState().addToCart(p2, 3);

    useProductFinder.getState().placeOrder(1000001, "ord-snap");

    const { orders } = useProductFinder.getState();
    expect(orders).toHaveLength(1);
    const order = orders[0];
    expect(order.id).toBe("ord-snap");
    expect(order.placedAt).toBe(1000001);
    expect(order.lines).toHaveLength(2);
    const ids = order.lines.map((l) => l.product.id);
    expect(ids).toContain(p1.id);
    expect(ids).toContain(p2.id);
    const l1 = order.lines.find((l) => l.product.id === p1.id)!;
    expect(l1.qty).toBe(2);
  });

  it("computes order total using the same tiered pricing as selectCartTotal", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 10); // qty 10 triggers 5% tier

    useProductFinder.getState().placeOrder(1000002, "ord-total");

    const { orders } = useProductFinder.getState();
    const order = orders[0];
    const expectedTotal = tierUnitPrice(p, 10) * 10;
    expect(order.total).toBeCloseTo(expectedTotal, 5);
    // confirm it IS a tiered price (less than flat)
    expect(order.total).toBeLessThan(p.unitPrice * 10);
  });

  it("clears the cart after placing an order", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 5);
    useProductFinder.getState().placeOrder(1000003, "ord-clear");

    const { cart } = useProductFinder.getState();
    expect(Object.keys(cart)).toHaveLength(0);
  });

  it("prepends new orders so the most recent is first", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 1);
    useProductFinder.getState().placeOrder(1000004, "ord-first");

    useProductFinder.getState().addToCart(p, 2);
    useProductFinder.getState().placeOrder(1000005, "ord-second");

    const { orders } = useProductFinder.getState();
    expect(orders[0].id).toBe("ord-second");
    expect(orders[1].id).toBe("ord-first");
  });
});

// ─── orders – reorder ─────────────────────────────────────────────────────────

describe("orders – reorder", () => {
  beforeEach(resetStore);

  it("replaces the cart with the lines from a past order", () => {
    const p1 = CATALOG_PRODUCTS[0];
    const p2 = CATALOG_PRODUCTS[1];
    useProductFinder.getState().addToCart(p1, 4);
    useProductFinder.getState().addToCart(p2, 7);
    useProductFinder.getState().placeOrder(2000000, "reord-src");

    // Cart is now empty — add a different product
    useProductFinder.getState().addToCart(CATALOG_PRODUCTS[2], 99);

    useProductFinder.getState().reorder("reord-src");

    const { cart } = useProductFinder.getState();
    expect(cart[p1.id]).toBeDefined();
    expect(cart[p1.id].qty).toBe(4);
    expect(cart[p2.id]).toBeDefined();
    expect(cart[p2.id].qty).toBe(7);
    // The third product should be gone (replaced)
    expect(cart[CATALOG_PRODUCTS[2].id]).toBeUndefined();
  });

  it("reorder produces an independent deep copy: mutating cart does not alter stored order", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 3);
    useProductFinder.getState().placeOrder(2000001, "reord-deep");

    useProductFinder.getState().reorder("reord-deep");
    // Mutate the reloaded cart qty
    useProductFinder.getState().updateCartQty(p.id, 999);

    // The stored order lines must be unchanged
    const order = useProductFinder.getState().orders.find((o) => o.id === "reord-deep")!;
    expect(order.lines[0].qty).toBe(3);
  });

  it("is a no-op when the id is not found", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 2);
    useProductFinder.getState().reorder("ghost-order");
    // cart unchanged
    expect(useProductFinder.getState().cart[p.id]?.qty).toBe(2);
  });
});

// ─── orders – deleteOrder ─────────────────────────────────────────────────────

describe("orders – deleteOrder", () => {
  beforeEach(resetStore);

  it("removes the order with the given id", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 1);
    useProductFinder.getState().placeOrder(3000000, "del-ord-1");
    useProductFinder.getState().addToCart(p, 2);
    useProductFinder.getState().placeOrder(3000001, "del-ord-2");

    useProductFinder.getState().deleteOrder("del-ord-1");

    const { orders } = useProductFinder.getState();
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe("del-ord-2");
  });

  it("is a no-op when the id is not found", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 1);
    useProductFinder.getState().placeOrder(3000100, "keep-ord");
    useProductFinder.getState().deleteOrder("ghost-id");
    expect(useProductFinder.getState().orders).toHaveLength(1);
  });
});

// ─── orders – persistence & hydrateSavedState ─────────────────────────────────

describe("orders – persistence via hydrateSavedState", () => {
  beforeEach(resetStore);

  it("persists orders to pf_orders key in localStorage when placeOrder is called", () => {
    const p = CATALOG_PRODUCTS[0];
    const mockStorage: Record<string, string> = {};
    const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    useProductFinder.getState().addToCart(p, 3);
    useProductFinder.getState().placeOrder(4000000, "persist-ord");

    const raw = mockStorage["pf_orders"];
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw) as Order[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe("persist-ord");
    expect(parsed[0].lines[0].qty).toBe(3);

    (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
  });

  it("loads orders from pf_orders key when hydrateSavedState is called", () => {
    const p = CATALOG_PRODUCTS[0];
    const storedOrders: Order[] = [
      { id: "hyd-ord-1", placedAt: 5000000, lines: [{ product: p, qty: 2 }], total: p.unitPrice * 2, customerId: null, customerName: null },
    ];
    const mockStorage: Record<string, string> = {
      pf_orders: JSON.stringify(storedOrders),
    };
    const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    hydrateSavedState();
    const { orders } = useProductFinder.getState();
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe("hyd-ord-1");
    expect(orders[0].lines[0].qty).toBe(2);

    (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
  });
});

// ─── orders – seed on first-ever load ─────────────────────────────────────────

describe("orders – hydrateSavedState seed behavior", () => {
  beforeEach(resetStore);

  it("seeds demo orders (≥ 3: 2 for CUST-001 + 1 for CUST-002) when pf_orders key is absent (null from getItem)", () => {
    const mockStorage: Record<string, string> = {}; // no pf_orders key
    const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    hydrateSavedState();
    const { orders } = useProductFinder.getState();
    // Per I-5b: at least 3 seed orders (2 for CUST-001, 1 for CUST-002)
    expect(orders.length).toBeGreaterThanOrEqual(3);
    // Seed also writes to localStorage so it persists
    expect(mockStorage["pf_orders"]).toBeDefined();
    const persisted = JSON.parse(mockStorage["pf_orders"]) as Order[];
    expect(persisted.length).toBeGreaterThanOrEqual(3);

    (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
  });

  it("does NOT seed when pf_orders is present but an empty array (key exists with value '[]')", () => {
    const mockStorage: Record<string, string> = { pf_orders: "[]" };
    const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    hydrateSavedState();
    expect(useProductFinder.getState().orders).toHaveLength(0);

    (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
  });

  it("does NOT seed when pf_orders has real orders already", () => {
    const p = CATALOG_PRODUCTS[0];
    const existing: Order[] = [
      { id: "existing-1", placedAt: 9000000, lines: [{ product: p, qty: 1 }], total: p.unitPrice, customerId: null, customerName: null },
    ];
    const mockStorage: Record<string, string> = { pf_orders: JSON.stringify(existing) };
    const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    hydrateSavedState();
    expect(useProductFinder.getState().orders).toHaveLength(1);
    expect(useProductFinder.getState().orders[0].id).toBe("existing-1");

    (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
  });

  it("seed orders have deterministic ids and recent placedAt values (within 6-month window)", () => {
    // Use a fixed `now` so assertions are deterministic regardless of wall-clock time.
    // 2026-06-07T00:00:00Z — a stable epoch for test purposes.
    const FIXED_NOW = new Date("2026-06-07T00:00:00Z").getTime();
    const MS_PER_DAY = 86_400_000;
    const SIX_MONTHS_MS = 183 * MS_PER_DAY; // conservative 183-day window

    const orders = buildDemoOrders(FIXED_NOW);

    // All orders must have non-empty ids, positive totals, and at least one line
    for (const o of orders) {
      expect(o.id.length).toBeGreaterThan(0);
      expect(o.placedAt).toBeGreaterThan(0);
      expect(o.lines.length).toBeGreaterThan(0);
      expect(o.total).toBeGreaterThan(0);
    }

    // Each placedAt must be within the last 6 months of FIXED_NOW
    for (const o of orders) {
      expect(o.placedAt).toBeGreaterThan(FIXED_NOW - SIX_MONTHS_MS);
      expect(o.placedAt).toBeLessThanOrEqual(FIXED_NOW);
    }

    // Verify the three expected offsets: 5, 35, 70 days before FIXED_NOW
    const demo001 = orders.find((o) => o.id === "demo-order-001");
    const demo002 = orders.find((o) => o.id === "demo-order-002");
    const demo003 = orders.find((o) => o.id === "demo-order-003");
    if (demo001) expect(demo001.placedAt).toBe(FIXED_NOW - 5 * MS_PER_DAY);
    if (demo002) expect(demo002.placedAt).toBe(FIXED_NOW - 35 * MS_PER_DAY);
    if (demo003) expect(demo003.placedAt).toBe(FIXED_NOW - 70 * MS_PER_DAY);

    // ordersOverTime must yield ≥ 1 non-empty bucket for this seeded set
    const buckets = ordersOverTime(orders, FIXED_NOW, 6);
    const nonEmpty = buckets.filter((b) => b.count > 0);
    expect(nonEmpty.length).toBeGreaterThanOrEqual(1);
  });

  it("calling hydrateSavedState twice with absent key seeds only once (idempotent after first write)", () => {
    const mockStorage: Record<string, string> = {};
    const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    hydrateSavedState(); // seeds ≥3, writes to mockStorage
    const seedCount = useProductFinder.getState().orders.length;
    resetStore();
    hydrateSavedState(); // pf_orders now present → no re-seed
    expect(useProductFinder.getState().orders).toHaveLength(seedCount);

    (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
  });
});

// ─── G4: spec-level facet filters ────────────────────────────────────────────

describe("specFilters – toggleSpecFilter", () => {
  beforeEach(() => {
    resetStore();
    searchItems = [];
    searchTotal = 0;
    searchFacets = [];
  });

  it("starts with specFilters as an empty object", () => {
    expect(useProductFinder.getState().filters.specFilters).toEqual({});
  });

  it("toggleSpecFilter adds a value for a new spec name", async () => {
    await useProductFinder.getState().toggleSpecFilter("Amperage", "15A");
    expect(useProductFinder.getState().filters.specFilters).toEqual({ Amperage: ["15A"] });
  });

  it("toggleSpecFilter appends a second value for the same spec name", async () => {
    await useProductFinder.getState().toggleSpecFilter("Amperage", "15A");
    await useProductFinder.getState().toggleSpecFilter("Amperage", "20A");
    const { specFilters } = useProductFinder.getState().filters;
    expect(specFilters["Amperage"]).toContain("15A");
    expect(specFilters["Amperage"]).toContain("20A");
    expect(specFilters["Amperage"]).toHaveLength(2);
  });

  it("toggleSpecFilter removes a value when it is already selected", async () => {
    await useProductFinder.getState().toggleSpecFilter("Amperage", "15A");
    await useProductFinder.getState().toggleSpecFilter("Amperage", "20A");
    await useProductFinder.getState().toggleSpecFilter("Amperage", "15A"); // remove
    const { specFilters } = useProductFinder.getState().filters;
    expect(specFilters["Amperage"]).toEqual(["20A"]);
  });

  it("toggleSpecFilter removes the spec name key when its values array becomes empty", async () => {
    await useProductFinder.getState().toggleSpecFilter("Amperage", "15A");
    await useProductFinder.getState().toggleSpecFilter("Amperage", "15A"); // remove last
    const { specFilters } = useProductFinder.getState().filters;
    expect("Amperage" in specFilters).toBe(false);
  });

  it("toggleSpecFilter re-runs search after each toggle", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const callsBefore = fetchSpy.mock.calls.length;
    await useProductFinder.getState().toggleSpecFilter("Amperage", "15A");
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});

describe("specFilters – clearFilters resets specFilters", () => {
  beforeEach(() => {
    resetStore();
    searchItems = [];
    searchTotal = 0;
    searchFacets = [];
  });

  it("clearFilters resets specFilters to {}", async () => {
    await useProductFinder.getState().toggleSpecFilter("Amperage", "15A");
    await useProductFinder.getState().toggleSpecFilter("Poles", "1-Pole");
    useProductFinder.getState().clearFilters();
    expect(useProductFinder.getState().filters.specFilters).toEqual({});
  });
});

describe("facets – runSearch stores facets from response", () => {
  beforeEach(() => {
    resetStore();
    searchItems = [];
    searchTotal = 0;
    searchFacets = [];
  });

  it("starts with facets as an empty array", () => {
    expect(useProductFinder.getState().facets).toEqual([]);
  });

  it("runSearch stores facets from search response", async () => {
    const mockFacets = [{ name: "Amperage", values: [{ value: "15A", count: 5 }] }];
    searchFacets = mockFacets;

    await useProductFinder.getState().runSearch();
    expect(useProductFinder.getState().facets).toEqual(mockFacets);
  });

  it("loadMore does not overwrite facets (keeps facets from first runSearch)", async () => {
    const mockFacets = [{ name: "Voltage", values: [{ value: "120V", count: 10 }] }];
    searchFacets = mockFacets;
    searchItems = [CATALOG_PRODUCTS[0]];
    searchTotal = 2;

    await useProductFinder.getState().runSearch();
    expect(useProductFinder.getState().facets).toEqual(mockFacets);

    // Change the mock facets before loadMore — loadMore should NOT clobber
    searchFacets = [{ name: "Other", values: [{ value: "X", count: 1 }] }];
    await useProductFinder.getState().loadMore();

    // Facets should still be the first page's facets
    expect(useProductFinder.getState().facets).toEqual(mockFacets);
  });
});

// ─── Customer accounts – store slice ─────────────────────────────────────────

describe("customers – store slice", () => {
  beforeEach(resetStore);

  it("customers is populated from the provider on store init", () => {
    const { customers } = useProductFinder.getState();
    expect(customers).toHaveLength(CUSTOMER_ACCOUNTS.length);
    expect(customers.map((c) => c.id)).toEqual(CUSTOMER_ACCOUNTS.map((c) => c.id));
  });

  it("activeCustomerId starts as null", () => {
    expect(useProductFinder.getState().activeCustomerId).toBeNull();
  });

  it("setActiveCustomer sets activeCustomerId", () => {
    const id = CUSTOMER_ACCOUNTS[0].id;
    useProductFinder.getState().setActiveCustomer(id);
    expect(useProductFinder.getState().activeCustomerId).toBe(id);
  });

  it("setActiveCustomer(null) clears activeCustomerId", () => {
    useProductFinder.getState().setActiveCustomer(CUSTOMER_ACCOUNTS[0].id);
    useProductFinder.getState().setActiveCustomer(null);
    expect(useProductFinder.getState().activeCustomerId).toBeNull();
  });

  it("setActiveCustomer persists to localStorage under pf_active_customer", () => {
    const mockStorage: Record<string, string> = {};
    const original = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    const id = CUSTOMER_ACCOUNTS[0].id;
    useProductFinder.getState().setActiveCustomer(id);
    expect(mockStorage["pf_active_customer"]).toBe(id);

    (globalThis as Record<string, unknown>).localStorage = original;
  });

  it("setActiveCustomer(null) removes pf_active_customer from localStorage", () => {
    const mockStorage: Record<string, string> = {};
    const original = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    useProductFinder.getState().setActiveCustomer(CUSTOMER_ACCOUNTS[0].id);
    useProductFinder.getState().setActiveCustomer(null);
    expect(mockStorage["pf_active_customer"]).toBeUndefined();

    (globalThis as Record<string, unknown>).localStorage = original;
  });

  it("resetStore resets activeCustomerId to null", () => {
    useProductFinder.getState().setActiveCustomer(CUSTOMER_ACCOUNTS[0].id);
    resetStore();
    expect(useProductFinder.getState().activeCustomerId).toBeNull();
  });
});

// ─── selectActiveCustomer ─────────────────────────────────────────────────────

describe("selectActiveCustomer", () => {
  beforeEach(resetStore);

  it("returns null when activeCustomerId is null", () => {
    const state = useProductFinder.getState();
    expect(selectActiveCustomer(state)).toBeNull();
  });

  it("returns the matching CustomerAccount when activeCustomerId is set", () => {
    const target = CUSTOMER_ACCOUNTS[0];
    useProductFinder.getState().setActiveCustomer(target.id);
    const state = useProductFinder.getState();
    const result = selectActiveCustomer(state);
    expect(result).toBeDefined();
    expect(result?.id).toBe(target.id);
    expect(result?.name).toBe(target.name);
  });

  it("returns null for an id not found in customers list", () => {
    useProductFinder.setState({ activeCustomerId: "GHOST-ID" });
    const state = useProductFinder.getState();
    expect(selectActiveCustomer(state)).toBeNull();
  });
});

// ─── hydrateSavedState loads activeCustomerId ─────────────────────────────────

describe("hydrateSavedState – activeCustomerId", () => {
  beforeEach(resetStore);

  it("loads a valid activeCustomerId from localStorage", () => {
    const id = CUSTOMER_ACCOUNTS[0].id;
    const mockStorage: Record<string, string> = {
      pf_active_customer: id,
    };
    const original = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    hydrateSavedState();
    expect(useProductFinder.getState().activeCustomerId).toBe(id);

    (globalThis as Record<string, unknown>).localStorage = original;
  });

  it("ignores an id that no longer exists in the customer list", () => {
    const mockStorage: Record<string, string> = {
      pf_active_customer: "STALE-CUST-999",
    };
    const original = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    hydrateSavedState();
    expect(useProductFinder.getState().activeCustomerId).toBeNull();

    (globalThis as Record<string, unknown>).localStorage = original;
  });

  it("defaults to null when pf_active_customer key is absent", () => {
    const mockStorage: Record<string, string> = {};
    const original = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    hydrateSavedState();
    expect(useProductFinder.getState().activeCustomerId).toBeNull();

    (globalThis as Record<string, unknown>).localStorage = original;
  });
});

// ─── I-5b: Order type has customerId + customerName ───────────────────────────

describe("I-5b: Order.customerId + customerName fields", () => {
  beforeEach(resetStore);

  it("placeOrder stamps customerId = null and customerName = null when no active customer", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 1);
    useProductFinder.getState().placeOrder(9000001, "stamp-null");

    const order = useProductFinder.getState().orders[0];
    expect(order.customerId).toBeNull();
    expect(order.customerName).toBeNull();
  });

  it("placeOrder stamps customerId and customerName from the active customer", () => {
    const customer = CUSTOMER_ACCOUNTS.find((c) => c.id === "CUST-001")!;
    useProductFinder.getState().setActiveCustomer(customer.id);
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 1);
    useProductFinder.getState().placeOrder(9000002, "stamp-cust");

    const order = useProductFinder.getState().orders[0];
    expect(order.customerId).toBe("CUST-001");
    expect(order.customerName).toBe(customer.name);
  });
});

// ─── I-5b: placeOrder total uses contract pricing ─────────────────────────────

describe("I-5b: placeOrder total uses contract pricing (not bare tierUnitPrice)", () => {
  beforeEach(resetStore);

  function findNetPricedProduct() {
    // CB-SQD-QO115 has a net price for CUST-001 in customers.ts
    const p = CATALOG_PRODUCTS.find((x) => x.id === "CB-SQD-QO115");
    if (!p) throw new Error("CB-SQD-QO115 not found in CATALOG_PRODUCTS");
    return p;
  }

  it("with a contract customer active, order total uses effectiveUnitPrice (< tierUnitPrice for net-priced SKU)", () => {
    const customer = CUSTOMER_ACCOUNTS.find((c) => c.id === "CUST-001")!;
    useProductFinder.getState().setActiveCustomer(customer.id);
    const p = findNetPricedProduct();
    // qty 1 — no volume break; net price beats tier price
    useProductFinder.getState().addToCart(p, 1);
    useProductFinder.getState().placeOrder(9000010, "contract-total");

    const order = useProductFinder.getState().orders[0];
    const provider = getPricingProvider();
    const expected = provider.getPricing(p, { customer, qty: 1 }).effectiveUnitPrice * 1;
    expect(order.total).toBeCloseTo(expected, 5);
    // Contract price (6.95) < list/tier price — verify the bug is fixed
    const tierBased = tierUnitPrice(p, 1) * 1;
    expect(order.total).toBeLessThan(tierBased);
  });

  it("with no active customer, order total still uses tierUnitPrice (unchanged path)", () => {
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 10);
    useProductFinder.getState().placeOrder(9000011, "no-cust-total");

    const order = useProductFinder.getState().orders[0];
    const expected = tierUnitPrice(p, 10) * 10;
    expect(order.total).toBeCloseTo(expected, 5);
  });

  it("order total matches the cart total the customer saw (same pricing, same customer)", () => {
    const customer = CUSTOMER_ACCOUNTS.find((c) => c.id === "CUST-001")!;
    useProductFinder.getState().setActiveCustomer(customer.id);
    const p = findNetPricedProduct();
    useProductFinder.getState().addToCart(p, 5);

    // Read cart total BEFORE placing order
    const cartTotal = selectCartTotal(useProductFinder.getState());
    useProductFinder.getState().placeOrder(9000012, "total-matches-cart");

    const order = useProductFinder.getState().orders[0];
    expect(order.total).toBeCloseTo(cartTotal, 5);
  });
});

// ─── I-5b: selectVisibleOrders ────────────────────────────────────────────────

describe("I-5b: selectVisibleOrders", () => {
  beforeEach(resetStore);

  it("returns an empty array when there are no orders", () => {
    const state = useProductFinder.getState();
    expect(selectVisibleOrders(state)).toHaveLength(0);
  });

  it("with no active customer, shows only orders where customerId === null", () => {
    const p = CATALOG_PRODUCTS[0];
    // Walk-in order
    useProductFinder.getState().addToCart(p, 1);
    useProductFinder.getState().placeOrder(9100001, "walkin-ord");

    // CUST-001 order
    useProductFinder.getState().setActiveCustomer("CUST-001");
    useProductFinder.getState().addToCart(p, 2);
    useProductFinder.getState().placeOrder(9100002, "cust001-ord");

    // Switch back to no active customer
    useProductFinder.getState().setActiveCustomer(null);
    const state = useProductFinder.getState();
    const visible = selectVisibleOrders(state);
    expect(visible.every((o) => o.customerId === null)).toBe(true);
    expect(visible.some((o) => o.id === "walkin-ord")).toBe(true);
    expect(visible.some((o) => o.id === "cust001-ord")).toBe(false);
  });

  it("with active customer CUST-001, shows only CUST-001 orders", () => {
    const p = CATALOG_PRODUCTS[0];
    // Walk-in order
    useProductFinder.getState().addToCart(p, 1);
    useProductFinder.getState().placeOrder(9100010, "walkin-2");

    // CUST-001 order
    useProductFinder.getState().setActiveCustomer("CUST-001");
    useProductFinder.getState().addToCart(p, 2);
    useProductFinder.getState().placeOrder(9100011, "cust001-2");

    // CUST-002 order
    useProductFinder.getState().setActiveCustomer("CUST-002");
    useProductFinder.getState().addToCart(p, 3);
    useProductFinder.getState().placeOrder(9100012, "cust002-2");

    // Back to CUST-001
    useProductFinder.getState().setActiveCustomer("CUST-001");
    const state = useProductFinder.getState();
    const visible = selectVisibleOrders(state);
    expect(visible.every((o) => o.customerId === "CUST-001")).toBe(true);
    expect(visible.some((o) => o.id === "cust001-2")).toBe(true);
    expect(visible.some((o) => o.id === "walkin-2")).toBe(false);
    expect(visible.some((o) => o.id === "cust002-2")).toBe(false);
  });

  it("switching active customer immediately changes visible orders", () => {
    const p = CATALOG_PRODUCTS[0];

    useProductFinder.getState().setActiveCustomer("CUST-001");
    useProductFinder.getState().addToCart(p, 1);
    useProductFinder.getState().placeOrder(9100020, "switch-cust001");

    useProductFinder.getState().setActiveCustomer("CUST-002");
    useProductFinder.getState().addToCart(p, 2);
    useProductFinder.getState().placeOrder(9100021, "switch-cust002");

    // Check CUST-001 view
    useProductFinder.getState().setActiveCustomer("CUST-001");
    const stateCust1 = useProductFinder.getState();
    expect(selectVisibleOrders(stateCust1).map((o) => o.id)).toContain("switch-cust001");
    expect(selectVisibleOrders(stateCust1).map((o) => o.id)).not.toContain("switch-cust002");

    // Switch to CUST-002 view
    useProductFinder.getState().setActiveCustomer("CUST-002");
    const stateCust2 = useProductFinder.getState();
    expect(selectVisibleOrders(stateCust2).map((o) => o.id)).toContain("switch-cust002");
    expect(selectVisibleOrders(stateCust2).map((o) => o.id)).not.toContain("switch-cust001");
  });
});

// ─── I-5b: seed assigns orders to specific customers ─────────────────────────

describe("I-5b: demo seed assigns orders to correct customers", () => {
  beforeEach(resetStore);

  it("seed assigns at least 2 orders to CUST-001 (Gulf Coast Industrial)", () => {
    const mockStorage: Record<string, string> = {};
    const original = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    hydrateSavedState();
    const { orders } = useProductFinder.getState();
    const cust001Orders = orders.filter((o) => o.customerId === "CUST-001");
    expect(cust001Orders.length).toBeGreaterThanOrEqual(2);

    (globalThis as Record<string, unknown>).localStorage = original;
  });

  it("seed assigns at least 1 order to CUST-002 (Lone Star Data Systems)", () => {
    const mockStorage: Record<string, string> = {};
    const original = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    hydrateSavedState();
    const { orders } = useProductFinder.getState();
    const cust002Orders = orders.filter((o) => o.customerId === "CUST-002");
    expect(cust002Orders.length).toBeGreaterThanOrEqual(1);

    (globalThis as Record<string, unknown>).localStorage = original;
  });

  it("seed orders for CUST-001 have correct customerName = 'Gulf Coast Industrial'", () => {
    const mockStorage: Record<string, string> = {};
    const original = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    hydrateSavedState();
    const { orders } = useProductFinder.getState();
    const cust001Orders = orders.filter((o) => o.customerId === "CUST-001");
    expect(cust001Orders.every((o) => o.customerName === "Gulf Coast Industrial")).toBe(true);

    (globalThis as Record<string, unknown>).localStorage = original;
  });

  it("seeded CUST-001 order totals use contract pricing (< bare tier total for net-priced SKUs)", () => {
    const mockStorage: Record<string, string> = {};
    const original = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    hydrateSavedState();
    const { orders } = useProductFinder.getState();
    // demo-order-001: CB-SQD-QO115 (qty 10) + CB-EAT-CH115 (qty 5), assigned to CUST-001
    const order1 = orders.find((o) => o.id === "demo-order-001");
    if (!order1) return; // skip if products absent from catalog
    // Compute what the tier-only total would be
    const tierTotal = order1.lines.reduce((s, l) => s + tierUnitPrice(l.product, l.qty) * l.qty, 0);
    // CUST-001 has net prices on all 3 SKUs, so contract total should be less
    expect(order1.total).toBeLessThan(tierTotal);

    (globalThis as Record<string, unknown>).localStorage = original;
  });

  it("total seed order count is at least 3 (2 for CUST-001 + 1 for CUST-002)", () => {
    const mockStorage: Record<string, string> = {};
    const original = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    hydrateSavedState();
    const { orders } = useProductFinder.getState();
    expect(orders.length).toBeGreaterThanOrEqual(3);

    (globalThis as Record<string, unknown>).localStorage = original;
  });
});

// ─── I-5b: reorder still deep-copies (regression) ────────────────────────────

describe("I-5b: reorder still works with per-customer orders", () => {
  beforeEach(resetStore);

  it("reorder on a customer-stamped order still deep-copies lines into cart", () => {
    const customer = CUSTOMER_ACCOUNTS.find((c) => c.id === "CUST-001")!;
    useProductFinder.getState().setActiveCustomer(customer.id);
    const p = CATALOG_PRODUCTS[0];
    useProductFinder.getState().addToCart(p, 4);
    useProductFinder.getState().placeOrder(9200001, "reord-cust");

    useProductFinder.getState().reorder("reord-cust");
    expect(useProductFinder.getState().cart[p.id]?.qty).toBe(4);

    // Mutate cart — stored order must be unchanged
    useProductFinder.getState().updateCartQty(p.id, 999);
    const stored = useProductFinder.getState().orders.find((o) => o.id === "reord-cust")!;
    expect(stored.lines[0].qty).toBe(4);
  });
});

// ─── specRanges – setSpecRange ────────────────────────────────────────────────

describe("specRanges – setSpecRange", () => {
  beforeEach(resetStore);

  it("starts with empty specRanges in defaultFilters", () => {
    expect(useProductFinder.getState().filters.specRanges).toEqual({});
  });

  it("setSpecRange sets a range entry and re-runs search", async () => {
    await useProductFinder.getState().setSpecRange("Amperage", { min: 15, max: 30 });
    const { filters } = useProductFinder.getState();
    expect(filters.specRanges["Amperage"]).toEqual({ min: 15, max: 30 });
  });

  it("setSpecRange with min-only stores a partial range", async () => {
    await useProductFinder.getState().setSpecRange("Voltage", { min: 120 });
    expect(useProductFinder.getState().filters.specRanges["Voltage"]).toEqual({ min: 120 });
  });

  it("setSpecRange with max-only stores a partial range", async () => {
    await useProductFinder.getState().setSpecRange("Wattage", { max: 600 });
    expect(useProductFinder.getState().filters.specRanges["Wattage"]).toEqual({ max: 600 });
  });

  it("setSpecRange with both undefined deletes the key (clears the range)", async () => {
    await useProductFinder.getState().setSpecRange("Amperage", { min: 15, max: 30 });
    await useProductFinder.getState().setSpecRange("Amperage", {});
    const { filters } = useProductFinder.getState();
    expect(filters.specRanges["Amperage"]).toBeUndefined();
  });

  it("clearFilters resets specRanges to {}", async () => {
    await useProductFinder.getState().setSpecRange("Amperage", { min: 10, max: 50 });
    expect(Object.keys(useProductFinder.getState().filters.specRanges).length).toBeGreaterThan(0);
    useProductFinder.getState().clearFilters();
    expect(useProductFinder.getState().filters.specRanges).toEqual({});
  });

  it("resetStore resets specRanges to {}", async () => {
    await useProductFinder.getState().setSpecRange("CCT", { min: 3000, max: 5000 });
    resetStore();
    expect(useProductFinder.getState().filters.specRanges).toEqual({});
  });
});

// ─── Demo accounts (password-free projection) ─────────────────────────────────

describe("DEMO_ACCOUNTS & DEMO_PASSWORD", () => {
  it("DEMO_ACCOUNTS has exactly 3 entries", () => {
    expect(DEMO_ACCOUNTS).toHaveLength(3);
  });

  it("no entry carries a password property", () => {
    for (const account of DEMO_ACCOUNTS) {
      expect("password" in account).toBe(false);
      expect(Object.keys(account).sort()).toEqual(["email", "name", "role"]);
    }
  });

  it("covers the sales/manager/admin demo emails", () => {
    const emails = DEMO_ACCOUNTS.map((a) => a.email).sort();
    expect(emails).toEqual([
      "admin@meridiansupply.com",
      "manager@meridiansupply.com",
      "sales@meridiansupply.com",
    ]);
  });

  it('DEMO_PASSWORD is "meridian2024" and works for login', () => {
    expect(DEMO_PASSWORD).toBe("meridian2024");
    expect(useProductFinder.getState().login("sales@meridiansupply.com", DEMO_PASSWORD)).toBe(true);
    useProductFinder.getState().logout();
  });
});

// ─── Cart deep-linking (openCartAt / clearCartFilters / setCartOpen) ──────────

describe("cart deep-linking", () => {
  beforeEach(resetStore);

  it("starts with no section and no filters", () => {
    const s = useProductFinder.getState();
    expect(s.cartSection).toBeNull();
    expect(s.cartQuoteStatusFilter).toBeNull();
    expect(s.cartOrderMonthFilter).toBeNull();
  });

  it('openCartAt("quotes", { quoteStatus: "sent" }) opens the drawer with the quote filter and nulls the month filter', () => {
    useProductFinder.getState().openCartAt("quotes", { quoteStatus: "sent" });
    const s = useProductFinder.getState();
    expect(s.cartOpen).toBe(true);
    expect(s.cartSection).toBe("quotes");
    expect(s.cartQuoteStatusFilter).toBe("sent");
    expect(s.cartOrderMonthFilter).toBeNull();
  });

  it('openCartAt("orders", { orderMonth }) sets the month filter and nulls the quote filter', () => {
    useProductFinder.getState().openCartAt("quotes", { quoteStatus: "won" });
    useProductFinder.getState().openCartAt("orders", { orderMonth: { year: 2026, month: 4 } });
    const s = useProductFinder.getState();
    expect(s.cartOpen).toBe(true);
    expect(s.cartSection).toBe("orders");
    expect(s.cartOrderMonthFilter).toEqual({ year: 2026, month: 4 });
    expect(s.cartQuoteStatusFilter).toBeNull();
  });

  it("openCartAt with no opts nulls both filters", () => {
    useProductFinder.getState().openCartAt("quotes", { quoteStatus: "sent" });
    useProductFinder.getState().openCartAt("basket");
    const s = useProductFinder.getState();
    expect(s.cartSection).toBe("basket");
    expect(s.cartQuoteStatusFilter).toBeNull();
    expect(s.cartOrderMonthFilter).toBeNull();
  });

  it("clearCartFilters nulls both filters but keeps the drawer open and the section", () => {
    useProductFinder.getState().openCartAt("quotes", { quoteStatus: "sent" });
    useProductFinder.getState().clearCartFilters();
    const s = useProductFinder.getState();
    expect(s.cartOpen).toBe(true);
    expect(s.cartSection).toBe("quotes");
    expect(s.cartQuoteStatusFilter).toBeNull();
    expect(s.cartOrderMonthFilter).toBeNull();
  });

  it("setCartOpen(true) resets section and both filters", () => {
    useProductFinder.getState().openCartAt("orders", { orderMonth: { year: 2025, month: 11 } });
    useProductFinder.getState().setCartOpen(true);
    const s = useProductFinder.getState();
    expect(s.cartOpen).toBe(true);
    expect(s.cartSection).toBeNull();
    expect(s.cartQuoteStatusFilter).toBeNull();
    expect(s.cartOrderMonthFilter).toBeNull();
  });

  it("setCartOpen(false) also resets section and filters", () => {
    useProductFinder.getState().openCartAt("quotes", { quoteStatus: "draft" });
    useProductFinder.getState().setCartOpen(false);
    const s = useProductFinder.getState();
    expect(s.cartOpen).toBe(false);
    expect(s.cartSection).toBeNull();
    expect(s.cartQuoteStatusFilter).toBeNull();
    expect(s.cartOrderMonthFilter).toBeNull();
  });
});

// ─── setAllFilters ────────────────────────────────────────────────────────────

describe("setAllFilters", () => {
  beforeEach(resetStore);

  it("sets filters, mirrors the query field, and clears appliedNlFilters", async () => {
    await useProductFinder.getState().runNlSearch("preferred under $50");
    expect(useProductFinder.getState().appliedNlFilters.length).toBeGreaterThan(0);

    const next = emptyFilterState();
    next.query = "gfci";
    next.categories.add("electrical");
    useProductFinder.getState().setAllFilters(next);

    const s = useProductFinder.getState();
    expect(s.filters).toBe(next);
    expect(s.query).toBe("gfci");
    expect(s.appliedNlFilters).toEqual([]);
  });

  it("does not run a search and does not flip loading", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const callsBefore = fetchSpy.mock.calls.length;
    const next = emptyFilterState();
    next.query = "breaker";
    useProductFinder.getState().setAllFilters(next);
    expect(fetchSpy.mock.calls.length).toBe(callsBefore);
    expect(useProductFinder.getState().loading).toBe(false);
  });
});

// ─── Guided tour ──────────────────────────────────────────────────────────────

describe("guided tour", () => {
  beforeEach(resetStore);

  it("starts closed at step 0", () => {
    const s = useProductFinder.getState();
    expect(s.tourOpen).toBe(false);
    expect(s.tourStep).toBe(0);
  });

  it("startTour opens at step 0 and writes pf_tour_seen", () => {
    const mockStorage: Record<string, string> = {};
    const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    useProductFinder.getState().setTourStep(4);
    useProductFinder.getState().startTour();
    const s = useProductFinder.getState();
    expect(s.tourOpen).toBe(true);
    expect(s.tourStep).toBe(0);
    expect(mockStorage["pf_tour_seen"]).toBe("1");

    (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
  });

  it("setTourStep updates the step", () => {
    useProductFinder.getState().startTour();
    useProductFinder.getState().setTourStep(3);
    expect(useProductFinder.getState().tourStep).toBe(3);
  });

  it("closeTour closes the tour and writes pf_tour_seen", () => {
    const mockStorage: Record<string, string> = {};
    const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };

    useProductFinder.getState().startTour();
    delete mockStorage["pf_tour_seen"];
    useProductFinder.getState().closeTour();
    expect(useProductFinder.getState().tourOpen).toBe(false);
    expect(mockStorage["pf_tour_seen"]).toBe("1");

    (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
  });
});

// ─── Command palette ──────────────────────────────────────────────────────────

describe("command palette", () => {
  beforeEach(resetStore);

  it("starts closed", () => {
    expect(useProductFinder.getState().paletteOpen).toBe(false);
  });

  it("setPaletteOpen toggles", () => {
    useProductFinder.getState().setPaletteOpen(true);
    expect(useProductFinder.getState().paletteOpen).toBe(true);
    useProductFinder.getState().setPaletteOpen(false);
    expect(useProductFinder.getState().paletteOpen).toBe(false);
  });
});

// ─── "Did you mean…?" correction flow ────────────────────────────────────────

describe("runNlSearch correction flow", () => {
  beforeEach(() => {
    resetStore();
    searchItems = [];
    searchTotal = 0;
  });

  it("dismissCorrection clears the banner", () => {
    useProductFinder.setState({ correction: { original: "a", corrected: "b", autoApplied: false } });
    useProductFinder.getState().dismissCorrection();
    expect(useProductFinder.getState().correction).toBeNull();
  });

  it("zero results + a confident typo auto-applies the corrected query", async () => {
    searchTotal = 0;
    await useProductFinder.getState().runNlSearch("breakr");
    const s = useProductFinder.getState();
    expect(s.correction).toEqual({ original: "breakr", corrected: "breaker", autoApplied: true });
    expect(s.query).toBe("breaker"); // recursive corrected search ran last
  });

  it("plenty of results → no correction", async () => {
    searchTotal = 100;
    await useProductFinder.getState().runNlSearch("breakr");
    expect(useProductFinder.getState().correction).toBeNull();
    expect(useProductFinder.getState().query).toBe("breakr"); // untouched
  });

  it("near-zero (1–2) results suggests without auto-applying", async () => {
    searchTotal = 2;
    await useProductFinder.getState().runNlSearch("breakr");
    const s = useProductFinder.getState();
    expect(s.correction).toEqual({ original: "breakr", corrected: "breaker", autoApplied: false });
    expect(s.query).toBe("breakr"); // original search results stay on screen
  });

  it("a clean query with zero results sets no correction", async () => {
    searchTotal = 0;
    await useProductFinder.getState().runNlSearch("breaker");
    expect(useProductFinder.getState().correction).toBeNull();
  });

  it("noCorrect opt suppresses the flow entirely", async () => {
    searchTotal = 0;
    await useProductFinder.getState().runNlSearch("breakr", { noCorrect: true });
    expect(useProductFinder.getState().correction).toBeNull();
    expect(useProductFinder.getState().query).toBe("breakr");
  });
});

// ─── NL search — subcategory chips via synonyms ───────────────────────────────

describe("runNlSearch – subcategory chips", () => {
  beforeEach(() => {
    resetStore();
    searchItems = [];
    searchTotal = 100; // plenty of results — keep the correction flow quiet
  });

  it('"romex in stock" applies a Wire & Cable subcategory filter', async () => {
    await useProductFinder.getState().runNlSearch("romex in stock");
    const { filters, appliedNlFilters } = useProductFinder.getState();
    expect(filters.subcategories.has("Wire & Cable")).toBe(true);
    expect(filters.onlyBranchStock).toBe(true);
    expect(appliedNlFilters).toContainEqual(
      expect.objectContaining({ kind: "subcategory", value: "Wire & Cable" }),
    );
  });

  it("removing the subcategory chip clears the subcategory filter", async () => {
    await useProductFinder.getState().runNlSearch("romex in stock");
    const chip = useProductFinder.getState().appliedNlFilters.find((f) => f.kind === "subcategory");
    expect(chip).toBeDefined();
    await useProductFinder.getState().removeNlFilter(chip!.id);
    expect(useProductFinder.getState().filters.subcategories.has("Wire & Cable")).toBe(false);
  });
});

// ─── counterQuote (customer "Request changes") ────────────────────────────────

describe("counterQuote", () => {
  beforeEach(() => {
    resetStore();
    useProductFinder.setState({ quotes: [], cart: {}, priceOverrides: {} });
  });

  function seedQuote() {
    useProductFinder.getState().addToCart(CATALOG_PRODUCTS[0], 2);
    useProductFinder.getState().saveQuote({ number: "Q-CTR-0001", customer: "Acme", project: "", now: 1_700_000_000_000 });
    return useProductFinder.getState().quotes[0];
  }

  it("attaches a trimmed counter-offer note with the injected timestamp", () => {
    const q = seedQuote();
    useProductFinder.getState().counterQuote(q.id, "  Can you do $60 even?  ", 1_700_000_100_000);
    const updated = useProductFinder.getState().quotes[0];
    expect(updated.counterOffer).toEqual({ note: "Can you do $60 even?", at: 1_700_000_100_000 });
    // status stays in play — countering does not decide the quote
    expect(updated.status).toBe(q.status);
  });

  it("ignores empty notes and unknown ids", () => {
    const q = seedQuote();
    useProductFinder.getState().counterQuote(q.id, "   ");
    expect(useProductFinder.getState().quotes[0].counterOffer).toBeUndefined();
    useProductFinder.getState().counterQuote("nope", "hello");
    expect(useProductFinder.getState().quotes[0].counterOffer).toBeUndefined();
  });

  it("does not counter quotes already converted to orders", () => {
    const q = seedQuote();
    useProductFinder.getState().setQuoteApproval(q.id, "approved");
    useProductFinder.getState().convertQuoteToOrder(q.id, 1_700_000_200_000);
    useProductFinder.getState().counterQuote(q.id, "too late");
    expect(useProductFinder.getState().quotes[0].counterOffer).toBeUndefined();
  });
});

// ─── Quote notes, terms, audit trail, revisions ───────────────────────────────

describe("quote notes, terms & audit trail", () => {
  beforeEach(() => {
    resetStore();
    useProductFinder.setState({ quotes: [], cart: {}, priceOverrides: {}, revisingQuoteId: null, user: { name: "Sarah Chen", email: "s@x", role: "sales", branch: "B", branchId: "B-1" } });
  });

  it("saveQuote captures note + termsIds and logs a created event with the actor", () => {
    useProductFinder.getState().addToCart(CATALOG_PRODUCTS[0], 2);
    useProductFinder.getState().saveQuote({ number: "Q-N-0001", customer: "Acme", project: "", now: 1_700_000_000_000, note: "  Crane access required  ", termsIds: ["freight", "returns"] });
    const q = useProductFinder.getState().quotes[0];
    expect(q.note).toBe("Crane access required");
    expect(q.termsIds).toEqual(["freight", "returns"]);
    expect(q.events?.[0]).toMatchObject({ kind: "created", actor: "Sarah Chen", at: 1_700_000_000_000 });
  });

  it("status, approval, counter, and link events append to the trail", () => {
    useProductFinder.getState().addToCart(CATALOG_PRODUCTS[0], 2);
    useProductFinder.getState().saveQuote({ number: "Q-N-0002", customer: "Acme", project: "", now: 1_700_000_000_000 });
    const id = useProductFinder.getState().quotes[0].id;
    useProductFinder.getState().setQuoteStatus(id, "sent");
    useProductFinder.getState().counterQuote(id, "Sharpen the pricing", 1_700_000_100_000);
    useProductFinder.getState().logQuoteLink(id, 1_700_000_200_000);
    const kinds = useProductFinder.getState().quotes[0].events?.map((e) => e.kind);
    expect(kinds).toContain("status");
    expect(kinds).toContain("counter");
    expect(kinds).toContain("link-copied");
    const counter = useProductFinder.getState().quotes[0].events?.find((e) => e.kind === "counter");
    expect(counter?.actor).toBe("Customer");
  });

  it("setQuoteStatus to the same status does not log a duplicate event", () => {
    useProductFinder.getState().addToCart(CATALOG_PRODUCTS[0], 2);
    useProductFinder.getState().saveQuote({ number: "Q-N-0003", customer: "A", project: "", now: 1_700_000_000_000 });
    const id = useProductFinder.getState().quotes[0].id;
    const before = useProductFinder.getState().quotes[0].events?.length ?? 0;
    useProductFinder.getState().setQuoteStatus(id, "draft");
    expect(useProductFinder.getState().quotes[0].events?.length).toBe(before);
  });
});

describe("quote revisions", () => {
  beforeEach(() => {
    resetStore();
    useProductFinder.setState({ quotes: [], cart: {}, priceOverrides: {}, revisingQuoteId: null, user: null });
  });

  function saveBase(now = 1_700_000_000_000) {
    useProductFinder.getState().addToCart(CATALOG_PRODUCTS[0], 2);
    useProductFinder.getState().saveQuote({ number: "Q-R-0001", customer: "Acme", project: "P1", now });
    return useProductFinder.getState().quotes[0];
  }

  it("startReviseQuote loads lines, flags revising, and Save Quote links v2", () => {
    const v1 = saveBase();
    useProductFinder.getState().startReviseQuote(v1.id);
    expect(useProductFinder.getState().revisingQuoteId).toBe(v1.id);
    expect(Object.keys(useProductFinder.getState().cart)).toHaveLength(1);

    useProductFinder.getState().updateCartQty(CATALOG_PRODUCTS[0].id, 5);
    useProductFinder.getState().saveQuote({ number: "Q-R-0002", customer: "Acme", project: "P1", now: 1_700_000_500_000 });

    const quotes = useProductFinder.getState().quotes;
    const v2 = quotes.find((q) => q.number === "Q-R-0002");
    const v1After = quotes.find((q) => q.id === v1.id);
    expect(v2?.revision).toBe(2);
    expect(v2?.revisionOf).toBe(v1.id);
    expect(v1After?.supersededBy).toBe(v2?.id);
    expect(v1After?.events?.some((e) => e.kind === "revised")).toBe(true);
    expect(v2?.events?.some((e) => e.kind === "revised")).toBe(true);
    expect(useProductFinder.getState().revisingQuoteId).toBeNull();
  });

  it("a revision of a revision becomes v3", () => {
    const v1 = saveBase();
    useProductFinder.getState().startReviseQuote(v1.id);
    useProductFinder.getState().saveQuote({ number: "Q-R-0002", customer: "Acme", project: "", now: 1_700_000_500_000 });
    const v2 = useProductFinder.getState().quotes.find((q) => q.number === "Q-R-0002");
    useProductFinder.getState().startReviseQuote(v2!.id);
    useProductFinder.getState().saveQuote({ number: "Q-R-0003", customer: "Acme", project: "", now: 1_700_000_900_000 });
    const v3 = useProductFinder.getState().quotes.find((q) => q.number === "Q-R-0003");
    expect(v3?.revision).toBe(3);
    expect(v3?.revisionOf).toBe(v2?.id);
  });

  it("refuses to revise won, converted, or superseded quotes", () => {
    const v1 = saveBase();
    // superseded
    useProductFinder.getState().startReviseQuote(v1.id);
    useProductFinder.getState().saveQuote({ number: "Q-R-0002", customer: "A", project: "", now: 1_700_000_500_000 });
    useProductFinder.getState().clearCart();
    useProductFinder.getState().startReviseQuote(v1.id);
    expect(useProductFinder.getState().revisingQuoteId).toBeNull();
    // won
    const v2 = useProductFinder.getState().quotes.find((q) => q.number === "Q-R-0002");
    useProductFinder.getState().setQuoteStatus(v2!.id, "won");
    useProductFinder.getState().startReviseQuote(v2!.id);
    expect(useProductFinder.getState().revisingQuoteId).toBeNull();
  });

  it("replace-cart actions and clearCart cancel the revising flag", () => {
    const v1 = saveBase();
    useProductFinder.getState().startReviseQuote(v1.id);
    useProductFinder.getState().clearCart();
    expect(useProductFinder.getState().revisingQuoteId).toBeNull();
    useProductFinder.getState().startReviseQuote(v1.id);
    useProductFinder.getState().loadQuoteToCart(v1.id);
    expect(useProductFinder.getState().revisingQuoteId).toBeNull();
  });
});

// ─── buildDemoQuotes (first-load seed) ────────────────────────────────────────

describe("buildDemoQuotes", () => {
  const NOW = 1_781_000_000_000;

  it("seeds a deterministic spread with stable ids and captured line prices", () => {
    const quotes = buildDemoQuotes(NOW);
    expect(quotes.length).toBeGreaterThanOrEqual(10);
    expect(new Set(quotes.map((q) => q.id)).size).toBe(quotes.length);
    for (const q of quotes) {
      expect(q.id.startsWith("demo-quote-")).toBe(true);
      expect(q.marginPct).toBeGreaterThan(0);
      expect(q.lines[0].unitPrice).toBeGreaterThan(0);
      expect(q.createdAt).toBeLessThanOrEqual(NOW);
    }
    expect(buildDemoQuotes(NOW)).toEqual(quotes);
  });

  it("includes the demo beats: a stale sent quote and a pending below-margin draft", () => {
    const quotes = buildDemoQuotes(NOW);
    const DAY = 86_400_000;
    const staleSent = quotes.find((q) => q.status === "sent" && NOW - q.createdAt > 14 * DAY);
    expect(staleSent).toBeDefined();
    const pending = quotes.find((q) => q.approvalStatus === "pending");
    expect(pending).toBeDefined();
    expect(pending?.marginPct).toBeLessThan(0.2);
  });

  it("shapes a win-rate gradient across margin bands (low bands win more)", () => {
    const quotes = buildDemoQuotes(NOW);
    const decided = (lo: number, hi: number) =>
      quotes.filter((q) => (q.status === "won" || q.status === "lost") && (q.marginPct ?? 0) >= lo && (q.marginPct ?? 0) < hi);
    const rate = (xs: typeof quotes) => xs.filter((q) => q.status === "won").length / xs.length;
    const low = decided(0.15, 0.2);
    const high = decided(0.3, 1);
    expect(low.length).toBeGreaterThanOrEqual(3);
    expect(high.length).toBeGreaterThanOrEqual(3);
    expect(rate(low)).toBeGreaterThan(rate(high));
  });
});
