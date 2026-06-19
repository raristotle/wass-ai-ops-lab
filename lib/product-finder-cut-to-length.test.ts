import { describe, it, expect } from "vitest";
import {
  isSoldByFoot,
  extractWireAwg,
  extractConductorMaterial,
  calcCutToLength,
  cutToLengthLabel,
} from "@/lib/product-finder-cut-to-length";
import type { CatalogProduct } from "@/features/product-finder/types";

function p(overrides: Partial<CatalogProduct>): CatalogProduct {
  return {
    id: "test-1", sku: "TEST", name: "Test product", brand: "Acme",
    category: "electrical", subcategory: "Wire & Cable",
    description: "", unitPrice: 1.50, uom: "ft",
    specs: [], preferred: false, branchStock: [], dcStock: [],
    externalSources: [], imageIcon: "wire", dataSource: "simulated",
    ...overrides,
  };
}

describe("isSoldByFoot", () => {
  it("true for uom=ft", () => expect(isSoldByFoot(p({ uom: "ft" }))).toBe(true));
  it("true for uom=lf", () => expect(isSoldByFoot(p({ uom: "lf" }))).toBe(true));
  it("false for uom=ea", () => expect(isSoldByFoot(p({ uom: "ea" }))).toBe(false));
  it("false for uom=box", () => expect(isSoldByFoot(p({ uom: "box" }))).toBe(false));
});

describe("extractWireAwg", () => {
  it("detects 12 AWG from name", () =>
    expect(extractWireAwg(p({ name: "Southwire 12 AWG THHN Copper Wire" }))).toBe("12"));
  it("detects 4/0 AWG from name", () =>
    expect(extractWireAwg(p({ name: "4/0 AWG Aluminum XHHW" }))).toBe("4/0"));
  it("detects 1/0 AWG (not confused with 1)", () =>
    expect(extractWireAwg(p({ name: "Belden 1/0 AWG feeder" }))).toBe("1/0"));
  it("returns null when no AWG present", () =>
    expect(extractWireAwg(p({ name: "3/4 EMT Conduit" }))).toBeNull());
});

describe("extractConductorMaterial", () => {
  it("copper from THHN keyword", () =>
    expect(extractConductorMaterial(p({ name: "12 AWG THHN copper" }))).toBe("Cu"));
  it("aluminum from 'aluminum' keyword", () =>
    expect(extractConductorMaterial(p({ name: "4/0 AWG aluminum XHHW" }))).toBe("Al"));
  it("null when undetectable", () =>
    expect(extractConductorMaterial(p({ name: "12 AWG wire" }))).toBeNull());
});

describe("calcCutToLength", () => {
  const wire = p({ name: "Southwire 12 AWG THHN Copper Wire", unitPrice: 0.45 });

  it("returns qty = ceil(lengthFt)", () => {
    const r = calcCutToLength(wire, 73.5);
    expect(r.qty).toBe(74);
    expect(r.lengthFt).toBe(73.5);
  });

  it("totalPrice = qty × unitPrice", () => {
    const r = calcCutToLength(wire, 100);
    expect(r.totalPrice).toBeCloseTo(100 * 0.45, 5);
  });

  it("provides NEC ampacity for a 12 AWG Cu wire (20 A)", () => {
    const r = calcCutToLength(wire, 50);
    expect(r.ampacity).toBe(20);
    expect(r.note).toContain("20 A");
    expect(r.note).toContain("NEC 310.15");
  });

  it("ampacity is null for conduit (no AWG in name)", () => {
    const conduit = p({ name: "3/4 EMT Conduit", unitPrice: 0.89, subcategory: "Conduit" });
    const r = calcCutToLength(conduit, 10);
    expect(r.ampacity).toBeNull();
    expect(r.note).toBeNull();
  });

  it("returns zeros for zero or negative length", () => {
    expect(calcCutToLength(wire, 0).qty).toBe(0);
    expect(calcCutToLength(wire, -5).qty).toBe(0);
  });
});

describe("cutToLengthLabel", () => {
  it("formats qty and total price", () => {
    const r = calcCutToLength(p({ unitPrice: 1.5 }), 10);
    expect(cutToLengthLabel(r)).toBe("10 ft — $15.00");
  });
});
