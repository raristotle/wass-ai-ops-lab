import { describe, it, expect } from "vitest";
import {
  estimateRebate,
  isRebateEligibleProduct,
  rebateForQuantity,
  REBATE_REGISTRY,
  REBATE_DISCLAIMER,
} from "@/lib/product-finder-rebates";
import type { CatalogProduct } from "@/features/product-finder/types";

function product(subcategory: string, specs: { name: string; value: string }[] = []): CatalogProduct {
  return {
    id: "p1",
    sku: "SKU1",
    name: "Test fixture",
    brand: "Lithonia Lighting",
    category: "electrical",
    subcategory,
    description: "",
    unitPrice: 100,
    uom: "EA",
    specs,
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "💡",
  } as unknown as CatalogProduct;
}

describe("rebate registry", () => {
  it("covers the main lighting fixture + lamp categories", () => {
    const subs = REBATE_REGISTRY.map((p) => p.subcategory);
    expect(subs).toContain("LED Troffers & Panels");
    expect(subs).toContain("High Bay Fixtures");
    expect(subs).toContain("Lamps & Tubes");
    expect(subs).toContain("Outdoor & Area Lighting");
  });
  it("every program has a sane range and a positive controls multiplier", () => {
    for (const p of REBATE_REGISTRY) {
      expect(p.perUnitLow).toBeGreaterThan(0);
      expect(p.perUnitHigh).toBeGreaterThanOrEqual(p.perUnitLow);
      expect(p.controlsMultiplier).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("estimateRebate", () => {
  it("returns null for a non-lighting subcategory", () => {
    expect(estimateRebate(product("Circuit Breakers"))).toBeNull();
    expect(estimateRebate(product("Drivers & Ballasts"))).toBeNull();
  });

  it("estimates a troffer with the controls uplift band", () => {
    const est = estimateRebate(product("LED Troffers & Panels"))!;
    expect(est).not.toBeNull();
    expect(est.dlcEligible).toBe(true);
    expect(est.unit).toBe("fixture");
    expect(est.perUnitLow).toBe(25);
    expect(est.perUnitHigh).toBe(50);
    // 2.5x controls multiplier
    expect(est.withControlsLow).toBe(62.5);
    expect(est.withControlsHigh).toBe(125);
    expect(est.disclaimer).toBe(REBATE_DISCLAIMER);
  });

  it("detects a qualifying control from specs", () => {
    const withMotion = estimateRebate(product("Outdoor & Area Lighting", [{ name: "Controls", value: "Motion Sensor" }]))!;
    expect(withMotion.controlsDetected).toBe(true);
    const without = estimateRebate(product("Outdoor & Area Lighting", [{ name: "Controls", value: "None" }]))!;
    expect(without.controlsDetected).toBe(false);
  });

  it("detects 0-10V dimming as a control", () => {
    const est = estimateRebate(product("LED Troffers & Panels", [{ name: "Dimming", value: "0-10V" }]))!;
    expect(est.controlsDetected).toBe(true);
  });

  it("lamps are paid per lamp with no controls uplift", () => {
    const est = estimateRebate(product("Lamps & Tubes"))!;
    expect(est.unit).toBe("lamp");
    expect(est.withControlsLow).toBe(est.perUnitLow); // 1.0x
  });
});

describe("isRebateEligibleProduct", () => {
  it("is true for lighting fixtures, false otherwise", () => {
    expect(isRebateEligibleProduct(product("High Bay Fixtures"))).toBe(true);
    expect(isRebateEligibleProduct(product("Wire & Cable"))).toBe(false);
  });
});

describe("rebateForQuantity", () => {
  const est = estimateRebate(product("LED Troffers & Panels"))!;
  it("scales the base band by quantity", () => {
    const t = rebateForQuantity(est, 10, false);
    expect(t.low).toBe(250);
    expect(t.high).toBe(500);
    expect(t.qty).toBe(10);
    expect(t.withControls).toBe(false);
  });
  it("uses the controls band when requested", () => {
    const t = rebateForQuantity(est, 10, true);
    expect(t.low).toBe(625);
    expect(t.high).toBe(1250);
  });
  it("floors fractional and clamps negative quantities", () => {
    expect(rebateForQuantity(est, 2.9, false).qty).toBe(2);
    expect(rebateForQuantity(est, -5, false).low).toBe(0);
  });
});
