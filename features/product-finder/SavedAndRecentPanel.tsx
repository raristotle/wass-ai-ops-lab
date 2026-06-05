"use client";

import { useProductFinder } from "@/lib/product-finder-store";
import type { ProductSnapshot } from "@/features/product-finder/types";

function MiniRow({ snap }: { snap: ProductSnapshot }) {
  return (
    <div className="flex w-full items-center gap-2 rounded-lg border border-[#B7C9D3] bg-white px-3 py-2 text-left">
      <span className="text-xl" aria-hidden="true">{snap.imageIcon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[#1D252D]">{snap.name}</span>
        <span className="block truncate text-xs text-[#4F758B]">{snap.brand} · ${snap.unitPrice.toFixed(2)}</span>
      </span>
    </div>
  );
}

export function SavedAndRecentPanel() {
  const recentlyViewed = useProductFinder((s) => s.recentlyViewed);
  const recentSnapshots = useProductFinder((s) => s.recentSnapshots);
  const favorites = useProductFinder((s) => s.favorites);
  const favoriteSnapshots = useProductFinder((s) => s.favoriteSnapshots);

  const recent = recentlyViewed.map((id) => recentSnapshots[id]).filter(Boolean) as ProductSnapshot[];
  const favs = favorites.map((id) => favoriteSnapshots[id]).filter(Boolean) as ProductSnapshot[];
  if (recent.length === 0 && favs.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {recent.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#4F758B]">Recently viewed</h3>
          <div className="space-y-2">{recent.slice(0, 6).map((s) => <MiniRow key={s.id} snap={s} />)}</div>
        </section>
      )}
      {favs.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#4F758B]"><span aria-hidden="true">★</span> Favorites</h3>
          <div className="space-y-2">{favs.map((s) => <MiniRow key={s.id} snap={s} />)}</div>
        </section>
      )}
    </div>
  );
}
