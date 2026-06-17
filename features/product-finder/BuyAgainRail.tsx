"use client";

import { useEffect, useMemo, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { reorderSuggestions } from "@/lib/product-finder-foryou";

/**
 * "Buy it again" rail (#6) — an Amazon-Business/Grainger-style reorder surface for
 * the landing: one-click reorder of a recent WHOLE order plus quick-add chips for
 * the customer's most-ordered SKUs (velocity-ranked, "due" flagged). Reuses the
 * shipped reorderSuggestions engine + the reorder(id) / addToCart store actions.
 * Renders nothing for an account with no order history.
 */
export function BuyAgainRail() {
  const orders = useProductFinder((s) => s.orders);
  const activeCustomerId = useProductFinder((s) => s.activeCustomerId);
  const cart = useProductFinder((s) => s.cart);
  const addToCart = useProductFinder((s) => s.addToCart);
  const reorder = useProductFinder((s) => s.reorder);
  const setCartOpen = useProductFinder((s) => s.setCartOpen);
  const setDetailModalProduct = useProductFinder((s) => s.setDetailModalProduct);

  // Clock read after mount keeps SSR + first client render identical.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);

  const scopedOrders = useMemo(
    () =>
      activeCustomerId === null
        ? orders.filter((o) => o.customerId === null)
        : orders.filter((o) => o.customerId === activeCustomerId),
    [orders, activeCustomerId],
  );
  const cartIds = useMemo(() => new Set(Object.keys(cart)), [cart]);
  const suggestions = useMemo(
    () => (now === null ? [] : reorderSuggestions(scopedOrders, cartIds, now, 6)),
    [scopedOrders, cartIds, now],
  );
  const recent = useMemo(() => [...scopedOrders].sort((a, b) => b.placedAt - a.placedAt).slice(0, 2), [scopedOrders]);

  // Show the rail whenever there's order history; the chip list and the
  // recent-order reorder buttons have different data dependencies, so they're
  // gated independently below (reorder stays useful even with every SKU in cart).
  if (scopedOrders.length === 0) return null;

  const daysAgo = (t: number) => (now === null ? 0 : Math.max(0, Math.round((now - t) / 86_400_000)));

  function reorderAll(id: string) {
    reorder(id);
    setCartOpen(true);
  }

  return (
    <section className="rounded-xl border border-[#00573F]/25 bg-[#00573F]/[0.04] p-4" aria-label="Buy it again">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base" aria-hidden="true">&#x1F501;</span>
        <h2 className="text-sm font-semibold text-[#1D252D]">Buy it again</h2>
        <span className="text-xs text-[#4F758B]">your most-ordered items and recent orders</span>
      </div>

      {/* Quick-add velocity chips */}
      {suggestions.length > 0 && (
      <ul className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <li
            key={s.product.id}
            className="flex items-center gap-2 rounded-lg border border-[#B7C9D3]/70 bg-white px-2.5 py-1.5"
          >
            <button
              type="button"
              onClick={() => setDetailModalProduct(s.product)}
              className="max-w-[180px] truncate text-left text-xs"
              title={s.product.name}
            >
              <b className="text-[#1D252D]">{s.product.sku}</b>
              <span className="ml-1 text-[#4F758B]">{s.product.name}</span>
            </button>
            <span className="whitespace-nowrap text-[10px] text-[#4F758B]">
              ×{s.timesOrdered}
              {s.due ? <span className="ml-1 font-semibold text-[#DB6B30]">due</span> : ` · ${daysAgo(s.lastOrderedAt)}d`}
            </span>
            <button
              type="button"
              onClick={() => addToCart(s.product, Math.max(1, s.lastQty))}
              aria-label={`Add ${s.product.sku} to cart`}
              className="rounded bg-[#00AA13] px-2 py-0.5 text-xs font-semibold text-white hover:bg-[#009911]"
            >
              Add
            </button>
          </li>
        ))}
      </ul>
      )}

      {/* One-click reorder of a recent whole order */}
      {recent.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#B7C9D3]/50 pt-3">
          <span className="text-xs font-medium text-[#4F758B]">Reorder a recent order:</span>
          {recent.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => reorderAll(o.id)}
              aria-label={`Reorder ${o.lines.length} line${o.lines.length === 1 ? "" : "s"} — $${o.total.toFixed(2)}, placed ${daysAgo(o.placedAt)} days ago`}
              className="rounded-lg border border-[#00573F]/50 px-2.5 py-1 text-xs font-medium text-[#00573F] hover:bg-[#00573F]/5"
            >
              {o.lines.length} line{o.lines.length === 1 ? "" : "s"} · ${o.total.toFixed(2)} · {daysAgo(o.placedAt)}d ago
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
