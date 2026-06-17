"use client";

import { useProductFinder } from "@/lib/product-finder-store";
import { buildAppliedChips, type ChipRemove } from "@/lib/product-finder-applied-filters";
import type { ProductCategory } from "@/features/product-finder/types";

/**
 * Applied-filters overview bar (v3-S1 #2). A persistent, scannable strip above
 * the results that shows every active sidebar facet as a removable chip plus a
 * "Clear all". Hidden when no facets are active. NL chips keep their place under
 * the search box; this bar deliberately omits anything they already show.
 */
export function AppliedFiltersBar() {
  const filters = useProductFinder((s) => s.filters);
  const appliedNlFilters = useProductFinder((s) => s.appliedNlFilters);
  const toggleCategory = useProductFinder((s) => s.toggleCategory);
  const toggleSubcategory = useProductFinder((s) => s.toggleSubcategory);
  const toggleBrand = useProductFinder((s) => s.toggleBrand);
  const setOnlyBranchStock = useProductFinder((s) => s.setOnlyBranchStock);
  const setOnlyDCStock = useProductFinder((s) => s.setOnlyDCStock);
  const setOnlyPreferred = useProductFinder((s) => s.setOnlyPreferred);
  const setOnlyActive = useProductFinder((s) => s.setOnlyActive);
  const setOnlyWithCrosses = useProductFinder((s) => s.setOnlyWithCrosses);
  const setPriceRange = useProductFinder((s) => s.setPriceRange);
  const toggleSpecFilter = useProductFinder((s) => s.toggleSpecFilter);
  const setSpecRange = useProductFinder((s) => s.setSpecRange);
  const clearFilters = useProductFinder((s) => s.clearFilters);

  const chips = buildAppliedChips(filters, appliedNlFilters);
  if (chips.length === 0) return null;

  function remove(r: ChipRemove) {
    switch (r.type) {
      case "category":
        toggleCategory(r.value as ProductCategory);
        break;
      case "subcategory":
        toggleSubcategory(r.value);
        break;
      case "brand":
        toggleBrand(r.value);
        break;
      case "branchStock":
        setOnlyBranchStock(false);
        break;
      case "dcStock":
        setOnlyDCStock(false);
        break;
      case "preferred":
        setOnlyPreferred(false);
        break;
      case "active":
        setOnlyActive(false);
        break;
      case "withCrosses":
        setOnlyWithCrosses(false);
        break;
      case "price":
        setPriceRange(null, null);
        break;
      case "spec":
        void toggleSpecFilter(r.name, r.value);
        break;
      case "specRange":
        void setSpecRange(r.name, {});
        break;
    }
  }

  return (
    <section
      aria-label="Active filters"
      className="flex flex-wrap items-center gap-2 rounded-lg border border-[#B7C9D3]/60 bg-[#F8FAFB] px-3 py-2"
    >
      <span className="text-xs font-semibold text-[#4F758B]">Active filters:</span>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => remove(chip.remove)}
          aria-label={`Remove filter ${chip.label}`}
          className="group inline-flex items-center gap-1 rounded-full border border-[#B7C9D3] bg-white px-2.5 py-0.5 text-xs text-[#1D252D] transition-colors hover:border-[#DB6B30] hover:text-[#DB6B30]"
        >
          <span>{chip.label}</span>
          <span aria-hidden="true" className="text-[#4F758B] group-hover:text-[#DB6B30]">
            ✕
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => clearFilters()}
        className="ml-auto rounded-md px-2 py-1 text-xs font-semibold text-[#4F758B] underline-offset-2 hover:text-[#1D252D] hover:underline"
      >
        Clear all
      </button>
    </section>
  );
}
