# Will-call pick-ticket + branch queue — v4-S4 #12

A branch view of the orders staged for **will-call pickup**, with a printable
**pick ticket** to pull the stock. Pure, $0 — it reuses the per-order
fulfillment map (`delivery | willcall`) the order-tracking feature already
records, so there's no schema change.

## Architecture

- **`lib/product-finder-pick-ticket.ts`** (pure): `willCallOrders(orders,
  fulfillment)` filters + sorts the queue; `buildPickTicket(order, now)` rolls an
  order into a ticket (line/item counts); `pickTicketHtml(ticket, brandName)`
  builds a self-contained, **XSS-escaped** printable HTML document.
- **`WillCallQueueModal`**: lists the queue (order, customer, items, placed date)
  with a **Print pick ticket** button that opens the ticket in a print window.
  Fully localized (en/es) via the i18n helper.
- **Dashboard**: a "N orders staged for will-call pickup" card (hidden when the
  queue is empty) opens the modal.
- Store flag `willCallOpen`; the command-palette overlay guard includes it.

## How an order becomes will-call
A rep chooses the fulfillment method (delivery vs will-call) on an order; that's
stored in `orderFulfillment[orderId]`. The queue is simply the orders whose method
is `willcall`. No branchId is on the order model yet, so the queue is branch-wide;
adding a per-order branch tag is the natural next step.

## Notes
- The pick ticket is plain printable HTML (no PDF dependency) — works with the
  browser's Print → Save as PDF.
- All product names + the brand are HTML-escaped before printing.
- No 3rd-party account or env var required.
