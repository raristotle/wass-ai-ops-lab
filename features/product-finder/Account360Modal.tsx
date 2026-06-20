"use client";

import { useEffect, useMemo, useState } from "react";
import { useProductFinder, selectActiveCustomer } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";
import { apiAdjacency } from "@/lib/product-finder-api";
import {
  buildAccount360,
  type AccountLine,
  type SubcatEdge,
} from "@/lib/product-finder-account-360";
import { Badge } from "@/components/ui/badge";

/**
 * Account 360 / call-prep whitespace panel (v5-S2 #6) — $0, deterministic.
 *
 * For the active customer, turns their quote history into a one-screen call-prep:
 * what families they buy, the WHITESPACE (adjacent families they should be buying
 * from us but aren't — the biggest AOV lever), and a reorder shortlist. Whitespace
 * is derived from the subcategory adjacency graph (fetched once from
 * /api/companions/adjacency) — same edges as the cross-sell engine. The scoring is
 * the pure, tested lib/product-finder-account-360.
 */
export function Account360Modal() {
  const open = useProductFinder((s) => s.account360Open);
  const setOpen = useProductFinder((s) => s.setAccount360Open);
  const closeRef = useModalA11y(open, () => setOpen(false));
  const quotes = useProductFinder((s) => s.quotes);
  const activeCustomer = useProductFinder(selectActiveCustomer);

  const [adjacency, setAdjacency] = useState<Map<string, SubcatEdge[]>>(new Map());

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void apiAdjacency().then((rec) => {
      if (cancelled) return;
      setAdjacency(new Map(Object.entries(rec)));
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // History = the active customer's quote lines (all quotes if no customer is selected).
  const history = useMemo<AccountLine[]>(() => {
    const relevant = activeCustomer
      ? quotes.filter((q) => q.customerId === activeCustomer.id || q.customer === activeCustomer.name)
      : quotes;
    return relevant.flatMap((q) =>
      q.lines.map((l) => ({
        subcategory: l.product.subcategory,
        amount: (l.unitPrice ?? l.product.unitPrice) * l.qty,
        sku: l.product.sku,
        name: l.product.name,
      })),
    );
  }, [quotes, activeCustomer]);

  const view = useMemo(() => buildAccount360(history, adjacency), [history, adjacency]);

  if (!open) return null;

  const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Account 360"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Account 360{activeCustomer ? ` — ${activeCustomer.name}` : ""}
            </h2>
            <p className="text-xs text-[#B7C9D3]">
              {money(view.summary.totalSpend)} across {view.summary.distinctFamilies} families ·{" "}
              {view.summary.whitespaceCount} whitespace gap{view.summary.whitespaceCount === 1 ? "" : "s"}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close Account 360"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          {history.length === 0 && (
            <p className="rounded-lg bg-[#F8FAFB] px-3 py-4 text-sm text-[#4F758B]">
              No quote history for this account yet. Save a quote for the account to see what they buy and where the
              whitespace is.
            </p>
          )}

          {/* Whitespace — the lead, it's the call objective. */}
          {view.whitespace.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#DB6B30]">
                Whitespace — pitch these
              </h3>
              <ul className="space-y-1.5">
                {view.whitespace.map((w) => (
                  <li key={w.subcategory} className="flex items-start gap-2 rounded-lg bg-[#DB6B30]/5 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-[#1D252D]">
                        {w.subcategory}
                        {w.required && (
                          <Badge className="border-0 bg-[#00AA13] px-1.5 py-0 text-[10px] text-white">required</Badge>
                        )}
                      </p>
                      <p className="text-xs text-[#4F758B]">{w.reason}</p>
                    </div>
                    <span className="flex-shrink-0 text-xs tabular-nums text-[#4F758B]">{w.score}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* What they buy */}
          {view.purchased.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4F758B]">What they buy</h3>
              <ul className="space-y-1">
                {view.purchased.slice(0, 8).map((f) => (
                  <li key={f.subcategory} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate text-[#1D252D]">{f.subcategory}</span>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#B7C9D3]/40">
                      <div className="h-full rounded-full bg-[#4F758B]" style={{ width: `${Math.round(f.share * 100)}%` }} />
                    </div>
                    <span className="w-16 flex-shrink-0 text-right tabular-nums text-[#4F758B]">{money(f.spend)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Reorder shortlist */}
          {view.topReorder.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4F758B]">Reorder shortlist</h3>
              <ul className="space-y-1">
                {view.topReorder.map((r) => (
                  <li key={r.sku} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate text-[#1D252D]">{r.name}</span>
                    <span className="flex-shrink-0 text-xs text-[#4F758B]">
                      {r.lines}× · {money(r.spend)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
