"use client";

import { useEffect, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { apiCompanionsAttach, type SlimCompanion } from "@/lib/product-finder-api";
import {
  CADENCE_LABEL,
  nextDueDate,
  type Cadence,
} from "@/lib/product-finder-subscription";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Customer reorder nudge + subscription (v5-S4 #16) — the D2C cross-sell surface on
 * the self-service portal. For an order, it shows:
 *   - a SUBSCRIPTION cadence selector that previews the next reorder date, and
 *   - ATTACH NUDGES — the cross-sell companions for the order's SKUs, addable to the
 *     reorder cart with one tap.
 *
 * The subscription is persisted client-side (localStorage, guarded) as a $0 stub —
 * the durable subscription store is the dormant production path. Companions come from
 * the same $0 cross-sell engine.
 */
export function CustomerReorderNudge({ orderId, skus, nowIso }: { orderId: string; skus: string[]; nowIso: string }) {
  const addToCart = useProductFinder((s) => s.addToCart);
  const branchId = useProductFinder((s) => s.user?.branchId);

  const [nudges, setNudges] = useState<SlimCompanion[]>([]);
  const [cadence, setCadence] = useState<Cadence | "">("");
  const [adding, setAdding] = useState<string | null>(null);

  // Load the saved subscription cadence for this order (client stub).
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const saved = localStorage.getItem(`sub:${orderId}`);
    if (saved) setCadence(saved as Cadence);
  }, [orderId]);

  // Fetch the attach rail for the order's SKUs.
  useEffect(() => {
    let cancelled = false;
    void apiCompanionsAttach(skus, branchId).then((r) => {
      if (!cancelled) setNudges(r.slice(0, 4));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  function setSub(c: Cadence | "") {
    setCadence(c);
    if (typeof localStorage === "undefined") return;
    if (c) localStorage.setItem(`sub:${orderId}`, c);
    else localStorage.removeItem(`sub:${orderId}`);
  }

  // Resolve a nudge SKU to a full product, then add it to the (reorder) cart.
  async function addNudge(c: SlimCompanion) {
    setAdding(c.product.id);
    try {
      const res = await fetch("/api/products/quick-resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skus: [c.product.sku] }),
      });
      const data = (await res.json().catch(() => null)) as { resolved?: { product: CatalogProduct | null }[] } | null;
      const product = data?.resolved?.[0]?.product;
      if (product) addToCart(product, 1);
    } catch {
      /* ignore — the customer can add it from search */
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg bg-[#F8FAFB] px-3 py-2.5" data-testid="reorder-nudge">
      {/* Subscription cadence */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs font-semibold text-[#1D252D]" htmlFor={`sub-${orderId}`}>
          Subscribe to reorder
        </label>
        <select
          id={`sub-${orderId}`}
          value={cadence}
          onChange={(e) => setSub(e.target.value as Cadence | "")}
          className="rounded border border-[#B7C9D3] bg-white px-2 py-1 text-xs text-[#1D252D]"
        >
          <option value="">Off</option>
          {(Object.keys(CADENCE_LABEL) as Cadence[]).map((c) => (
            <option key={c} value={c}>
              {CADENCE_LABEL[c]}
            </option>
          ))}
        </select>
        {cadence && (
          <span className="text-xs text-[#00573F]">
            Next reorder {nextDueDate({ lastOrderedIso: nowIso, cadence })}
          </span>
        )}
      </div>

      {/* Attach nudges */}
      {nudges.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#4F758B]">Customers also add</p>
          <div className="flex flex-wrap gap-1.5">
            {nudges.map((c) => (
              <button
                key={c.product.id}
                type="button"
                disabled={adding === c.product.id}
                onClick={() => addNudge(c)}
                title={c.reasons[0] ?? c.product.subcategory}
                className="rounded-full border border-[#B7C9D3] bg-white px-2.5 py-1 text-xs text-[#1D252D] hover:border-[#00AA13] hover:text-[#00AA13] disabled:opacity-50"
              >
                {adding === c.product.id ? "…" : `+ ${c.product.name} · $${c.product.unitPrice.toFixed(2)}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
