import type { WescoProduct, ProductCategory, SortKey, SearchResponse } from "@/features/product-finder/types";
import { getCatalog } from "@/lib/catalog/index";

export interface SearchFilters {
  categories?: ProductCategory[];
  subcategories?: string[];
  brands?: string[];
  onlyBranchStock?: boolean;
  onlyDCStock?: boolean;
  onlyPreferred?: boolean;
  priceMin?: number | null;
  priceMax?: number | null;
}

export interface SearchParams {
  text?: string;
  filters?: SearchFilters;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
}

function totalBranch(p: WescoProduct): number {
  return p.branchStock.reduce((s, b) => s + b.quantity, 0);
}

function sortItems(items: WescoProduct[], sort: SortKey): WescoProduct[] {
  const arr = [...items];
  switch (sort) {
    case "preferred": return arr.sort((a, b) => (b.preferred ? 1 : 0) - (a.preferred ? 1 : 0));
    case "branchStock": return arr.sort((a, b) => totalBranch(b) - totalBranch(a));
    case "priceLow": return arr.sort((a, b) => a.unitPrice - b.unitPrice);
    case "priceHigh": return arr.sort((a, b) => b.unitPrice - a.unitPrice);
    case "brand": return arr.sort((a, b) => a.brand.localeCompare(b.brand));
    default: return arr.sort((a, b) => (b.preferred ? 1 : 0) - (a.preferred ? 1 : 0));
  }
}

export function searchCatalog(params: SearchParams = {}): SearchResponse {
  const { products, haystack } = getCatalog();
  const f = params.filters ?? {};
  const text = (params.text ?? "").trim().toLowerCase();
  const page = Math.max(0, params.page ?? 0);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));

  const catSet = f.categories && f.categories.length ? new Set(f.categories) : null;
  const subSet = f.subcategories && f.subcategories.length ? new Set(f.subcategories) : null;
  const brandSet = f.brands && f.brands.length ? new Set(f.brands) : null;

  const matched: WescoProduct[] = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (text && !haystack[i].includes(text)) continue;
    if (catSet && !catSet.has(p.category)) continue;
    if (subSet && !subSet.has(p.subcategory)) continue;
    if (brandSet && !brandSet.has(p.brand)) continue;
    if (f.onlyPreferred && !p.preferred) continue;
    if (f.onlyBranchStock && totalBranch(p) === 0) continue;
    if (f.onlyDCStock && p.dcStock.every((d) => d.quantity === 0)) continue;
    if (f.priceMin != null && p.unitPrice < f.priceMin) continue;
    if (f.priceMax != null && p.unitPrice > f.priceMax) continue;
    matched.push(p);
  }

  const sorted = sortItems(matched, params.sort ?? "relevance");
  const start = page * pageSize;
  return { items: sorted.slice(start, start + pageSize), total: matched.length, page, pageSize };
}
