/**
 * Map a placed Meridian order + its derived tracking state into the inputs for
 * the order-lifecycle cXML documents (v3-S6 #13): an OrderConfirmation and a
 * ShipNotice/ASN. Pure + deterministic (now injected) so it is unit-testable;
 * OrderTracking.tsx calls these to POST /api/procurement/order-status and
 * download the cXML. Reuses the shipped UNSPSC classifier for line detail.
 */

import type { Order } from "@/lib/product-finder-store";
import type { OrderTracking } from "@/lib/product-finder-tracking";
import type {
  ProcurementOrder,
  ProcurementLine,
  OrderConfirmationInput,
  ShipNoticeInput,
} from "@/lib/procurement/types";
import { unspscCode } from "@/lib/catalog/unspsc";

const SUPPLIER_NAME = "Meridian Supply Co.";
const SUPPLIER_ID = "MERIDIAN01";

/** A placed order as a ProcurementOrder (supplier = Meridian, buyer = customer). */
export function orderToProcurement(order: Order): ProcurementOrder {
  const lines: ProcurementLine[] = order.lines.map((l) => ({
    sku: l.product.sku,
    name: l.product.name,
    brand: l.product.brand,
    qty: l.qty,
    unitPrice: l.product.unitPrice,
    uom: l.product.uom,
    unspsc: unspscCode(l.product),
  }));
  return {
    poNumber: order.id,
    timestamp: new Date(order.placedAt).toISOString(),
    supplierName: SUPPLIER_NAME,
    supplierId: SUPPLIER_ID,
    buyerName: order.customerName ?? "Walk-in customer",
    buyerId: order.customerId ?? "WALKIN",
    lines,
  };
}

function stageAt(tracking: OrderTracking, key: string): number | null {
  const s = tracking.stages.find((x) => x.key === key);
  return s ? s.at : null;
}

/** OrderConfirmation input: accept the PO, estimated ship date from tracking. */
export function confirmationFromTracking(tracking: OrderTracking, now: number): OrderConfirmationInput {
  const shipAt = stageAt(tracking, "shipped");
  return {
    noticeDate: new Date(now).toISOString(),
    status: "accept",
    estimatedShipDate: shipAt != null ? new Date(shipAt).toISOString() : undefined,
  };
}

/** ShipNotice/ASN input: ship date from the shipped stage, delivery from the ETA. */
export function shipNoticeFromTracking(order: Order, tracking: OrderTracking, now: number): ShipNoticeInput {
  const shipAt = stageAt(tracking, "shipped") ?? now;
  return {
    shipmentId: `ASN-${order.id}`,
    noticeDate: new Date(now).toISOString(),
    shipDate: new Date(shipAt).toISOString(),
    deliveryDate: new Date(tracking.etaAt).toISOString(),
    method: tracking.method,
  };
}
