import type {
  SearchResponse,
  SuggestItem,
  ProductDetail,
  FilterState,
} from "@/features/product-finder/types";

function filtersToQuery(
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
