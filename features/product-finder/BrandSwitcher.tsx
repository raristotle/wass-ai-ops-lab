"use client";

import { useProductFinder } from "@/lib/product-finder-store";
import { BRANDS, getBrand } from "@/lib/brand";

/**
 * Header white-label brand switcher. Flip the app's logo + name to any
 * configured distributor profile live (the "this is your branded app" moment in
 * a pitch). The choice persists; the header logo re-skins immediately.
 */
export function BrandSwitcher() {
  const brandId = useProductFinder((s) => s.brandId);
  const setBrandId = useProductFinder((s) => s.setBrandId);
  const ids = Object.keys(BRANDS);
  if (ids.length < 2) return null;

  return (
    <div className="hidden flex-col gap-0.5 sm:flex">
      <label htmlFor="brand-switcher" className="text-[9px] font-semibold uppercase tracking-widest text-[#B7C9D3]">
        Brand:
      </label>
      <select
        id="brand-switcher"
        value={brandId}
        onChange={(e) => setBrandId(e.target.value)}
        className="rounded border border-[#4F758B] bg-[#1D252D] px-2 py-0.5 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-[#00AA13]"
        aria-label="White-label brand"
      >
        {ids.map((id) => (
          <option key={id} value={id}>
            {getBrand(id).name}
          </option>
        ))}
      </select>
    </div>
  );
}
