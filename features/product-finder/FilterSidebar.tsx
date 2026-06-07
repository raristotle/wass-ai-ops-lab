"use client";

import { useState, useMemo } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { ALL_SUBCATEGORIES, ALL_BRANDS, CATEGORY_META, CATEGORIES } from "@/lib/catalog/taxonomy";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FilterState, EnumFacet, RangeFacet } from "@/features/product-finder/types";
import { getCatalogProvider } from "@/lib/integration/index";

const VISIBLE_LIMIT = 8;

/** Small provenance strip shown at the bottom of the sidebar. */
function CatalogSourceStrip() {
  const catalogSource = getCatalogProvider().getSource(new Date());
  const productCountFormatted = catalogSource.productCount.toLocaleString("en-US");
  const syncedAt = new Date(catalogSource.lastSyncedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="mt-auto border-t border-[#B7C9D3] pt-3">
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#4F758B]">
        Catalog source
      </p>
      <p className="text-xs text-[#4F758B]">
        {catalogSource.source} &middot; {productCountFormatted} products
      </p>
      <p className="text-[10px] text-[#B7C9D3]">
        Synced {syncedAt}
      </p>
      <p className="mt-1 text-[10px] italic text-[#B7C9D3]">
        Attributes synced from PIM &mdash; simulated integration.
      </p>
    </div>
  );
}

function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.categories.size > 0 ||
    filters.subcategories.size > 0 ||
    filters.brands.size > 0 ||
    filters.onlyBranchStock ||
    filters.onlyDCStock ||
    filters.onlyPreferred ||
    filters.priceMin !== null ||
    filters.priceMax !== null ||
    Object.keys(filters.specFilters ?? {}).length > 0 ||
    Object.keys(filters.specRanges ?? {}).length > 0
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function SidebarSection({ title, children }: SectionProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-[#B7C9D3] pb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-3 text-sm font-semibold text-[#1D252D] lg:pointer-events-none"
        aria-expanded={open}
      >
        {title}
        <span className="text-[#4F758B] lg:hidden">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="mt-1 space-y-2">{children}</div>}
    </div>
  );
}

/**
 * Range facet control — two number inputs for Min and Max.
 * Reflects the current specRanges value and applies on change/blur.
 * Uses the facet's min/max as placeholders (catalog bounds).
 */
function RangeFacetControl({
  facet,
  currentRange,
  onApply,
}: {
  facet: RangeFacet;
  currentRange: { min?: number; max?: number } | undefined;
  onApply: (range: { min?: number; max?: number }) => void;
}) {
  const [localMin, setLocalMin] = useState(
    currentRange?.min !== undefined ? String(currentRange.min) : ""
  );
  const [localMax, setLocalMax] = useState(
    currentRange?.max !== undefined ? String(currentRange.max) : ""
  );

  function apply(newMin: string, newMax: string) {
    const parsedMin = newMin !== "" ? parseFloat(newMin) : undefined;
    const parsedMax = newMax !== "" ? parseFloat(newMax) : undefined;
    onApply({
      min: parsedMin !== undefined && Number.isFinite(parsedMin) ? parsedMin : undefined,
      max: parsedMax !== undefined && Number.isFinite(parsedMax) ? parsedMax : undefined,
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-[#4F758B]">
        Range: {facet.min}–{facet.max} {facet.unit}
      </p>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder={`Min ${facet.unit}`}
          value={localMin}
          onChange={(e) => setLocalMin(e.target.value)}
          onBlur={() => apply(localMin, localMax)}
          className="h-8 text-xs"
          min={facet.min}
          max={facet.max}
          aria-label={`Minimum ${facet.name}`}
        />
        <span className="text-xs text-[#4F758B]">–</span>
        <Input
          type="number"
          placeholder={`Max ${facet.unit}`}
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value)}
          onBlur={() => apply(localMin, localMax)}
          className="h-8 text-xs"
          min={facet.min}
          max={facet.max}
          aria-label={`Maximum ${facet.name}`}
        />
      </div>
      {(localMin !== "" || localMax !== "") && (
        <button
          type="button"
          className="text-xs text-[#DB6B30] underline underline-offset-1 hover:text-[#c05a22]"
          onClick={() => {
            setLocalMin("");
            setLocalMax("");
            onApply({});
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}

export function FilterSidebar() {
  const filters = useProductFinder((s) => s.filters);
  const facets = useProductFinder((s) => s.facets);
  const toggleCategory = useProductFinder((s) => s.toggleCategory);
  const toggleSubcategory = useProductFinder((s) => s.toggleSubcategory);
  const toggleBrand = useProductFinder((s) => s.toggleBrand);
  const setOnlyBranchStock = useProductFinder((s) => s.setOnlyBranchStock);
  const setOnlyDCStock = useProductFinder((s) => s.setOnlyDCStock);
  const setOnlyPreferred = useProductFinder((s) => s.setOnlyPreferred);
  const setPriceRange = useProductFinder((s) => s.setPriceRange);
  const clearFilters = useProductFinder((s) => s.clearFilters);
  const toggleSpecFilter = useProductFinder((s) => s.toggleSpecFilter);
  const setSpecRange = useProductFinder((s) => s.setSpecRange);

  // Derive specRanges as a stable reference (plain object from store — no new-array issue)
  const specRanges = filters.specRanges;

  const [showAllSubs, setShowAllSubs] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");

  const visibleSubs = showAllSubs
    ? ALL_SUBCATEGORIES
    : ALL_SUBCATEGORIES.slice(0, VISIBLE_LIMIT);
  const visibleBrands = showAllBrands
    ? ALL_BRANDS
    : ALL_BRANDS.slice(0, VISIBLE_LIMIT);

  const anyActive = hasActiveFilters(filters);

  // Partition facets into enum and range — useMemo so we don't create new arrays
  // per render (render-loop guard: stable reference via useMemo over stable `facets`).
  const { enumFacets, rangeFacets } = useMemo(() => {
    const enumFacets: EnumFacet[] = [];
    const rangeFacets: RangeFacet[] = [];
    for (const f of facets) {
      if (f.type === "enum") enumFacets.push(f);
      else rangeFacets.push(f);
    }
    return { enumFacets, rangeFacets };
  }, [facets]);

  function handlePriceApply() {
    const min = priceMin !== "" ? parseFloat(priceMin) : null;
    const max = priceMax !== "" ? parseFloat(priceMax) : null;
    setPriceRange(
      min !== null && !isNaN(min) ? min : null,
      max !== null && !isNaN(max) ? max : null
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-0 overflow-y-auto px-4 py-4">
      {/* Category chips */}
      <SidebarSection title="Category">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = filters.categories.has(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  active
                    ? "border-[#1D252D] bg-[#1D252D] text-white"
                    : "border-[#B7C9D3] bg-white text-[#1D252D] hover:border-[#4F758B]"
                )}
              >
                {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
              </button>
            );
          })}
        </div>
      </SidebarSection>

      {/* Stock Availability */}
      <SidebarSection title="Stock Availability">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1D252D]">
          <input
            type="checkbox"
            checked={filters.onlyBranchStock}
            onChange={(e) => setOnlyBranchStock(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded accent-[#00AA13]"
          />
          In Stock at My Branch
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1D252D]">
          <input
            type="checkbox"
            checked={filters.onlyDCStock}
            onChange={(e) => setOnlyDCStock(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded accent-[#00AA13]"
          />
          In Stock at DC
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1D252D]">
          <input
            type="checkbox"
            checked={filters.onlyPreferred}
            onChange={(e) => setOnlyPreferred(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded accent-[#00AA13]"
          />
          Preferred Suppliers Only
        </label>
      </SidebarSection>

      {/* Subcategory */}
      <SidebarSection title="Subcategory">
        <div className="space-y-1.5">
          {visibleSubs.map((sub) => (
            <label
              key={sub}
              className="flex cursor-pointer items-center text-sm text-[#1D252D]"
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.subcategories.has(sub)}
                  onChange={() => toggleSubcategory(sub)}
                  className="h-4 w-4 cursor-pointer rounded accent-[#00AA13]"
                />
                {sub}
              </span>
            </label>
          ))}
          {ALL_SUBCATEGORIES.length > VISIBLE_LIMIT && (
            <button
              type="button"
              onClick={() => setShowAllSubs((v) => !v)}
              className="text-xs text-[#004986] underline hover:text-[#1D252D]"
            >
              {showAllSubs
                ? "Show less"
                : `Show ${ALL_SUBCATEGORIES.length - VISIBLE_LIMIT} more`}
            </button>
          )}
        </div>
      </SidebarSection>

      {/* Brand */}
      <SidebarSection title="Brand">
        <div className="space-y-1.5">
          {visibleBrands.map((brand) => (
            <label
              key={brand}
              className="flex cursor-pointer items-center text-sm text-[#1D252D]"
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.brands.has(brand)}
                  onChange={() => toggleBrand(brand)}
                  className="h-4 w-4 cursor-pointer rounded accent-[#00AA13]"
                />
                {brand}
              </span>
            </label>
          ))}
          {ALL_BRANDS.length > VISIBLE_LIMIT && (
            <button
              type="button"
              onClick={() => setShowAllBrands((v) => !v)}
              className="text-xs text-[#004986] underline hover:text-[#1D252D]"
            >
              {showAllBrands
                ? "Show less"
                : `Show ${ALL_BRANDS.length - VISIBLE_LIMIT} more`}
            </button>
          )}
        </div>
      </SidebarSection>

      {/* Enum Spec Facets — checkbox groups for categorical specs */}
      {enumFacets.map((facet) => (
        <SidebarSection key={facet.name} title={facet.name}>
          <div className="space-y-1.5">
            {facet.values.map(({ value, count }) => {
              const selected = (filters.specFilters[facet.name] ?? []).includes(value);
              return (
                <label
                  key={value}
                  className="flex cursor-pointer items-center justify-between text-sm text-[#1D252D]"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSpecFilter(facet.name, value)}
                      className="h-4 w-4 cursor-pointer rounded accent-[#00AA13]"
                    />
                    {value}
                  </span>
                  <span className="text-xs text-[#4F758B]">{count}</span>
                </label>
              );
            })}
          </div>
        </SidebarSection>
      ))}

      {/* Range Spec Facets — min/max number inputs for numeric specs */}
      {rangeFacets.map((facet) => (
        <SidebarSection key={facet.name} title={`${facet.name} (${facet.unit})`}>
          <RangeFacetControl
            facet={facet}
            currentRange={specRanges[facet.name]}
            onApply={(range) => setSpecRange(facet.name, range)}
          />
        </SidebarSection>
      ))}

      {/* Price Range */}
      <SidebarSection title="Price Range">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min $"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="h-8 text-xs"
            min={0}
          />
          <span className="text-xs text-[#4F758B]">–</span>
          <Input
            type="number"
            placeholder="Max $"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="h-8 text-xs"
            min={0}
          />
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handlePriceApply}
          className="mt-1 h-7 w-full bg-[#1D252D] text-xs text-white hover:bg-[#2d3740]"
        >
          Apply
        </Button>
      </SidebarSection>

      {/* Clear All Filters */}
      {anyActive && (
        <div className="pt-3">
          <button
            type="button"
            onClick={() => {
              clearFilters();
              setPriceMin("");
              setPriceMax("");
            }}
            className="text-sm font-semibold text-[#DB6B30] underline underline-offset-2 hover:text-[#c05a22]"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Catalog source provenance strip */}
      <CatalogSourceStrip />
    </div>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <aside className="hidden w-64 shrink-0 border-r border-[#B7C9D3] bg-white lg:flex lg:flex-col">
        {sidebar}
      </aside>

      {/* Mobile: FAB + bottom-sheet drawer */}
      <div className="lg:hidden">
        {/* FAB */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open filters"
          className="fixed bottom-6 left-4 z-40 flex items-center gap-1.5 rounded-full bg-[#1D252D] px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4h18M7 8h10M11 12h2"
            />
          </svg>
          Filters
          {anyActive && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00AA13] text-[10px] font-bold text-white">
              {filters.categories.size +
                filters.subcategories.size +
                filters.brands.size +
                (filters.onlyBranchStock ? 1 : 0) +
                (filters.onlyDCStock ? 1 : 0) +
                (filters.onlyPreferred ? 1 : 0)}
            </span>
          )}
        </button>

        {/* Overlay */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Bottom sheet */}
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl transition-transform duration-300",
            drawerOpen ? "translate-y-0" : "translate-y-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <div className="sticky top-0 flex items-center justify-between border-b border-[#B7C9D3] bg-white px-5 py-3">
            <span className="font-semibold text-[#1D252D]">Filters</span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="text-[#4F758B] hover:text-[#1D252D]"
              aria-label="Close filters"
            >
              ✕
            </button>
          </div>
          {sidebar}
        </div>
      </div>
    </>
  );
}
