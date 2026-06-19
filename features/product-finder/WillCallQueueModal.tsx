"use client";

import { useMemo } from "react";
import { useProductFinder } from "@/lib/product-finder-store";
import { useModalA11y } from "@/features/product-finder/useModalA11y";
import { getBrand } from "@/lib/brand";
import { t } from "@/lib/product-finder-i18n";
import { willCallOrders, buildPickTicket, pickTicketHtml } from "@/lib/product-finder-pick-ticket";

/**
 * Will-call branch queue (v4-S4 #12). Lists the orders staged for branch pickup
 * and prints a pick ticket per order. Pure data + a print window; $0. Reuses the
 * orderFulfillment map the order-tracking feature already records.
 */
function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function WillCallQueueModal() {
  const open = useProductFinder((s) => s.willCallOpen);
  const setOpen = useProductFinder((s) => s.setWillCallOpen);
  const orders = useProductFinder((s) => s.orders);
  const fulfillment = useProductFinder((s) => s.orderFulfillment);
  const brandId = useProductFinder((s) => s.brandId);
  const locale = useProductFinder((s) => s.locale);
  const closeRef = useModalA11y(open, () => setOpen(false));

  const queue = useMemo(() => willCallOrders(orders, fulfillment), [orders, fulfillment]);

  if (!open) return null;

  function printTicket(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const ticket = buildPickTicket(order, Date.now());
    const html = pickTicketHtml(ticket, getBrand(brandId).name);
    const w = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("willcall.title", locale)}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative my-8 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-xl bg-[#1D252D] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">{t("willcall.title", locale)}</h2>
            <p className="text-xs text-[#B7C9D3]">{t("willcall.subtitle", locale)}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("action.close", locale)}
            className="text-2xl font-light leading-none text-white/80 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        <div className="px-5 py-4">
          {queue.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#4F758B]">{t("willcall.empty", locale)}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#B7C9D3] text-left text-xs uppercase tracking-wide text-[#4F758B]">
                    <th className="py-2">{t("willcall.col.order", locale)}</th>
                    <th className="py-2">{t("willcall.col.customer", locale)}</th>
                    <th className="py-2 text-right">{t("willcall.col.items", locale)}</th>
                    <th className="py-2">{t("willcall.col.placed", locale)}</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {queue.map((o) => {
                    const items = o.lines.reduce((s, l) => s + l.qty, 0);
                    return (
                      <tr key={o.id} className="border-b border-[#B7C9D3]/50">
                        <td className="py-2 font-mono text-xs text-[#1D252D]">{o.id}</td>
                        <td className="py-2 text-[#1D252D]">{o.customerName ?? "Walk-in"}</td>
                        <td className="py-2 text-right text-[#1D252D]">{items}</td>
                        <td className="py-2 text-[#4F758B]">{fmtDate(o.placedAt)}</td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() => printTicket(o.id)}
                            className="rounded border border-[#00AA13] px-2.5 py-1 text-xs font-semibold text-[#00573F] transition-colors hover:bg-[#00AA13]/10"
                          >
                            🖨 {t("willcall.printTicket", locale)}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-[10px] italic text-[#4F758B]">
            Will-call orders are the ones a rep marked for branch pickup. The pick ticket opens a printable
            window — pull the stock, check it off, and mark it ready for pickup.
          </p>
        </div>
      </div>
    </div>
  );
}
