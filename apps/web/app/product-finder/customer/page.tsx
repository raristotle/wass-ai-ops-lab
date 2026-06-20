"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProductFinder } from "@/lib/product-finder-store";
import { AuthGuard } from "@/features/product-finder/AuthGuard";
import { ProductFinderShell } from "@/features/product-finder/ProductFinderShell";
import { CustomerReorderNudge } from "@/features/product-finder/CustomerReorderNudge";
import { orderTracking } from "@/lib/product-finder-tracking";
import { t } from "@/lib/product-finder-i18n";
import type { PlacedOrder, OrderLine } from "@/lib/product-finder-order-intake";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Customer self-service portal (v4-S4 #13) — a logged-in customer's order history
 * + reorder. Read-only over the tenant-scoped /api/customer/orders; reorder
 * resolves the SKUs against the catalog and drops them in the cart for review.
 * Reuses the shipped SSO/session, order persistence, and order-tracking timeline.
 */

const fmt$ = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
const fmtDate = (ms: number) => new Date(ms).toLocaleDateString("en-US", { dateStyle: "medium" });

function PortalContent() {
  const locale = useProductFinder((s) => s.locale);
  const user = useProductFinder((s) => s.user);
  const addToCart = useProductFinder((s) => s.addToCart);
  const setCartOpen = useProductFinder((s) => s.setCartOpen);
  const router = useRouter();

  const [orders, setOrders] = useState<PlacedOrder[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);
  const now = useMemo(() => Date.now(), []);

  useEffect(() => {
    let alive = true;
    fetch("/api/customer/orders")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { orders?: PlacedOrder[] } | null) => {
        if (alive) setOrders(Array.isArray(d?.orders) ? d!.orders! : []);
      })
      .catch(() => {
        if (alive) setOrders([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function reorder(order: PlacedOrder) {
    setReordering(order.id);
    try {
      const qtyBySku = new Map(order.lines.map((l: OrderLine) => [l.sku.toUpperCase(), l.qty]));
      const res = await fetch("/api/products/quick-resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skus: order.lines.map((l) => l.sku) }),
      });
      const data = (await res.json().catch(() => null)) as
        | { resolved?: { sku: string; product: CatalogProduct | null }[] }
        | null;
      let added = 0;
      for (const r of data?.resolved ?? []) {
        if (r.product) {
          // Key the qty off the INPUT sku (r.sku) — a cross-reference resolution
          // returns a product whose own sku differs from the ordered line's sku.
          addToCart(r.product, qtyBySku.get(r.sku.toUpperCase()) ?? 1);
          added += 1;
        }
      }
      if (added > 0) {
        setCartOpen(true);
        router.push("/product-finder");
      }
    } catch {
      /* leave the page; the customer can retry */
    } finally {
      setReordering(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1D252D]">{t("portal.title", locale)}</h1>
          <p className="mt-0.5 text-sm text-[#4F758B]">
            {user?.name ? `${user.name} · ` : ""}
            {t("portal.subtitle", locale)}
          </p>
        </div>
        <Link
          href="/product-finder"
          className="shrink-0 rounded-lg border border-[#4F758B] px-3 py-1.5 text-xs font-semibold text-[#4F758B] hover:border-[#1D252D] hover:text-[#1D252D]"
        >
          {t("portal.back", locale)}
        </Link>
      </div>

      {orders === null ? (
        <p className="py-12 text-center text-sm text-[#4F758B]">…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-[#B7C9D3] bg-white p-8 text-center text-sm text-[#4F758B]">
          {t("portal.empty", locale)}
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const track = orderTracking({ placedAt: o.placedAt, etaDays: 5, method: "delivery" }, now);
            const isOpen = expanded === o.id;
            return (
              <li key={o.id} className="rounded-xl border border-[#B7C9D3] bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-xs text-[#4F758B]">{o.id}</span>
                    <span className="block text-sm font-semibold text-[#1D252D]">
                      {fmt$(o.total)} · {o.itemCount} {t("willcall.col.items", locale).toLowerCase()}
                    </span>
                    <span className="block text-[11px] text-[#4F758B]">
                      {t("portal.placedOn", locale)} {fmtDate(o.placedAt)}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-[#004986]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#004986]">
                    {track.status}
                  </span>
                  <span className="shrink-0 text-[#B7C9D3]" aria-hidden="true">{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-[#B7C9D3]/50 px-4 py-3">
                    <ul className="mb-3 space-y-1">
                      {o.lines.map((l, i) => (
                        <li key={i} className="flex items-center justify-between gap-2 text-xs">
                          <span className="min-w-0 flex-1 truncate text-[#1D252D]">
                            <span className="font-mono text-[#4F758B]">{l.sku}</span> · {l.name}
                          </span>
                          <span className="shrink-0 text-[#4F758B]">×{l.qty}</span>
                          <span className="w-16 shrink-0 text-right font-medium text-[#1D252D]">{fmt$(l.lineTotal)}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      disabled={reordering === o.id}
                      onClick={() => reorder(o)}
                      className="rounded-lg bg-[#00AA13] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#00880F] disabled:opacity-50"
                    >
                      {reordering === o.id ? "…" : `🔁 ${t("action.reorder", locale)}`}
                    </button>

                    {/* v5-S4 #16: subscribe-to-reorder cadence + cross-sell attach nudges */}
                    <CustomerReorderNudge orderId={o.id} skus={o.lines.map((l) => l.sku)} nowIso={new Date(now).toISOString()} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-center text-[10px] italic text-[#4F758B]">
        Your orders are scoped to your account via single sign-on — you only ever see your own.
      </p>
    </div>
  );
}

export default function CustomerPortalPage() {
  return (
    <AuthGuard>
      <ProductFinderShell>
        <PortalContent />
      </ProductFinderShell>
    </AuthGuard>
  );
}
