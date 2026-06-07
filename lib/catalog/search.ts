import type { CatalogProduct, ProductCategory, SortKey, SearchResponse } from "@/features/product-finder/types";
import { getCatalog } from "@/lib/catalog/index";
import { computeFacets } from "@/lib/catalog/facets";
import { parseAttribute } from "@/lib/catalog/attributes";

export interface SearchFilters {
  categories?: ProductCategory[];
  subcategories?: string[];
  brands?: string[];
  onlyBranchStock?: boolean;
  onlyDCStock?: boolean;
  onlyPreferred?: boolean;
  priceMin?: number | null;
  priceMax?: number | null;
  /** spec name → selected values (OR within a name, AND across names) */
  specFilters?: Record<string, string[]>;
  /** Numeric range filters: spec name → { min?, max? } — applied AFTER facets are computed */
  specRanges?: Record<string, { min?: number; max?: number }>;
}

export interface SearchParams {
  text?: string;
  filters?: SearchFilters;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
}

function totalBranch(p: CatalogProduct): number {
  return p.branchStock.reduce((s, b) => s + b.quantity, 0);
}

function sortItems(items: CatalogProduct[], sort: SortKey): CatalogProduct[] {
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

  // Normalize specFilters: only keep entries with at least one value
  const specEntries: [string, Set<string>][] = Object.entries(f.specFilters ?? {})
    .filter(([, vals]) => vals.length > 0)
    .map(([name, vals]) => [name, new Set(vals)]);

  // Normalize specRanges: only keep entries with at least one bound
  const rangeEntries: [string, { min?: number; max?: number }][] = Object.entries(f.specRanges ?? {})
    .filter(([, range]) => range.min !== undefined || range.max !== undefined);

  const terms = text.split(/\s+/).filter(Boolean);

  // Phase 1: match text + structural filters (category/subcat/brand/stock/price)
  // This set is used to compute facets BEFORE specFilters/specRanges are applied.
  const baseMatched: CatalogProduct[] = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (terms.length > 0 && !terms.every((t) => haystack[i].includes(t))) continue;
    if (catSet && !catSet.has(p.category)) continue;
    if (subSet && !subSet.has(p.subcategory)) continue;
    if (brandSet && !brandSet.has(p.brand)) continue;
    if (f.onlyPreferred && !p.preferred) continue;
    if (f.onlyBranchStock && totalBranch(p) === 0) continue;
    if (f.onlyDCStock && p.dcStock.every((d) => d.quantity === 0)) continue;
    if (f.priceMin != null && p.unitPrice < f.priceMin) continue;
    if (f.priceMax != null && p.unitPrice > f.priceMax) continue;
    baseMatched.push(p);
  }

  // Compute facets over the base matched set (before spec narrowing — standard faceted search)
  const facets = computeFacets(baseMatched);

  // Phase 2: apply specFilters (AND across names, OR within a name's values)
  const afterSpecFilters: CatalogProduct[] =
    specEntries.length === 0
      ? baseMatched
      : baseMatched.filter((p) =>
          specEntries.every(([name, valueSet]) =>
            p.specs.some((s) => s.name === name && valueSet.has(s.value))
          )
        );

  // Phase 3: apply specRanges (AND across names)
  // A product matches a range entry if parseAttribute(name, its spec value) is
  // non-null and within [min ?? -Inf, max ?? +Inf] (inclusive).
  const matched: CatalogProduct[] =
    rangeEntries.length === 0
      ? afterSpecFilters
      : afterSpecFilters.filter((p) =>
          rangeEntries.every(([name, range]) => {
            // Find the spec value for this name on this product
            const spec = p.specs.find((s) => s.name === name);
            if (!spec) return false;
            const parsed = parseAttribute(name, spec.value);
            if (parsed === null) return false;
            const { numeric } = parsed;
            const low = range.min ?? -Infinity;
            const high = range.max ?? Infinity;
            return numeric >= low && numeric <= high;
          })
        );

  const sorted = sortItems(matched, params.sort ?? "relevance");
  const start = page * pageSize;
  return { items: sorted.slice(start, start + pageSize), total: matched.length, page, pageSize, facets };
}
