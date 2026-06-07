import type { CatalogProduct } from "@/features/product-finder/types";
import type { EnumFacet, RangeFacet, Facet } from "@/features/product-finder/types";
import { parseAttribute, NUMERIC_SPECS } from "@/lib/catalog/attributes";

export type { EnumFacet, RangeFacet, Facet };

// Re-export the older non-discriminated types for any code that still uses them.
// The canonical type is Facet (discriminated union) from types.ts.
export interface FacetValue {
  value: string;
  count: number;
}

/**
 * Compute dynamic spec facets from a product set.
 *
 * - For spec names in NUMERIC_SPECS: emits a range facet
 *   `{ type:"range", name, unit, min, max }` if at least 2 distinct numeric
 *   values can be parsed; otherwise falls back to an enum facet.
 * - All other specs: emits `{ type:"enum", name, values:[{value,count}] }`.
 * - Sorts facets by total coverage (how many products have that spec) desc;
 *   tiebreak alphabetical by name.
 * - Within each enum facet, values sorted by count desc; tiebreak alphabetical.
 * - Skips facets that have only one distinct value (no filtering benefit).
 *   For range facets this is implicit: we require ≥ 2 distinct numerics.
 * - Caps to maxFacets facets and maxValuesPerFacet values per enum facet.
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
  const facets: (Facet & { _coverage: number })[] = [];

  for (const [name, { coverage, values }] of accum) {
    const isNumericSpec = Boolean(NUMERIC_SPECS[name]);

    if (isNumericSpec) {
      // Try to build a range facet
      const numerics: number[] = [];
      for (const [val] of values) {
        const parsed = parseAttribute(name, val);
        if (parsed !== null) {
          numerics.push(parsed.numeric);
        }
      }
      // Deduplicate to count distinct numeric values
      const distinctNumerics = [...new Set(numerics)];
      if (distinctNumerics.length >= 2) {
        const unit = NUMERIC_SPECS[name].unit;
        const min = Math.min(...distinctNumerics);
        const max = Math.max(...distinctNumerics);
        const rangeFacet: RangeFacet & { _coverage: number } = {
          type: "range",
          name,
          unit,
          min,
          max,
          _coverage: coverage,
        };
        facets.push(rangeFacet);
        continue;
      }
      // Fall through to enum facet if <2 distinct numerics
    }

    // Enum facet
    // Skip facets with only one distinct value — no filtering benefit
    if (values.size <= 1) continue;

    // Sort values by count desc, tiebreak alphabetical by value
    const sortedValues = [...values.entries()]
      .sort(([aVal, aCnt], [bVal, bCnt]) => {
        if (bCnt !== aCnt) return bCnt - aCnt;
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      })
      .slice(0, maxValuesPerFacet)
      .map(([value, count]) => ({ value, count }));

    const enumFacet: EnumFacet & { _coverage: number } = {
      type: "enum",
      name,
      values: sortedValues,
      _coverage: coverage,
    };
    facets.push(enumFacet);
  }

  // Sort facets by coverage desc, tiebreak alphabetical by name
  facets.sort((a, b) => {
    if (b._coverage !== a._coverage) return b._coverage - a._coverage;
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });

  // Strip the internal _coverage field and apply facet cap
  return facets.slice(0, maxFacets).map((f) => {
    const { _coverage: _, ...rest } = f;
    return rest as Facet;
  });
}
