/**
 * Applied-filters overview bar (v3-S1 #2) — derive the full set of active
 * SIDEBAR facet selections as removable chips, so facet choices get the same
 * visible, one-tap-remove treatment the natural-language chips already have.
 *
 * The NL chips keep their own home (under the search box); to avoid showing a
 * facet twice, any facet value an NL filter already set is OMITTED here (the NL
 * chip owns it). Pure + deterministic so it's unit-tested in isolation.
 */

import type { FilterState, ParsedFilter } from "@/features/product-finder/types";

export type ChipRemove =
  | { type: "category"; value: string }
  | { type: "subcategory"; value: string }
  | { type: "brand"; value: string }
  | { type: "branchStock" }
  | { type: "dcStock" }
  | { type: "preferred" }
  | { type: "active" }
  | { type: "price" }
  | { type: "spec"; name: string; value: string }
  | { type: "specRange"; name: string };

export interface AppliedChip {
  /** Stable key for React + tests. */
  id: string;
  label: string;
  remove: ChipRemove;
}

/** Tokens for facet values that a natural-language chip already represents. */
function coveredByNl(nl: ParsedFilter[]): Set<string> {
  const covered = new Set<string>();
  for (const f of nl) {
    switch (f.kind) {
      case "category":
        covered.add(`category:${String(f.value)}`);
        break;
      case "subcategory":
        covered.add(`subcategory:${String(f.value)}`);
        break;
      case "brand":
        covered.add(`brand:${String(f.value)}`);
        break;
      case "branchStock":
        covered.add("branchStock");
        break;
      case "preferred":
        covered.add("preferred");
        break;
      case "priceMin":
      case "priceMax":
        covered.add("price");
        break;
    }
  }
  return covered;
}

function priceLabel(min: number | null, max: number | null): string | null {
  if (min != null && max != null) return `$${min}–$${max}`;
  if (max != null) return `≤ $${max}`;
  if (min != null) return `≥ $${min}`;
  return null;
}

/**
 * Active sidebar-facet chips, excluding anything an NL chip already shows.
 * Order: categories → subcategories → brands → toggles → price → specs → ranges.
 */
export function buildAppliedChips(filters: FilterState, nl: ParsedFilter[]): AppliedChip[] {
  const covered = coveredByNl(nl);
  const chips: AppliedChip[] = [];

  for (const cat of filters.categories) {
    if (covered.has(`category:${cat}`)) continue;
    chips.push({ id: `category:${cat}`, label: `Category: ${cat}`, remove: { type: "category", value: cat } });
  }
  for (const sub of filters.subcategories) {
    if (covered.has(`subcategory:${sub}`)) continue;
    chips.push({ id: `subcategory:${sub}`, label: sub, remove: { type: "subcategory", value: sub } });
  }
  for (const brand of filters.brands) {
    if (covered.has(`brand:${brand}`)) continue;
    chips.push({ id: `brand:${brand}`, label: brand, remove: { type: "brand", value: brand } });
  }
  if (filters.onlyBranchStock && !covered.has("branchStock")) {
    chips.push({ id: "branchStock", label: "In stock at branch", remove: { type: "branchStock" } });
  }
  if (filters.onlyDCStock) {
    chips.push({ id: "dcStock", label: "In stock at DC", remove: { type: "dcStock" } });
  }
  if (filters.onlyPreferred && !covered.has("preferred")) {
    chips.push({ id: "preferred", label: "Preferred only", remove: { type: "preferred" } });
  }
  if (filters.onlyActive) {
    chips.push({ id: "active", label: "Active only", remove: { type: "active" } });
  }
  if (!covered.has("price")) {
    const pl = priceLabel(filters.priceMin, filters.priceMax);
    if (pl) chips.push({ id: "price", label: pl, remove: { type: "price" } });
  }
  for (const [name, values] of Object.entries(filters.specFilters)) {
    for (const value of values) {
      chips.push({ id: `spec:${name}:${value}`, label: `${name}: ${value}`, remove: { type: "spec", name, value } });
    }
  }
  for (const [name, range] of Object.entries(filters.specRanges)) {
    // Use ≥ / ≤ for one-sided ranges so the chip never reads "Amperage 20–".
    const label =
      range.min != null && range.max != null
        ? `${name} ${range.min}–${range.max}`
        : range.max != null
          ? `${name} ≤ ${range.max}`
          : range.min != null
            ? `${name} ≥ ${range.min}`
            : name;
    chips.push({ id: `specRange:${name}`, label, remove: { type: "specRange", name } });
  }

  return chips;
}
