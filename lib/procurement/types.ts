/**
 * Procurement-integration seam — turn a Meridian quote/basket into the formats
 * a customer's purchasing system actually consumes: a cXML PunchOutOrderMessage
 * (Ariba / Coupa / SAP punchout) and an EDI X12 850 purchase order. Pure
 * generators (lib/procurement/{cxml,edi850}) so they are deterministic and
 * unit-testable; the cart exposes a one-click download.
 */

export interface ProcurementLine {
  sku: string;
  name: string;
  brand: string;
  qty: number;
  unitPrice: number;
  uom: string;
  /** 8-digit UNSPSC commodity code (required by Ariba/Coupa before go-live). */
  unspsc?: string;
}

export interface ProcurementOrder {
  /** Purchase-order / quote number. */
  poNumber: string;
  /** ISO timestamp (passed in so generators stay pure/testable). */
  timestamp: string;
  supplierName: string;
  supplierId: string;
  buyerName: string;
  buyerId: string;
  lines: ProcurementLine[];
}

export function orderTotal(order: ProcurementOrder): number {
  return Math.round(order.lines.reduce((s, l) => s + l.unitPrice * l.qty, 0) * 100) / 100;
}

/**
 * Inputs for the order-lifecycle cXML documents a supplier sends back to a
 * buyer's procurement system AFTER the PO: an OrderConfirmation (we accept /
 * detail / reject the PO) and a ShipNotice / ASN (what shipped, when, how). Kept
 * here with ProcurementOrder so the generators stay pure + deterministic; the
 * route maps a Meridian order + its tracking state into these. All dates are ISO
 * strings (passed in, never read from the clock, so the generators are testable).
 */
export interface OrderConfirmationInput {
  /** ISO timestamp the confirmation is issued. */
  noticeDate: string;
  /** accept = confirm the PO as ordered; detail = line-level; reject = decline. */
  status: "accept" | "detail" | "reject";
  /** ISO estimated ship date (from order tracking), optional. */
  estimatedShipDate?: string;
}

export interface ShipNoticeInput {
  /** Supplier shipment / ASN identifier. */
  shipmentId: string;
  /** ISO timestamp the notice is issued. */
  noticeDate: string;
  /** ISO actual ship date. */
  shipDate: string;
  /** ISO estimated delivery date (from tracking ETA), optional. */
  deliveryDate?: string;
  /** Carrier name; omitted → no ShipControl carrier block (the tracking model has none). */
  carrier?: string;
  /** Carrier tracking number, optional. */
  trackingNumber?: string;
  /** delivery vs will-call — willcall annotates a pickup shipment. */
  method?: "delivery" | "willcall";
}
