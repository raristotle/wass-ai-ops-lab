import { describe, expect, it } from "vitest";
import {
  orderToProcurement,
  confirmationFromTracking,
  shipNoticeFromTracking,
} from "@/lib/product-finder-order-status";
import { orderTracking } from "@/lib/product-finder-tracking";
import type { Order } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";

const product = (over: Partial<CatalogProduct> = {}): CatalogProduct => ({
  id: "GEN-1", sku: "ACME-1", name: "Acme breaker", brand: "Acme",
  category: "electrical", subcategory: "Circuit Breakers", description: "x",
  unitPrice: 42, uom: "EA", specs: [{ name: "A", value: "20", isNonNeg: true }],
  preferred: false, branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  dataSource: "simulated", lifecycleStatus: "Active", ...over,
});

const order: Order = {
  id: "demo-order-7",
  placedAt: Date.parse("2026-06-10T00:00:00Z"),
  lines: [
    { product: product({ sku: "A-1", name: "Breaker A", brand: "ABB" }), qty: 3 },
    { product: product({ sku: "B-2", name: "Lug B", brand: "Burndy", uom: "PK" }), qty: 5 },
  ],
  total: 100,
  customerId: "CUST-001",
  customerName: "Gulf Coast Industrial",
};

describe("orderToProcurement", () => {
  it("maps an order to a supplier→buyer ProcurementOrder with UNSPSC line detail", () => {
    const po = orderToProcurement(order);
    expect(po.poNumber).toBe("demo-order-7");
    expect(po.supplierId).toBe("MERIDIAN01");
    expect(po.buyerName).toBe("Gulf Coast Industrial");
    expect(po.buyerId).toBe("CUST-001");
    expect(po.lines).toHaveLength(2);
    expect(po.lines[0]).toMatchObject({ sku: "A-1", brand: "ABB", qty: 3, uom: "EA" });
    expect(po.lines[0].unspsc).toMatch(/^\d{8}$/); // an 8-digit UNSPSC code
  });

  it("falls back to walk-in identity when there is no customer", () => {
    const po = orderToProcurement({ ...order, customerId: null, customerName: null });
    expect(po.buyerName).toBe("Walk-in customer");
    expect(po.buyerId).toBe("WALKIN");
  });
});

describe("confirmationFromTracking / shipNoticeFromTracking", () => {
  const now = Date.parse("2026-06-12T00:00:00Z");
  const tracking = orderTracking({ placedAt: order.placedAt, etaDays: 4, method: "delivery" }, now);

  it("confirmation accepts the PO with an estimated ship date from the shipped stage", () => {
    const conf = confirmationFromTracking(tracking, now);
    expect(conf.status).toBe("accept");
    expect(conf.noticeDate).toBe(new Date(now).toISOString());
    expect(conf.estimatedShipDate).toBe(new Date(tracking.stages.find((s) => s.key === "shipped")!.at).toISOString());
  });

  it("ship notice carries ASN id, ship date, ETA-derived delivery date, and method", () => {
    const asn = shipNoticeFromTracking(order, tracking, now);
    expect(asn.shipmentId).toBe("ASN-demo-order-7");
    expect(asn.deliveryDate).toBe(new Date(tracking.etaAt).toISOString());
    expect(asn.method).toBe("delivery");
    expect(Date.parse(asn.shipDate)).toBeGreaterThanOrEqual(order.placedAt);
  });
});
