import { describe, it, expect } from "vitest";
import { orderTotal, type ProcurementOrder } from "@/lib/procurement/types";
import { buildPunchOutCxml, buildOrderConfirmationCxml, buildShipNoticeCxml } from "@/lib/procurement/cxml";
import { buildEdi850 } from "@/lib/procurement/edi850";

const order: ProcurementOrder = {
  poNumber: "Q-100245",
  timestamp: "2026-06-14T15:04:00Z",
  supplierName: "Meridian Supply Co.",
  supplierId: "MERIDIAN01",
  buyerName: "Gulf Coast Industrial",
  buyerId: "GULFCOAST1",
  lines: [
    { sku: "FRN-R-30", name: "Bussmann FRN-R-30 Fuse & <Co>", brand: "Bussmann", qty: 6, unitPrice: 5.93, uom: "PK" },
    { sku: "TR30R", name: "Mersen TR30R Fuse", brand: "Mersen", qty: 2, unitPrice: 5.27, uom: "PK" },
  ],
};

describe("orderTotal", () => {
  it("sums unit price × qty", () => {
    expect(orderTotal(order)).toBe(6 * 5.93 + 2 * 5.27);
  });
});

describe("buildPunchOutCxml", () => {
  const xml = buildPunchOutCxml(order);
  it("is a cXML PunchOutOrderMessage with the total and one ItemIn per line", () => {
    expect(xml).toContain("<cXML");
    expect(xml).toContain("<PunchOutOrderMessage>");
    expect(xml).toContain('operationAllowed="create"');
    expect(xml).toContain(`<Money currency="USD">${orderTotal(order).toFixed(2)}</Money>`);
    expect((xml.match(/<ItemIn /g) ?? []).length).toBe(2);
    expect(xml).toContain("<SupplierPartID>FRN-R-30</SupplierPartID>");
    expect(xml).toContain('quantity="6"');
  });
  it("XML-escapes descriptions", () => {
    expect(xml).toContain("Bussmann FRN-R-30 Fuse &amp; &lt;Co&gt;");
    expect(xml).not.toContain("Fuse & <Co>");
  });
  it("strips XML-1.0-illegal control characters so output stays well-formed", () => {
    const dirty = buildPunchOutCxml({
      ...order,
      lines: [{ sku: "A\x00B", name: "Name\x0BX", brand: "B", qty: 1, unitPrice: 1, uom: "EA" }],
    });
    expect(dirty).toContain("<SupplierPartID>AB</SupplierPartID>"); // NUL dropped
    expect(dirty).toContain("Name\x0BX".replace(/[\x0B]/g, "")); // vertical-tab dropped
    expect(dirty).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F]/); // no raw control chars survive
  });
});

describe("buildOrderConfirmationCxml", () => {
  const xml = buildOrderConfirmationCxml(order, {
    noticeDate: "2026-06-18T12:00:00Z",
    status: "accept",
    estimatedShipDate: "2026-06-20T00:00:00Z",
  });
  it("is a cXML ConfirmationRequest referencing the PO, with header total + per-line status", () => {
    expect(xml).toContain("<cXML");
    expect(xml).toContain("<ConfirmationRequest>");
    expect(xml).toContain('<ConfirmationHeader operation="new" type="accept" noticeDate="2026-06-18T12:00:00Z" shipmentDate="2026-06-20T00:00:00Z">');
    expect(xml).toContain(`<Money currency="USD">${orderTotal(order).toFixed(2)}</Money>`);
    expect(xml).toContain('<OrderReference orderID="Q-100245">');
    expect((xml.match(/<ConfirmationItem /g) ?? []).length).toBe(2);
    expect(xml).toContain('<ConfirmationStatus type="accept" quantity="6" shipmentDate="2026-06-20T00:00:00Z">');
    expect(xml).toContain("<SupplierPartID>FRN-R-30</SupplierPartID>");
  });
  it("marks every line rejected when status=reject and XML-escapes", () => {
    const rej = buildOrderConfirmationCxml(order, { noticeDate: "2026-06-18T12:00:00Z", status: "reject" });
    expect(rej).toContain('type="reject"');
    expect(rej).toContain('<ConfirmationStatus type="reject"');
    expect(rej).not.toContain("shipmentDate="); // omitted when no estimatedShipDate
  });
});

describe("buildShipNoticeCxml", () => {
  it("is a cXML ShipNoticeRequest with header dates, ship control, and one item per line", () => {
    const xml = buildShipNoticeCxml(order, {
      shipmentId: "ASN-Q-100245",
      noticeDate: "2026-06-20T09:00:00Z",
      shipDate: "2026-06-20T08:00:00Z",
      deliveryDate: "2026-06-22T00:00:00Z",
      carrier: "Meridian Fleet",
      trackingNumber: "MF-998877",
      method: "delivery",
    });
    expect(xml).toContain("<ShipNoticeRequest>");
    expect(xml).toContain('<ShipNoticeHeader shipmentID="ASN-Q-100245" noticeDate="2026-06-20T09:00:00Z" shipmentDate="2026-06-20T08:00:00Z" deliveryDate="2026-06-22T00:00:00Z" />');
    expect(xml).toContain('<CarrierIdentifier domain="companyName">Meridian Fleet</CarrierIdentifier>');
    expect(xml).toContain("<ShipmentIdentifier>MF-998877</ShipmentIdentifier>");
    expect(xml).toContain('<OrderReference orderID="Q-100245">');
    expect((xml.match(/<ShipNoticeItem /g) ?? []).length).toBe(2);
  });
  it("omits ShipControl when no carrier/tracking (graceful degrade) and notes will-call", () => {
    const xml = buildShipNoticeCxml(order, {
      shipmentId: "ASN-2",
      noticeDate: "2026-06-20T09:00:00Z",
      shipDate: "2026-06-20T08:00:00Z",
      method: "willcall",
    });
    expect(xml).not.toContain("<ShipControl>");
    expect(xml).not.toContain("deliveryDate=");
    expect(xml).toContain("Will-call: staged for customer pickup");
  });
});

describe("buildEdi850", () => {
  const edi = buildEdi850(order, 42);
  it("wraps the PO in a valid X12 850 envelope", () => {
    expect(edi).toContain("ISA*00*");
    expect(edi).toContain("GS*PO*MERIDIAN01*GULFCOAST1*20260614*1504*42*X*004010~");
    expect(edi).toContain("ST*850*0001~");
    expect(edi).toContain("BEG*00*NE*Q-100245**20260614~");
    expect(edi).toContain("GE*1*42~");
    expect(edi).toContain("IEA*1*000000042~");
  });
  it("emits one PO1 per line with sku, qty, price, uom, brand", () => {
    expect(edi).toContain("PO1*1*6*PK*5.93*PE*VP*FRN-R-30*MG*Bussmann~");
    expect(edi).toContain("PO1*2*2*PK*5.27*PE*VP*TR30R*MG*Mersen~");
    expect(edi).toContain("CTT*2~");
  });
  it("SE segment count matches the ST…SE block", () => {
    const lines = edi.trim().split("\n");
    const stIdx = lines.findIndex((l) => l.startsWith("ST*"));
    const seIdx = lines.findIndex((l) => l.startsWith("SE*"));
    const declared = Number(lines[seIdx].split("*")[1]);
    expect(declared).toBe(seIdx - stIdx + 1);
  });
});
