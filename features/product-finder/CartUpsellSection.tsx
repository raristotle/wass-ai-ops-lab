"use client";

import { useEffect, useMemo, useState } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { apiCartUpsell, type CartUpsell } from "@/lib/product-finder-api";
import { deriveCartShape, servicesForCart } from "@/lib/product-finder-services-attach";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * CartUpsellSection (v5-S2) — three rep-facing attach strips on the cart drawer,
 * all driven by what's already in the basket:
 *   #9 Preferred-brand swaps — swap commodity lines to the preferred / private-label
 *      equivalent at the same-or-lower price, with the margin lift + a penetration meter.
 *   #7 Complete the segment package — the Wesco solution the cart is closest to
 *      finishing, with one-click adds for the empty families.
 *   #8 Wesco services — kitting / labeling / VMI / cut-to-length / staging, triggered
 *      by the shape of the cart (computed locally, $0).
 *
 * The swaps + package gaps come from POST /api/cart/upsell (server cross-ref + catalog);
 * the services list is pure-client. Renders nothing for an empty cart.
 */
export function CartUpsellSection() {
  const cart = useProductFinder((s) => s.cart);
  const addToCart = useProductFinder((s) => s.addToCart);
  const removeFromCart = useProductFinder((s) => s.removeFromCart);
  const branchId = useProductFinder((s) => s.user?.branchId);

  const items = useMemo(() => Object.values(cart), [cart]);

  // Pure, local: services triggered by cart shape.
  const services = useMemo(() => servicesForCart(deriveCartShape(items)), [items]);

  // Stable cart signature so the effect only refetches when the SKUs/qtys change.
  const cartSig = useMemo(
    () => items.map(({ product, qty }) => `${product.sku}:${qty}`).sort().join("|"),
    [items],
  );

  const [upsell, setUpsell] = useState<CartUpsell>({ swaps: [], penetration: null, solution: null });

  useEffect(() => {
    let cancelled = false;
    if (items.length === 0) {
      setUpsell({ swaps: [], penetration: null, solution: null });
      return;
    }
    const skus = items.map((i) => i.product.sku);
    const qtys = items.map((i) => i.qty);
    void apiCartUpsell(skus, qtys, { branchId }).then((res) => {
      if (!cancelled) setUpsell(res);
    });
    return () => {
      cancelled = true;
    };
    // cartSig captures the SKU/qty set; branchId changes the stock-aware picks.
  }, [cartSig, branchId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (items.length === 0) return null;

  const { swaps, penetration, solution } = upsell;
  const hasAnything = swaps.length > 0 || (solution && solution.gaps.length > 0) || services.length > 0;
  if (!hasAnything) return null;

  const swapAll = () => {
    for (const s of swaps) {
      removeFromCart(s.from.id);
      addToCart(s.to, s.qty);
    }
  };

  return (
    <div className="space-y-4 border-t border-[#B7C9D3]/40 px-4 py-4" data-testid="cart-upsell">
      {/* ── Preferred-brand swaps (#9) ── */}
      {swaps.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[#4F758B]">
              Preferred-brand swaps
              {penetration && (
                <span className="ml-2 font-normal normal-case text-gray-400">
                  {penetration.before.linePenetrationPct}% → {penetration.after.linePenetrationPct}% preferred
                </span>
              )}
            </h4>
            {swaps.length >= 2 && (
              <Button size="sm" className="h-7 bg-[#00AA13] px-2.5 text-xs text-white hover:bg-[#008f10]" onClick={swapAll}>
                Swap all ({swaps.length})
              </Button>
            )}
          </div>
          <ul className="space-y-1.5">
            {swaps.map((s) => (
              <li key={s.from.id} className="flex items-center gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[#1D252D]">
                    {s.from.brand} → <span className="font-medium">{s.to.brand}</span>{" "}
                    <span className="text-gray-400">{s.to.name}</span>
                  </p>
                  <p className="text-xs text-[#4F758B]">
                    +${s.lineMarginGain.toFixed(2)} margin
                    {s.unitPriceDelta < 0 && ` · ${s.unitPriceDelta < 0 ? "saves" : ""} $${Math.abs(s.unitPriceDelta).toFixed(2)}/unit`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    removeFromCart(s.from.id);
                    addToCart(s.to, s.qty);
                  }}
                  className="flex-shrink-0 rounded-md border border-[#00AA13] px-2 py-1 text-xs font-medium text-[#00AA13] hover:bg-[#00AA13]/5"
                >
                  Swap
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Complete the segment package (#7) ── */}
      {solution && solution.gaps.length > 0 && (
        <section>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[#4F758B]">
              Complete the {solution.template.name}
            </h4>
            <Badge className="flex-shrink-0 border-0 bg-[#004986] px-1.5 py-0 text-[10px] text-white">
              {solution.segment.code}
            </Badge>
          </div>
          {/* Coverage meter */}
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#B7C9D3]/40">
              <div className="h-full rounded-full bg-[#00AA13]" style={{ width: `${solution.coveragePct}%` }} />
            </div>
            <span className="flex-shrink-0 text-xs tabular-nums text-[#4F758B]">
              {solution.coveredCount}/{solution.totalCount}
            </span>
          </div>
          <ul className="space-y-1.5">
            {solution.gaps.map((g) => (
              <li key={g.subcategory} className="flex items-center gap-2 text-sm">
                <span className="flex-shrink-0 text-lg" aria-hidden="true">
                  {g.product.imageIcon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[#1D252D]">{g.subcategory}</p>
                  <p className="truncate text-xs text-[#4F758B]">
                    {g.product.name} · ${g.product.unitPrice.toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addToCart(g.product)}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#00AA13] text-lg leading-none text-white hover:bg-[#008f10]"
                  aria-label={`Add ${g.product.name} to basket`}
                >
                  +
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Wesco services (#8) ── */}
      {services.length > 0 && (
        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4F758B]">Add Wesco services</h4>
          <ul className="space-y-1">
            {services.map((svc) => (
              <li key={svc.id} className="rounded-md bg-[#F8FAFB] px-2.5 py-1.5">
                <p className="text-sm font-medium text-[#1D252D]">{svc.name}</p>
                <p className="text-xs text-[#4F758B]">{svc.blurb}</p>
                <p className="mt-0.5 text-[11px] text-gray-400">Why: {svc.trigger}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
