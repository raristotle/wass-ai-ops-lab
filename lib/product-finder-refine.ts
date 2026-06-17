/**
 * Post-query refine-by-filter (v3-S2 #4) — rank the highest-signal facet VALUES
 * to suggest as one-tap narrowings, computed from the result-set facet
 * distribution already returned by search. Suggests filters, not search terms.
 *
 * Diversity + signal: we round-robin across facets (so the row isn't all one
 * facet) and within each round rank by count, excluding anything already applied.
 * Pure + unit-tested.
 *
 * NOTE on counts: a chip's `count` is the facet value's count over the base
 * matched set (text + structural filters, before spec narrowing) — standard
 * faceted-search semantics. With spec filters active, the post-click result count
 * can be lower; the number reflects the facet dimension, not an exact preview.
 */

import type { Facet, EnumFacet } from "@/features/product-finder/types";

export interface RefineChip {
  kind: "brand" | "subcategory" | "spec";
  /** Facet name — "Brand"/"Subcategory" for the non-spec facets, else the spec name. */
  name: string;
  value: string;
  count: number;
}

export interface AppliedRefine {
  specFilters: Record<string, string[]>;
  brands: ReadonlySet<string> | string[];
  subcategories: ReadonlySet<string> | string[];
}

function has(set: ReadonlySet<string> | string[], v: string): boolean {
  return Array.isArray(set) ? set.includes(v) : set.has(v);
}

interface Group {
  kind: RefineChip["kind"];
  name: string;
  values: { value: string; count: number }[];
}

/**
 * @param specFacets   spec enum/range facets (from SearchResponse.facets)
 * @param refineFacets Brand/Subcategory enum facets (from SearchResponse.refineFacets)
 * @param applied      the currently-applied spec/brand/subcategory selections (excluded)
 * @param max          how many chips to surface
 */
export function buildRefineChips(
  specFacets: Facet[],
  refineFacets: EnumFacet[] | undefined,
  applied: AppliedRefine,
  max = 6,
): RefineChip[] {
  const groups: Group[] = [];

  for (const f of refineFacets ?? []) {
    const kind: RefineChip["kind"] = f.name === "Brand" ? "brand" : f.name === "Subcategory" ? "subcategory" : "spec";
    const appliedSet = kind === "brand" ? applied.brands : kind === "subcategory" ? applied.subcategories : [];
    const values = f.values.filter((v) => !has(appliedSet, v.value));
    if (values.length) groups.push({ kind, name: f.name, values });
  }
  for (const f of specFacets) {
    if (f.type !== "enum") continue;
    const appliedVals = applied.specFilters[f.name] ?? [];
    const values = f.values.filter((v) => !appliedVals.includes(v.value));
    if (values.length) groups.push({ kind: "spec", name: f.name, values });
  }

  // Round 0 takes the top value from every facet (diversity), ranked by count;
  // round 1 takes each facet's 2nd value; …until we reach `max`.
  const chips: RefineChip[] = [];
  for (let round = 0; chips.length < max; round += 1) {
    const thisRound: RefineChip[] = [];
    for (const g of groups) {
      if (round < g.values.length) {
        thisRound.push({ kind: g.kind, name: g.name, value: g.values[round].value, count: g.values[round].count });
      }
    }
    if (thisRound.length === 0) break;
    thisRound.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    for (const c of thisRound) {
      if (chips.length < max) chips.push(c);
    }
  }
  return chips;
}
