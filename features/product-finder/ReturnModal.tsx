"use client";

import { useMemo, useState } from "react";
import { useProductFinder, selectActiveCustomer } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";
import { getPricingProvider } from "@/lib/integration/index";
import {
  RETURN_REASONS,
  RETURN_STATUS_LABEL,
  type ReturnReason,
  type ReturnLine,
} from "@/lib/product-finder-returns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReturnModal() {
  const orderId = useProductFinder((s) => s.returnModalOrderId);
  const setReturnModalOrder = useProductFinder((s) => s.setReturnModalOrder);
  const orders = useProductFinder((s) => s.orders);
  const returns = useProductFinder((s) => s.returns);
  const createReturnRequest = useProductFinder((s) => s.createReturnRequest);
  const advanceReturnStatus = useProductFinder((s) => s.advanceReturnStatus);
  const activeCustomer = useProductFinder(selectActiveCustomer);

  const order = orders.find((o) => o.id === orderId) ?? null;
  const orderReturns = useMemo(() => returns.filter((r) => r.orderId === orderId), [returns, orderId]);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState<ReturnReason>(RETURN_REASONS[0]);
  const [note, setNote] = useState("");
  const closeRef = useModalA11y(orderId !== null, () => setReturnModalOrder(null));

  if (!order) return null;

  function lineFor(productId: string, qty: number, product: { sku: string; name: string }): ReturnLine {
    const unitPrice = getPricingProvider().getPricing(
      order!.lines.find((l) => l.product.id === productId)!.product,
      { customer: activeCustomer, qty },
    ).effectiveUnitPrice;
    return { productId, name: product.name, sku: product.sku, qty, unitPrice };
  }

  const chosenLines: ReturnLine[] = order.lines
    .filter((l) => selected[l.product.id])
    .map((l) => lineFor(l.product.id, l.qty, l.product));

  const refundEstimate = chosenLines.reduce((s, l) => s + l.unitPrice * l.qty, 0);

  function submit() {
    if (chosenLines.length === 0) return;
    createReturnRequest({ orderId: order!.id, lines: chosenLines, reason, note });
    setSelected({});
    setNote("");
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Start a return"
      onClick={(e) => {
        if (e.target === e.currentTarget) setReturnModalOrder(null);
      }}
    >
      <div className="relative my-8 w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Start a return</h2>
            <p className="text-xs text-[#B7C9D3]">Order placed {new Date(order.placedAt).toLocaleDateString()}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setReturnModalOrder(null)}
            aria-label="Close return"
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Existing RMAs */}
          {orderReturns.length > 0 && (
            <div className="mb-4 rounded-lg border border-[#B7C9D3] bg-[#F1EFE8] px-3 py-2">
              <p className="mb-1 text-xs font-semibold text-[#1D252D]">Returns on this order</p>
              {orderReturns.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 py-0.5 text-xs">
                  <span className="text-[#4F758B]">
                    {r.rma} · {r.lines.length} line{r.lines.length === 1 ? "" : "s"} · ${r.refundAmount.toFixed(2)}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="rounded bg-[#004986] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {RETURN_STATUS_LABEL[r.status]}
                    </span>
                    {r.status !== "refunded" && r.status !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => advanceReturnStatus(r.id)}
                        className="text-[10px] text-[#00573F] underline"
                      >
                        advance
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Line selection */}
          <p className="mb-1 text-xs font-medium text-[#1D252D]">Select lines to return</p>
          <div className="rounded border border-[#B7C9D3]">
            {order.lines.map((l) => (
              <label
                key={l.product.id}
                className="flex cursor-pointer items-center gap-2 border-b border-[#B7C9D3]/40 px-2 py-1.5 text-xs last:border-0"
              >
                <input
                  type="checkbox"
                  checked={Boolean(selected[l.product.id])}
                  onChange={(e) => setSelected((s) => ({ ...s, [l.product.id]: e.target.checked }))}
                  className="h-4 w-4 accent-[#DB6B30]"
                />
                <span className="min-w-0 flex-1 truncate text-[#1D252D]">{l.product.name}</span>
                <span className="text-[#4F758B]">×{l.qty}</span>
              </label>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-[#1D252D]">
              Reason
              <select
                className="rounded border border-[#B7C9D3] px-2 py-1.5 text-sm focus:border-[#00AA13] focus:outline-none"
                value={reason}
                onChange={(e) => setReason(e.target.value as ReturnReason)}
              >
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-[#1D252D]">
              Note (optional)
              <input
                className="rounded border border-[#B7C9D3] px-2 py-1.5 text-sm focus:border-[#00AA13] focus:outline-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Restocking detail…"
              />
            </label>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-[#4F758B]">
              Estimated credit: <span className="font-semibold text-[#1D252D]">${refundEstimate.toFixed(2)}</span>
            </span>
            <Button
              className={cn("h-8 bg-[#DB6B30] text-white hover:bg-[#b9551f]")}
              onClick={submit}
              disabled={chosenLines.length === 0}
            >
              Generate RMA
            </Button>
          </div>
          <p className="mt-2 text-[10px] italic text-[#4F758B]">
            Generates an RMA + return label and tracks the credit through to the issued credit.
          </p>
        </div>
      </div>
    </div>
  );
}
