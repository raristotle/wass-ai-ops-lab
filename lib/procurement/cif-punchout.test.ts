import { describe, it, expect } from "vitest";
import { buildCif, type CifRow } from "@/lib/procurement/cif";
import {
  parsePunchOutSetupRequest,
  punchoutStartUrl,
  buildPunchOutSetupResponse,
} from "@/lib/procurement/punchout-setup";

const row = (over: Partial<CifRow> = {}): CifRow => ({
  sku: "QO115",
  manufacturerPartId: "QO115",
  description: 'Square D QO115 1-Pole 15A "QO" breaker',
  unspsc: "39121700",
  unitPrice: 8.45,
  uom: "EA",
  leadTimeDays: 3,
  manufacturerName: "Square D",
  supplierUrl: "https://app.raristotle.com/product-finder?sku=QO115",
  ...over,
});

describe("buildCif (CIF 3.0)", () => {
  const cif = buildCif({ supplierId: "0000000", supplierName: "Meridian", timestamp: "2026-06-15T00:00:00Z", rows: [row(), row({ sku: "QO120" })] });

  it("emits the CIF 3.0 header, item count, fieldnames, and ENDOFDATA", () => {
    expect(cif).toMatch(/^CIF_I_V3\.0/);
    expect(cif).toContain("ITEMCOUNT: 2");
    expect(cif).toContain("CODEFORMAT: UNSPSC");
    expect(cif).toContain("FIELDNAMES: Supplier ID,Supplier Part ID");
    expect(cif).toContain("DATA");
    expect(cif.trimEnd().endsWith("ENDOFDATA")).toBe(true);
  });

  it("quotes fields, doubles internal quotes, and formats price to 2dp", () => {
    expect(cif).toContain('"39121700"');
    expect(cif).toContain('"8.45"');
    expect(cif).toContain('Square D QO115 1-Pole 15A ""QO"" breaker'); // internal quotes doubled
  });
});

describe("parsePunchOutSetupRequest — Level 1 vs Level 2", () => {
  it("is Level 1 (store home) when there is no SelectedItem", () => {
    const xml = `<cXML><Request><PunchOutSetupRequest operation="create"><BuyerCookie>abc</BuyerCookie></PunchOutSetupRequest></Request></cXML>`;
    const p = parsePunchOutSetupRequest(xml);
    expect(p.level).toBe(1);
    expect(p.selectedItemId).toBeNull();
    expect(p.operation).toBe("create");
    expect(p.buyerCookie).toBe("abc");
  });

  it("is Level 2 (item-level) when a SelectedItem carries a SupplierPartID", () => {
    const xml = `<cXML><Request><PunchOutSetupRequest operation="edit"><BuyerCookie>c2</BuyerCookie>
      <SelectedItem><ItemID><SupplierPartID>QO115</SupplierPartID></ItemID></SelectedItem>
      </PunchOutSetupRequest></Request></cXML>`;
    const p = parsePunchOutSetupRequest(xml);
    expect(p.level).toBe(2);
    expect(p.selectedItemId).toBe("QO115");
    expect(p.operation).toBe("edit");
  });
});

describe("punchoutStartUrl", () => {
  it("deep-links to the SKU for Level 2, store home for Level 1", () => {
    expect(punchoutStartUrl("https://x.com/", "QO115")).toBe("https://x.com/product-finder?sku=QO115");
    expect(punchoutStartUrl("https://x.com", null)).toBe("https://x.com/product-finder");
  });
});

describe("buildPunchOutSetupResponse", () => {
  it("returns a 200 response carrying the StartPage URL", () => {
    const xml = buildPunchOutSetupResponse({ payloadID: "p1", timestamp: "2026-06-15T00:00:00Z", startUrl: "https://x.com/product-finder?sku=QO115" });
    expect(xml).toContain('<Status code="200" text="OK"/>');
    expect(xml).toContain("<StartPage>");
    expect(xml).toContain("https://x.com/product-finder?sku=QO115");
  });
});
