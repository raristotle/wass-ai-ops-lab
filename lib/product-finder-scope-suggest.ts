/**
 * Scoped "search within this category" suggestion (v3-S2 #8) — when a typed query
 * strongly matches a category or subcategory name, the autocomplete can offer
 * "Search only in {X}", which scopes subsequent browsing to that branch.
 *
 * Conservative by design (NN/g: scope only on a strong, explicit match): the
 * default suggestions stay unscoped; this fires only on a clear name match.
 * Pure + unit-tested.
 */

import { ALL_SUBCATEGORIES, CATEGORIES, CATEGORY_META } from "@/lib/catalog/taxonomy";

export interface ScopeMatch {
  kind: "category" | "subcategory";
  /** Canonical value — a ProductCategory id, or a subcategory name. */
  value: string;
  /** Human label for the suggestion row + the scope chip. */
  label: string;
}

const MIN_LEN = 3;

/**
 * The best category/subcategory the query points at, or null. Subcategories win
 * over categories (more specific); among subcategories, exact > prefix > contains,
 * tie-broken toward the shortest (most specific) name.
 */
export function scopeSuggestion(query: string): ScopeMatch | null {
  const q = query.trim().toLowerCase();
  if (q.length < MIN_LEN) return null;

  let best: { name: string; score: number } | null = null;
  for (const name of ALL_SUBCATEGORIES) {
    const n = name.toLowerCase();
    let score = 0;
    if (n === q) score = 3;
    else if (n.startsWith(q)) score = 2;
    else if (n.includes(q)) score = 1;
    if (score > 0 && (!best || score > best.score || (score === best.score && name.length < best.name.length))) {
      best = { name, score };
    }
  }
  if (best) return { kind: "subcategory", value: best.name, label: best.name };

  for (const c of CATEGORIES) {
    const label = CATEGORY_META[c].label.toLowerCase();
    if (label === q || label.startsWith(q) || c === q) {
      return { kind: "category", value: c, label: CATEGORY_META[c].label };
    }
  }
  return null;
}
