# Order-lifecycle cXML — OrderConfirmation & ShipNotice

After a buyer's procurement system sends a PO (via the shipped PunchOut / EDI 850
path), the supplier sends back two standard cXML lifecycle documents. Sprint 6 adds
both as **pure, deterministic generators** that reuse the existing `ProcurementOrder`
type and `esc()` XML-escaper, plus an **operator-triggered** endpoint and a download
affordance on the order-tracking panel. Document generation is **$0/deterministic**;
transmission is **operator-triggered only — never scheduled (no cron)**.

| Document | cXML message | What it says |
|---|---|---|
| **OrderConfirmation** | `ConfirmationRequest` | We **accept** / detail / reject the PO; carries the order total, an `OrderReference` back to the PO, and a per-line `ConfirmationStatus` with the estimated ship date. |
| **ShipNotice (ASN)** | `ShipNoticeRequest` | What **shipped**, when (`shipmentDate`), estimated delivery (`deliveryDate`), optional carrier/tracking (`ShipControl`), and a `ShipNoticeItem` per line. Will-call shipments are annotated. |

## Files

| File | Role |
|---|---|
| `lib/procurement/cxml.ts` | `buildOrderConfirmationCxml(order, input)` + `buildShipNoticeCxml(order, input)` — pure cXML 1.2.014 generators reusing `esc()` + a shared `lifecycleHeader`/`orderReference`. |
| `lib/procurement/types.ts` | `OrderConfirmationInput` + `ShipNoticeInput` (all dates are ISO strings, passed in so the generators stay testable). |
| `lib/product-finder-order-status.ts` | Pure mappers: `orderToProcurement(order)` (a placed order → `ProcurementOrder`, UNSPSC line detail), `confirmationFromTracking` / `shipNoticeFromTracking` (derive the inputs from the order's `OrderTracking` state). |
| `apps/web/app/api/procurement/order-status/route.ts` | `POST { kind: "confirmation"|"shipnotice", order, confirmation|shipment }` → the cXML document. Rate-limited + body-capped; like CIF/PunchOut it is an external B2B surface (operator/buyer supplies the order in the body; no tenant data read). |
| `features/product-finder/OrderTracking.tsx` | "Procurement cXML" row with **Order confirmation** / **Ship notice (ASN)** download buttons (operator-triggered). |

## Graceful degrade

The app's `OrderTracking` model is derived (no carrier or tracking number), so the
ShipNotice **omits the `ShipControl` block unless a carrier/tracking number is
supplied** — the document stays valid either way. The ship date comes from the
`shipped` tracking stage; the delivery date from the order ETA.

## No cron

Both documents are generated only when the operator clicks the button (or an
authenticated agent POSTs) — there is no scheduled emission, per the project rule.
