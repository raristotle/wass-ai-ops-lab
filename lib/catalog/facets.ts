import type { CatalogProduct } from "@/features/product-finder/types";

export interface FacetValue {
  value: string;
  count: number;
}

export interface Facet {
  name: string;
  values: FacetValue[];
}

/**
 * Compute dynamic spec facets from a product set.
 *
 * - Aggregates spec name→value→count across all products.
 * - Sorts facets by total coverage (how many products have that spec) desc;
 *   tiebreak alphabetical by name.
 * - Within each facet, values sorted by count desc; tiebreak alphabetical.
 * - Skips facets that have only one distinct value (no filtering benefit).
 * - Caps to maxFacets facets and maxValuesPerFacet values per facet.
 */
export function computeFacets(
  products: CatalogProduct[],
  maxFacets = 8,
  maxValuesPerFacet = 12,
): Facet[] {
  if (products.length === 0) return [];

  // Accumulate: name → { coverage (product count), values: Map<value, count> }
  const accum = new Map<string, { coverage: number; values: Map<string, number> }>();

  for (const product of products) {
    for (const spec of product.specs) {
      let entry = accum.get(spec.name);
      if (!entry) {
        entry = { coverage: 0, values: new Map() };
        accum.set(spec.name, entry);
      }
      entry.coverage += 1;
      entry.values.set(spec.value, (entry.values.get(spec.value) ?? 0) + 1);
    }
  }

  // Build and filter facets
  const facets: Facet[] = [];
  for (const [name, { coverage, values }] of accum) {
    // Skip facets with only one distinct value — no filtering benefit
    if (values.size <= 1) continue;

    // Sort values by count desc, tiebreak alphabetical by value
    const sortedValues: FacetValue[] = [...values.entries()]
      .sort(([aVal, aCnt], [bVal, bCnt]) => {
        if (bCnt !== aCnt) return bCnt - aCnt;
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      })
      .slice(0, maxValuesPerFacet)
      .map(([value, count]) => ({ value, count }));

    facets.push({ name, values: sortedValues, _coverage: coverage } as Facet & { _coverage: number });
  }

  // Sort facets by coverage desc, tiebreak alphabetical by name
  facets.sort((a, b) => {
    const aCov = (a as Facet & { _coverage: number })._coverage;
    const bCov = (b as Facet & { _coverage: number })._coverage;
    if (bCov !== aCov) return bCov - aCov;
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });

  // Strip the internal _coverage field and apply facet cap
  return facets
    .slice(0, maxFacets)
    .map(({ name, values }) => ({ name, values }));
}
