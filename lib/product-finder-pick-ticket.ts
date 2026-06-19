/**
 * Will-call pick ticket + branch queue (v4-S4 #12). Pure, $0, deterministic
 * (now injected). Branch staff see the orders staged for pickup and print a pick
 * ticket to pull the stock. Reuses the existing per-order fulfillment map
 * (delivery|willcall) the order-tracking feature already records — no schema
 * change. The printable HTML is built here so the modal can open + print it.
 */

import type { Order } from "@/lib/product-finder-store";
import type { FulfillmentMethod } from "@/lib/product-finder-tracking";

export interface PickTicketLine {
  sku: string;
  name: string;
  qty: number;
}

export interface PickTicket {
  orderId: string;
  customer: string;
  placedAt: number;
  printedAt: number;
  lineCount: number;
  itemCount: number;
  lines: PickTicketLine[];
}

/** The will-call orders (staged for branch pickup), newest first. */
export function willCallOrders(orders: Order[], fulfillment: Record<string, FulfillmentMethod>): Order[] {
  return orders
    .filter((o) => fulfillment[o.id] === "willcall")
    .slice()
    .sort((a, b) => b.placedAt - a.placedAt);
}

/** Build a pick ticket from an order. Pure. */
export function buildPickTicket(order: Order, now: number): PickTicket {
  const lines: PickTicketLine[] = order.lines.map((l) => ({
    sku: l.product.sku,
    name: l.product.name,
    qty: l.qty,
  }));
  return {
    orderId: order.id,
    customer: order.customerName ?? "Walk-in",
    placedAt: order.placedAt,
    printedAt: now,
    lineCount: lines.length,
    itemCount: lines.reduce((s, l) => s + l.qty, 0),
    lines,
  };
}

/** HTML-escape for the printable ticket (XSS-safe). */
function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

/** A self-contained, printable pick-ticket HTML document. */
export function pickTicketHtml(ticket: PickTicket, brandName: string): string {
  const rows = ticket.lines
    .map(
      (l) => `<tr>
        <td class="chk"><span class="box"></span></td>
        <td class="sku">${esc(l.sku)}</td>
        <td>${esc(l.name)}</td>
        <td class="qty">${l.qty}</td>
      </tr>`,
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Pick Ticket ${esc(ticket.orderId)}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1D252D; margin: 24px; }
  h1 { font-size: 18px; margin: 0 0 2px; }
  .brand { color: #00AA13; font-weight: bold; letter-spacing: 1px; }
  .meta { font-size: 12px; color: #4F758B; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #1D252D; color: #fff; text-align: left; padding: 6px 8px; }
  td { border-bottom: 1px solid #B7C9D3; padding: 6px 8px; }
  .chk { width: 24px; } .box { display:inline-block; width:14px; height:14px; border:1.5px solid #1D252D; }
  .sku { font-family: monospace; color: #4F758B; } .qty { text-align: right; font-weight: bold; width: 60px; }
  .foot { margin-top: 16px; font-size: 12px; color: #4F758B; }
</style></head><body>
  <div class="brand">${esc(brandName)}</div>
  <h1>WILL-CALL PICK TICKET</h1>
  <div class="meta">
    Order <strong>${esc(ticket.orderId)}</strong> &middot; ${esc(ticket.customer)}<br/>
    Placed: ${fmtDate(ticket.placedAt)} &middot; Printed: ${fmtDate(ticket.printedAt)}<br/>
    ${ticket.lineCount} line${ticket.lineCount === 1 ? "" : "s"} &middot; ${ticket.itemCount} item${ticket.itemCount === 1 ? "" : "s"}
  </div>
  <table>
    <thead><tr><th></th><th>SKU</th><th>Description</th><th style="text-align:right">Qty</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="foot">Picked by: ____________________   Verified: ____________________   Ready for pickup ☐</p>
</body></html>`;
}
