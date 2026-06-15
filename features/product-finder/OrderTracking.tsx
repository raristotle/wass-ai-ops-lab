"use client";

import { useState } from "react";
import { useProductFinder, type Order } from "@/lib/product-finder-store";
import { orderEtaDays } from "@/lib/product-finder-delivery";
import { orderTracking, type FulfillmentMethod } from "@/lib/product-finder-tracking";
import { cn } from "@/lib/utils";

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Post-checkout tracking for one order: a status timeline + promised date +
 * a delivery/will-call toggle, plus the entry point to start a return. Closes
 * the gap where the app went dark after checkout.
 */
export function OrderTracking({ order }: { order: Order }) {
  const branchId = useProductFinder((s) => s.user?.branchId);
  const method = useProductFinder((s) => s.orderFulfillment[order.id]) ?? "delivery";
  const setOrderFulfillment = useProductFinder((s) => s.setOrderFulfillment);
  const setReturnModalOrder = useProductFinder((s) => s.setReturnModalOrder);
  const [open, setOpen] = useState(false);

  const etaDays = orderEtaDays(order.lines, branchId);
  const track = orderTracking({ placedAt: order.placedAt, etaDays, method: method as FulfillmentMethod }, Date.now());

  return (
    <div className="mt-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="rounded border border-[#004986]/40 px-2 py-0.5 text-[11px] font-medium text-[#004986] hover:bg-[#004986]/5"
        >
          {open ? "Hide tracking" : "Track order"}
        </button>
        <span className="text-[11px] text-[#4F758B]">
          {track.delivered ? track.status : `${track.status} · ${track.method === "willcall" ? "ready" : "arrives"} ~${fmtDate(track.etaAt)}`}
        </span>
        <button
          type="button"
          onClick={() => setReturnModalOrder(order.id)}
          className="ml-auto rounded border border-[#DB6B30]/40 px-2 py-0.5 text-[11px] font-medium text-[#DB6B30] hover:bg-[#DB6B30]/5"
        >
          Start a return
        </button>
      </div>

      {open && (
        <div className="mt-2 rounded-lg border border-[#B7C9D3] bg-white px-3 py-2">
          {/* Fulfillment method */}
          <div className="mb-2 flex items-center gap-2 text-[11px]">
            <span className="text-[#4F758B]">Fulfillment:</span>
            {(["delivery", "willcall"] as FulfillmentMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setOrderFulfillment(order.id, m)}
                className={cn(
                  "rounded-full border px-2 py-0.5 font-medium transition-colors",
                  method === m
                    ? "border-[#00AA13] bg-[#00AA13]/10 text-[#00573F]"
                    : "border-[#B7C9D3] text-[#4F758B] hover:border-[#4F758B]",
                )}
              >
                {m === "delivery" ? "Jobsite delivery" : "Will-call pickup"}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <ol className="space-y-1.5">
            {track.stages.map((s) => (
              <li key={s.key} className="flex items-center gap-2 text-xs">
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px]",
                    s.done ? "bg-[#00AA13] text-white" : "border border-[#B7C9D3] text-transparent",
                    s.current && "ring-2 ring-[#00AA13]/40",
                  )}
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className={cn(s.current ? "font-semibold text-[#1D252D]" : s.done ? "text-[#1D252D]" : "text-[#4F758B]")}>
                  {s.label}
                </span>
                <span className="ml-auto text-[10px] text-[#4F758B]">{fmtDate(s.at)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[10px] italic text-[#4F758B]">
            Simulated tracking from the order date and stocking ETA — a carrier/WMS feed drops in behind the same seam.
          </p>
        </div>
      )}
    </div>
  );
}
