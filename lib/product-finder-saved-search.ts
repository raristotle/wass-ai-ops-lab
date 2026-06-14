import type { FilterState } from "@/features/product-finder/types";

/**
 * Saved searches — a named, deep-linkable snapshot of the current query + filters
 * a rep can re-run with one click, plus an optional alert that surfaces "new
 * matches" through the notification bell. Pure helpers here; persistence and the
 * alert signal live in the store.
 */

export interface SavedSearch {
  id: string;
  name: string;
  /** Deep-link query string (no leading '?') that rebuilds the filters. */
  query: string;
  /** Human-readable summary of the filters, for the list UI. */
  summary: string;
  createdAt: number;
  /** When true, the bell flags `newMatches` for this search. */
  alertsOn: boolean;
  /** Alert signal: matches found since the rep last viewed it (0 = nothing new). */
  newMatches: number;
}

/** A short human description of an active filter set, e.g. `“breaker” · Electrical · ≤$50`. */
export function summarizeFilters(f: FilterState): string {
  const parts: string[] = [];
  if (f.query.trim()) parts.push(`“${f.query.trim()}”`);
  if (f.categories.size) parts.push([...f.categories].join(", "));
  if (f.subcategories.size) parts.push([...f.subcategories].join(", "));
  if (f.brands.size) parts.push([...f.brands].join(", "));
  if (f.onlyPreferred) parts.push("preferred");
  if (f.onlyBranchStock) parts.push("in stock");
  else if (f.onlyDCStock) parts.push("DC stock");
  if (f.priceMin != null && f.priceMax != null) parts.push(`$${f.priceMin}–$${f.priceMax}`);
  else if (f.priceMax != null) parts.push(`≤$${f.priceMax}`);
  else if (f.priceMin != null) parts.push(`≥$${f.priceMin}`);
  for (const [name, vals] of Object.entries(f.specFilters)) {
    if (vals && vals.length) parts.push(`${name}: ${vals.join("/")}`);
  }
  return parts.length ? parts.join(" · ") : "All products";
}

/** True when the filter set is worth saving (anything beyond the empty default). */
export function hasAnyFilter(f: FilterState): boolean {
  return (
    f.query.trim().length > 0 ||
    f.categories.size > 0 ||
    f.subcategories.size > 0 ||
    f.brands.size > 0 ||
    f.onlyPreferred ||
    f.onlyBranchStock ||
    f.onlyDCStock ||
    f.priceMin != null ||
    f.priceMax != null ||
    Object.values(f.specFilters).some((v) => v && v.length > 0) ||
    Object.keys(f.specRanges).length > 0
  );
}
