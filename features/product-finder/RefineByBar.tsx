"use client";

import { useProductFinder } from "@/lib/product-finder-store";
import { buildRefineChips } from "@/lib/product-finder-refine";

/**
 * Post-query "Refine by" bar (v3-S2 #4) — one-tap narrowings ranked from the
 * result-set facet distribution. Shown only once the user has engaged (a query
 * or a category/brand selection), so it doesn't clutter the cold landing view.
 * Each chip applies the matching facet; the count shows how many results carry it.
 */
export function RefineByBar() {
  const facets = useProductFinder((s) => s.facets);
  const refineFacets = useProductFinder((s) => s.refineFacets);
  const filters = useProductFinder((s) => s.filters);
  const total = useProductFinder((s) => s.total);
  const toggleBrand = useProductFinder((s) => s.toggleBrand);
  const toggleSubcategory = useProductFinder((s) => s.toggleSubcategory);
  const toggleSpecFilter = useProductFinder((s) => s.toggleSpecFilter);

  const engaged =
    filters.query.trim().length > 0 ||
    filters.categories.size > 0 ||
    filters.subcategories.size > 0 ||
    filters.brands.size > 0 ||
    filters.onlyWithCrosses ||
    filters.onlyPreferred;

  const chips = buildRefineChips(facets, refineFacets, {
    specFilters: filters.specFilters,
    brands: filters.brands,
    subcategories: filters.subcategories,
  });

  if (!engaged || total === 0 || chips.length === 0) return null;

  const apply = (chip: (typeof chips)[number]) => {
    if (chip.kind === "brand") toggleBrand(chip.value);
    else if (chip.kind === "subcategory") toggleSubcategory(chip.value);
    else void toggleSpecFilter(chip.name, chip.value);
  };

  const fmt = new Intl.NumberFormat("en-US");

  return (
    <section aria-label="Refine results" className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-[#4F758B]">Refine by:</span>
      {chips.map((chip) => (
        <button
          key={`${chip.kind}:${chip.name}:${chip.value}`}
          type="button"
          onClick={() => apply(chip)}
          aria-label={`Refine by ${chip.name} ${chip.value} (${fmt.format(chip.count)} matches)`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#B7C9D3] bg-white px-2.5 py-0.5 text-xs text-[#1D252D] transition-colors hover:border-[#00AA13] hover:bg-[#00AA13]/10 hover:text-[#00573F]"
        >
          <span>{chip.value}</span>
          <span className="text-[#4F758B]">· {fmt.format(chip.count)}</span>
        </button>
      ))}
    </section>
  );
}
