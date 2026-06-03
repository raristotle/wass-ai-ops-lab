import { describe, it, expect, beforeEach } from "vitest";
import { useProductFinder, selectCartCount, selectCartTotal } from "@/lib/product-finder-store";
import { WESCO_PRODUCTS } from "@/data/mock/wesco-products";

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
    results: [],
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

// ─── runSearch integration ────────────────────────────────────────────────────

describe("runSearch", () => {
  beforeEach(resetStore);

  it("returns all products when no query or filters are set", () => {
    useProductFinder.getState().runSearch();
    const { results } = useProductFinder.getState();
    expect(results.length).toBe(WESCO_PRODUCTS.length);
  });

  it("filters to only preferred products when onlyPreferred is true", () => {
    useProductFinder.getState().setOnlyPreferred(true);
    const { results } = useProductFinder.getState();
    expect(results.every((p) => p.preferred)).toBe(true);
  });

  it("filters by category", () => {
    useProductFinder.getState().toggleCategory("datacom");
    const { results } = useProductFinder.getState();
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.category === "datacom")).toBe(true);
  });

  it("filters by price max", () => {
    useProductFinder.getState().setPriceRange(null, 10);
    const { results } = useProductFinder.getState();
    expect(results.every((p) => p.unitPrice <= 10)).toBe(true);
  });
});
