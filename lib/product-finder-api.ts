import type {
  SearchResponse,
  SuggestItem,
  ProductDetail,
  FilterState,
} from "@/features/product-finder/types";

export function filtersToQuery(
  filters: FilterState,
  page: number,
  pageSize: number
): string {
  const sp = new URLSearchParams();
  if (filters.query) sp.set("q", filters.query);
  if (filters.categories.size)
    sp.set("category", [...filters.categories].join(","));
  if (filters.subcategories.size)
    sp.set("subcategory", [...filters.subcategories].join(","));
  if (filters.brands.size) sp.set("brand", [...filters.brands].join(","));
  if (filters.onlyBranchStock) sp.set("onlyBranchStock", "true");
  if (filters.onlyDCStock) sp.set("onlyDCStock", "true");
  if (filters.onlyPreferred) sp.set("onlyPreferred", "true");
  if (filters.onlyActive) sp.set("onlyActive", "true");
  if (filters.onlyWithCrosses) sp.set("onlyWithCrosses", "true");
  if (filters.priceMin != null) sp.set("priceMin", String(filters.priceMin));
  if (filters.priceMax != null) sp.set("priceMax", String(filters.priceMax));
  sp.set("sort", filters.sortKey);
  sp.set("page", String(page));
  sp.set("pageSize", String(pageSize));

  // Serialize specFilters as spec.<Name>=v1,v2
  // Do NOT encodeURIComponent the name — URLSearchParams.set encodes the key once,
  // and parseSearchQuery's URLSearchParams parsing decodes it once, giving the real name.
  // Values are encodeURIComponent'd so a comma inside a value isn't confused with the separator.
  for (const [name, values] of Object.entries(filters.specFilters ?? {})) {
    if (values.length > 0) {
      sp.set(`spec.${name}`, values.map(encodeURIComponent).join(","));
    }
  }

  // Serialize specRanges as specmin.<Name>=<number> and specmax.<Name>=<number>.
  // Same key-encoding rule: pass the raw name to URLSearchParams.set — it encodes once,
  // and parseSearchQuery's URLSearchParams decodes once, giving the real name.
  for (const [name, range] of Object.entries(filters.specRanges ?? {})) {
    if (range.min !== undefined) {
      sp.set(`specmin.${name}`, String(range.min));
    }
    if (range.max !== undefined) {
      sp.set(`specmax.${name}`, String(range.max));
    }
  }

  return sp.toString();
}

export async function apiSearch(
  filters: FilterState,
  page: number,
  pageSize = 24
): Promise<SearchResponse> {
  const res = await fetch(
    `/api/products/search?${filtersToQuery(filters, page, pageSize)}`
  );
  if (!res.ok) throw new Error(`search failed: ${res.status}`);
  return res.json();
}

export async function apiSuggest(q: string): Promise<SuggestItem[]> {
  const res = await fetch(`/api/products/suggest?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return (await res.json()).items as SuggestItem[];
}

export async function apiGetProduct(
  id: string,
  branchId?: string
): Promise<ProductDetail> {
  const res = await fetch(
    `/api/products/${encodeURIComponent(id)}${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`
  );
  if (!res.ok) throw new Error(`detail failed: ${res.status}`);
  return res.json();
}

/** Ask Meridian (conversational): send the chat history, get a grounded reply. */
export async function apiAssistant(
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<{ enabled: boolean; reply: string; toolsUsed: string[] }> {
  try {
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) return { enabled: true, reply: "Sorry — Ask Meridian is unavailable right now.", toolsUsed: [] };
    return await res.json();
  } catch {
    return { enabled: true, reply: "Sorry — Ask Meridian is unavailable right now.", toolsUsed: [] };
  }
}

/** Substitute-&-save: stocked production cross candidates per cart SKU. */
export async function apiCrossSavings(
  skus: string[]
): Promise<Record<string, import("@/lib/catalog/cross-savings").CrossCandidate[]>> {
  try {
    const res = await fetch("/api/crosses/savings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skus }),
    });
    if (!res.ok) return {};
    return (await res.json()).candidates ?? {};
  } catch {
    return {};
  }
}

/** Competitor-BOM cross matching: one suggestion (or null) per query, in order. */
export async function apiCrossMatch(
  queries: string[]
): Promise<(import("@/lib/catalog/bom-cross").BomCrossSuggestion | null)[]> {
  try {
    const res = await fetch("/api/crosses/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries }),
    });
    if (!res.ok) return queries.map(() => null);
    // Fail closed to the documented per-query null shape if a 200 omits `suggestions`.
    return (await res.json()).suggestions ?? queries.map(() => null);
  } catch {
    return queries.map(() => null);
  }
}

/**
 * Single-part cross lookup: the stocked suggestion (verified engine) PLUS the documented bulk
 * cross-references (ingested manufacturer xref files) — so a rep always sees what a competitor
 * part crosses to, even when we don't stock the target.
 */
export async function apiCrossLookup(query: string): Promise<{
  suggestion: import("@/lib/catalog/bom-cross").BomCrossSuggestion | null;
  xref: import("@/lib/catalog/xref-index").XrefHit[];
}> {
  try {
    const res = await fetch("/api/crosses/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries: [query] }),
    });
    if (!res.ok) return { suggestion: null, xref: [] };
    const data = await res.json();
    return { suggestion: data.suggestions?.[0] ?? null, xref: data.xref?.[0] ?? [] };
  } catch {
    return { suggestion: null, xref: [] };
  }
}

export interface BomAnalyzeRow {
  sku: string;
  qty: number;
  product: { id: string; sku: string; name: string; brand: string; unitPrice: number; lifecycleStatus?: string } | null;
  sourcingScore?: number;
  health: import("@/lib/catalog/bom-health").LineHealth | null;
  award: {
    switch: boolean;
    lineSavings: number;
    rationale: string;
    best: { id: string; label: string; kind: string; landedUnit: number };
    currentLandedUnit: number;
  } | null;
  compliance: { flags: string[]; countryOfOrigin: string; section301: boolean; ulListed: boolean } | null;
  tariff: {
    ratePct: number;
    /** Layer label, e.g. "MFN 2.7% + Section 301 25%" or "none" (DI-7). */
    program: string;
    dutyPerUnit: number;
    dutyLine: number;
    tariffedLandedUnit: number;
    // Real per-subcategory HTS detail (DI-7) — present when the subcategory is mapped.
    htsCode?: string;
    mfnDutyPct?: number;
    section301Pct?: number;
    section232Pct?: number;
  } | null;
}

export interface BomAnalysis {
  rows: BomAnalyzeRow[];
  compliance: import("@/lib/catalog/compliance").BomCompliance;
  /** Section-301 duty exposure rollup (v3-S3 #14). */
  tariff: { exposedLines: number; totalDuty: number };
}

const EMPTY_COMPLIANCE = { lines: 0, ulListed: 0, notUlListed: 0, rohsIssues: 0, prop65: 0, tariffExposed: 0, flagged: 0 };
const EMPTY_TARIFF = { exposedLines: 0, totalDuty: 0 };

export async function apiBomAnalyze(
  items: { sku: string; qty: number }[],
  branchId?: string,
): Promise<BomAnalysis> {
  try {
    const res = await fetch("/api/bom/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, branchId }),
    });
    if (!res.ok) return { rows: [], compliance: EMPTY_COMPLIANCE, tariff: EMPTY_TARIFF };
    const data = await res.json();
    return {
      // Fail closed to [] (consistent with the error paths + the non-optional type)
      // if a malformed 200 omits `rows`.
      rows: (data.rows ?? []) as BomAnalyzeRow[],
      compliance: data.compliance ?? EMPTY_COMPLIANCE,
      tariff: data.tariff ?? EMPTY_TARIFF,
    };
  } catch {
    return { rows: [], compliance: EMPTY_COMPLIANCE, tariff: EMPTY_TARIFF };
  }
}

export async function apiGoesWith(id: string): Promise<import("@/features/product-finder/types").CatalogProduct[]> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}/goeswith`);
  if (!res.ok) return [];
  // Fail closed to [] if a malformed 200 omits `items` (a consumer .map() would
  // otherwise crash the product-detail modal).
  return ((await res.json()).items ?? []) as import("@/features/product-finder/types").CatalogProduct[];
}

// ─── Cross-sell companions (v5-S1) ──────────────────────────────────────────
// The richer companion rail: each item carries a relation (required/recommended),
// an attach score, and the reasons behind it. Fails closed to [] so the modal
// never crashes on a malformed response.
export interface CompanionItem {
  relation: "required" | "recommended";
  attachScore: number;
  reasons: string[];
  sources: ("spec-rule" | "market-basket" | "affinity")[];
  product: import("@/features/product-finder/types").CatalogProduct;
}

export interface CompanionsResult {
  items: CompanionItem[];
  /** B10: the market-basket lift shown came from labeled DEMO baskets, not real order history. */
  demo: boolean;
  /** True when mined co-purchase lift actually influenced this rail (vs. deterministic backbone only). */
  behavioral: boolean;
}

/** Companions for a product WITH provenance meta (demo/behavioral) — used by the rail so it can
 *  clearly label a demo cross-sell signal (B10). */
export async function apiCompanionsWithMeta(
  id: string,
  opts: { branchId?: string; k?: number } = {},
): Promise<CompanionsResult> {
  const params = new URLSearchParams();
  if (opts.branchId) params.set("branchId", opts.branchId);
  if (opts.k) params.set("k", String(opts.k));
  const qs = params.toString();
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(id)}/companions${qs ? `?${qs}` : ""}`);
    if (!res.ok) return { items: [], demo: false, behavioral: false };
    const j = await res.json();
    return { items: (j.companions ?? []) as CompanionItem[], demo: !!j.demo, behavioral: !!j.behavioral };
  } catch {
    return { items: [], demo: false, behavioral: false };
  }
}

export async function apiCompanions(
  id: string,
  opts: { branchId?: string; k?: number } = {},
): Promise<CompanionItem[]> {
  return (await apiCompanionsWithMeta(id, opts)).items;
}

// ─── Cart upsell bundle (v5-S2: preferred swaps + segment coverage) ──────────
type Cat = import("@/features/product-finder/types").CatalogProduct;
export interface CartUpsell {
  resolved?: number;
  swaps: {
    from: Cat; to: Cat; qty: number;
    unitPriceDelta: number; marginDeltaPct: number; lineMarginGain: number;
  }[];
  penetration: {
    before: { linePenetrationPct: number; valuePenetrationPct: number };
    after: { linePenetrationPct: number; valuePenetrationPct: number };
  } | null;
  solution: {
    segment: { code: string; name: string };
    template: { id: string; name: string; description: string };
    coveragePct: number; coveredCount: number; totalCount: number;
    gaps: { subcategory: string; product: Cat }[];
  } | null;
}

export async function apiCartUpsell(
  skus: string[],
  qtys: number[],
  opts: { branchId?: string; seedSku?: string } = {},
): Promise<CartUpsell> {
  const empty: CartUpsell = { swaps: [], penetration: null, solution: null };
  if (skus.length === 0) return empty;
  try {
    const res = await fetch("/api/cart/upsell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skus, qtys, branchId: opts.branchId, seedSku: opts.seedSku }),
    });
    if (!res.ok) return empty;
    return (await res.json()) as CartUpsell;
  } catch {
    return empty;
  }
}

/** Slim companion (from POST /api/companions). For nudge rails where a full product
 *  isn't needed until the customer adds it. */
export interface SlimCompanion {
  relation: "required" | "recommended";
  attachScore: number;
  reasons: string[];
  product: { id: string; sku: string; name: string; brand: string; subcategory: string; unitPrice: number; uom: string; imageIcon: string; preferred: boolean; inStock: boolean };
}

/** Basket-level attach rail for a set of SKUs (POST /api/companions, mode "attach"). */
export async function apiCompanionsAttach(skus: string[], branchId?: string): Promise<SlimCompanion[]> {
  if (skus.length === 0) return [];
  try {
    const res = await fetch("/api/companions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skus, mode: "attach", branchId }),
    });
    if (!res.ok) return [];
    return ((await res.json()).attach ?? []) as SlimCompanion[];
  } catch {
    return [];
  }
}

// ─── Order-history import (pilot data onboarding) ───────────────────────────
export interface OrderHistoryManifest {
  version: number;
  customer: string | null;
  orders: number;
  lines: number;
  resolved: number;
  unresolved: number;
  distinctSkus: number;
  distinctSubcategories: number;
  rulesMined: number;
  topPairs: { a: string; b: string; lift: number; count: number }[];
  importedAtIso: string;
}
export interface OrderHistoryStatus {
  durable: boolean;
  manifest: OrderHistoryManifest | null;
}
export interface OrderHistoryImportResult {
  ok?: boolean;
  persisted?: "postgres" | "memory";
  manifest?: OrderHistoryManifest;
  headline?: string;
  error?: string;
  /** B7: server hint that a real catalog-number crosswalk should be loaded first
   *  (set on a zero/low-resolution import when only the demo crosswalk is active). */
  needsCrosswalk?: boolean;
}

export async function apiOrderHistoryStatus(): Promise<OrderHistoryStatus> {
  try {
    const res = await fetch("/api/order-history");
    if (!res.ok) return { durable: false, manifest: null };
    return (await res.json()) as OrderHistoryStatus;
  } catch {
    return { durable: false, manifest: null };
  }
}

export async function apiImportOrderHistory(csv: string, customer?: string): Promise<OrderHistoryImportResult> {
  try {
    const res = await fetch("/api/order-history/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, customer }),
    });
    return (await res.json()) as OrderHistoryImportResult;
  } catch {
    return { error: "Import request failed" };
  }
}

export async function apiClearOrderHistory(): Promise<boolean> {
  try {
    const res = await fetch("/api/order-history", { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Customer catalog-number crosswalk (pilot data onboarding) ───────────────
export interface CrosswalkManifest {
  version: number;
  customer: string | null;
  entries: number;
  resolved: number;
  unresolved: number;
  importedAtIso: string;
}
export interface CrosswalkStatus {
  durable: boolean;
  manifest: CrosswalkManifest | null;
}
export interface CrosswalkImportResult {
  ok?: boolean;
  persisted?: "postgres" | "memory";
  manifest?: CrosswalkManifest;
  headline?: string;
  error?: string;
}

export async function apiCrosswalkStatus(): Promise<CrosswalkStatus> {
  try {
    const res = await fetch("/api/catalog/crosswalk");
    if (!res.ok) return { durable: false, manifest: null };
    return (await res.json()) as CrosswalkStatus;
  } catch {
    return { durable: false, manifest: null };
  }
}

export async function apiImportCrosswalk(csv: string, customer?: string): Promise<CrosswalkImportResult> {
  try {
    const res = await fetch("/api/catalog/crosswalk/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, customer }),
    });
    return (await res.json()) as CrosswalkImportResult;
  } catch {
    return { error: "Import request failed" };
  }
}

export async function apiClearCrosswalk(): Promise<boolean> {
  try {
    const res = await fetch("/api/catalog/crosswalk", { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

/** B17: capture a single Wesco stock #→sku mapping into the crosswalk (deduped, provenance "captured"). */
export interface CaptureWescoResult {
  ok?: boolean;
  entries?: number;
  added?: boolean;
  sku?: string;
  name?: string;
  error?: string;
}
export async function apiCaptureWescoSku(number: string, sku: string): Promise<CaptureWescoResult> {
  try {
    const res = await fetch("/api/catalog/crosswalk/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number, sku }),
    });
    return (await res.json()) as CaptureWescoResult;
  } catch {
    return { error: "Capture request failed" };
  }
}

// ─── Data ingestion (Sprint D1) — renewable source-adapter framework ─────────
export interface IngestRunReport {
  adapterId: string;
  label: string;
  runAtIso: string;
  fetched: number;
  parsed: number;
  kept: number;
  dropped: number;
  diff: { added: number; changed: number; removed: number };
  sampleAdded: string[];
  normalization?: { attributesSeen: number; attributesMapped: number; coverage: number };
  error?: string;
}
export interface IngestSource {
  id: string;
  label: string;
  segment: string;
  dataTypes: string[];
  license: string;
  records: number;
  lastFetchedIso: string | null;
}
export interface IngestStatus {
  ok?: boolean;
  persisted?: "postgres" | "memory";
  liveSourcesConfigured?: boolean;
  sources: IngestSource[];
  recentRuns: IngestRunReport[];
  attributeTaxonomy?: { key: string; label: string; unit: string | null }[];
}
export interface IngestRunResult {
  ok?: boolean;
  persisted?: "postgres" | "memory";
  headline?: string;
  reports?: IngestRunReport[];
  error?: string;
}

export async function apiIngestStatus(): Promise<IngestStatus> {
  try {
    const res = await fetch("/api/ingest/status");
    if (!res.ok) return { sources: [], recentRuns: [] };
    return (await res.json()) as IngestStatus;
  } catch {
    return { sources: [], recentRuns: [] };
  }
}

export async function apiIngestRun(adapterIds?: string[]): Promise<IngestRunResult> {
  try {
    const res = await fetch("/api/ingest/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adapterIds && adapterIds.length ? { adapterIds } : {}),
    });
    return (await res.json()) as IngestRunResult;
  } catch {
    return { error: "Ingestion run request failed" };
  }
}

export async function apiAdjacency(): Promise<Record<string, { to: string; required: boolean }[]>> {
  try {
    const res = await fetch("/api/companions/adjacency");
    if (!res.ok) return {};
    return ((await res.json()).adjacency ?? {}) as Record<string, { to: string; required: boolean }[]>;
  } catch {
    return {};
  }
}

export async function apiResolve(
  q: string,
): Promise<import("@/lib/product-finder-bulk-quote").BulkResolution> {
  try {
    const res = await fetch(`/api/products/resolve?q=${encodeURIComponent(q)}`);
    if (!res.ok) return { product: null, matchedVia: null };
    return await res.json();
  } catch {
    return { product: null, matchedVia: null };
  }
}
