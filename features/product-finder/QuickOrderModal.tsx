"use client";

import { useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";
import { apiCompanions, type CompanionItem } from "@/lib/product-finder-api";
import {
  parseQuickOrderLines,
  aggregateQuickLines,
  type SmartResolvedQuickLine,
} from "@/lib/product-finder-quick-order";

/** A resolved line plus the raw qty-field string (cleared/retyped freely; clamped at add-time). */
type UiLine = SmartResolvedQuickLine & { qtyStr: string };

/**
 * Quick-Order Pad — Amazon-Business-style rapid entry. Paste/type KNOWN SKUs (one
 * per line, optional qty: "QO115 10", "QO115,10", "QO115 x 10") and add the whole
 * list to the cart in one action. Plus one-click recall of the last order and any
 * saved basket. Exact-SKU resolution against the catalog; unmatched lines are
 * flagged so nothing is silently dropped. Reuses the cart / reorder / loadBasket
 * store actions; the parsing/resolution live in the pure, unit-tested lib.
 */
export function QuickOrderModal() {
  const open = useProductFinder((s) => s.quickOrderOpen);
  const setOpen = useProductFinder((s) => s.setQuickOrderOpen);
  const addToCart = useProductFinder((s) => s.addToCart);
  const reorder = useProductFinder((s) => s.reorder);
  const orders = useProductFinder((s) => s.orders);
  const savedBaskets = useProductFinder((s) => s.savedBaskets);
  const loadBasket = useProductFinder((s) => s.loadBasket);
  const setCartOpen = useProductFinder((s) => s.setCartOpen);
  const closeRef = useModalA11y(open, () => setOpen(false));

  const branchId = useProductFinder((s) => s.user?.branchId);
  const [text, setText] = useState("");
  const [lines, setLines] = useState<UiLine[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // v5-S4 #15: basket-aware cross-sell companions for the resolved SKUs.
  const [companions, setCompanions] = useState<CompanionItem[]>([]);

  /** Fetch companions for the matched products (a few seeds), dedup, drop anything
   *  already in the quick-order list — the "add these too" chip row. */
  async function loadCompanions(matched: UiLine[]) {
    const seeds = matched.map((l) => l.product).filter((p): p is NonNullable<typeof p> => !!p);
    if (seeds.length === 0) {
      setCompanions([]);
      return;
    }
    const inList = new Set(seeds.map((p) => p.id));
    const rails = await Promise.all(seeds.slice(0, 3).map((p) => apiCompanions(p.id, { branchId, k: 4 })));
    const seen = new Set<string>();
    const merged: CompanionItem[] = [];
    for (const c of rails.flat()) {
      if (inList.has(c.product.id) || seen.has(c.product.id)) continue;
      seen.add(c.product.id);
      merged.push(c);
    }
    // Required first, then attach score; cap the chip row.
    merged.sort((a, b) => (a.relation !== b.relation ? (a.relation === "required" ? -1 : 1) : b.attachScore - a.attachScore));
    setCompanions(merged.slice(0, 6));
  }

  // Resolve the pasted SKUs against the FULL catalog server-side (exact SKU then
  // canonical cross-reference) — so real Wesco SKUs and competitor BOMs resolve,
  // not just the curated demo subset. Parsing/aggregation stay pure + client-side.
  async function resolveList() {
    const parsed = aggregateQuickLines(parseQuickOrderLines(text));
    if (parsed.length === 0) {
      setMsg("Paste at least one SKU.");
      setLines(null);
      setCompanions([]);
      return;
    }
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/products/quick-resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skus: parsed.map((p) => p.sku) }),
      });
      const data: unknown = await res.json().catch(() => null);
      const resolved = Array.isArray((data as { resolved?: unknown })?.resolved)
        ? (data as { resolved: SmartResolvedQuickLine[] }).resolved
        : [];
      // The route resolves input order 1:1, so zip by index; qty stays client-side.
      const uiLines: UiLine[] = parsed.map((p, i) => {
        const r = resolved[i];
        return {
          raw: p.raw,
          sku: p.sku,
          qty: p.qty,
          matchKind: r?.matchKind ?? "none",
          product: r?.product ?? null,
          via: r?.via,
          qtyStr: String(p.qty),
        };
      });
      setLines(uiLines);
      void loadCompanions(uiLines.filter((l) => l.product));
    } catch {
      setMsg("Could not resolve SKUs — please try again.");
    } finally {
      setBusy(false);
    }
  }

  // The qty field holds a raw string so it can be cleared/retyped freely; the
  // numeric value is parsed + clamped to [1, 100000] (the order schema's per-line
  // ceiling) only at add-time, so an over-cap value can't reach checkout.
  function setQtyStr(i: number, v: string) {
    setLines((prev) => (prev ? prev.map((l, idx) => (idx === i ? { ...l, qtyStr: v } : l)) : prev));
  }
  function lineQty(l: UiLine): number {
    const s = l.qtyStr.trim();
    if (!/^\d+$/.test(s)) return 1; // mirror the parse lib: only a clean positive integer counts
    return Math.min(parseInt(s, 10), 100_000);
  }

  if (!open) return null;

  const matched = lines?.filter((l) => l.product) ?? [];
  const unmatched = lines?.filter((l) => !l.product) ?? [];
  const total = matched.reduce((sum, l) => sum + (l.product ? l.product.unitPrice * lineQty(l) : 0), 0);
  const lastOrder = orders[0] ?? null;

  function addAll() {
    for (const l of matched) {
      if (l.product) addToCart(l.product, lineQty(l));
    }
    setOpen(false);
    setCartOpen(true);
  }

  function recallOrder(id: string) {
    reorder(id);
    setOpen(false);
    setCartOpen(true);
  }

  function recallBasket(id: string) {
    loadBasket(id);
    setOpen(false);
    setCartOpen(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Quick-Order Pad"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Quick-Order Pad</h2>
            <p className="text-xs text-[#B7C9D3]">Paste Wesco or competitor SKUs — duplicates merge, competitor parts auto cross-reference — and add the whole list to the cart.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close Quick-Order Pad"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="px-5 py-4">
          <label htmlFor="qo-input" className="mb-1 block text-xs font-medium text-[#1D252D]">
            SKUs — one per line, optional quantity (e.g. <code>QO115 10</code>, <code>QO115,10</code>, <code>QO115 x 10</code>)
          </label>
          <textarea
            id="qo-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={"QO115 10\nCAT6-PL-1000 4\nEKL-1591"}
            className="w-full rounded border border-[#B7C9D3] px-2 py-1.5 font-mono text-sm focus:border-[#00AA13] focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void resolveList()}
              disabled={!text.trim() || busy}
              className="rounded bg-[#00AA13] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#009911] disabled:opacity-50"
            >
              {busy ? "Resolving…" : "Resolve list"}
            </button>
            {msg && <span className="text-xs text-[#DB6B30]">{msg}</span>}
          </div>

          {lines && (
            <div className="mt-4" aria-live="polite">
              {matched.length > 0 && (
                <ul className="space-y-1.5">
                  {lines.map((l, i) =>
                    l.product ? (
                      <li key={i} className="flex items-center gap-2 rounded-lg border border-[#B7C9D3]/70 px-3 py-2">
                        <span className="text-[#00AA13]" aria-hidden="true">&#x2713;</span>
                        <span className="flex-1 truncate text-sm">
                          <b className="text-[#1D252D]">{l.product.sku}</b>
                          <span className="ml-1.5 text-[#4F758B]">{l.product.name}</span>
                          {l.matchKind === "cross" && l.via && (
                            <span
                              className="ml-1.5 whitespace-nowrap rounded bg-[#004986]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#004986]"
                              title={`Cross-referenced from competitor/legacy part ${l.via}`}
                            >
                              &#x2194; cross-ref {l.via}
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-[#4F758B]">${l.product.unitPrice.toFixed(2)}</span>
                        <label className="sr-only" htmlFor={`qo-qty-${i}`}>Quantity for {l.product.sku}</label>
                        <input
                          id={`qo-qty-${i}`}
                          type="number"
                          min={1}
                          inputMode="numeric"
                          value={l.qtyStr}
                          onChange={(e) => setQtyStr(i, e.target.value)}
                          className="w-16 rounded border border-[#B7C9D3] px-2 py-1 text-sm focus:border-[#00AA13] focus:outline-none"
                        />
                      </li>
                    ) : null,
                  )}
                </ul>
              )}

              {unmatched.length > 0 && (
                <div className="mt-2 rounded-lg border border-[#DB6B30]/40 bg-[#DB6B30]/5 px-3 py-2 text-xs text-[#993C1D]">
                  <b>{unmatched.length} not found:</b> {unmatched.map((l) => l.sku).join(", ")} — check the SKU or search the catalog.
                </div>
              )}

              {/* v5-S4 #15: cross-sell companion chips for the resolved basket */}
              {companions.length > 0 && (
                <div className="mt-3" data-testid="quickorder-companions">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#4F758B]">Add these too</p>
                  <div className="flex flex-wrap gap-1.5">
                    {companions.map((c) => (
                      <button
                        key={c.product.id}
                        type="button"
                        onClick={() => addToCart(c.product)}
                        title={c.reasons[0] ?? c.product.subcategory}
                        className={
                          "rounded-full border px-2.5 py-1 text-xs transition-colors " +
                          (c.relation === "required"
                            ? "border-[#00AA13] text-[#00AA13] hover:bg-[#00AA13]/5"
                            : "border-[#B7C9D3] text-[#1D252D] hover:bg-[#F8FAFB]")
                        }
                      >
                        + {c.product.name} · ${c.product.unitPrice.toFixed(2)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matched.length > 0 ? (
                <button
                  type="button"
                  onClick={addAll}
                  className="mt-3 w-full rounded bg-[#00573F] px-3 py-2 text-sm font-semibold text-white hover:bg-[#00684a]"
                >
                  Add {matched.length} item{matched.length === 1 ? "" : "s"} to cart · ${total.toFixed(2)}
                </button>
              ) : (
                <p className="mt-2 text-xs text-[#4F758B]">No SKUs matched the catalog.</p>
              )}
            </div>
          )}

          {(lastOrder || savedBaskets.length > 0) && (
            <div className="mt-5 border-t border-[#B7C9D3]/60 pt-3">
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#4F758B]">Recall</h3>
              <div className="space-y-1.5">
                {lastOrder && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate text-[#1D252D]">
                      Last order · {lastOrder.lines.length} line{lastOrder.lines.length === 1 ? "" : "s"} · ${lastOrder.total.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => recallOrder(lastOrder.id)}
                      className="rounded border border-[#00573F]/50 px-2 py-0.5 text-xs font-medium text-[#00573F] hover:bg-[#00573F]/5"
                    >
                      Reorder
                    </button>
                  </div>
                )}
                {savedBaskets.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate text-[#1D252D]">
                      {b.name} · {b.lines.length} line{b.lines.length === 1 ? "" : "s"}
                    </span>
                    <button
                      type="button"
                      onClick={() => recallBasket(b.id)}
                      className="rounded border border-[#004986]/40 px-2 py-0.5 text-xs font-medium text-[#004986] hover:bg-[#004986]/5"
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
