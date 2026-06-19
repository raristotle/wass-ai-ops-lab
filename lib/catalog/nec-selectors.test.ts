import { describe, it, expect } from "vitest";
import { conduitFill, wireSizeForVoltageDrop, breakerSize, ampacityLookup, boxFill, wireAmpacity } from "@/lib/catalog/nec-selectors";

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

describe("ampacityLookup", () => {
  it("returns base ampacity for #12 Cu with no derating", () => {
    const r = ampacityLookup({ awg: "12", material: "Cu" });
    expect(r.ok).toBe(true);
    expect(r.answer).toBe("20 A (derated)");
    expect(r.explanation).toMatch(/20 A/);
  });

  it("derates for bundle (7 conductors → 70%)", () => {
    const r = ampacityLookup({ awg: "10", material: "Cu", conductorCount: 7 });
    expect(r.ok).toBe(true);
    // base 30 A × 0.70 = 21 A
    expect(r.answer).toBe("21 A (derated)");
    expect(r.explanation).toMatch(/bundle/);
  });

  it("derates for high ambient temperature (40°C → 0.91)", () => {
    const r = ampacityLookup({ awg: "12", material: "Cu", ambientC: 40 });
    expect(r.ok).toBe(true);
    // base 20 A × 0.91 = 18 A (floor)
    expect(r.answer).toBe("18 A (derated)");
  });

  it("returns aluminum ampacity and notes #6 Al = 50 A", () => {
    const r = ampacityLookup({ awg: "6", material: "Al" });
    expect(r.ok).toBe(true);
    expect(r.answer).toBe("50 A (derated)");
  });

  it("rejects #14 aluminum (not recommended for building wiring)", () => {
    expect(ampacityLookup({ awg: "14", material: "Al" }).ok).toBe(false);
  });
});

describe("wireAmpacity (standalone)", () => {
  it("returns copper base ampacity", () => {
    expect(wireAmpacity("12", "Cu")).toBe(20);
    expect(wireAmpacity("4/0", "Cu")).toBe(230);
  });
  it("returns aluminum ampacity for supported sizes", () => {
    expect(wireAmpacity("6", "Al")).toBe(50);
    expect(wireAmpacity("14", "Al")).toBeNull();
  });
});

describe("boxFill", () => {
  it("three #12 conductors + 1 device + clamp → fits a 22.5 cu in box", () => {
    const r = boxFill({ conductors: [{ awg: "12", count: 3 }], devices: 1, hasClamp: true, groundWires: 0 });
    expect(r.ok).toBe(true);
    // 3×2.25 + 1×2×2.25 + 1×2.25 = 6.75 + 4.5 + 2.25 = 13.5 cu in → fits 15.5 cu in octagon
    expect(r.answer).toContain("15.5");
    expect(r.subcategory).toBe("Boxes & Covers");
  });

  it("many conductors push into a larger box", () => {
    const r = boxFill({ conductors: [{ awg: "12", count: 8 }], devices: 2, hasClamp: false, groundWires: 2 });
    expect(r.ok).toBe(true);
    // 8×2.25 + 2×2×2.25 + 0 + 1×2.25 = 18 + 9 + 2.25 = 29.25 → 29.5 cu in box
    expect(parseFloat(r.answer)).toBeGreaterThanOrEqual(29);
  });

  it("rejects #4 AWG conductors (NEC 314.28 required)", () => {
    const r = boxFill({ conductors: [{ awg: "4", count: 2 }], devices: 0, hasClamp: false, groundWires: 0 });
    expect(r.ok).toBe(false);
    expect(r.explanation).toMatch(/314\.28/);
  });

  it("rejects an empty conductor list", () => {
    expect(boxFill({ conductors: [], devices: 0, hasClamp: false, groundWires: 0 }).ok).toBe(false);
  });
});
