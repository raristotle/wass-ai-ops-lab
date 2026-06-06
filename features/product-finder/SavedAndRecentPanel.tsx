"use client";

import { useEffect, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import type { ProductSnapshot } from "@/features/product-finder/types";

function MiniRow({ snap }: { snap: ProductSnapshot }) {
  return (
    <div className="flex w-full items-center gap-2 rounded-lg border border-[#B7C9D3] bg-white px-3 py-2 text-left">
      <span className="text-xl" aria-hidden="true">{snap.imageIcon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[#1D252D]">{snap.name}</span>
        <span className="block truncate text-xs text-[#4F758B]">{snap.brand} · ${Number(snap.unitPrice).toFixed(2)}</span>
      </span>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, count, collapsed, onToggle, onClear, children }: CollapsibleSectionProps) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          className="flex items-center gap-1.5 text-left"
        >
          <span className="text-[#4F758B]" aria-hidden="true">
            {collapsed ? "▸" : "▾"}
          </span>
          <span className="text-xs font-bold uppercase tracking-wide text-[#4F758B]">
            {title}
          </span>
          <span className="text-xs text-[#B7C9D3]">({count})</span>
        </button>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-[#4F758B] hover:text-[#1D252D]"
          >
            Clear
          </button>
        )}
      </div>
      {!collapsed && <div>{children}</div>}
    </section>
  );
}

function readBool(key: string): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(key) === "1";
}

function writeBool(key: string, value: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, value ? "1" : "0");
}

export function SavedAndRecentPanel() {
  const recentlyViewed = useProductFinder((s) => s.recentlyViewed);
  const recentSnapshots = useProductFinder((s) => s.recentSnapshots);
  const favorites = useProductFinder((s) => s.favorites);
  const favoriteSnapshots = useProductFinder((s) => s.favoriteSnapshots);
  const searchHistory = useProductFinder((s) => s.searchHistory);
  const clearSearchHistory = useProductFinder((s) => s.clearSearchHistory);
  const clearRecentlyViewed = useProductFinder((s) => s.clearRecentlyViewed);
  const runNlSearch = useProductFinder((s) => s.runNlSearch);

  const recent = recentlyViewed.map((id) => recentSnapshots[id]).filter(Boolean) as ProductSnapshot[];
  const favs = favorites.map((id) => favoriteSnapshots[id]).filter(Boolean) as ProductSnapshot[];

  // Collapsed state — initialize to false (expanded) to avoid SSR/hydration mismatch.
  // A useEffect sets the real stored values after mount (panel only renders client-side
  // after AuthGuard hydration, but useEffect is the safest pattern regardless).
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [recentCollapsed, setRecentCollapsed] = useState(false);
  const [favsCollapsed, setFavsCollapsed] = useState(false);

  useEffect(() => {
    setHistoryCollapsed(readBool("pf_collapsed_history"));
    setRecentCollapsed(readBool("pf_collapsed_recent"));
    setFavsCollapsed(readBool("pf_collapsed_favorites"));
  }, []);

  const toggleHistory = () => {
    setHistoryCollapsed((prev) => {
      const next = !prev;
      writeBool("pf_collapsed_history", next);
      return next;
    });
  };

  const toggleRecent = () => {
    setRecentCollapsed((prev) => {
      const next = !prev;
      writeBool("pf_collapsed_recent", next);
      return next;
    });
  };

  const toggleFavs = () => {
    setFavsCollapsed((prev) => {
      const next = !prev;
      writeBool("pf_collapsed_favorites", next);
      return next;
    });
  };

  if (searchHistory.length === 0 && recent.length === 0 && favs.length === 0) return null;

  return (
    <div className="space-y-4">
      {searchHistory.length > 0 && (
        <CollapsibleSection
          title="Search history"
          count={searchHistory.length}
          collapsed={historyCollapsed}
          onToggle={toggleHistory}
          onClear={clearSearchHistory}
        >
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => runNlSearch(term)}
                className="rounded-full border border-[#B7C9D3] px-3 py-1 text-sm text-[#1D252D] hover:border-[#4F758B]"
              >
                {term}
              </button>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {(recent.length > 0 || favs.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {recent.length > 0 && (
            <CollapsibleSection
              title="Recently viewed"
              count={Math.min(6, recent.length)}
              collapsed={recentCollapsed}
              onToggle={toggleRecent}
              onClear={clearRecentlyViewed}
            >
              <div className="space-y-2">
                {recent.slice(0, 6).map((s) => (
                  <MiniRow key={s.id} snap={s} />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {favs.length > 0 && (
            <CollapsibleSection
              title="★ Favorites"
              count={favs.length}
              collapsed={favsCollapsed}
              onToggle={toggleFavs}
            >
              <div className="space-y-2">
                {favs.map((s) => (
                  <MiniRow key={s.id} snap={s} />
                ))}
              </div>
            </CollapsibleSection>
          )}
        </div>
      )}
    </div>
  );
}
