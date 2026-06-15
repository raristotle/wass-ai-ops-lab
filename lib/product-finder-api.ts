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
    return (await res.json()).suggestions;
  } catch {
    return queries.map(() => null);
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
}

export interface BomAnalysis {
  rows: BomAnalyzeRow[];
  compliance: import("@/lib/catalog/compliance").BomCompliance;
}

const EMPTY_COMPLIANCE = { lines: 0, ulListed: 0, notUlListed: 0, rohsIssues: 0, prop65: 0, tariffExposed: 0, flagged: 0 };

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
    if (!res.ok) return { rows: [], compliance: EMPTY_COMPLIANCE };
    const data = await res.json();
    return { rows: data.rows as BomAnalyzeRow[], compliance: data.compliance ?? EMPTY_COMPLIANCE };
  } catch {
    return { rows: [], compliance: EMPTY_COMPLIANCE };
  }
}

export async function apiGoesWith(id: string): Promise<import("@/features/product-finder/types").CatalogProduct[]> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}/goeswith`);
  if (!res.ok) return [];
  return (await res.json()).items as import("@/features/product-finder/types").CatalogProduct[];
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
