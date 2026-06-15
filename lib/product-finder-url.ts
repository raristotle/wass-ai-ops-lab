/**
 * lib/product-finder-url.ts — shareable-URL encode/decode for filter state.
 *
 * Grammar symmetry by construction:
 * - Encoding delegates to filtersToQuery (lib/product-finder-api) — the same
 *   serializer the search API uses.
 * - Decoding delegates to parseSearchQuery (lib/catalog/schemas) — the same
 *   parser the search route uses.
 *
 * decode(buildShareQuery(state, …)) round-trips exactly (see unit tests).
 * Pure and isomorphic — no window/Date references.
 */

import type { FilterState, ProductCategory } from "@/features/product-finder/types";
import { parseSearchQuery } from "@/lib/catalog/schemas";
import { filtersToQuery } from "@/lib/product-finder-api";
import { CATEGORIES } from "@/lib/catalog/taxonomy";

/** The canonical default FilterState — single source of truth for the store too. */
export function emptyFilterState(): FilterState {
  return {
    query: "",
    categories: new Set(),
    subcategories: new Set(),
    brands: new Set(),
    onlyBranchStock: false,
    onlyDCStock: false,
    onlyPreferred: false,
    onlyActive: false,
    priceMin: null,
    priceMax: null,
    sortKey: "relevance",
    viewMode: "list",
    specFilters: {},
    specRanges: {},
  };
}

function stripLeadingQuestionMark(search: string): string {
  return search.startsWith("?") ? search.slice(1) : search;
}

const VALID_CATEGORIES: ReadonlySet<ProductCategory> = new Set(CATEGORIES);

/**
 * Decode a query string ("?a=b" or "a=b") into a full FilterState.
 *
 * Junk-tolerant: unknown category values are dropped, a bad sort falls back to
 * the schema default, viewMode is always the default, page/pageSize ignored.
 */
export function decodeFiltersFromQuery(search: string): FilterState {
  const sp = new URLSearchParams(stripLeadingQuestionMark(search));
  const parsed = parseSearchQuery(sp);
  const base = emptyFilterState();

  const categories = new Set<ProductCategory>(
    (parsed.filters.categories ?? []).filter((c) => VALID_CATEGORIES.has(c)),
  );

  return {
    ...base,
    query: parsed.text,
    categories,
    subcategories: new Set(parsed.filters.subcategories ?? []),
    brands: new Set(parsed.filters.brands ?? []),
    onlyBranchStock: parsed.filters.onlyBranchStock,
    onlyDCStock: parsed.filters.onlyDCStock,
    onlyPreferred: parsed.filters.onlyPreferred,
    onlyActive: parsed.filters.onlyActive,
    priceMin: parsed.filters.priceMin,
    priceMax: parsed.filters.priceMax,
    sortKey: parsed.sort,
    specFilters: parsed.filters.specFilters ?? {},
    specRanges: parsed.filters.specRanges ?? {},
  };
}

/**
 * True iff the query string carries any FILTER parameter. cart/page/pageSize
 * on their own do not count.
 */
export function hasFilterParams(search: string): boolean {
  const sp = new URLSearchParams(stripLeadingQuestionMark(search));
  const FILTER_KEYS = new Set([
    "q", "category", "subcategory", "brand",
    "onlyBranchStock", "onlyDCStock", "onlyPreferred", "onlyActive",
    "priceMin", "priceMax", "sort",
  ]);
  for (const [key] of sp.entries()) {
    if (FILTER_KEYS.has(key)) return true;
    if (key.startsWith("spec.") || key.startsWith("specmin.") || key.startsWith("specmax.")) return true;
  }
  return false;
}

/**
 * Serialize a FilterState for sharing (page 0), preserving any cart=<v>
 * payload already present in the current location's query string.
 */
export function buildShareQuery(filters: FilterState, pageSize: number, currentSearch: string): string {
  const base = filtersToQuery(filters, 0, pageSize);
  const current = new URLSearchParams(stripLeadingQuestionMark(currentSearch));
  const cart = current.get("cart");
  if (cart === null) return base;
  const sp = new URLSearchParams(base);
  sp.set("cart", cart); // URLSearchParams encodes the value safely
  return sp.toString();
}

/** Share query for a single-category deep link (default page size). */
export function categoryShareQuery(category: ProductCategory): string {
  const filters = emptyFilterState();
  filters.categories.add(category);
  return filtersToQuery(filters, 0, 24);
}

/** Share query for a single-subcategory deep link (default page size). */
export function subcategoryShareQuery(subcategory: string): string {
  const filters = emptyFilterState();
  filters.subcategories.add(subcategory);
  return filtersToQuery(filters, 0, 24);
}
