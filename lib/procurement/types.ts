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
