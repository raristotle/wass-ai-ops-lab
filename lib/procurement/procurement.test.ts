import { describe, it, expect } from "vitest";
import { orderTotal, type ProcurementOrder } from "@/lib/procurement/types";
import { buildPunchOutCxml } from "@/lib/procurement/cxml";
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
