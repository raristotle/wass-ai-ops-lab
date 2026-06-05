import { create } from "zustand";
import type { FilterState, ParsedFilter, SortKey, ViewMode, WescoProduct, BomLine, AuthUser, ProductCategory } from "@/features/product-finder/types";
import { parseQuery } from "@/lib/product-finder-nl-search";
import {
  searchProducts,
  getAlternatives,
  getCrossSells,
  getUpsells,
} from "@/data/mock/wesco-products";
import { apiSearch, apiGetProduct } from "@/lib/product-finder-api";
import type { ProductSnapshot } from "@/features/product-finder/types";

const MAX_RECENT = 12;

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
  runNlSearch: (raw: string) => Promise<void>;
  removeNlFilter: (id: string) => Promise<void>;

  // BOM mode
  bomMode: boolean;
  bomText: string;
  bomLines: BomLine[];
  setBomMode: (v: boolean) => void;
  setBomText: (t: string) => void;
  parseBom: () => void;

  // Active product (single search result)
  activeProduct: WescoProduct | null;
  setActiveProduct: (p: WescoProduct | null) => Promise<void>;

  // Filters
  filters: FilterState;
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

  // Saved & history
  favorites: string[];
  favoriteSnapshots: Record<string, ProductSnapshot>;
  recentSnapshots: Record<string, ProductSnapshot>;
  toggleFavorite: (product: WescoProduct) => void;
  isFavorite: (id: string) => boolean;
  recentlyViewed: string[];

  // Derived / Results
  results: WescoProduct[];
  loading: boolean;
  error: string | null;
  page: number;
  total: number;
  pageSize: number;
  runSearch: () => Promise<void>;
  loadMore: () => Promise<void>;
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
    default: {
      // Compile-time exhaustiveness: a new ParsedFilterKind must be handled above.
      const _exhaustive: never = f.kind;
      return _exhaustive;
    }
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
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("pf_user", JSON.stringify(user));
    }
    return true;
  },

  logout() {
    set({ user: null });
    if (typeof localStorage !== "undefined") localStorage.removeItem("pf_user");
  },

  // ── Search ─────────────────────────────────────────────────
  query: "",
  setQuery(q) {
    set({ query: q });
  },

  appliedNlFilters: [],

  async runNlSearch(raw) {
    const parsed = parseQuery(raw);
    set((s) => {
      // A new NL search is self-contained: start from defaults so the chips always
      // match the active filters, but keep the user's sort + view preferences.
      let filters: FilterState = {
        ...defaultFilters(),
        sortKey: s.filters.sortKey,
        viewMode: s.filters.viewMode,
        query: parsed.text,
      };
      for (const f of parsed.filters) filters = applyParsedFilter(filters, f, true);
      return { filters, appliedNlFilters: parsed.filters, query: raw };
    });
    await get().runSearch();
  },

  async removeNlFilter(id) {
    set((s) => {
      const target = s.appliedNlFilters.find((f) => f.id === id);
      if (!target) return s;
      return {
        filters: applyParsedFilter(s.filters, target, false),
        appliedNlFilters: s.appliedNlFilters.filter((f) => f.id !== id),
      };
    });
    await get().runSearch();
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

  async setActiveProduct(p) {
    if (!p) {
      set({ activeProduct: null });
      await get().runSearch();
      return;
    }
    const snap: ProductSnapshot = { id: p.id, name: p.name, brand: p.brand, unitPrice: p.unitPrice, imageIcon: p.imageIcon, category: p.category };
    set((s) => {
      const recentlyViewed = [p.id, ...s.recentlyViewed.filter((id) => id !== p.id)].slice(0, MAX_RECENT);
      const recentSnapshots = { ...s.recentSnapshots, [p.id]: snap };
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_recent", JSON.stringify(recentlyViewed));
        localStorage.setItem("pf_recent_snap", JSON.stringify(recentSnapshots));
      }
      return { activeProduct: p, recentlyViewed, recentSnapshots };
    });
    try {
      const detail = await apiGetProduct(p.id, get().user?.branchId);
      if (get().activeProduct?.id !== p.id) return; // stale response — user moved on
      set({ activeProduct: detail.product, results: detail.equivalents, total: detail.equivalents.length, page: 0 });
    } catch { /* keep the passed product + existing results on failure */ }
  },

  // ── Favorites & history ────────────────────────────────────
  favorites: [],
  favoriteSnapshots: {},
  recentSnapshots: {},
  recentlyViewed: [],

  toggleFavorite(product) {
    set((s) => {
      const has = s.favorites.includes(product.id);
      const favorites = has ? s.favorites.filter((f) => f !== product.id) : [...s.favorites, product.id];
      const favoriteSnapshots = { ...s.favoriteSnapshots };
      if (has) delete favoriteSnapshots[product.id];
      else favoriteSnapshots[product.id] = { id: product.id, name: product.name, brand: product.brand, unitPrice: product.unitPrice, imageIcon: product.imageIcon, category: product.category };
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_favorites", JSON.stringify(favorites));
        localStorage.setItem("pf_fav_snap", JSON.stringify(favoriteSnapshots));
      }
      return { favorites, favoriteSnapshots };
    });
  },

  isFavorite(id) {
    return get().favorites.includes(id);
  },

  // ── Filters ───────────────────────────────────────────────
  filters: defaultFilters(),

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
    set({ filters: defaultFilters(), appliedNlFilters: [] });
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
  loading: false,
  error: null,
  page: 0,
  total: 0,
  pageSize: 24,

  async runSearch() {
    set({ loading: true, error: null, page: 0 });
    try {
      const res = await apiSearch(get().filters, 0, get().pageSize);
      set({ results: res.items, total: res.total, page: 0, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "Search failed", results: [], total: 0 });
    }
  },

  async loadMore() {
    const next = get().page + 1;
    set({ loading: true, error: null });
    try {
      const res = await apiSearch(get().filters, next, get().pageSize);
      set((s) => ({ results: [...s.results, ...res.items], total: res.total, page: next, loading: false }));
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "Load more failed" });
    }
  },
}));

// ─── Hydrate auth from localStorage on client ─────────────────────────────────
export function hydrateAuth() {
  if (typeof localStorage === "undefined") return;
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

export function hydrateSavedState() {
  if (typeof localStorage === "undefined") return;
  const readArr = (k: string): string[] => {
    const raw = localStorage.getItem(k);
    if (!raw) return [];
    try { const v = JSON.parse(raw); return Array.isArray(v) ? (v as string[]) : []; }
    catch { localStorage.removeItem(k); return []; }
  };
  const readMap = (k: string): Record<string, ProductSnapshot> => {
    const raw = localStorage.getItem(k);
    if (!raw) return {};
    try { const v = JSON.parse(raw); return v && typeof v === "object" ? (v as Record<string, ProductSnapshot>) : {}; }
    catch { localStorage.removeItem(k); return {}; }
  };
  useProductFinder.setState({
    favorites: readArr("pf_favorites"),
    recentlyViewed: readArr("pf_recent"),
    favoriteSnapshots: readMap("pf_fav_snap"),
    recentSnapshots: readMap("pf_recent_snap"),
  });
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
