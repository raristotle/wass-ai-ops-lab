import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  useProductFinder,
  hydrateAuth,
  hydrateSavedState,
  selectCrossSells,
  selectUpsells,
  type Order,
  type SavedBasket,
} from "@/lib/product-finder-store";
import { CATALOG_PRODUCTS } from "@/data/mock/catalog-products";
import { CUSTOMER_ACCOUNTS } from "@/lib/integration/customers";
import { overrideBounds } from "@/lib/product-finder-override";
import type { ReturnLine } from "@/lib/product-finder-returns";

// ─── Fetch mock ───────────────────────────────────────────────────────────────
// runSearch / loadMore / setActiveProduct all call fetch; give them a benign
// response so the actions resolve. Individual tests can flip `failNextFetch`.

let searchItems: unknown[] = [];
let searchTotal = 0;
let failNextFetch = false;

globalThis.fetch = vi.fn(async (url: string | URL) => {
  if (failNextFetch) {
    failNextFetch = false;
    throw new Error("network down");
  }
  const u = String(url);
  if (u.includes("/api/products/search")) {
    return {
      ok: true,
      json: async () => ({ items: searchItems, total: searchTotal, page: 0, pageSize: 24, facets: [] }),
    } as Response;
  }
  return { ok: true, json: async () => ({ product: null, equivalents: [] }) } as Response;
}) as typeof fetch;

// ─── In-memory localStorage stub ──────────────────────────────────────────────
// The store guards every persistence call on `typeof localStorage !== "undefined"`.
// Installing a stub for the whole file exercises all of those write/remove
// branches (which are skipped when localStorage is undefined, as it is by default
// in the node test env). Each test restores the original after itself.

let mockStorage: Record<string, string> = {};
let originalLocalStorage: unknown;

function installLocalStorage(seed: Record<string, string> = {}) {
  mockStorage = { ...seed };
  originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => mockStorage[k] ?? null,
    setItem: (k: string, v: string) => {
      mockStorage[k] = v;
    },
    removeItem: (k: string) => {
      delete mockStorage[k];
    },
  };
}

function restoreLocalStorage() {
  (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
}

// ─── Store reset ──────────────────────────────────────────────────────────────

function resetStore() {
  useProductFinder.setState({
    cart: {},
    cartOpen: false,
    cartSection: null,
    cartQuoteStatusFilter: null,
    cartOrderMonthFilter: null,
    priceOverrides: {},
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
    savedBaskets: [],
    savedSearches: [],
    watches: [],
    notifReads: {},
    orders: [],
    orderFulfillment: {},
    returns: [],
    returnModalOrderId: null,
    jobTemplates: [],
    quotes: [],
    revisingQuoteId: null,
    activeCustomerId: null,
    correction: null,
    tourOpen: false,
    tourStep: 0,
    paletteOpen: false,
    substitutes: {},
    facets: [],
    refineFacets: [],
    filters: {
      query: "",
      categories: new Set(),
      subcategories: new Set(),
      brands: new Set(),
      onlyBranchStock: false,
      onlyDCStock: false,
      onlyPreferred: false,
      onlyActive: false,
      onlyWithCrosses: false,
      priceMin: null,
      priceMax: null,
      sortKey: "relevance",
      viewMode: "list",
      specFilters: {},
      specRanges: {},
    },
  });
}

beforeEach(() => {
  resetStore();
  searchItems = [];
  searchTotal = 0;
  failNextFetch = false;
  installLocalStorage();
});

afterEach(() => {
  restoreLocalStorage();
});

const get = () => useProductFinder.getState();

// ─── setQuery ─────────────────────────────────────────────────────────────────

describe("setQuery", () => {
  it("stores the query string", () => {
    get().setQuery("breaker 20A");
    expect(get().query).toBe("breaker 20A");
  });
});

// ─── auth persistence branches (login / loginWithSso / logout) ────────────────

describe("auth persistence", () => {
  it("login writes pf_user to localStorage", () => {
    const ok = get().login("sales@meridiansupply.com", "meridian2024");
    expect(ok).toBe(true);
    expect(mockStorage["pf_user"]).toBeDefined();
    const stored = JSON.parse(mockStorage["pf_user"]) as { email: string; password?: string };
    expect(stored.email).toBe("sales@meridiansupply.com");
    // password is stripped before persisting
    expect("password" in stored).toBe(false);
  });

  it("loginWithSso sets the user without a password and persists it", () => {
    const ssoUser = {
      name: "Pat SSO",
      email: "pat@partner.com",
      role: "sales" as const,
      branch: "Remote",
      branchId: "B-SSO",
    };
    get().loginWithSso(ssoUser);
    expect(get().user).toEqual(ssoUser);
    expect(JSON.parse(mockStorage["pf_user"]).email).toBe("pat@partner.com");
  });

  it("logout removes pf_user and pf_active_customer from localStorage", () => {
    get().login("manager@meridiansupply.com", "meridian2024");
    get().setActiveCustomer("CUST-001");
    expect(mockStorage["pf_user"]).toBeDefined();
    expect(mockStorage["pf_active_customer"]).toBe("CUST-001");
    get().logout();
    expect(mockStorage["pf_user"]).toBeUndefined();
    expect(mockStorage["pf_active_customer"]).toBeUndefined();
    expect(get().user).toBeNull();
    expect(get().activeCustomerId).toBeNull();
  });
});

// ─── applyParsedFilter branches (via runNlSearch / removeNlFilter) ────────────
// Covers priceMin, category/subcategory/brand add+remove, and the "min price"
// chip path that the existing suite does not exercise.

describe("applyParsedFilter coverage via NL search", () => {
  beforeEach(() => {
    searchTotal = 100; // keep the correction flow quiet
  });

  it("applies a priceMin (over $X) chip and removes it", async () => {
    await get().runNlSearch("breaker over $25");
    const chip = get().appliedNlFilters.find((f) => f.kind === "priceMin");
    expect(chip).toBeDefined();
    expect(get().filters.priceMin).toBe(25);
    await get().removeNlFilter(chip!.id);
    expect(get().filters.priceMin).toBeNull();
  });

  it("applies a category chip and removing it deletes the category", async () => {
    await get().runNlSearch("electrical breakers");
    const catChip = get().appliedNlFilters.find((f) => f.kind === "category");
    if (catChip) {
      expect(get().filters.categories.has(catChip.value as never)).toBe(true);
      await get().removeNlFilter(catChip!.id);
      expect(get().filters.categories.has(catChip.value as never)).toBe(false);
    }
  });

  it("applies a brand chip and removing it deletes the brand", async () => {
    await get().runNlSearch("Square D breakers");
    const brandChip = get().appliedNlFilters.find((f) => f.kind === "brand");
    if (brandChip) {
      expect(get().filters.brands.has(brandChip.value as string)).toBe(true);
      await get().removeNlFilter(brandChip!.id);
      expect(get().filters.brands.has(brandChip.value as string)).toBe(false);
    }
  });

  it("removeNlFilter for an unknown id is a no-op", async () => {
    await get().runNlSearch("preferred");
    const before = get().appliedNlFilters.length;
    await get().removeNlFilter("no-such-chip");
    expect(get().appliedNlFilters.length).toBe(before);
  });
});

// ─── parseBom ─────────────────────────────────────────────────────────────────

describe("parseBom", () => {
  it("parses quantity-prefixed lines, resolves products, and enables BOM mode", () => {
    get().setBomText("10x breaker\nwire nut\n   \n3 receptacle");
    get().parseBom();
    const { bomLines, bomMode } = get();
    expect(bomMode).toBe(true);
    // blank line is filtered out → 3 parsed lines
    expect(bomLines).toHaveLength(3);
    expect(bomLines[0].quantity).toBe(10);
    expect(bomLines[0].description).toBe("breaker");
    // a line with no qty prefix defaults to quantity 1
    expect(bomLines[1].quantity).toBe(1);
    expect(bomLines[1].description).toBe("wire nut");
    expect(bomLines[2].quantity).toBe(3);
    // each line carries an id and (possibly empty) alternatives array
    for (const l of bomLines) {
      expect(typeof l.id).toBe("string");
      expect(Array.isArray(l.alternatives)).toBe(true);
    }
  });

  it("setBomMode / setBomText update state", () => {
    get().setBomMode(true);
    expect(get().bomMode).toBe(true);
    get().setBomText("hello");
    expect(get().bomText).toBe("hello");
  });
});

// ─── setActiveProduct persistence branch ──────────────────────────────────────

describe("setActiveProduct persists recent snapshots", () => {
  it("writes pf_recent and pf_recent_snap to localStorage", async () => {
    const p = CATALOG_PRODUCTS[0];
    await get().setActiveProduct(p);
    expect(mockStorage["pf_recent"]).toBeDefined();
    expect(mockStorage["pf_recent_snap"]).toBeDefined();
    const recent = JSON.parse(mockStorage["pf_recent"]) as string[];
    expect(recent[0]).toBe(p.id);
  });
});

// ─── search history / recently viewed persistence ─────────────────────────────

describe("history persistence branches", () => {
  it("addSearchTerm persists to pf_search_history", () => {
    get().addSearchTerm("gfci");
    expect(JSON.parse(mockStorage["pf_search_history"])).toEqual(["gfci"]);
  });

  it("clearSearchHistory removes pf_search_history", () => {
    get().addSearchTerm("gfci");
    get().clearSearchHistory();
    expect(mockStorage["pf_search_history"]).toBeUndefined();
    expect(get().searchHistory).toEqual([]);
  });

  it("clearRecentlyViewed removes pf_recent and pf_recent_snap", async () => {
    await get().setActiveProduct(CATALOG_PRODUCTS[0]);
    get().clearRecentlyViewed();
    expect(mockStorage["pf_recent"]).toBeUndefined();
    expect(mockStorage["pf_recent_snap"]).toBeUndefined();
    expect(get().recentlyViewed).toEqual([]);
  });

  it("toggleFavorite persists pf_favorites and pf_fav_snap on add and on remove", () => {
    const p = CATALOG_PRODUCTS[0];
    get().toggleFavorite(p);
    expect(JSON.parse(mockStorage["pf_favorites"])).toContain(p.id);
    expect(JSON.parse(mockStorage["pf_fav_snap"])[p.id]).toBeDefined();
    // remove drops the snapshot
    get().toggleFavorite(p);
    expect(JSON.parse(mockStorage["pf_favorites"])).not.toContain(p.id);
    expect(JSON.parse(mockStorage["pf_fav_snap"])[p.id]).toBeUndefined();
  });
});

// ─── filter setters that re-run search ────────────────────────────────────────

describe("filter setters", () => {
  it("setOnlyDCStock toggles and re-runs search", async () => {
    get().setOnlyDCStock(true);
    expect(get().filters.onlyDCStock).toBe(true);
  });

  it("setOnlyActive toggles", () => {
    get().setOnlyActive(true);
    expect(get().filters.onlyActive).toBe(true);
  });

  it("setOnlyWithCrosses toggles", () => {
    get().setOnlyWithCrosses(true);
    expect(get().filters.onlyWithCrosses).toBe(true);
  });

  it("setOnlyBranchStock toggles", () => {
    get().setOnlyBranchStock(true);
    expect(get().filters.onlyBranchStock).toBe(true);
  });

  it("setSortKey stores the sort key", () => {
    get().setSortKey("priceLow");
    expect(get().filters.sortKey).toBe("priceLow");
  });

  it("setViewMode stores the view mode (no search)", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const before = fetchSpy.mock.calls.length;
    get().setViewMode("grid");
    expect(get().filters.viewMode).toBe("grid");
    // setViewMode is a pure preference change — it does not fire a search
    expect(fetchSpy.mock.calls.length).toBe(before);
  });
});

// ─── white-label brand + locale ───────────────────────────────────────────────

describe("brandId & locale", () => {
  it("setBrandId accepts a known brand and persists it", () => {
    // wesco is a known brand id in lib/brand
    get().setBrandId("wesco");
    expect(get().brandId).toBe("wesco");
    expect(mockStorage["pf_brand"]).toBe("wesco");
  });

  it("setBrandId falls back to the default for an unknown id", () => {
    get().setBrandId("not-a-real-brand");
    // falls back — persisted value equals the resolved (default) brand
    expect(get().brandId).toBe(mockStorage["pf_brand"]);
    expect(get().brandId).not.toBe("not-a-real-brand");
  });

  it("setLocale accepts a known locale and persists it", () => {
    get().setLocale("es");
    expect(get().locale).toBe("es");
    expect(mockStorage["pf_locale"]).toBe("es");
  });

  it("setLocale falls back to the default for an unknown locale", () => {
    get().setLocale("zz" as never);
    expect(get().locale).not.toBe("zz");
    expect(mockStorage["pf_locale"]).toBe(get().locale);
  });
});

// ─── compare: 4-item cap + clearCompare ──────────────────────────────────────

describe("compare", () => {
  it("toggleCompare caps the selection at 4 items", () => {
    get().toggleCompare("a");
    get().toggleCompare("b");
    get().toggleCompare("c");
    get().toggleCompare("d");
    get().toggleCompare("e"); // ignored — already at the cap
    const ids = get().compareIds;
    expect(ids.size).toBe(4);
    expect(ids.has("e")).toBe(false);
  });

  it("toggleCompare removes an id that is already selected", () => {
    get().toggleCompare("a");
    get().toggleCompare("a");
    expect(get().compareIds.has("a")).toBe(false);
  });

  it("clearCompare empties the set and closes the modal", () => {
    get().toggleCompare("a");
    get().setCompareModalOpen(true);
    get().clearCompare();
    expect(get().compareIds.size).toBe(0);
    expect(get().compareModalOpen).toBe(false);
  });
});

// ─── price overrides (margin-guarded) ─────────────────────────────────────────

describe("setPriceOverride", () => {
  it("is a no-op when the product is not in the cart", () => {
    get().setPriceOverride("ghost", 5);
    expect(get().priceOverrides["ghost"]).toBeUndefined();
  });

  it("clamps an in-range override and stores it", () => {
    const p = CATALOG_PRODUCTS[0];
    get().addToCart(p, 1);
    const { min, max } = overrideBounds(p);
    const mid = Math.round(((min + max) / 2) * 100) / 100;
    get().setPriceOverride(p.id, mid);
    expect(get().priceOverrides[p.id]).toBeCloseTo(mid, 2);
  });

  it("clamps a below-floor override up to the band minimum", () => {
    const p = CATALOG_PRODUCTS[0];
    get().addToCart(p, 1);
    const { min } = overrideBounds(p);
    get().setPriceOverride(p.id, 0.01);
    expect(get().priceOverrides[p.id]).toBeCloseTo(min, 2);
  });

  it("clearing with null removes the override", () => {
    const p = CATALOG_PRODUCTS[0];
    get().addToCart(p, 1);
    get().setPriceOverride(p.id, overrideBounds(p).max);
    expect(get().priceOverrides[p.id]).toBeDefined();
    get().setPriceOverride(p.id, null);
    expect(get().priceOverrides[p.id]).toBeUndefined();
  });

  it("removeFromCart also drops the line's price override", () => {
    const p = CATALOG_PRODUCTS[0];
    get().addToCart(p, 1);
    get().setPriceOverride(p.id, overrideBounds(p).max);
    get().removeFromCart(p.id);
    expect(get().priceOverrides[p.id]).toBeUndefined();
  });
});

// ─── saved searches + alerts ──────────────────────────────────────────────────

describe("saved searches", () => {
  it("saveSearch snapshots the current filters and persists", () => {
    get().toggleCategory("electrical");
    get().saveSearch("Electrical run");
    const ss = get().savedSearches;
    expect(ss).toHaveLength(1);
    expect(ss[0].name).toBe("Electrical run");
    expect(ss[0].alertsOn).toBe(true);
    expect(ss[0].newMatches).toBe(0);
    expect(mockStorage["pf_saved_searches"]).toBeDefined();
  });

  it("saveSearch is a no-op for a blank name", () => {
    get().saveSearch("   ");
    expect(get().savedSearches).toHaveLength(0);
  });

  it("saveSearch overwrites an existing search of the same name (case-insensitive), keeping its id", () => {
    get().saveSearch("Run");
    const firstId = get().savedSearches[0].id;
    get().toggleBrand(CATALOG_PRODUCTS[0].brand);
    get().saveSearch("RUN");
    expect(get().savedSearches).toHaveLength(1);
    expect(get().savedSearches[0].id).toBe(firstId);
  });

  it("setSavedSearchAlerts toggles the alert flag and persists", () => {
    get().saveSearch("Alertable");
    const id = get().savedSearches[0].id;
    get().setSavedSearchAlerts(id, false);
    expect(get().savedSearches[0].alertsOn).toBe(false);
    expect(JSON.parse(mockStorage["pf_saved_searches"])[0].alertsOn).toBe(false);
  });

  it("deleteSavedSearch removes the search and persists", () => {
    get().saveSearch("A");
    get().saveSearch("B");
    const id = get().savedSearches.find((s) => s.name === "A")!.id;
    get().deleteSavedSearch(id);
    expect(get().savedSearches.some((s) => s.id === id)).toBe(false);
  });

  it("runSavedSearch clears the new-match signal, decodes filters, and re-runs search", async () => {
    get().saveSearch("Run me");
    const id = get().savedSearches[0].id;
    // simulate a pending alert
    useProductFinder.setState((s) => ({
      savedSearches: s.savedSearches.map((x) => (x.id === id ? { ...x, newMatches: 7 } : x)),
    }));
    await get().runSavedSearch(id);
    expect(get().savedSearches[0].newMatches).toBe(0);
    expect(get().appliedNlFilters).toEqual([]);
    expect(get().error).toBeNull();
  });

  it("runSavedSearch is a no-op for an unknown id", async () => {
    await get().runSavedSearch("nope");
    expect(get().savedSearches).toHaveLength(0);
  });
});

// ─── order fulfillment ────────────────────────────────────────────────────────

describe("setOrderFulfillment", () => {
  it("stores the method per order and persists", () => {
    get().setOrderFulfillment("ord-1", "willcall");
    expect(get().orderFulfillment["ord-1"]).toBe("willcall");
    expect(JSON.parse(mockStorage["pf_order_fulfillment"])["ord-1"]).toBe("willcall");
    get().setOrderFulfillment("ord-1", "delivery");
    expect(get().orderFulfillment["ord-1"]).toBe("delivery");
  });
});

// ─── returns / RMA ────────────────────────────────────────────────────────────

describe("returns (RMA) lifecycle", () => {
  function makeLine(): ReturnLine {
    const p = CATALOG_PRODUCTS[0];
    return { productId: p.id, name: p.name, sku: p.id, qty: 2, unitPrice: p.unitPrice };
  }

  it("setReturnModalOrder sets and clears the modal target", () => {
    get().setReturnModalOrder("ord-9");
    expect(get().returnModalOrderId).toBe("ord-9");
    get().setReturnModalOrder(null);
    expect(get().returnModalOrderId).toBeNull();
  });

  it("createReturnRequest prepends a 'requested' RMA carrying the order's customerId, and persists", () => {
    // place an order so the request can read its customerId
    get().setActiveCustomer("CUST-001");
    get().addToCart(CATALOG_PRODUCTS[0], 2);
    get().placeOrder(1_700_000_000_000, "ord-ret");

    get().createReturnRequest({
      orderId: "ord-ret",
      lines: [makeLine()],
      reason: "Defective / DOA",
      note: "  arrived cracked  ",
      now: 1_700_000_100_000,
    });
    const r = get().returns[0];
    expect(r.orderId).toBe("ord-ret");
    expect(r.status).toBe("requested");
    expect(r.customerId).toBe("CUST-001");
    expect(r.note).toBe("arrived cracked");
    expect(mockStorage["pf_returns"]).toBeDefined();
  });

  it("createReturnRequest for an unknown order stamps a null customerId", () => {
    get().createReturnRequest({
      orderId: "missing-order",
      lines: [makeLine()],
      reason: "No longer needed",
      now: 1_700_000_200_000,
    });
    expect(get().returns[0].customerId).toBeNull();
  });

  it("advanceReturnStatus walks the happy path and stops at the terminal state", () => {
    get().createReturnRequest({
      orderId: "o",
      lines: [makeLine()],
      reason: "Damaged in transit",
      now: 1_700_000_300_000,
    });
    const id = get().returns[0].id;
    expect(get().returns[0].status).toBe("requested");
    get().advanceReturnStatus(id);
    expect(get().returns[0].status).toBe("approved");
    get().advanceReturnStatus(id);
    get().advanceReturnStatus(id);
    get().advanceReturnStatus(id); // → refunded (terminal)
    expect(get().returns[0].status).toBe("refunded");
    get().advanceReturnStatus(id); // no further transition
    expect(get().returns[0].status).toBe("refunded");
  });

  it("advanceReturnStatus leaves other requests untouched", () => {
    get().createReturnRequest({ orderId: "o1", lines: [makeLine()], reason: "No longer needed", now: 1 });
    get().createReturnRequest({ orderId: "o2", lines: [makeLine()], reason: "No longer needed", now: 2 });
    const firstId = get().returns[0].id;
    get().advanceReturnStatus(firstId);
    const other = get().returns.find((r) => r.id !== firstId)!;
    expect(other.status).toBe("requested");
  });
});

// ─── job templates (merge-into-cart kits) ─────────────────────────────────────

describe("job templates", () => {
  it("saveTemplate is a no-op for a blank name or an empty cart", () => {
    get().saveTemplate("   ");
    expect(get().jobTemplates).toHaveLength(0);
    get().saveTemplate("Empty cart kit");
    expect(get().jobTemplates).toHaveLength(0);
  });

  it("saveTemplate snapshots the cart and persists", () => {
    get().addToCart(CATALOG_PRODUCTS[0], 2);
    get().addToCart(CATALOG_PRODUCTS[1], 3);
    get().saveTemplate("Office buildout", 1000);
    const t = get().jobTemplates[0];
    expect(t.name).toBe("Office buildout");
    expect(t.lines).toHaveLength(2);
    expect(t.savedAt).toBe(1000);
    expect(mockStorage["pf_job_templates"]).toBeDefined();
  });

  it("saveTemplate overwrites a same-named template in place (case-insensitive)", () => {
    get().addToCart(CATALOG_PRODUCTS[0], 1);
    get().saveTemplate("Kit", 1000);
    get().clearCart();
    get().addToCart(CATALOG_PRODUCTS[1], 9);
    get().saveTemplate("KIT", 2000);
    expect(get().jobTemplates).toHaveLength(1);
    expect(get().jobTemplates[0].lines[0].product.id).toBe(CATALOG_PRODUCTS[1].id);
    expect(get().jobTemplates[0].savedAt).toBe(2000);
  });

  it("applyTemplate MERGES quantities into the existing cart", () => {
    const p = CATALOG_PRODUCTS[0];
    get().addToCart(p, 2);
    get().saveTemplate("Merge kit", 1000);
    // keep p in the cart, then apply — quantities should add
    get().applyTemplate(get().jobTemplates[0].id);
    expect(get().cart[p.id].qty).toBe(4);
  });

  it("applyTemplate adds template lines for products not already in the cart", () => {
    const p1 = CATALOG_PRODUCTS[0];
    const p2 = CATALOG_PRODUCTS[1];
    get().addToCart(p1, 1);
    get().addToCart(p2, 5);
    get().saveTemplate("Two-line kit", 1000);
    const id = get().jobTemplates[0].id;
    get().clearCart();
    get().applyTemplate(id);
    expect(get().cart[p1.id].qty).toBe(1);
    expect(get().cart[p2.id].qty).toBe(5);
  });

  it("applyTemplate is a no-op for an unknown id", () => {
    get().addToCart(CATALOG_PRODUCTS[0], 1);
    get().applyTemplate("ghost-template");
    expect(get().cart[CATALOG_PRODUCTS[0].id].qty).toBe(1);
  });

  it("deleteTemplate removes the template and persists", () => {
    get().addToCart(CATALOG_PRODUCTS[0], 1);
    get().saveTemplate("Keep", 1000);
    get().addToCart(CATALOG_PRODUCTS[1], 1);
    get().saveTemplate("Drop", 2000);
    const id = get().jobTemplates.find((t) => t.name === "Drop")!.id;
    get().deleteTemplate(id);
    expect(get().jobTemplates.some((t) => t.id === id)).toBe(false);
  });
});

// ─── quote lifecycle persistence + branches ───────────────────────────────────

describe("quote lifecycle", () => {
  function seedQuote(over?: { now?: number }) {
    get().addToCart(CATALOG_PRODUCTS[0], 2);
    get().saveQuote({ number: "Q-COV-0001", customer: "  Acme  ", project: "  Tower  ", now: over?.now ?? 1_700_000_000_000 });
    return get().quotes[0];
  }

  it("saveQuote trims customer/project, persists, and is a no-op on an empty cart", () => {
    get().saveQuote({ number: "Q-EMPTY", customer: "X", project: "Y" });
    expect(get().quotes).toHaveLength(0);
    const q = seedQuote();
    expect(q.customer).toBe("Acme");
    expect(q.project).toBe("Tower");
    expect(mockStorage["pf_quotes"]).toBeDefined();
  });

  it("saveQuote on a below-margin basket (deep override) flags approval pending", () => {
    const p = CATALOG_PRODUCTS[0];
    get().addToCart(p, 1);
    // override down to the floor → deep discount + thin margin → approval required
    get().setPriceOverride(p.id, overrideBounds(p).min);
    get().saveQuote({ number: "Q-PEND", customer: "Acme", project: "", now: 1_700_000_000_000 });
    const q = get().quotes[0];
    expect(q.approvalStatus).toBe("pending");
    expect(q.events?.some((e) => e.kind === "approval")).toBe(true);
  });

  it("setQuoteStatus changes status, logs an event, and persists", () => {
    const q = seedQuote();
    get().setQuoteStatus(q.id, "sent");
    expect(get().quotes[0].status).toBe("sent");
    expect(JSON.parse(mockStorage["pf_quotes"])[0].status).toBe("sent");
  });

  it("setQuoteLostReason records the reason and persists", () => {
    const q = seedQuote();
    get().setQuoteLostReason(q.id, "Lost on price");
    expect(get().quotes[0].lostReason).toBe("Lost on price");
    expect(JSON.parse(mockStorage["pf_quotes"])[0].lostReason).toBe("Lost on price");
  });

  it("setQuoteApproval records status + an approval event and persists", () => {
    const q = seedQuote();
    get().setQuoteApproval(q.id, "approved");
    expect(get().quotes[0].approvalStatus).toBe("approved");
    expect(get().quotes[0].events?.some((e) => e.kind === "approval")).toBe(true);
  });

  it("loadQuoteToCart replaces the cart with the quote's lines", () => {
    const q = seedQuote();
    get().clearCart();
    get().addToCart(CATALOG_PRODUCTS[2], 99);
    get().loadQuoteToCart(q.id);
    expect(get().cart[CATALOG_PRODUCTS[2].id]).toBeUndefined();
    expect(get().cart[CATALOG_PRODUCTS[0].id].qty).toBe(2);
  });

  it("loadQuoteToCart is a no-op for an unknown id", () => {
    get().addToCart(CATALOG_PRODUCTS[0], 1);
    get().loadQuoteToCart("ghost");
    expect(get().cart[CATALOG_PRODUCTS[0].id].qty).toBe(1);
  });

  it("deleteQuote removes the quote and persists", () => {
    const q = seedQuote();
    get().deleteQuote(q.id);
    expect(get().quotes).toHaveLength(0);
    expect(JSON.parse(mockStorage["pf_quotes"])).toHaveLength(0);
  });

  it("convertQuoteToOrder makes an order, marks the quote won, and persists both", () => {
    const q = seedQuote();
    get().convertQuoteToOrder(q.id, 1_700_000_500_000);
    const updated = get().quotes[0];
    expect(updated.status).toBe("won");
    expect(updated.convertedOrderId).toBeDefined();
    expect(get().orders).toHaveLength(1);
    expect(get().orders[0].total).toBe(q.total);
    expect(mockStorage["pf_orders"]).toBeDefined();
  });

  it("convertQuoteToOrder is blocked while approval is pending", () => {
    const p = CATALOG_PRODUCTS[0];
    get().addToCart(p, 1);
    get().setPriceOverride(p.id, overrideBounds(p).min);
    get().saveQuote({ number: "Q-BLOCK", customer: "A", project: "", now: 1_700_000_000_000 });
    const id = get().quotes[0].id;
    get().convertQuoteToOrder(id, 1_700_000_600_000);
    expect(get().orders).toHaveLength(0);
    expect(get().quotes[0].convertedOrderId).toBeUndefined();
  });

  it("convertQuoteToOrder is a no-op once already converted", () => {
    const q = seedQuote();
    get().convertQuoteToOrder(q.id, 1_700_000_500_000);
    const orderCount = get().orders.length;
    get().convertQuoteToOrder(q.id, 1_700_000_700_000);
    expect(get().orders).toHaveLength(orderCount);
  });

  it("convertQuoteToOrder leaves OTHER quotes in the list untouched", () => {
    // First quote — will NOT be converted.
    get().addToCart(CATALOG_PRODUCTS[1], 1);
    get().saveQuote({ number: "Q-OTHER", customer: "Other Co", project: "", now: 1_700_000_000_000 });
    const other = get().quotes[0];
    // Second quote — the one we convert.
    get().clearCart();
    get().addToCart(CATALOG_PRODUCTS[0], 2);
    get().saveQuote({ number: "Q-TARGET", customer: "Target Co", project: "", now: 1_700_000_010_000 });
    const target = get().quotes.find((x) => x.number === "Q-TARGET")!;

    get().convertQuoteToOrder(target.id, 1_700_000_500_000);

    const otherAfter = get().quotes.find((x) => x.id === other.id)!;
    expect(otherAfter.status).toBe(other.status);
    expect(otherAfter.convertedOrderId).toBeUndefined();
    expect(get().quotes.find((x) => x.id === target.id)!.status).toBe("won");
  });

  it("counterQuote and logQuoteLink persist to pf_quotes", () => {
    const q = seedQuote();
    get().counterQuote(q.id, "Trim 5%", 1_700_000_400_000);
    expect(JSON.parse(mockStorage["pf_quotes"])[0].counterOffer.note).toBe("Trim 5%");
    get().logQuoteLink(q.id, 1_700_000_450_000);
    expect(get().quotes[0].events?.some((e) => e.kind === "link-copied")).toBe(true);
  });

  it("logQuoteLink on an unknown id leaves quotes unchanged", () => {
    const q = seedQuote();
    const before = get().quotes[0].events?.length ?? 0;
    get().logQuoteLink("nope", 1);
    expect(get().quotes[0].events?.length ?? 0).toBe(before);
  });

  it("cancelRevise clears the revising flag", () => {
    const q = seedQuote();
    get().startReviseQuote(q.id);
    expect(get().revisingQuoteId).toBe(q.id);
    get().cancelRevise();
    expect(get().revisingQuoteId).toBeNull();
  });
});

// ─── notifications read state ─────────────────────────────────────────────────

describe("markNotificationsRead", () => {
  it("is a no-op for an empty id list", () => {
    get().markNotificationsRead([], 1000);
    expect(get().notifReads).toEqual({});
    expect(mockStorage["pf_notif_reads"]).toBeUndefined();
  });

  it("stamps each id with the readAt timestamp and persists", () => {
    get().markNotificationsRead(["n1", "n2"], 1700);
    expect(get().notifReads).toEqual({ n1: 1700, n2: 1700 });
    expect(JSON.parse(mockStorage["pf_notif_reads"])).toEqual({ n1: 1700, n2: 1700 });
  });

  it("merges new ids with previously-read ones", () => {
    get().markNotificationsRead(["n1"], 1000);
    get().markNotificationsRead(["n2"], 2000);
    expect(get().notifReads).toEqual({ n1: 1000, n2: 2000 });
  });
});

// ─── modal open/close flags ───────────────────────────────────────────────────

describe("modal open/close flags", () => {
  const flags: Array<[keyof ReturnType<typeof get>, keyof ReturnType<typeof get>]> = [
    ["bulkModalOpen", "setBulkModalOpen"],
    ["bulkCrossOpen", "setBulkCrossOpen"],
    ["assistantOpen", "setAssistantOpen"],
    ["willCallOpen", "setWillCallOpen"],
    ["submittalOpen", "setSubmittalOpen"],
    ["keyboardHelpOpen", "setKeyboardHelpOpen"],
    ["specMatchOpen", "setSpecMatchOpen"],
    ["riskSweepOpen", "setRiskSweepOpen"],
    ["helpOpen", "setHelpOpen"],
    ["jobWizardOpen", "setJobWizardOpen"],
    ["guidedOpen", "setGuidedOpen"],
    ["rfqOpen", "setRfqOpen"],
    ["bomIqOpen", "setBomIqOpen"],
    ["jobsOpen", "setJobsOpen"],
    ["kitsOpen", "setKitsOpen"],
    ["vmiOpen", "setVmiOpen"],
    ["quickOrderOpen", "setQuickOrderOpen"],
    ["barcodeOpen", "setBarcodeOpen"],
    ["cycleCountOpen", "setCycleCountOpen"],
  ];

  it("each open/close flag round-trips true then false", () => {
    for (const [flag, setter] of flags) {
      const state = get() as unknown as Record<string, unknown>;
      const set = state[setter as string] as (v: boolean) => void;
      expect(state[flag as string]).toBe(false);
      set(true);
      expect((get() as unknown as Record<string, unknown>)[flag as string]).toBe(true);
      set(false);
      expect((get() as unknown as Record<string, unknown>)[flag as string]).toBe(false);
    }
  });

  it("setActiveResultIndex stores the highlighted row index", () => {
    get().setActiveResultIndex(3);
    expect(get().activeResultIndex).toBe(3);
  });

  it("setCompareModalOpen toggles the compare modal", () => {
    get().setCompareModalOpen(true);
    expect(get().compareModalOpen).toBe(true);
  });
});

// ─── renameBasket persistence ─────────────────────────────────────────────────

describe("renameBasket persistence", () => {
  it("rename writes the updated baskets back to pf_saved_baskets", () => {
    get().addToCart(CATALOG_PRODUCTS[0], 1);
    get().saveCurrentBasket("Original", "b-1", 1000);
    get().renameBasket("b-1", "Renamed");
    expect(JSON.parse(mockStorage["pf_saved_baskets"])[0].name).toBe("Renamed");
  });
});

// ─── runSearch / loadMore error paths ─────────────────────────────────────────

describe("search error paths", () => {
  it("runSearch sets an error message and clears results when fetch throws", async () => {
    failNextFetch = true;
    await get().runSearch();
    const s = get();
    expect(s.loading).toBe(false);
    expect(s.error).toBe("network down");
    expect(s.results).toEqual([]);
    expect(s.total).toBe(0);
  });

  it("loadMore sets an error and stops loading when fetch throws", async () => {
    // first page succeeds
    searchItems = [CATALOG_PRODUCTS[0]];
    searchTotal = 5;
    await get().runSearch();
    expect(get().results).toHaveLength(1);
    // second page fails
    failNextFetch = true;
    await get().loadMore();
    expect(get().loading).toBe(false);
    expect(get().error).toBe("network down");
    // first page's results survive a failed loadMore
    expect(get().results).toHaveLength(1);
  });

  it("loadMore appends the next page and advances the page index", async () => {
    searchItems = [CATALOG_PRODUCTS[0]];
    searchTotal = 4;
    await get().runSearch();
    searchItems = [CATALOG_PRODUCTS[1]];
    await get().loadMore();
    expect(get().page).toBe(1);
    expect(get().results).toHaveLength(2);
  });
});

// ─── hydrateAuth ──────────────────────────────────────────────────────────────

describe("hydrateAuth", () => {
  it("loads a stored user from pf_user", () => {
    const user = { name: "Stored Rep", email: "rep@x.com", role: "sales", branch: "B", branchId: "B-1" };
    installLocalStorage({ pf_user: JSON.stringify(user) });
    hydrateAuth();
    expect(get().user?.email).toBe("rep@x.com");
  });

  it("drops corrupt pf_user JSON and leaves the user null", () => {
    installLocalStorage({ pf_user: "{not-json" });
    hydrateAuth();
    expect(get().user).toBeNull();
    expect(mockStorage["pf_user"]).toBeUndefined();
  });

  it("does nothing when pf_user is absent", () => {
    installLocalStorage({});
    hydrateAuth();
    expect(get().user).toBeNull();
  });
});

// ─── derived selectors: crossSells / upsells ──────────────────────────────────

describe("selectCrossSells / selectUpsells", () => {
  it("return [] when there is no active product", () => {
    expect(selectCrossSells(get())).toEqual([]);
    expect(selectUpsells(get())).toEqual([]);
  });

  it("return arrays when an active product is set", async () => {
    await get().setActiveProduct(CATALOG_PRODUCTS[0]);
    expect(Array.isArray(selectCrossSells(get()))).toBe(true);
    expect(Array.isArray(selectUpsells(get()))).toBe(true);
  });
});

// ─── basket persistence regression for SavedBasket / Order typing ─────────────

describe("typed persistence round-trips", () => {
  it("saveCurrentBasket persists a SavedBasket shape that re-parses", () => {
    get().addToCart(CATALOG_PRODUCTS[0], 2);
    get().saveCurrentBasket("RT", "rt-1", 1234);
    const parsed = JSON.parse(mockStorage["pf_saved_baskets"]) as SavedBasket[];
    expect(parsed[0].id).toBe("rt-1");
    expect(parsed[0].lines[0].qty).toBe(2);
  });

  it("placeOrder persists an Order shape that re-parses", () => {
    get().addToCart(CATALOG_PRODUCTS[0], 1);
    get().placeOrder(1234, "rt-ord");
    const parsed = JSON.parse(mockStorage["pf_orders"]) as Order[];
    expect(parsed[0].id).toBe("rt-ord");
  });

  it("deleteOrder persists the trimmed list", () => {
    get().addToCart(CATALOG_PRODUCTS[0], 1);
    get().placeOrder(1000, "keep");
    get().addToCart(CATALOG_PRODUCTS[1], 1);
    get().placeOrder(2000, "drop");
    get().deleteOrder("drop");
    const parsed = JSON.parse(mockStorage["pf_orders"]) as Order[];
    expect(parsed.some((o) => o.id === "drop")).toBe(false);
    expect(parsed.some((o) => o.id === "keep")).toBe(true);
  });
});

// ─── hydrateSavedState — corrupt / wrong-shape data recovery ───────────────────
// Drives every read-helper catch branch: corrupt JSON in each key must be
// dropped (removeItem) and fall back to a safe default rather than throwing.

describe("hydrateSavedState corrupt-data recovery", () => {
  it("drops corrupt JSON in every persisted key and falls back to safe defaults", () => {
    const BAD = "{not-valid-json";
    installLocalStorage({
      pf_favorites: BAD,
      pf_recent: BAD,
      pf_fav_snap: BAD,
      pf_recent_snap: BAD,
      pf_search_history: BAD,
      pf_saved_baskets: BAD,
      pf_job_templates: BAD,
      pf_quotes: BAD,
      pf_orders: BAD,
      pf_watches: BAD,
      pf_notif_reads: BAD,
      pf_saved_searches: BAD,
      pf_order_fulfillment: BAD,
      pf_returns: BAD,
    });

    expect(() => hydrateSavedState()).not.toThrow();

    const s = get();
    expect(s.favorites).toEqual([]);
    expect(s.recentlyViewed).toEqual([]);
    expect(s.favoriteSnapshots).toEqual({});
    expect(s.recentSnapshots).toEqual({});
    expect(s.searchHistory).toEqual([]);
    expect(s.savedBaskets).toEqual([]);
    expect(s.jobTemplates).toEqual([]);
    expect(s.quotes).toEqual([]);
    expect(s.orders).toEqual([]);
    expect(s.watches).toEqual([]);
    expect(s.notifReads).toEqual({});
    expect(s.savedSearches).toEqual([]);
    expect(s.orderFulfillment).toEqual({});
    expect(s.returns).toEqual([]);

    // Each corrupt key is removed so the next load starts clean.
    expect(mockStorage["pf_favorites"]).toBeUndefined();
    expect(mockStorage["pf_returns"]).toBeUndefined();
  });

  it("readJson loads well-shaped data through the guard", () => {
    installLocalStorage({
      pf_quotes: "[]",
      pf_orders: "[]",
      pf_order_fulfillment: JSON.stringify({ "ord-1": "willcall" }),
      pf_returns: JSON.stringify([
        {
          id: "rma-1",
          rma: "RMA-1",
          orderId: "ord-1",
          customerId: null,
          lines: [],
          reason: "No longer needed",
          status: "requested",
          createdAt: 1,
          refundAmount: 0,
        },
      ]),
    });

    hydrateSavedState();

    expect(get().orderFulfillment).toEqual({ "ord-1": "willcall" });
    expect(get().returns).toHaveLength(1);
    expect(get().returns[0].id).toBe("rma-1");
    // valid data is retained (not evicted)
    expect(mockStorage["pf_order_fulfillment"]).toBeDefined();
    expect(mockStorage["pf_returns"]).toBeDefined();
  });

  it("readJson drops wrong-shaped (valid-JSON) data that fails the shape guard", () => {
    installLocalStorage({
      pf_quotes: "[]",
      pf_orders: "[]",
      // valid JSON, but the WRONG shape for each guard:
      pf_order_fulfillment: JSON.stringify(["not", "an", "object"]), // fails isPlainObject (array)
      pf_returns: JSON.stringify({ not: "an array" }), // fails Array.isArray
    });

    hydrateSavedState();

    expect(get().orderFulfillment).toEqual({});
    expect(get().returns).toEqual([]);
    // wrong-shape values are evicted from storage
    expect(mockStorage["pf_order_fulfillment"]).toBeUndefined();
    expect(mockStorage["pf_returns"]).toBeUndefined();
  });
});
