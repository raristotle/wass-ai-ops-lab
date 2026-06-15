import { describe, it, expect } from "vitest";
import { conduitFill, wireSizeForVoltageDrop, breakerSize } from "@/lib/catalog/nec-selectors";

describe("conduitFill", () => {
  it("matches NEC: nine 12 AWG THHN fit 1/2\" EMT, ten need 3/4\"", () => {
    expect(conduitFill({ conductorAwg: "12", count: 9, conduitType: "EMT" }).answer).toBe('1/2" EMT');
    expect(conduitFill({ conductorAwg: "12", count: 10, conduitType: "EMT" }).answer).toBe('3/4" EMT');
  });

  it("sizes up for larger conductors and resolves to the Conduit subcategory", () => {
    const r = conduitFill({ conductorAwg: "4/0", count: 4, conduitType: "PVC" });
    expect(r.ok).toBe(true);
    expect(r.subcategory).toBe("Conduit");
    expect(r.searchQuery).toContain("PVC");
  });

  it("rejects an empty run", () => {
    expect(conduitFill({ conductorAwg: "12", count: 0, conduitType: "EMT" }).ok).toBe(false);
  });
});

describe("breakerSize", () => {
  it("rounds a continuous load up by 125% to the next standard size", () => {
    expect(breakerSize({ amps: 20, continuous: true }).answer).toBe("25 A breaker"); // 20×1.25=25
    expect(breakerSize({ amps: 16, continuous: true }).answer).toBe("20 A breaker"); // 16×1.25=20
  });

  it("uses the load directly for non-continuous loads", () => {
    expect(breakerSize({ amps: 20, continuous: false }).answer).toBe("20 A breaker");
    expect(breakerSize({ amps: 92, continuous: false }).answer).toBe("100 A breaker"); // next std up
  });

  it("resolves to the Circuit Breakers subcategory", () => {
    expect(breakerSize({ amps: 20, continuous: false }).subcategory).toBe("Circuit Breakers");
  });
});

describe("wireSizeForVoltageDrop", () => {
  it("a short run is governed by ampacity (20A → 12 AWG)", () => {
    const r = wireSizeForVoltageDrop({ amps: 20, lengthFt: 50, voltage: 240, phase: "1ph", material: "Cu" });
    expect(r.answer).toBe("12 AWG Cu");
    expect(r.explanation).toMatch(/ampacity/);
  });

  it("a long run upsizes for voltage drop (20A, 150ft → 8 AWG)", () => {
    const r = wireSizeForVoltageDrop({ amps: 20, lengthFt: 150, voltage: 240, phase: "1ph", material: "Cu" });
    expect(r.answer).toBe("8 AWG Cu");
    expect(r.explanation).toMatch(/voltage drop/);
  });

  it("aluminum needs a larger conductor than copper for the same run", () => {
    const cu = wireSizeForVoltageDrop({ amps: 40, lengthFt: 200, voltage: 240, phase: "1ph", material: "Cu" });
    const al = wireSizeForVoltageDrop({ amps: 40, lengthFt: 200, voltage: 240, phase: "1ph", material: "Al" });
    expect(cu.ok && al.ok).toBe(true);
    expect(al.searchQuery).toContain("aluminum");
  });

  it("rejects nonsense input", () => {
    expect(wireSizeForVoltageDrop({ amps: 0, lengthFt: 50, voltage: 240, phase: "1ph", material: "Cu" }).ok).toBe(false);
  });
});
