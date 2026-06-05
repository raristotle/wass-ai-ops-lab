"use client";

import { useProductFinder } from "@/lib/product-finder-store";
import { PRODUCT_MAP } from "@/data/mock/wesco-products";
import type { WescoProduct } from "@/features/product-finder/types";

function MiniRow({ product }: { product: WescoProduct }) {
  const setActiveProduct = useProductFinder((s) => s.setActiveProduct);
  return (
    <button
      type="button"
      onClick={() => setActiveProduct(product)}
      className="flex w-full items-center gap-2 rounded-lg border border-[#B7C9D3] bg-white px-3 py-2 text-left hover:border-[#00AA13]"
    >
      <span className="text-xl" aria-hidden="true">{product.imageIcon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[#1D252D]">{product.name}</span>
        <span className="block truncate text-xs text-[#4F758B]">{product.brand} · ${product.unitPrice.toFixed(2)}</span>
      </span>
    </button>
  );
}

export function SavedAndRecentPanel() {
  const favorites = useProductFinder((s) => s.favorites);
  const recentlyViewed = useProductFinder((s) => s.recentlyViewed);

  const favProducts = favorites.map((id) => PRODUCT_MAP.get(id)).filter((p): p is WescoProduct => !!p);
  const recentProducts = recentlyViewed.map((id) => PRODUCT_MAP.get(id)).filter((p): p is WescoProduct => !!p);

  if (favProducts.length === 0 && recentProducts.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {recentProducts.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#4F758B]">Recently viewed</h3>
          <div className="space-y-2">
            {recentProducts.slice(0, 6).map((p) => <MiniRow key={p.id} product={p} />)}
          </div>
        </section>
      )}
      {favProducts.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#4F758B]"><span aria-hidden="true">★</span> Favorites</h3>
          <div className="space-y-2">
            {favProducts.map((p) => <MiniRow key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
