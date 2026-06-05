import { create } from "zustand";
import type { FilterState, ParsedFilter, SortKey, ViewMode, WescoProduct, BomLine, AuthUser, ProductCategory } from "@/features/product-finder/types";
import { parseQuery } from "@/lib/product-finder-nl-search";
import {
  searchProducts,
  getAlternatives,
  getCrossSells,
  getUpsells,
  getTotalBranchStock,
} from "@/data/mock/wesco-products";

// ─── Auth slice ───────────────────────────────────────────────────────────────

const DEMO_USERS: Record<string, AuthUser & { password: string }> = {
  "sales@wesco.com": {
    name: "Sarah Chen",
    email: "sales@wesco.com",
    role: "sales",
    branch: "Houston Downtown",
    branchId: "B-HOU-01",
    password: "wesco2024",
  },
  "manager@wesco.com": {
    name: "Marcus Rivera",
    email: "manager@wesco.com",
    role: "manager",
    branch: "Dallas North",
    branchId: "B-DAL-01",
    password: "wesco2024",
  },
  "admin@wesco.com": {
    name: "Admin User",
    email: "admin@wesco.com",
    role: "admin",
    branch: "Corporate",
    branchId: "B-CORP",
    password: "wesco2024",
  },
};

// ─── Compare slice ─────────────────────────────────────────────────────────────

export interface ProductFinderState {
  // Auth
  user: AuthUser | null;
  authError: string | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;

  // Search
  query: string;
  setQuery: (q: string) => void;
  appliedNlFilters: ParsedFilter[];
  runNlSearch: (raw: string) => void;
  removeNlFilter: (id: string) => void;

  // BOM mode
  bomMode: boolean;
  bomText: string;
  bomLines: BomLine[];
  setBomMode: (v: boolean) => void;
  setBomText: (t: string) => void;
  parseBom: () => void;

  // Active product (single search result)
  activeProduct: WescoProduct | null;
  setActiveProduct: (p: WescoProduct | null) => void;

  // Filters
  filters: FilterState;
  setFilterQuery: (q: string) => void;
  toggleCategory: (cat: ProductCategory) => void;
  toggleBrand: (brand: string) => void;
  toggleSubcategory: (sub: string) => void;
  setOnlyBranchStock: (v: boolean) => void;
  setOnlyDCStock: (v: boolean) => void;
  setOnlyPreferred: (v: boolean) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setSortKey: (k: SortKey) => void;
  setViewMode: (v: ViewMode) => void;
  clearFilters: () => void;

  // Compare
  compareIds: Set<string>;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  compareModalOpen: boolean;
  setCompareModalOpen: (v: boolean) => void;

  // Cart (basket)
  cart: Record<string, { product: WescoProduct; qty: number }>;
  addToCart: (product: WescoProduct, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateCartQty: (id: string, qty: number) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;

  // Derived
  results: WescoProduct[];
  runSearch: () => void;
}

function defaultFilters(): FilterState {
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
  };
}

function applyParsedFilter(filters: FilterState, f: ParsedFilter, on: boolean): FilterState {
  const next: FilterState = {
    ...filters,
    categories: new Set(filters.categories),
    brands: new Set(filters.brands),
    subcategories: new Set(filters.subcategories),
  };
  switch (f.kind) {
    case "priceMax":
      next.priceMax = on ? (f.value as number) : null;
      break;
    case "priceMin":
      next.priceMin = on ? (f.value as number) : null;
      break;
    case "branchStock":
      next.onlyBranchStock = on;
      break;
    case "preferred":
      next.onlyPreferred = on;
      break;
    case "category":
      if (on) next.categories.add(f.value as ProductCategory);
      else next.categories.delete(f.value as ProductCategory);
      break;
    case "brand":
      if (on) next.brands.add(f.value as string);
      else next.brands.delete(f.value as string);
      break;
  }
  return next;
}

export const useProductFinder = create<ProductFinderState>((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────
  user: null,
  authError: null,

  login(email, password) {
    const record = DEMO_USERS[email.toLowerCase()];
    if (!record || record.password !== password) {
      set({ authError: "Invalid email or password." });
      return false;
    }
    const { password: _pw, ...user } = record;
    set({ user, authError: null });
    if (typeof window !== "undefined") {
      localStorage.setItem("pf_user", JSON.stringify(user));
    }
    return true;
  },

  logout() {
    set({ user: null });
    if (typeof window !== "undefined") localStorage.removeItem("pf_user");
  },

  // ── Search ─────────────────────────────────────────────────
  query: "",
  setQuery(q) {
    set({ query: q });
  },

  appliedNlFilters: [],

  runNlSearch(raw) {
    const parsed = parseQuery(raw);
    set((s) => {
      let filters = { ...s.filters, query: parsed.text };
      for (const f of parsed.filters) filters = applyParsedFilter(filters, f, true);
      return { filters, appliedNlFilters: parsed.filters, query: raw };
    });
    get().runSearch();
  },

  removeNlFilter(id) {
    set((s) => {
      const target = s.appliedNlFilters.find((f) => f.id === id);
      if (!target) return s;
      return {
        filters: applyParsedFilter(s.filters, target, false),
        appliedNlFilters: s.appliedNlFilters.filter((f) => f.id !== id),
      };
    });
    get().runSearch();
  },

  // ── BOM ───────────────────────────────────────────────────
  bomMode: false,
  bomText: "",
  bomLines: [],
  setBomMode(v) { set({ bomMode: v }); },
  setBomText(t) { set({ bomText: t }); },
  parseBom() {
    const lines = get()
      .bomText.split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const parsed: BomLine[] = lines.map((raw, i) => {
      const qtyMatch = raw.match(/^(\d+)[x×\s]+(.+)/i);
      const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;
      const description = qtyMatch ? qtyMatch[2].trim() : raw;

      const results = searchProducts(description);
      const resolved = results[0] ?? null;

      return {
        id: `bom-${i}`,
        rawText: raw,
        quantity,
        description,
        resolved,
        alternatives: resolved ? getAlternatives(resolved).slice(0, 3) : [],
      };
    });

    set({ bomLines: parsed, bomMode: true });
  },

  // ── Active product ─────────────────────────────────────────
  activeProduct: null,
  setActiveProduct(p) {
    set({ activeProduct: p });
    if (p) get().runSearch();
  },

  // ── Filters ───────────────────────────────────────────────
  filters: defaultFilters(),

  setFilterQuery(q) {
    set((s) => ({ filters: { ...s.filters, query: q } }));
    get().runSearch();
  },

  toggleCategory(cat) {
    set((s) => {
      const cats = new Set(s.filters.categories);
      if (cats.has(cat)) cats.delete(cat);
      else cats.add(cat);
      return { filters: { ...s.filters, categories: cats } };
    });
    get().runSearch();
  },

  toggleBrand(brand) {
    set((s) => {
      const brands = new Set(s.filters.brands);
      if (brands.has(brand)) brands.delete(brand);
      else brands.add(brand);
      return { filters: { ...s.filters, brands } };
    });
    get().runSearch();
  },

  toggleSubcategory(sub) {
    set((s) => {
      const subs = new Set(s.filters.subcategories);
      if (subs.has(sub)) subs.delete(sub);
      else subs.add(sub);
      return { filters: { ...s.filters, subcategories: subs } };
    });
    get().runSearch();
  },

  setOnlyBranchStock(v) {
    set((s) => ({ filters: { ...s.filters, onlyBranchStock: v } }));
    get().runSearch();
  },

  setOnlyDCStock(v) {
    set((s) => ({ filters: { ...s.filters, onlyDCStock: v } }));
    get().runSearch();
  },

  setOnlyPreferred(v) {
    set((s) => ({ filters: { ...s.filters, onlyPreferred: v } }));
    get().runSearch();
  },

  setPriceRange(min, max) {
    set((s) => ({ filters: { ...s.filters, priceMin: min, priceMax: max } }));
    get().runSearch();
  },

  setSortKey(k) {
    set((s) => ({ filters: { ...s.filters, sortKey: k } }));
    get().runSearch();
  },

  setViewMode(v) {
    set((s) => ({ filters: { ...s.filters, viewMode: v } }));
  },

  clearFilters() {
    set({ filters: defaultFilters() });
    get().runSearch();
  },

  // ── Compare ───────────────────────────────────────────────
  compareIds: new Set(),
  compareModalOpen: false,

  toggleCompare(id) {
    set((s) => {
      const ids = new Set(s.compareIds);
      if (ids.has(id)) ids.delete(id);
      else if (ids.size < 4) ids.add(id);
      return { compareIds: ids };
    });
  },

  clearCompare() {
    set({ compareIds: new Set(), compareModalOpen: false });
  },

  setCompareModalOpen(v) { set({ compareModalOpen: v }); },

  // ── Cart ──────────────────────────────────────────────────
  cart: {},
  cartOpen: false,

  addToCart(product, qty = 1) {
    set((s) => {
      const existing = s.cart[product.id];
      return {
        cart: {
          ...s.cart,
          [product.id]: { product, qty: existing ? existing.qty + qty : qty },
        },
      };
    });
  },

  removeFromCart(id) {
    set((s) => {
      const { [id]: _, ...rest } = s.cart;
      return { cart: rest };
    });
  },

  updateCartQty(id, qty) {
    if (qty <= 0) { get().removeFromCart(id); return; }
    set((s) => ({
      cart: { ...s.cart, [id]: { ...s.cart[id], qty } },
    }));
  },

  clearCart() { set({ cart: {} }); },
  setCartOpen(v) { set({ cartOpen: v }); },

  // ── Results / search engine ───────────────────────────────
  results: [],

  runSearch() {
    const { filters, activeProduct } = get();
    let pool = searchProducts(filters.query);

    // Category filter
    if (filters.categories.size > 0) {
      pool = pool.filter((p) => filters.categories.has(p.category));
    }
    // Subcategory filter
    if (filters.subcategories.size > 0) {
      pool = pool.filter((p) => filters.subcategories.has(p.subcategory));
    }
    // Brand filter
    if (filters.brands.size > 0) {
      pool = pool.filter((p) => filters.brands.has(p.brand));
    }
    // Branch stock
    if (filters.onlyBranchStock) {
      pool = pool.filter((p) => getTotalBranchStock(p) > 0);
    }
    // DC stock
    if (filters.onlyDCStock) {
      pool = pool.filter((p) => p.dcStock.some((d) => d.quantity > 0));
    }
    // Preferred only
    if (filters.onlyPreferred) {
      pool = pool.filter((p) => p.preferred);
    }
    // Price range
    if (filters.priceMin !== null) {
      pool = pool.filter((p) => p.unitPrice >= filters.priceMin!);
    }
    if (filters.priceMax !== null) {
      pool = pool.filter((p) => p.unitPrice <= filters.priceMax!);
    }

    // Sort
    const sort = filters.sortKey;
    pool = [...pool].sort((a, b) => {
      if (sort === "preferred")    return (b.preferred ? 1 : 0) - (a.preferred ? 1 : 0);
      if (sort === "branchStock")  return getTotalBranchStock(b) - getTotalBranchStock(a);
      if (sort === "priceLow")     return a.unitPrice - b.unitPrice;
      if (sort === "priceHigh")    return b.unitPrice - a.unitPrice;
      if (sort === "brand")        return a.brand.localeCompare(b.brand);
      // relevance: preferred first, then alternatives of active product
      const aIsAlt = activeProduct?.alternativeIds.includes(a.id) ? 1 : 0;
      const bIsAlt = activeProduct?.alternativeIds.includes(b.id) ? 1 : 0;
      if (aIsAlt !== bIsAlt) return bIsAlt - aIsAlt;
      return (b.preferred ? 1 : 0) - (a.preferred ? 1 : 0);
    });

    set({ results: pool });
  },
}));

// ─── Hydrate auth from localStorage on client ─────────────────────────────────
export function hydrateAuth() {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem("pf_user");
  if (raw) {
    try {
      const user = JSON.parse(raw) as AuthUser;
      useProductFinder.setState({ user });
    } catch {
      localStorage.removeItem("pf_user");
    }
  }
}

// ─── Derived selectors ────────────────────────────────────────────────────────
export function selectCrossSells(state: ProductFinderState) {
  const p = state.activeProduct;
  return p ? getCrossSells(p) : [];
}

export function selectUpsells(state: ProductFinderState) {
  const p = state.activeProduct;
  return p ? getUpsells(p) : [];
}

export function selectCartCount(state: ProductFinderState) {
  return Object.values(state.cart).reduce((s, i) => s + i.qty, 0);
}

export function selectCartTotal(state: ProductFinderState) {
  return Object.values(state.cart).reduce(
    (s, i) => s + i.product.unitPrice * i.qty, 0
  );
}
