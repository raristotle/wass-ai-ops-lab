import { create } from "zustand";
import type { FilterState, ParsedFilter, SortKey, ViewMode, CatalogProduct, BomLine, AuthUser, ProductCategory, SearchResponse } from "@/features/product-finder/types";
import type { CustomerAccount } from "@/lib/integration/types";
import { getCustomerProvider } from "@/lib/integration/index";

// ─── SavedBasket type ─────────────────────────────────────────────────────────
export type SavedBasket = {
  id: string;
  name: string;
  lines: { product: CatalogProduct; qty: number }[];
  savedAt: number;
};

// ─── Order type ───────────────────────────────────────────────────────────────
export type Order = {
  id: string;
  placedAt: number;
  lines: { product: CatalogProduct; qty: number }[];
  total: number;
  /** The customer this order belongs to. null = walk-in / no active customer. */
  customerId: string | null;
  customerName: string | null;
};
import { parseQuery } from "@/lib/product-finder-nl-search";
import { getPricingProvider } from "@/lib/integration/index";
import {
  searchProducts,
  getAlternatives,
  getCrossSells,
  getUpsells,
  CATALOG_PRODUCTS,
} from "@/data/mock/catalog-products";
import { apiSearch, apiGetProduct } from "@/lib/product-finder-api";
import type { ProductSnapshot } from "@/features/product-finder/types";

const MAX_RECENT = 12;
const MAX_SEARCH_HISTORY = 12;

// ─── Auth slice ───────────────────────────────────────────────────────────────

const DEMO_USERS: Record<string, AuthUser & { password: string }> = {
  "sales@meridiansupply.com": {
    name: "Sarah Chen",
    email: "sales@meridiansupply.com",
    role: "sales",
    branch: "Houston Downtown",
    branchId: "B-HOU-01",
    password: "meridian2024",
  },
  "manager@meridiansupply.com": {
    name: "Marcus Rivera",
    email: "manager@meridiansupply.com",
    role: "manager",
    branch: "Dallas North",
    branchId: "B-DAL-01",
    password: "meridian2024",
  },
  "admin@meridiansupply.com": {
    name: "Admin User",
    email: "admin@meridiansupply.com",
    role: "admin",
    branch: "Corporate",
    branchId: "B-CORP",
    password: "meridian2024",
  },
};

// ─── Compare slice ─────────────────────────────────────────────────────────────

export interface ProductFinderState {
  // Auth
  user: AuthUser | null;
  authError: string | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;

  // Customer accounts
  customers: CustomerAccount[];
  activeCustomerId: string | null;
  setActiveCustomer: (id: string | null) => void;

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
  activeProduct: CatalogProduct | null;
  setActiveProduct: (p: CatalogProduct | null) => Promise<void>;

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
  toggleSpecFilter: (name: string, value: string) => Promise<void>;

  // Compare
  compareIds: Set<string>;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  compareModalOpen: boolean;
  setCompareModalOpen: (v: boolean) => void;

  // Detail modal
  detailModalProduct: CatalogProduct | null;
  setDetailModalProduct: (p: CatalogProduct | null) => void;

  // BOM import modal
  bomModalOpen: boolean;
  setBomModalOpen: (v: boolean) => void;

  // Cart (basket)
  cart: Record<string, { product: CatalogProduct; qty: number }>;
  addToCart: (product: CatalogProduct, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateCartQty: (id: string, qty: number) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;

  // Saved baskets
  savedBaskets: SavedBasket[];
  saveCurrentBasket: (name: string, id?: string, now?: number) => void;
  loadBasket: (id: string) => void;
  deleteBasket: (id: string) => void;
  renameBasket: (id: string, name: string) => void;

  // Order history
  orders: Order[];
  placeOrder: (now: number, id?: string) => void;
  reorder: (id: string) => void;
  deleteOrder: (id: string) => void;

  // Watches (notify-when-available)
  watches: string[];
  toggleWatch: (id: string) => void;

  // Saved & history
  favorites: string[];
  favoriteSnapshots: Record<string, ProductSnapshot>;
  recentSnapshots: Record<string, ProductSnapshot>;
  toggleFavorite: (product: CatalogProduct) => void;
  isFavorite: (id: string) => boolean;
  recentlyViewed: string[];
  searchHistory: string[];
  addSearchTerm: (term: string) => void;
  clearSearchHistory: () => void;
  clearRecentlyViewed: () => void;

  // Derived / Results
  results: CatalogProduct[];
  facets: SearchResponse["facets"];
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
    specFilters: {},
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
  // ── Customer accounts ─────────────────────────────────────
  customers: getCustomerProvider().list(),
  activeCustomerId: null,

  setActiveCustomer(id) {
    set({ activeCustomerId: id });
    if (typeof localStorage !== "undefined") {
      if (id === null) {
        localStorage.removeItem("pf_active_customer");
      } else {
        localStorage.setItem("pf_active_customer", id);
      }
    }
  },

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
    if (raw.trim()) get().addSearchTerm(raw);
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
  searchHistory: [],

  addSearchTerm(term) {
    const trimmed = term.trim();
    if (!trimmed) return;
    set((s) => {
      const lower = trimmed.toLowerCase();
      const deduped = s.searchHistory.filter((t) => t.toLowerCase() !== lower);
      const next = [trimmed, ...deduped].slice(0, MAX_SEARCH_HISTORY);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_search_history", JSON.stringify(next));
      }
      return { searchHistory: next };
    });
  },

  clearSearchHistory() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("pf_search_history");
    }
    set({ searchHistory: [] });
  },

  clearRecentlyViewed() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("pf_recent");
      localStorage.removeItem("pf_recent_snap");
    }
    set({ recentlyViewed: [], recentSnapshots: {} });
  },

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

  // ── Detail modal ──────────────────────────────────────────
  detailModalProduct: null,
  setDetailModalProduct(p) { set({ detailModalProduct: p }); },

  // ── BOM import modal ──────────────────────────────────────
  bomModalOpen: false,
  setBomModalOpen(v) { set({ bomModalOpen: v }); },

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

  // ── Saved baskets ─────────────────────────────────────────
  savedBaskets: [],

  saveCurrentBasket(name, id, now) {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const cart = get().cart;
    const cartValues = Object.values(cart);
    if (cartValues.length === 0) return;

    const lines = cartValues.map((entry) => ({ product: entry.product, qty: entry.qty }));
    const ts = now ?? Date.now();
    const basketId = id ?? `basket-${ts}-${trimmedName.replace(/\s+/g, "-").toLowerCase()}`;

    set((s) => {
      const lowerName = trimmedName.toLowerCase();
      const existingIdx = s.savedBaskets.findIndex(
        (b) => b.name.toLowerCase() === lowerName
      );
      let nextBaskets: SavedBasket[];
      if (existingIdx !== -1) {
        // Overwrite in-place (keep position? spec says overwrite — keep same slot)
        nextBaskets = s.savedBaskets.map((b, i) =>
          i === existingIdx ? { ...b, lines, savedAt: ts } : b
        );
      } else {
        const newBasket: SavedBasket = { id: basketId, name: trimmedName, lines, savedAt: ts };
        nextBaskets = [newBasket, ...s.savedBaskets];
      }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_saved_baskets", JSON.stringify(nextBaskets));
      }
      return { savedBaskets: nextBaskets };
    });
  },

  loadBasket(id) {
    const basket = get().savedBaskets.find((b) => b.id === id);
    if (!basket) return;
    const newCart: Record<string, { product: CatalogProduct; qty: number }> = {};
    for (const line of basket.lines) {
      newCart[line.product.id] = { product: line.product, qty: line.qty };
    }
    set({ cart: newCart });
  },

  deleteBasket(id) {
    set((s) => {
      const nextBaskets = s.savedBaskets.filter((b) => b.id !== id);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_saved_baskets", JSON.stringify(nextBaskets));
      }
      return { savedBaskets: nextBaskets };
    });
  },

  renameBasket(id, name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((s) => {
      const nextBaskets = s.savedBaskets.map((b) =>
        b.id === id ? { ...b, name: trimmed } : b
      );
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_saved_baskets", JSON.stringify(nextBaskets));
      }
      return { savedBaskets: nextBaskets };
    });
  },

  // ── Order history ─────────────────────────────────────────
  orders: [],

  placeOrder(now, id) {
    const cart = get().cart;
    const cartValues = Object.values(cart);
    if (cartValues.length === 0) return;

    const activeCustomer = selectActiveCustomer(get());
    const provider = getPricingProvider();

    const lines = cartValues.map((entry) => ({
      product: entry.product,
      qty: entry.qty,
    }));
    // Use the SAME pricing the cart shows (effectiveUnitPrice) to fix the bug
    // where contract customer order totals didn't match the cart subtotal.
    const total = lines.reduce(
      (sum, l) => sum + provider.getPricing(l.product, { customer: activeCustomer, qty: l.qty }).effectiveUnitPrice * l.qty,
      0
    );
    const orderId = id ?? `order-${now}`;
    const newOrder: Order = {
      id: orderId,
      placedAt: now,
      lines,
      total,
      customerId: activeCustomer?.id ?? null,
      customerName: activeCustomer?.name ?? null,
    };

    set((s) => {
      const orders = [newOrder, ...s.orders];
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_orders", JSON.stringify(orders));
      }
      return { orders, cart: {} };
    });
  },

  reorder(id) {
    const order = get().orders.find((o) => o.id === id);
    if (!order) return;
    // Deep independent copy so mutating the cart never changes the stored order
    const newCart: Record<string, { product: CatalogProduct; qty: number }> = {};
    for (const line of order.lines) {
      newCart[line.product.id] = {
        product: { ...line.product, specs: line.product.specs ? [...line.product.specs] : [] },
        qty: line.qty,
      };
    }
    set({ cart: newCart });
  },

  deleteOrder(id) {
    set((s) => {
      const orders = s.orders.filter((o) => o.id !== id);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_orders", JSON.stringify(orders));
      }
      return { orders };
    });
  },

  // ── Watches (notify-when-available) ──────────────────────
  watches: [],

  toggleWatch(id) {
    set((s) => {
      const has = s.watches.includes(id);
      const watches = has ? s.watches.filter((w) => w !== id) : [...s.watches, id];
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_watches", JSON.stringify(watches));
      }
      return { watches };
    });
  },

  // ── Results / search engine ───────────────────────────────
  results: [],
  facets: [],
  loading: false,
  error: null,
  page: 0,
  total: 0,
  pageSize: 24,

  async runSearch() {
    set({ loading: true, error: null, page: 0 });
    try {
      const res = await apiSearch(get().filters, 0, get().pageSize);
      set({ results: res.items, total: res.total, page: 0, loading: false, facets: res.facets ?? [] });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "Search failed", results: [], total: 0 });
    }
  },

  async loadMore() {
    const next = get().page + 1;
    set({ loading: true, error: null });
    try {
      const res = await apiSearch(get().filters, next, get().pageSize);
      // Keep the first page's facets stable — don't clobber on loadMore
      set((s) => ({ results: [...s.results, ...res.items], total: res.total, page: next, loading: false }));
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "Load more failed" });
    }
  },

  // ── Spec-level facet filters ──────────────────────────────
  async toggleSpecFilter(name, value) {
    set((s) => {
      const current = s.filters.specFilters[name] ?? [];
      let next: string[];
      if (current.includes(value)) {
        next = current.filter((v) => v !== value);
      } else {
        next = [...current, value];
      }
      const newSpecFilters = { ...s.filters.specFilters };
      if (next.length === 0) {
        delete newSpecFilters[name];
      } else {
        newSpecFilters[name] = next;
      }
      return { filters: { ...s.filters, specFilters: newSpecFilters } };
    });
    await get().runSearch();
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
  const readBaskets = (k: string): SavedBasket[] => {
    const raw = localStorage.getItem(k);
    if (!raw) return [];
    try { const v = JSON.parse(raw); return Array.isArray(v) ? (v as SavedBasket[]) : []; }
    catch { localStorage.removeItem(k); return []; }
  };
  const readOrders = (): Order[] => {
    const raw = localStorage.getItem("pf_orders");
    // null means ABSENT (never been set) → seed demo orders
    if (raw === null) {
      const demoOrders = buildDemoOrders(Date.now());
      localStorage.setItem("pf_orders", JSON.stringify(demoOrders));
      return demoOrders;
    }
    try { const v = JSON.parse(raw); return Array.isArray(v) ? (v as Order[]) : []; }
    catch { localStorage.removeItem("pf_orders"); return []; }
  };
  const readActiveCustomer = (): string | null => {
    const raw = localStorage.getItem("pf_active_customer");
    if (!raw) return null;
    // Validate that the id still exists in the current customer list
    const exists = getCustomerProvider().list().some((c) => c.id === raw);
    return exists ? raw : null;
  };

  useProductFinder.setState({
    favorites: readArr("pf_favorites"),
    recentlyViewed: readArr("pf_recent"),
    favoriteSnapshots: readMap("pf_fav_snap"),
    recentSnapshots: readMap("pf_recent_snap"),
    searchHistory: readArr("pf_search_history"),
    savedBaskets: readBaskets("pf_saved_baskets"),
    watches: readArr("pf_watches"),
    orders: readOrders(),
    activeCustomerId: readActiveCustomer(),
  });
}

// ─── Demo order seed (first-ever load only) ───────────────────────────────────
/**
 * Build demo seed orders with placedAt timestamps relative to `now`.
 * Each order lands in a distinct recent month so the Orders-Over-Time chart
 * always shows populated buckets regardless of when the app is first opened.
 *
 * Offsets (days before `now`):
 *   demo-order-001 →  5 days ago  (this month or very recent)
 *   demo-order-002 → 35 days ago  (~1 month ago)
 *   demo-order-003 → 70 days ago  (~2 months ago)
 *
 * `now` is injected by the caller so the function remains pure / testable.
 * Exported so unit tests can call it with a fixed `now` for deterministic assertions.
 */
export function buildDemoOrders(now: number): Order[] {
  // Use known, stable catalog product ids for deterministic demo history.
  // Seeded per-customer:
  //   CUST-001 (Gulf Coast Industrial): orders 001 + 002 (breaker SKUs with net prices)
  //   CUST-002 (Lone Star Data Systems): order 003
  const p1 = CATALOG_PRODUCTS.find((p) => p.id === "CB-SQD-QO115");
  const p2 = CATALOG_PRODUCTS.find((p) => p.id === "CB-EAT-CH115");
  const p3 = CATALOG_PRODUCTS.find((p) => p.id === "CB-SQD-QO115DF");

  const MS_PER_DAY = 86_400_000;
  const provider = getPricingProvider();

  const orders: Order[] = [];

  // CUST-001 order 1: CB-SQD-QO115 (qty 10) + CB-EAT-CH115 (qty 5) — 5 days ago
  if (p1 && p2) {
    const customer1 = { id: "CUST-001", name: "Gulf Coast Industrial" };
    const lines1 = [
      { product: p1, qty: 10 },
      { product: p2, qty: 5 },
    ];
    const cust001Account = getCustomerProvider().get("CUST-001");
    orders.push({
      id: "demo-order-001",
      placedAt: now - 5 * MS_PER_DAY,
      lines: lines1,
      // Use contract pricing to match what the customer would have seen in cart
      total: lines1.reduce(
        (s, l) => s + provider.getPricing(l.product, { customer: cust001Account, qty: l.qty }).effectiveUnitPrice * l.qty,
        0
      ),
      customerId: customer1.id,
      customerName: customer1.name,
    });
  }

  // CUST-001 order 2: CB-SQD-QO115DF (qty 2) — 35 days ago
  if (p3) {
    const customer1 = { id: "CUST-001", name: "Gulf Coast Industrial" };
    const lines2 = [{ product: p3, qty: 2 }];
    const cust001Account = getCustomerProvider().get("CUST-001");
    orders.push({
      id: "demo-order-002",
      placedAt: now - 35 * MS_PER_DAY,
      lines: lines2,
      total: lines2.reduce(
        (s, l) => s + provider.getPricing(l.product, { customer: cust001Account, qty: l.qty }).effectiveUnitPrice * l.qty,
        0
      ),
      customerId: customer1.id,
      customerName: customer1.name,
    });
  }

  // CUST-002 (Lone Star Data Systems) order: datacom/AV product if available, else fallback — 70 days ago
  {
    const customer2 = { id: "CUST-002", name: "Lone Star Data Systems" };
    // Try to find a datacom product; fall back to first catalog product
    const datacomProduct = CATALOG_PRODUCTS.find((p) => p.category === "datacom") ?? CATALOG_PRODUCTS[2];
    if (datacomProduct) {
      const cust002Account = getCustomerProvider().get("CUST-002");
      const lines3 = [{ product: datacomProduct, qty: 3 }];
      orders.push({
        id: "demo-order-003",
        placedAt: now - 70 * MS_PER_DAY,
        lines: lines3,
        total: lines3.reduce(
          (s, l) => s + provider.getPricing(l.product, { customer: cust002Account, qty: l.qty }).effectiveUnitPrice * l.qty,
          0
        ),
        customerId: customer2.id,
        customerName: customer2.name,
      });
    }
  }

  return orders;
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
  const customer = selectActiveCustomer(state);
  const provider = getPricingProvider();
  return Object.values(state.cart).reduce((sum, { product, qty }) => {
    const effectiveUnitPrice = provider.getPricing(product, { customer, qty }).effectiveUnitPrice;
    return sum + effectiveUnitPrice * qty;
  }, 0);
}

export function selectActiveCustomer(state: ProductFinderState): CustomerAccount | null {
  if (!state.activeCustomerId) return null;
  return state.customers.find((c) => c.id === state.activeCustomerId) ?? null;
}

export function selectVisibleOrders(state: ProductFinderState): Order[] {
  const { orders, activeCustomerId } = state;
  if (activeCustomerId === null) {
    // Walk-in / no customer selected — show only walk-in orders
    return orders.filter((o) => o.customerId === null);
  }
  return orders.filter((o) => o.customerId === activeCustomerId);
}
