"use client";

import { useEffect, useMemo, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import {
  reorderSuggestions,
  favoritePicks,
  type ReorderSuggestion,
} from "@/lib/product-finder-foryou";
import { alsoBought } from "@/lib/product-finder-recommendations";
import { apiGetProduct, apiGoesWith } from "@/lib/product-finder-api";
import type { CatalogProduct, ProductSnapshot } from "@/features/product-finder/types";

const DAY_MS = 86_400_000;

function daysAgo(ts: number, now: number): string {
  const d = Math.max(0, Math.floor((now - ts) / DAY_MS));
  if (d === 0) return "today";
  return d === 1 ? "1 day ago" : `${d} days ago`;
}

function SectionHeading({ icon, title }: { icon: string; title: string }) {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#4F758B]">
      <span aria-hidden="true">{icon}</span>
      {title}
    </p>
  );
}

function ReorderCard({ s, now, onAdd, onView }: {
  s: ReorderSuggestion;
  now: number;
  onAdd: () => void;
  onView: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#B7C9D3] bg-white px-3 py-2">
      <span className="text-xl" aria-hidden="true">{s.product.imageIcon}</span>
      <button type="button" onClick={onView} className="min-w-0 flex-1 text-left" aria-label={`View ${s.product.name}`}>
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-[#1D252D]">{s.product.name}</span>
          {s.due && (
            <span className="shrink-0 rounded bg-[#EAAA00] px-1 text-[8px] font-bold uppercase tracking-wide text-[#1D252D]">
              due
            </span>
          )}
        </span>
        <span className="block truncate text-xs text-[#4F758B]">
          ordered {s.timesOrdered}× · last {daysAgo(s.lastOrderedAt, now)}
          {s.customerName ? ` · ${s.customerName}` : ""}
        </span>
      </button>
      <button
        type="button"
        onClick={onAdd}
        className="shrink-0 rounded bg-[#00AA13] px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-[#009911]"
        aria-label={`Add ${s.lastQty} × ${s.product.name} to basket`}
      >
        + Add {s.lastQty > 1 ? `×${s.lastQty}` : ""}
      </button>
    </div>
  );
}

function ProductMiniCard({ name, sub, icon, onAdd, onView }: {
  name: string;
  sub: string;
  icon: string;
  onAdd: () => void;
  onView?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#B7C9D3] bg-white px-3 py-2">
      <span className="text-xl" aria-hidden="true">{icon}</span>
      {onView ? (
        <button type="button" onClick={onView} className="min-w-0 flex-1 text-left" aria-label={`View ${name}`}>
          <span className="block truncate text-sm font-medium text-[#1D252D]">{name}</span>
          <span className="block truncate text-xs text-[#4F758B]">{sub}</span>
        </button>
      ) : (
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-[#1D252D]">{name}</span>
          <span className="block truncate text-xs text-[#4F758B]">{sub}</span>
        </span>
      )}
      <button
        type="button"
        onClick={onAdd}
        className="shrink-0 rounded bg-[#00AA13] px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-[#009911]"
        aria-label={`Add ${name} to basket`}
      >
        + Add
      </button>
    </div>
  );
}

export function ForYouRail() {
  const orders = useProductFinder((s) => s.orders);
  const activeCustomerId = useProductFinder((s) => s.activeCustomerId);
  const cart = useProductFinder((s) => s.cart);
  const favorites = useProductFinder((s) => s.favorites);
  const favoriteSnapshots = useProductFinder((s) => s.favoriteSnapshots);
  const addToCart = useProductFinder((s) => s.addToCart);
  const setDetailModalProduct = useProductFinder((s) => s.setDetailModalProduct);
  const user = useProductFinder((s) => s.user);

  // Clock is read after mount so SSR and first client render match.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);

  // Active customer → their history; walk-in → all history (demo-friendly,
  // each suggestion then carries its customer chip).
  const scopedOrders = useMemo(
    () => (activeCustomerId === null ? orders : orders.filter((o) => o.customerId === activeCustomerId)),
    [orders, activeCustomerId]
  );

  const cartIds = useMemo(() => new Set(Object.keys(cart)), [cart]);

  const suggestions = useMemo(
    () => (now === null ? [] : reorderSuggestions(scopedOrders, cartIds, now, 4)),
    [scopedOrders, cartIds, now]
  );

  const favs = useMemo(() => {
    const snaps = favorites.map((id) => favoriteSnapshots[id]).filter(Boolean) as ProductSnapshot[];
    const exclude = new Set([...cartIds, ...suggestions.map((s) => s.product.id)]);
    return favoritePicks(snaps, exclude, 4);
  }, [favorites, favoriteSnapshots, cartIds, suggestions]);

  // Cross-sell off the top reorder suggestion ("goes well with your orders").
  const topSuggestionId = suggestions[0]?.product.id ?? null;
  const [goesWith, setGoesWith] = useState<CatalogProduct[]>([]);
  useEffect(() => {
    if (!topSuggestionId) {
      setGoesWith([]);
      return;
    }
    let cancelled = false;
    apiGoesWith(topSuggestionId).then((items) => {
      if (!cancelled) setGoesWith(items.slice(0, 4));
    });
    return () => {
      cancelled = true;
    };
  }, [topSuggestionId]);

  const visibleGoesWith = useMemo(
    () =>
      goesWith
        .filter((p) => !cartIds.has(p.id) && !suggestions.some((s) => s.product.id === p.id))
        .slice(0, 3),
    [goesWith, cartIds, suggestions]
  );

  // Data-driven "also bought" (count-based CF over real order co-occurrence),
  // seeded by the top reorder suggestion. Preferred over the curated cross-sell
  // when the order history actually supports it.
  const alsoBoughtItems = useMemo(() => {
    if (!topSuggestionId) return [];
    const exclude = new Set([...cartIds, ...suggestions.map((s) => s.product.id)]);
    return alsoBought(scopedOrders, topSuggestionId, { excludeIds: exclude, k: 3 });
  }, [scopedOrders, topSuggestionId, cartIds, suggestions]);

  const handleAddFavorite = async (id: string) => {
    try {
      const detail = await apiGetProduct(id, user?.branchId);
      addToCart(detail.product, 1);
    } catch {
      /* product unavailable — ignore */
    }
  };

  const handleViewFavorite = async (id: string) => {
    try {
      const detail = await apiGetProduct(id, user?.branchId);
      setDetailModalProduct(detail.product);
    } catch {
      /* ignore */
    }
  };

  if (now === null) return null;
  if (suggestions.length === 0 && favs.length === 0) return null;

  return (
    <section
      className="rounded-xl border border-[#00AA13]/30 bg-[#00AA13]/[0.03] p-4"
      aria-label="Personalized recommendations"
      data-tour="for-you"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-[#00AA13] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          For you
        </span>
        <span className="text-[10px] italic text-[#4F758B]">
          based on your order history & favorites — simulated data
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {suggestions.length > 0 && (
          <div>
            <SectionHeading icon="🔁" title="Time to reorder" />
            <div className="space-y-2">
              {suggestions.map((s) => (
                <ReorderCard
                  key={s.product.id}
                  s={s}
                  now={now}
                  onAdd={() => addToCart(s.product, s.lastQty)}
                  onView={() => setDetailModalProduct(s.product)}
                />
              ))}
            </div>
          </div>
        )}

        {favs.length > 0 && (
          <div>
            <SectionHeading icon="★" title="From your favorites" />
            <div className="space-y-2">
              {favs.map((f) => (
                <ProductMiniCard
                  key={f.id}
                  name={f.name}
                  sub={`${f.brand} · $${Number(f.unitPrice).toFixed(2)}`}
                  icon={f.imageIcon}
                  onAdd={() => handleAddFavorite(f.id)}
                  onView={() => handleViewFavorite(f.id)}
                />
              ))}
            </div>
          </div>
        )}

        {alsoBoughtItems.length > 0 ? (
          <div>
            <SectionHeading icon="🛒" title="Frequently ordered together" />
            <div className="space-y-2">
              {alsoBoughtItems.map((a) => (
                <ProductMiniCard
                  key={a.product.id}
                  name={a.product.name}
                  sub={`ordered together ${a.coOrders}×`}
                  icon={a.product.imageIcon}
                  onAdd={() => addToCart(a.product, 1)}
                  onView={() => setDetailModalProduct(a.product)}
                />
              ))}
            </div>
          </div>
        ) : (
          visibleGoesWith.length > 0 && (
            <div>
              <SectionHeading icon="🧩" title="Goes well with your orders" />
              <div className="space-y-2">
                {visibleGoesWith.map((p) => (
                  <ProductMiniCard
                    key={p.id}
                    name={p.name}
                    sub={`${p.subcategory} · $${p.unitPrice.toFixed(2)}/${p.uom}`}
                    icon={p.imageIcon}
                    onAdd={() => addToCart(p, 1)}
                    onView={() => setDetailModalProduct(p)}
                  />
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}
