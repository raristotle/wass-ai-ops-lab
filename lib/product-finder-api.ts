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

export async function apiGoesWith(id: string): Promise<import("@/features/product-finder/types").CatalogProduct[]> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}/goeswith`);
  if (!res.ok) return [];
  return (await res.json()).items as import("@/features/product-finder/types").CatalogProduct[];
}
