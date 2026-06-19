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

// ─── JobTemplate type ─────────────────────────────────────────────────────────
// A reusable kit of products (e.g. "Standard office buildout"). Applied by
// MERGING into the cart, not replacing it — unlike a SavedBasket.
export type JobTemplate = {
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
import { emptyFilterState } from "@/lib/product-finder-url";
import { NEAR_ZERO_RESULTS, suggestCorrection } from "@/lib/product-finder-suggest-correction";
import { getPricingProvider } from "@/lib/integration/index";
import type { SavedQuote, QuoteStatus, ApprovalStatus } from "@/lib/product-finder-quotes";
import { QUOTE_STATUS_LABEL, APPROVAL_LABEL, isSuperseded } from "@/lib/product-finder-quotes";
import { evaluateApproval } from "@/lib/product-finder-approval-policy";
import type { FulfillmentMethod } from "@/lib/product-finder-tracking";
import {
  createReturn,
  nextReturnStatus,
  type ReturnRequest,
  type ReturnLine,
  type ReturnReason,
} from "@/lib/product-finder-returns";
import { quoteNumber } from "@/lib/product-finder-quote";
import { quoteEvent, appendEvent } from "@/lib/product-finder-quote-events";
import { basketMargin } from "@/lib/product-finder-margin";
import { clampOverride } from "@/lib/product-finder-override";
import type { WatchEntry } from "@/lib/product-finder-notifications";
import {
  searchProducts,
  getAlternatives,
  getCrossSells,
  getUpsells,
  CATALOG_PRODUCTS,
} from "@/data/mock/catalog-products";
import { apiSearch, apiGetProduct, filtersToQuery } from "@/lib/product-finder-api";
import { decodeFiltersFromQuery } from "@/lib/product-finder-url";
import { summarizeFilters, type SavedSearch } from "@/lib/product-finder-saved-search";
import { DEFAULT_BRAND_ID, isBrandId } from "@/lib/brand";
import type { ProductSnapshot } from "@/features/product-finder/types";

const MAX_RECENT = 12;
const MAX_SEARCH_HISTORY = 12;

// ─── Auth slice ───────────────────────────────────────────────────────────────

/** Shared demo password for every demo account. */
export const DEMO_PASSWORD = "meridian2024";

/**
 * Best-effort: POST to /api/auth/login to mint the signed server-session cookie
 * (carries the tenant for the durable API). Active only when SESSION_SECRET is
 * configured server-side; a harmless no-op otherwise, so client auth still works.
 */
function establishServerSession(email: string, password: string, name: string): void {
  if (typeof fetch === "undefined") return;
  void fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  }).catch(() => {});
}

const DEMO_USERS: Record<string, AuthUser & { password: string }> = {
  "sales@meridiansupply.com": {
    name: "Sarah Chen",
    email: "sales@meridiansupply.com",
    role: "sales",
    branch: "Houston Downtown",
    branchId: "B-HOU-01",
    password: DEMO_PASSWORD,
  },
  "manager@meridiansupply.com": {
    name: "Marcus Rivera",
    email: "manager@meridiansupply.com",
    role: "manager",
    branch: "Dallas North",
    branchId: "B-DAL-01",
    password: DEMO_PASSWORD,
  },
  "admin@meridiansupply.com": {
    name: "Admin User",
    email: "admin@meridiansupply.com",
    role: "admin",
    branch: "Corporate",
    branchId: "B-CORP",
    password: DEMO_PASSWORD,
  },
};

/** Password-free public projection of a demo account (safe for UI lists). */
export type DemoAccount = Pick<AuthUser, "name" | "email" | "role">;

export const DEMO_ACCOUNTS: readonly DemoAccount[] = Object.values(DEMO_USERS).map(
  ({ name, email, role }) => ({ name, email, role }),
);

// ─── UI types ─────────────────────────────────────────────────────────────────

/** A section of the cart drawer that can be deep-linked / opened directly. */
export type CartSection = "basket" | "quotes" | "orders";

/** A "did you mean…?" suggestion attached to the last NL search. */
export type SearchCorrection = {
  original: string;
  corrected: string;
  /** true = the corrected query was already run automatically. */
  autoApplied: boolean;
};

// ─── Compare slice ─────────────────────────────────────────────────────────────

export interface ProductFinderState {
  // Auth
  user: AuthUser | null;
  authError: string | null;
  login: (email: string, password: string) => boolean;
  loginWithSso: (user: AuthUser) => void;
  logout: () => void;

  // Customer accounts
  customers: CustomerAccount[];
  activeCustomerId: string | null;
  setActiveCustomer: (id: string | null) => void;

  // Search
  query: string;
  setQuery: (q: string) => void;
  appliedNlFilters: ParsedFilter[];
  runNlSearch: (raw: string, opts?: { noCorrect?: boolean }) => Promise<void>;
  removeNlFilter: (id: string) => Promise<void>;

  // "Did you mean…?" correction for the last NL search
  correction: SearchCorrection | null;
  dismissCorrection: () => void;

  // Guided tour
  tourOpen: boolean;
  tourStep: number;
  startTour: () => void;
  setTourStep: (step: number) => void;
  closeTour: () => void;

  // Command palette
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;

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
  setOnlyActive: (v: boolean) => void;
  setOnlyWithCrosses: (v: boolean) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setSortKey: (k: SortKey) => void;
  setViewMode: (v: ViewMode) => void;
  clearFilters: () => void;
  /** Replace the whole FilterState (mirrors query, clears NL chips) WITHOUT running a search. */
  setAllFilters: (filters: FilterState) => void;
  toggleSpecFilter: (name: string, value: string) => Promise<void>;
  /** Set or clear a numeric range for a spec. When both min and max are undefined the key is deleted. */
  setSpecRange: (name: string, range: { min?: number; max?: number }) => Promise<void>;

  // Compare
  compareIds: Set<string>;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  compareModalOpen: boolean;
  setCompareModalOpen: (v: boolean) => void;

  // Keyboard power layer (results surface): the highlighted result row + the
  // shortcuts help overlay.
  activeResultIndex: number;
  setActiveResultIndex: (n: number) => void;
  keyboardHelpOpen: boolean;
  setKeyboardHelpOpen: (v: boolean) => void;

  // Sprint-4 agents (#20 spec-match, #7 risk sweep)
  specMatchOpen: boolean;
  setSpecMatchOpen: (v: boolean) => void;
  riskSweepOpen: boolean;
  setRiskSweepOpen: (v: boolean) => void;

  // Detail modal
  detailModalProduct: CatalogProduct | null;
  setDetailModalProduct: (p: CatalogProduct | null) => void;

  // BOM import modal
  bomModalOpen: boolean;
  setBomModalOpen: (v: boolean) => void;
  bulkModalOpen: boolean;
  setBulkModalOpen: (v: boolean) => void;
  bulkCrossOpen: boolean;
  setBulkCrossOpen: (v: boolean) => void;
  assistantOpen: boolean;
  setAssistantOpen: (v: boolean) => void;
  /** Active white-label brand profile id (lib/brand). Persisted in localStorage. */
  brandId: string;
  setBrandId: (id: string) => void;
  submittalOpen: boolean;
  setSubmittalOpen: (v: boolean) => void;

  // Cart (basket)
  cart: Record<string, { product: CatalogProduct; qty: number }>;
  addToCart: (product: CatalogProduct, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateCartQty: (id: string, qty: number) => void;
  clearCart: () => void;
  /** Per-line manual unit-price overrides (productId → price). In-memory, like the cart. */
  priceOverrides: Record<string, number>;
  /** Set (clamped to overrideBounds) or clear (null) a manual line price. */
  setPriceOverride: (id: string, price: number | null) => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  // Cart deep-linking: open the drawer at a section, optionally pre-filtered.
  cartSection: CartSection | null;
  cartQuoteStatusFilter: QuoteStatus | null;
  cartOrderMonthFilter: { year: number; month: number } | null;
  openCartAt: (
    section: CartSection,
    opts?: { quoteStatus?: QuoteStatus; orderMonth?: { year: number; month: number } },
  ) => void;
  clearCartFilters: () => void;
  helpOpen: boolean;
  setHelpOpen: (v: boolean) => void;

  // Saved baskets
  savedBaskets: SavedBasket[];
  saveCurrentBasket: (name: string, id?: string, now?: number) => void;
  loadBasket: (id: string) => void;
  deleteBasket: (id: string) => void;
  renameBasket: (id: string, name: string) => void;

  // Saved searches + alerts
  savedSearches: SavedSearch[];
  saveSearch: (name: string) => void;
  deleteSavedSearch: (id: string) => void;
  setSavedSearchAlerts: (id: string, on: boolean) => void;
  runSavedSearch: (id: string) => Promise<void>;

  // Order history
  orders: Order[];
  placeOrder: (now: number, id?: string) => void;
  reorder: (id: string) => void;
  deleteOrder: (id: string) => void;

  // Post-purchase: fulfillment method (tracking) + returns/RMA
  orderFulfillment: Record<string, FulfillmentMethod>;
  setOrderFulfillment: (orderId: string, method: FulfillmentMethod) => void;
  returns: ReturnRequest[];
  createReturnRequest: (input: { orderId: string; lines: ReturnLine[]; reason: ReturnReason; note?: string; now?: number }) => void;
  advanceReturnStatus: (id: string, now?: number) => void;
  returnModalOrderId: string | null;
  setReturnModalOrder: (orderId: string | null) => void;

  // Job templates (reusable BOM kits — applied by merging into the cart)
  jobTemplates: JobTemplate[];
  saveTemplate: (name: string, now?: number) => void;
  applyTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;

  // Saved quotes (with status workflow)
  quotes: SavedQuote[];
  saveQuote: (input: { number: string; customer: string; project: string; status?: QuoteStatus; now?: number; note?: string; termsIds?: string[] }) => void;
  setQuoteStatus: (id: string, status: QuoteStatus) => void;
  /** Capture a lost-reason for forensics (see product-finder-forensics). */
  setQuoteLostReason: (id: string, reason: string) => void;
  setQuoteApproval: (id: string, status: ApprovalStatus) => void;
  loadQuoteToCart: (id: string) => void;
  deleteQuote: (id: string) => void;
  convertQuoteToOrder: (id: string, now?: number) => void;
  /** Customer "Request changes" — attaches a counter-offer note (status stays in play). */
  counterQuote: (id: string, note: string, now?: number) => void;
  /** Audit-trail entry for a copied customer link. */
  logQuoteLink: (id: string, now?: number) => void;

  // Quote revisions
  /** Quote currently being revised in the basket (Save Quote creates v(n+1)). */
  revisingQuoteId: string | null;
  /** Load a quote's lines for revision; refused for converted/won/superseded quotes. */
  startReviseQuote: (id: string) => void;
  cancelRevise: () => void;

  // Job wizard (Ask Meridian)
  jobWizardOpen: boolean;
  setJobWizardOpen: (v: boolean) => void;

  // Guided engineering selectors (NEC calculators)
  guidedOpen: boolean;
  setGuidedOpen: (v: boolean) => void;

  // Inbound RFQ auto-quote
  rfqOpen: boolean;
  setRfqOpen: (v: boolean) => void;

  // BOM intelligence (health + landed-cost optimizer)
  bomIqOpen: boolean;
  setBomIqOpen: (v: boolean) => void;

  // Job (project) workspace — server-persisted job container
  jobsOpen: boolean;
  setJobsOpen: (v: boolean) => void;

  // Kit / assembly browser — curated product bundles added to cart in bulk
  kitsOpen: boolean;
  setKitsOpen: (v: boolean) => void;

  // VMI (vendor-managed inventory) — min/max + replenishment
  vmiOpen: boolean;
  setVmiOpen: (v: boolean) => void;

  // Quick-Order Pad — exact-SKU rapid entry + recall
  quickOrderOpen: boolean;
  setQuickOrderOpen: (v: boolean) => void;

  // Barcode scanner (#20 PWA — camera part lookup)
  barcodeOpen: boolean;
  setBarcodeOpen: (v: boolean) => void;

  cycleCountOpen: boolean;
  setCycleCountOpen: (v: boolean) => void;

  // Watches (notify-when-available)
  watches: WatchEntry[];
  toggleWatch: (id: string, info?: { name?: string; now?: number }) => void;

  // Notification read state (notification id → readAt)
  notifReads: Record<string, number>;
  markNotificationsRead: (ids: string[], now: number) => void;

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
  /** In-stock substitutes keyed by out-of-stock result id (from the search route). */
  substitutes: Record<string, CatalogProduct>;
  facets: SearchResponse["facets"];
  /** Brand/Subcategory enum facets for the refine-by-filter bar (v3-S2 #4). */
  refineFacets: NonNullable<SearchResponse["refineFacets"]>;
  loading: boolean;
  error: string | null;
  page: number;
  total: number;
  pageSize: number;
  runSearch: () => Promise<void>;
  loadMore: () => Promise<void>;
}

function defaultFilters(): FilterState {
  // Canonical defaults live in lib/product-finder-url so URL decode/encode
  // and the store always agree.
  return emptyFilterState();
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
    case "subcategory":
      if (on) next.subcategories.add(f.value as string);
      else next.subcategories.delete(f.value as string);
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
    // Best-effort: also establish the signed server session (active only when
    // SESSION_SECRET is set; a no-op otherwise). Carries the tenant for the API.
    establishServerSession(email, password, user.name);
    return true;
  },

  /** Establish a session from an SSO-mapped identity (no password). */
  loginWithSso(user) {
    set({ user, authError: null });
    if (typeof localStorage !== "undefined") localStorage.setItem("pf_user", JSON.stringify(user));
    establishServerSession(user.email, DEMO_PASSWORD, user.name);
  },

  logout() {
    // Also clear the active customer — otherwise on a shared workstation the next
    // rep inherits the previous rep's "Quoting for" selection (wrong pricing tier /
    // contract attribution on their quotes and orders).
    set({ user: null, activeCustomerId: null });
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("pf_user");
      localStorage.removeItem("pf_active_customer");
    }
    // Clear the signed server session cookie too (no-op when sessions are off).
    if (typeof fetch !== "undefined") void fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  },

  // ── Search ─────────────────────────────────────────────────
  query: "",
  setQuery(q) {
    set({ query: q });
  },

  appliedNlFilters: [],

  async runNlSearch(raw, opts) {
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

    // ── "Did you mean…?" flow — only after the search resolves ──────────────
    if (opts?.noCorrect || !raw.trim()) {
      set({ correction: null });
      return;
    }
    if (get().total >= NEAR_ZERO_RESULTS) {
      set({ correction: null });
      return;
    }
    const sugg = suggestCorrection(raw);
    if (!sugg || sugg.corrected.toLowerCase() === raw.toLowerCase()) {
      set({ correction: null });
      return;
    }
    if (get().total === 0 && sugg.confident) {
      // Zero results + a confident fix → auto-apply, then surface the banner.
      await get().runNlSearch(sugg.corrected, { noCorrect: true });
      set({ correction: { original: raw, corrected: sugg.corrected, autoApplied: true } });
    } else {
      set({ correction: { original: raw, corrected: sugg.corrected, autoApplied: false } });
    }
  },

  // ── "Did you mean…?" correction ───────────────────────────
  correction: null,
  dismissCorrection() {
    set({ correction: null });
  },

  // ── Guided tour ───────────────────────────────────────────
  tourOpen: false,
  tourStep: 0,
  startTour() {
    set({ tourOpen: true, tourStep: 0 });
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("pf_tour_seen", "1");
    }
  },
  setTourStep(step) {
    set({ tourStep: step });
  },
  closeTour() {
    set({ tourOpen: false });
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("pf_tour_seen", "1");
    }
  },

  // ── Command palette ───────────────────────────────────────
  paletteOpen: false,
  setPaletteOpen(v) {
    set({ paletteOpen: v });
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

  setOnlyActive(v) {
    set((s) => ({ filters: { ...s.filters, onlyActive: v } }));
    get().runSearch();
  },

  setOnlyWithCrosses(v) {
    set((s) => ({ filters: { ...s.filters, onlyWithCrosses: v } }));
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

  setAllFilters(filters) {
    // Replace state only — callers (e.g. URL hydration) decide when to search.
    // Never flips `loading` and never fires a request.
    set({ filters, query: filters.query, appliedNlFilters: [] });
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
  bulkModalOpen: false,
  setBulkModalOpen(v) { set({ bulkModalOpen: v }); },
  bulkCrossOpen: false,
  setBulkCrossOpen(v) { set({ bulkCrossOpen: v }); },
  assistantOpen: false,
  setAssistantOpen(v) { set({ assistantOpen: v }); },
  brandId: DEFAULT_BRAND_ID,
  setBrandId(id) {
    const next = isBrandId(id) ? id : DEFAULT_BRAND_ID;
    if (typeof localStorage !== "undefined") localStorage.setItem("pf_brand", next);
    set({ brandId: next });
  },
  submittalOpen: false,
  setSubmittalOpen(v) { set({ submittalOpen: v }); },

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

  // ── Keyboard power layer ──────────────────────────────────
  activeResultIndex: -1,
  setActiveResultIndex(n) { set({ activeResultIndex: n }); },
  keyboardHelpOpen: false,
  setKeyboardHelpOpen(v) { set({ keyboardHelpOpen: v }); },

  // ── Sprint-4 agents ───────────────────────────────────────
  specMatchOpen: false,
  setSpecMatchOpen(v) { set({ specMatchOpen: v }); },
  riskSweepOpen: false,
  setRiskSweepOpen(v) { set({ riskSweepOpen: v }); },

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
      const { [id]: _o, ...restOverrides } = s.priceOverrides;
      return { cart: rest, priceOverrides: restOverrides };
    });
  },

  updateCartQty(id, qty) {
    if (qty <= 0) { get().removeFromCart(id); return; }
    set((s) => ({
      cart: { ...s.cart, [id]: { ...s.cart[id], qty } },
    }));
  },

  clearCart() { set({ cart: {}, priceOverrides: {}, revisingQuoteId: null }); },

  // ── Per-line price overrides (margin-guarded) ─────────────
  priceOverrides: {},

  setPriceOverride(id, price) {
    set((s) => {
      const line = s.cart[id];
      if (!line) return s;
      if (price === null) {
        const { [id]: _, ...rest } = s.priceOverrides;
        return { priceOverrides: rest };
      }
      return { priceOverrides: { ...s.priceOverrides, [id]: clampOverride(line.product, price) } };
    });
  },
  setCartOpen(v) {
    // Plain open/close always starts from a clean drawer — no stale deep-link
    // section or filters.
    set({ cartOpen: v, cartSection: null, cartQuoteStatusFilter: null, cartOrderMonthFilter: null });
  },

  // ── Cart deep-linking ─────────────────────────────────────
  cartSection: null,
  cartQuoteStatusFilter: null,
  cartOrderMonthFilter: null,

  openCartAt(section, opts) {
    set({
      cartOpen: true,
      cartSection: section,
      // Exactly the provided filter is set; the other is always nulled.
      cartQuoteStatusFilter: opts?.quoteStatus ?? null,
      cartOrderMonthFilter: opts?.orderMonth ?? null,
    });
  },

  clearCartFilters() {
    // Keep the drawer open and the section selected — only drop the filters.
    set({ cartQuoteStatusFilter: null, cartOrderMonthFilter: null });
  },

  helpOpen: false,
  setHelpOpen(v) { set({ helpOpen: v }); },

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
    set({ cart: newCart, priceOverrides: {}, revisingQuoteId: null });
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

  // ── Saved searches + alerts ───────────────────────────────
  savedSearches: [],

  saveSearch(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const filters = get().filters;
    const query = filtersToQuery(filters, 0, get().pageSize);
    const summary = summarizeFilters(filters);
    const ts = Date.now();
    set((s) => {
      const lower = trimmed.toLowerCase();
      const idx = s.savedSearches.findIndex((x) => x.name.toLowerCase() === lower);
      const entry: SavedSearch = {
        id: idx !== -1 ? s.savedSearches[idx].id : `search-${ts}-${trimmed.replace(/\s+/g, "-").toLowerCase()}`,
        name: trimmed,
        query,
        summary,
        createdAt: ts,
        alertsOn: true,
        newMatches: 0,
      };
      const next = idx !== -1 ? s.savedSearches.map((x, i) => (i === idx ? entry : x)) : [entry, ...s.savedSearches];
      if (typeof localStorage !== "undefined") localStorage.setItem("pf_saved_searches", JSON.stringify(next));
      return { savedSearches: next };
    });
  },

  deleteSavedSearch(id) {
    set((s) => {
      const next = s.savedSearches.filter((x) => x.id !== id);
      if (typeof localStorage !== "undefined") localStorage.setItem("pf_saved_searches", JSON.stringify(next));
      return { savedSearches: next };
    });
  },

  setSavedSearchAlerts(id, on) {
    set((s) => {
      const next = s.savedSearches.map((x) => (x.id === id ? { ...x, alertsOn: on } : x));
      if (typeof localStorage !== "undefined") localStorage.setItem("pf_saved_searches", JSON.stringify(next));
      return { savedSearches: next };
    });
  },

  async runSavedSearch(id) {
    const entry = get().savedSearches.find((x) => x.id === id);
    if (!entry) return;
    set((s) => {
      // Viewing clears the new-match signal.
      const next = s.savedSearches.map((x) => (x.id === id ? { ...x, newMatches: 0 } : x));
      if (typeof localStorage !== "undefined") localStorage.setItem("pf_saved_searches", JSON.stringify(next));
      return { savedSearches: next, filters: decodeFiltersFromQuery(entry.query), appliedNlFilters: [] };
    });
    await get().runSearch();
  },

  // ── Order history ─────────────────────────────────────────
  orders: [],
  orderFulfillment: {},
  returns: [],
  returnModalOrderId: null,
  setReturnModalOrder(orderId) { set({ returnModalOrderId: orderId }); },

  placeOrder(now, id) {
    const cart = get().cart;
    const cartValues = Object.values(cart);
    if (cartValues.length === 0) return;

    const state = get();
    const activeCustomer = selectActiveCustomer(state);

    const lines = cartValues.map((entry) => ({
      product: entry.product,
      qty: entry.qty,
    }));
    // Use the SAME pricing the cart shows (effectiveUnitPrice, incl. manual
    // overrides) so order totals always match the cart subtotal.
    const total = lines.reduce(
      (sum, l) => sum + lineUnitPrice(state, l.product, l.qty) * l.qty,
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
      return { orders, cart: {}, priceOverrides: {}, revisingQuoteId: null };
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
    set({ cart: newCart, priceOverrides: {}, revisingQuoteId: null });
  },

  setOrderFulfillment(orderId, method) {
    set((s) => {
      const orderFulfillment = { ...s.orderFulfillment, [orderId]: method };
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_order_fulfillment", JSON.stringify(orderFulfillment));
      }
      return { orderFulfillment };
    });
  },

  createReturnRequest({ orderId, lines, reason, note, now }) {
    const ts = now ?? Date.now();
    const order = get().orders.find((o) => o.id === orderId);
    const entry = createReturn({
      orderId,
      customerId: order?.customerId ?? null,
      lines,
      reason,
      now: ts,
      ...(note ? { note } : {}),
    });
    set((s) => {
      const returns = [entry, ...s.returns];
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_returns", JSON.stringify(returns));
      }
      return { returns };
    });
  },

  advanceReturnStatus(id) {
    set((s) => {
      const returns = s.returns.map((r) => {
        if (r.id !== id) return r;
        const next = nextReturnStatus(r.status);
        return next ? { ...r, status: next } : r;
      });
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_returns", JSON.stringify(returns));
      }
      return { returns };
    });
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

  // ── Job templates (reusable BOM kits) ─────────────────────
  jobTemplates: [],

  saveTemplate(name, now) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const cartValues = Object.values(get().cart);
    if (cartValues.length === 0) return;

    const lines = cartValues.map((entry) => ({ product: entry.product, qty: entry.qty }));
    const ts = now ?? Date.now();

    set((s) => {
      const lowerName = trimmed.toLowerCase();
      const existingIdx = s.jobTemplates.findIndex((t) => t.name.toLowerCase() === lowerName);
      let next: JobTemplate[];
      if (existingIdx !== -1) {
        next = s.jobTemplates.map((t, i) => (i === existingIdx ? { ...t, lines, savedAt: ts } : t));
      } else {
        next = [{ id: `tmpl-${ts}`, name: trimmed, lines, savedAt: ts }, ...s.jobTemplates];
      }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_job_templates", JSON.stringify(next));
      }
      return { jobTemplates: next };
    });
  },

  applyTemplate(id) {
    const template = get().jobTemplates.find((t) => t.id === id);
    if (!template) return;
    // MERGE into the cart (add quantities), so kits combine rather than replace.
    set((s) => {
      const cart = { ...s.cart };
      for (const line of template.lines) {
        const existing = cart[line.product.id];
        cart[line.product.id] = {
          product: line.product,
          qty: existing ? existing.qty + line.qty : line.qty,
        };
      }
      return { cart };
    });
  },

  deleteTemplate(id) {
    set((s) => {
      const next = s.jobTemplates.filter((t) => t.id !== id);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_job_templates", JSON.stringify(next));
      }
      return { jobTemplates: next };
    });
  },

  // ── Saved quotes (status workflow) ────────────────────────
  quotes: [],

  saveQuote({ number, customer, project, status, now, note, termsIds }) {
    const cartValues = Object.values(get().cart);
    if (cartValues.length === 0) return;

    const state = get();
    const activeCustomer = selectActiveCustomer(state);
    const actor = state.user?.name;
    const marginLines = cartValues.map((entry) => ({
      product: entry.product,
      qty: entry.qty,
      effectiveUnitPrice: lineUnitPrice(state, entry.product, entry.qty),
    }));
    // Capture the unit price each line was quoted at (incl. manual overrides)
    const lines = marginLines.map((l) => ({ product: l.product, qty: l.qty, unitPrice: l.effectiveUnitPrice }));
    const total = marginLines.reduce((sum, l) => sum + l.effectiveUnitPrice * l.qty, 0);
    const margin = basketMargin(marginLines);
    const ts = now ?? Date.now();

    // Revision link: Save Quote while revising creates v(n+1) and supersedes the original.
    const revising = state.revisingQuoteId
      ? state.quotes.find((q) => q.id === state.revisingQuoteId) ?? null
      : null;

    // Approval policy: margin floor + large-order + deep-discount rules.
    const discountDepthPct = marginLines.reduce((max, l) => {
      const list = l.product.unitPrice;
      const depth = list > 0 ? (list - l.effectiveUnitPrice) / list : 0;
      return depth > max ? depth : max;
    }, 0);
    const decision = evaluateApproval({
      marginPct: margin.marginPct,
      orderValue: total,
      discountDepthPct,
      categories: [...new Set(marginLines.map((l) => l.product.category))],
    });
    const pending = decision.required;
    let events = appendEvent(undefined, quoteEvent("created", `Quote ${number} saved`, ts, actor));
    if (pending) {
      events = appendEvent(events, quoteEvent("approval", `${decision.reason} — approval pending`, ts));
    }
    if (revising) {
      events = appendEvent(events, quoteEvent("revised", `Revision of ${revising.number}`, ts, actor));
    }

    const newQuote: SavedQuote = {
      id: `quote-${ts}`,
      number,
      customer: customer.trim(),
      project: project.trim(),
      lines,
      total,
      status: status ?? "draft",
      createdAt: ts,
      customerId: activeCustomer?.id ?? null,
      marginPct: margin.marginPct,
      events,
      ...(note?.trim() ? { note: note.trim() } : {}),
      ...(termsIds && termsIds.length > 0 ? { termsIds: [...termsIds] } : {}),
      // Below-margin quotes start pending manager sign-off.
      ...(pending ? { approvalStatus: "pending" as const } : {}),
      ...(revising
        ? { revision: (revising.revision ?? 1) + 1, revisionOf: revising.id }
        : {}),
    };

    set((s) => {
      const prior = revising
        ? s.quotes.map((q) =>
            q.id === revising.id
              ? {
                  ...q,
                  supersededBy: newQuote.id,
                  events: appendEvent(q.events, quoteEvent("revised", `Superseded by ${number} (v${newQuote.revision})`, ts, actor)),
                }
              : q,
          )
        : s.quotes;
      const quotes = [newQuote, ...prior];
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_quotes", JSON.stringify(quotes));
      }
      return { quotes, revisingQuoteId: null };
    });
  },

  setQuoteStatus(id, status) {
    set((s) => {
      const actor = s.user?.name;
      const quotes = s.quotes.map((q) => {
        if (q.id !== id || q.status === status) return q;
        return {
          ...q,
          status,
          events: appendEvent(
            q.events,
            quoteEvent("status", `${QUOTE_STATUS_LABEL[q.status]} → ${QUOTE_STATUS_LABEL[status]}`, Date.now(), actor),
          ),
        };
      });
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_quotes", JSON.stringify(quotes));
      }
      return { quotes };
    });
  },

  setQuoteLostReason(id, reason) {
    set((s) => {
      const quotes = s.quotes.map((q) => (q.id === id ? { ...q, lostReason: reason } : q));
      if (typeof localStorage !== "undefined") localStorage.setItem("pf_quotes", JSON.stringify(quotes));
      return { quotes };
    });
  },

  setQuoteApproval(id, status) {
    set((s) => {
      const actor = s.user?.name;
      const quotes = s.quotes.map((q) => {
        if (q.id !== id) return q;
        return {
          ...q,
          approvalStatus: status,
          events: appendEvent(q.events, quoteEvent("approval", APPROVAL_LABEL[status], Date.now(), actor)),
        };
      });
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_quotes", JSON.stringify(quotes));
      }
      return { quotes };
    });
  },

  loadQuoteToCart(id) {
    const quote = get().quotes.find((q) => q.id === id);
    if (!quote) return;
    const newCart: Record<string, { product: CatalogProduct; qty: number }> = {};
    for (const line of quote.lines) {
      newCart[line.product.id] = { product: line.product, qty: line.qty };
    }
    set({ cart: newCart, priceOverrides: {}, revisingQuoteId: null });
  },

  deleteQuote(id) {
    set((s) => {
      const quotes = s.quotes.filter((q) => q.id !== id);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_quotes", JSON.stringify(quotes));
      }
      return { quotes };
    });
  },

  convertQuoteToOrder(id, now) {
    const quote = get().quotes.find((q) => q.id === id);
    if (!quote || quote.convertedOrderId) return; // already converted / missing
    if (quote.approvalStatus === "pending") return; // blocked until a manager signs off

    const ts = now ?? Date.now();
    const orderId = `order-${ts}`;
    // Build the order from the QUOTE's lines (not the current cart) so the rep's
    // working basket is untouched.
    const newOrder: Order = {
      id: orderId,
      placedAt: ts,
      lines: quote.lines.map((l) => ({ product: l.product, qty: l.qty })),
      total: quote.total,
      customerId: quote.customerId,
      customerName: quote.customer || null,
    };

    set((s) => {
      const orders = [newOrder, ...s.orders];
      const quotes = s.quotes.map((q) =>
        q.id === id
          ? {
              ...q,
              status: "won" as QuoteStatus,
              convertedOrderId: orderId,
              convertedAt: ts,
              events: appendEvent(q.events, quoteEvent("converted", `Converted to order (${orderId})`, ts, s.user?.name)),
            }
          : q,
      );
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_orders", JSON.stringify(orders));
        localStorage.setItem("pf_quotes", JSON.stringify(quotes));
      }
      return { orders, quotes };
    });
  },

  counterQuote(id, note, now) {
    const trimmed = note.trim();
    if (!trimmed) return;
    const ts = now ?? Date.now();
    set((s) => {
      const quotes = s.quotes.map((q) =>
        q.id === id && !q.convertedOrderId && q.status !== "won" && q.status !== "lost"
          ? {
              ...q,
              counterOffer: { note: trimmed, at: ts },
              events: appendEvent(q.events, quoteEvent("counter", `“${trimmed.slice(0, 60)}${trimmed.length > 60 ? "…" : ""}”`, ts, "Customer")),
            }
          : q,
      );
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_quotes", JSON.stringify(quotes));
      }
      return { quotes };
    });
  },

  logQuoteLink(id, now) {
    const ts = now ?? Date.now();
    set((s) => {
      const quotes = s.quotes.map((q) =>
        q.id === id
          ? { ...q, events: appendEvent(q.events, quoteEvent("link-copied", "Customer link copied", ts, s.user?.name)) }
          : q,
      );
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_quotes", JSON.stringify(quotes));
      }
      return { quotes };
    });
  },

  // ── Quote revisions ───────────────────────────────────────
  revisingQuoteId: null,

  startReviseQuote(id) {
    const quote = get().quotes.find((q) => q.id === id);
    if (!quote || quote.convertedOrderId || quote.status === "won" || isSuperseded(quote)) return;
    const newCart: Record<string, { product: CatalogProduct; qty: number }> = {};
    for (const line of quote.lines) {
      newCart[line.product.id] = { product: line.product, qty: line.qty };
    }
    set({ cart: newCart, priceOverrides: {}, revisingQuoteId: id });
  },

  cancelRevise() {
    set({ revisingQuoteId: null });
  },

  // ── Job wizard (Ask Meridian) ─────────────────────────────
  jobWizardOpen: false,
  setJobWizardOpen(v) { set({ jobWizardOpen: v }); },

  // ── Guided engineering selectors (NEC calculators) ────────
  guidedOpen: false,
  setGuidedOpen(v) { set({ guidedOpen: v }); },

  // ── Inbound RFQ auto-quote ────────────────────────────────
  rfqOpen: false,
  setRfqOpen(v) { set({ rfqOpen: v }); },

  // ── BOM intelligence (health + landed-cost) ───────────────
  bomIqOpen: false,
  setBomIqOpen(v) { set({ bomIqOpen: v }); },

  // ── Job (project) workspace ───────────────────────────────
  jobsOpen: false,
  setJobsOpen(v) { set({ jobsOpen: v }); },

  // ── Kit / assembly browser ────────────────────────────────
  kitsOpen: false,
  setKitsOpen(v) { set({ kitsOpen: v }); },

  // ── VMI (vendor-managed inventory) ────────────────────────
  vmiOpen: false,
  setVmiOpen(v) { set({ vmiOpen: v }); },

  // ── Quick-Order Pad ───────────────────────────────────────
  quickOrderOpen: false,
  setQuickOrderOpen(v) { set({ quickOrderOpen: v }); },

  // ── Barcode scanner (#20) ─────────────────────────────────
  barcodeOpen: false,
  setBarcodeOpen(v) { set({ barcodeOpen: v }); },

  cycleCountOpen: false,
  setCycleCountOpen(v) { set({ cycleCountOpen: v }); },

  // ── Watches (notify-when-available) ──────────────────────
  watches: [],

  toggleWatch(id, info) {
    set((s) => {
      const has = s.watches.some((w) => w.id === id);
      const watches = has
        ? s.watches.filter((w) => w.id !== id)
        : [...s.watches, { id, name: info?.name ?? id, addedAt: info?.now ?? Date.now() }];
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_watches", JSON.stringify(watches));
      }
      return { watches };
    });
  },

  // ── Notification read state ───────────────────────────────
  notifReads: {},

  markNotificationsRead(ids, now) {
    if (ids.length === 0) return;
    set((s) => {
      const notifReads = { ...s.notifReads };
      for (const id of ids) notifReads[id] = now;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_notif_reads", JSON.stringify(notifReads));
      }
      return { notifReads };
    });
  },

  // ── Results / search engine ───────────────────────────────
  results: [],
  substitutes: {},
  facets: [],
  refineFacets: [],
  loading: false,
  error: null,
  page: 0,
  total: 0,
  pageSize: 24,

  async runSearch() {
    set({ loading: true, error: null, page: 0 });
    try {
      const res = await apiSearch(get().filters, 0, get().pageSize);
      set({ results: res.items, substitutes: res.substitutes ?? {}, total: res.total, page: 0, loading: false, facets: res.facets ?? [], refineFacets: res.refineFacets ?? [] });
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
      set((s) => ({
        results: [...s.results, ...res.items],
        substitutes: { ...s.substitutes, ...(res.substitutes ?? {}) },
        total: res.total,
        page: next,
        loading: false,
      }));
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

  // ── Numeric range filters ─────────────────────────────────
  async setSpecRange(name, range) {
    set((s) => {
      const newSpecRanges = { ...s.filters.specRanges };
      if (range.min === undefined && range.max === undefined) {
        // Clear this range key entirely
        delete newSpecRanges[name];
      } else {
        newSpecRanges[name] = range;
      }
      return { filters: { ...s.filters, specRanges: newSpecRanges } };
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
  const readTemplates = (): JobTemplate[] => {
    const raw = localStorage.getItem("pf_job_templates");
    if (!raw) return [];
    try { const v = JSON.parse(raw); return Array.isArray(v) ? (v as JobTemplate[]) : []; }
    catch { localStorage.removeItem("pf_job_templates"); return []; }
  };
  const readQuotes = (): SavedQuote[] => {
    const raw = localStorage.getItem("pf_quotes");
    // null means ABSENT (never been set) → seed demo quotes so the pipeline,
    // win/loss insights, and counter-offer demos light up on a fresh browser.
    if (raw === null) {
      const demoQuotes = buildDemoQuotes(Date.now());
      localStorage.setItem("pf_quotes", JSON.stringify(demoQuotes));
      return demoQuotes;
    }
    try { const v = JSON.parse(raw); return Array.isArray(v) ? (v as SavedQuote[]) : []; }
    catch { localStorage.removeItem("pf_quotes"); return []; }
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

  const favoriteSnapshots = readMap("pf_fav_snap");
  const recentSnapshots = readMap("pf_recent_snap");

  // Watches: migrate the legacy string[] shape (pre-notification-center) to
  // WatchEntry[] in place. Names fall back to a known snapshot, then the id.
  const readWatches = (): WatchEntry[] => {
    const raw = localStorage.getItem("pf_watches");
    if (!raw) return [];
    try {
      const v: unknown = JSON.parse(raw);
      if (!Array.isArray(v)) return [];
      const now = Date.now();
      const entries: WatchEntry[] = [];
      for (const e of v as unknown[]) {
        if (typeof e === "string") {
          const snap = recentSnapshots[e] ?? favoriteSnapshots[e];
          entries.push({ id: e, name: snap?.name ?? e, addedAt: now });
        } else if (e && typeof e === "object" && typeof (e as { id?: unknown }).id === "string") {
          const o = e as { id: string; name?: unknown; addedAt?: unknown };
          entries.push({
            id: o.id,
            name: typeof o.name === "string" ? o.name : o.id,
            addedAt: typeof o.addedAt === "number" ? o.addedAt : now,
          });
        }
      }
      return entries;
    } catch {
      localStorage.removeItem("pf_watches");
      return [];
    }
  };

  const readReads = (): Record<string, number> => {
    const raw = localStorage.getItem("pf_notif_reads");
    if (!raw) return {};
    try {
      const v = JSON.parse(raw);
      return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, number>) : {};
    } catch {
      localStorage.removeItem("pf_notif_reads");
      return {};
    }
  };

  const readSavedSearches = (): SavedSearch[] => {
    const raw = localStorage.getItem("pf_saved_searches");
    if (raw === null) {
      // First-ever load: seed demo saved searches (one carries a new-match alert).
      const seed = buildDemoSavedSearches(Date.now());
      localStorage.setItem("pf_saved_searches", JSON.stringify(seed));
      return seed;
    }
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? (v as SavedSearch[]) : [];
    } catch {
      localStorage.removeItem("pf_saved_searches");
      return [];
    }
  };

  const watches = readWatches();
  // Persist the migrated shape so legacy entries upgrade exactly once.
  localStorage.setItem("pf_watches", JSON.stringify(watches));

  useProductFinder.setState({
    favorites: readArr("pf_favorites"),
    recentlyViewed: readArr("pf_recent"),
    favoriteSnapshots,
    recentSnapshots,
    searchHistory: readArr("pf_search_history"),
    savedBaskets: readBaskets("pf_saved_baskets"),
    savedSearches: readSavedSearches(),
    brandId: (() => {
      const v = localStorage.getItem("pf_brand");
      return isBrandId(v) ? v : DEFAULT_BRAND_ID;
    })(),
    jobTemplates: readTemplates(),
    quotes: readQuotes(),
    watches,
    notifReads: readReads(),
    orders: readOrders(),
    orderFulfillment: readJson<Record<string, FulfillmentMethod>>("pf_order_fulfillment", {}, isPlainObject),
    returns: readJson<ReturnRequest[]>("pf_returns", [], Array.isArray),
    activeCustomerId: readActiveCustomer(),
  });
}

/**
 * Tolerant JSON read with a typed fallback. Drops values that fail to parse OR
 * fail the optional shape guard (legacy/foreign/tampered data of the wrong shape
 * would otherwise crash the consuming feature on first use).
 */
function readJson<T>(key: string, fallback: T, valid?: (v: unknown) => boolean): T {
  if (typeof localStorage === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (valid && !valid(parsed)) {
      localStorage.removeItem(key);
      return fallback;
    }
    return parsed as T;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

const isPlainObject = (v: unknown): boolean => v !== null && typeof v === "object" && !Array.isArray(v);

/**
 * Demo saved searches, seeded once when pf_saved_searches has never been written.
 * One carries newMatches > 0 so the notification bell demonstrates a saved-search
 * alert on first load. `now` is injected so the builder stays pure/testable.
 */
export function buildDemoSavedSearches(now: number): SavedSearch[] {
  const DAY = 86_400_000;
  const mk = (over: Partial<FilterState>) => {
    const f: FilterState = { ...defaultFilters(), ...over };
    return { query: filtersToQuery(f, 0, 24), summary: summarizeFilters(f) };
  };
  return [
    {
      id: "demo-search-breakers",
      name: "Square D 20A breakers in stock",
      ...mk({ query: "20A breaker", brands: new Set(["Square D"]), onlyBranchStock: true }),
      createdAt: now - 3 * DAY,
      alertsOn: true,
      newMatches: 4,
    },
    {
      id: "demo-search-cat6",
      name: "Cat6 plenum cable",
      ...mk({ query: "cat6 plenum" }),
      createdAt: now - 10 * DAY,
      alertsOn: true,
      newMatches: 0,
    },
  ];
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

// ─── Demo quote seed (first-ever load only) ───────────────────────────────────
/**
 * Build demo saved quotes with createdAt timestamps relative to `now` —
 * seeded once when pf_quotes has never been written (mirrors buildDemoOrders).
 *
 * The won/lost margin spread is deliberate so win/loss insights show a
 * credible gradient out of the box:
 *   15–20% band → 3 won / 1 lost (75%)
 *   20–25% band → 2 won / 1 lost (67%)
 *   25–30% band → 2 won / 1 lost (67%) — typical catalog band
 *   30%+  band → 1 won / 2 lost (33%)
 * Plus one stale sent quote (>14 days, triggers the follow-up alert), one
 * fresh sent quote, and one below-margin draft pending approval (badges the
 * manager bell immediately).
 *
 * `now` is injected so the function stays pure / unit-testable.
 */
export function buildDemoQuotes(now: number): SavedQuote[] {
  const DAY = 86_400_000;
  const p1 = CATALOG_PRODUCTS.find((p) => p.id === "CB-SQD-QO115");
  const p2 = CATALOG_PRODUCTS.find((p) => p.id === "CB-EAT-CH115");
  // A different-subcategory line (Wire & Cable vs Circuit Breakers) so some quotes
  // count as cross-sell in the rep scorecard (#18).
  const p3 = CATALOG_PRODUCTS.find((p) => p.id === "WC-SOA-12THHN-BLK");
  if (!p1 || !p2 || !p3) return [];

  type Seed = {
    daysAgo: number;
    status: QuoteStatus;
    marginPct: number;
    customerId: string | null;
    customer: string;
    qty: number;
    approvalStatus?: ApprovalStatus;
  };

  const seeds: Seed[] = [
    // 15–20% band: 3 won / 1 lost
    { daysAgo: 52, status: "won", marginPct: 0.17, customerId: "CUST-001", customer: "Gulf Coast Industrial", qty: 40 },
    { daysAgo: 45, status: "won", marginPct: 0.18, customerId: "CUST-002", customer: "Lone Star Data Systems", qty: 25 },
    { daysAgo: 33, status: "won", marginPct: 0.16, customerId: "CUST-001", customer: "Gulf Coast Industrial", qty: 60 },
    { daysAgo: 41, status: "lost", marginPct: 0.19, customerId: null, customer: "Bayou Contracting", qty: 30 },
    // 20–25% band: 2 won / 1 lost
    { daysAgo: 28, status: "won", marginPct: 0.22, customerId: "CUST-001", customer: "Gulf Coast Industrial", qty: 35 },
    { daysAgo: 24, status: "won", marginPct: 0.24, customerId: "CUST-002", customer: "Lone Star Data Systems", qty: 20 },
    { daysAgo: 26, status: "lost", marginPct: 0.23, customerId: null, customer: "Pinnacle Builders", qty: 45 },
    // 25–30% band: 2 won / 1 lost — the catalog's typical band, so the cart
    // guidance line has history for everyday baskets
    { daysAgo: 18, status: "won", marginPct: 0.27, customerId: "CUST-001", customer: "Gulf Coast Industrial", qty: 22 },
    { daysAgo: 15, status: "won", marginPct: 0.29, customerId: null, customer: "Pinnacle Builders", qty: 16 },
    { daysAgo: 12, status: "lost", marginPct: 0.26, customerId: "CUST-002", customer: "Lone Star Data Systems", qty: 40 },
    // 30%+ band: 1 won / 2 lost — over-margined quotes lose
    { daysAgo: 38, status: "won", marginPct: 0.31, customerId: "CUST-002", customer: "Lone Star Data Systems", qty: 12 },
    { daysAgo: 31, status: "lost", marginPct: 0.33, customerId: null, customer: "Bayou Contracting", qty: 50 },
    { daysAgo: 22, status: "lost", marginPct: 0.36, customerId: "CUST-001", customer: "Gulf Coast Industrial", qty: 28 },
    // Open pipeline: one stale sent (follow-up alert) + one fresh sent
    { daysAgo: 20, status: "sent", marginPct: 0.21, customerId: "CUST-001", customer: "Gulf Coast Industrial", qty: 32 },
    { daysAgo: 3, status: "sent", marginPct: 0.27, customerId: "CUST-002", customer: "Lone Star Data Systems", qty: 18 },
    // Below-margin draft awaiting manager sign-off (badges the bell)
    { daysAgo: 1, status: "draft", marginPct: 0.12, customerId: null, customer: "Bayou Contracting", qty: 80, approvalStatus: "pending" },
  ];

  // Distinct reps so the manager scorecard (#18) shows real per-rep differentiation
  // instead of a single "Unknown" row. Rep is carried on the quote's created event
  // (the scorecard reads the audit-trail author).
  const REPS = ["Sarah Chen", "Marcus Rivera", "Devin Park"];

  return seeds.map((s, i) => {
    const ts = now - s.daysAgo * DAY;
    const product = i % 2 === 0 ? p1 : p2;
    const unitPrice = product.unitPrice;
    const rep = REPS[i % REPS.length];
    // Attach a second (wire) line to a varied subset so cross-sell attach differs
    // per rep (Marcus ~100%, Sarah ~33%, Devin ~20%) rather than a flat 0%.
    const crossSell = i % 3 === 1 || i % 5 === 0;
    const lines = crossSell
      ? [{ product, qty: s.qty, unitPrice }, { product: p3, qty: 8, unitPrice: p3.unitPrice }]
      : [{ product, qty: s.qty, unitPrice }];
    const total = Math.round(lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0) * 100) / 100;
    const quote: SavedQuote = {
      id: `demo-quote-${String(i + 1).padStart(3, "0")}`,
      number: quoteNumber(new Date(ts), 9000 + i),
      customer: s.customer,
      project: "",
      lines,
      total,
      status: s.status,
      createdAt: ts,
      customerId: s.customerId,
      marginPct: s.marginPct,
      events: [quoteEvent("created", "Quote created", ts, rep)],
      // Won quotes record when they converted, so the scorecard's cycle-time metric
      // has data (varied 2–5 days; all seeds are ≥12 days old, so still in the past).
      ...(s.status === "won" ? { convertedAt: ts + (2 + (i % 4)) * DAY } : {}),
      ...(s.approvalStatus ? { approvalStatus: s.approvalStatus } : {}),
    };
    return quote;
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
    (sum, { product, qty }) => sum + lineUnitPrice(state, product, qty) * qty,
    0
  );
}

/**
 * The unit price a cart line is actually sold at: the rep's manual override
 * when present, otherwise the pricing provider's effective price.
 */
export function lineUnitPrice(
  state: Pick<ProductFinderState, "priceOverrides" | "customers" | "activeCustomerId">,
  product: CatalogProduct,
  qty: number
): number {
  const override = state.priceOverrides[product.id];
  if (override !== undefined) return override;
  const customer = state.activeCustomerId
    ? state.customers.find((c) => c.id === state.activeCustomerId) ?? null
    : null;
  return getPricingProvider().getPricing(product, { customer, qty }).effectiveUnitPrice;
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
