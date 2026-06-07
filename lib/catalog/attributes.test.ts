import { describe, it, expect } from "vitest";
import { parseAttribute, NUMERIC_SPECS } from "@/lib/catalog/attributes";

// ─── NUMERIC_SPECS allow-list ─────────────────────────────────────────────────

describe("NUMERIC_SPECS allow-list", () => {
  it("contains expected spec names", () => {
    const keys = Object.keys(NUMERIC_SPECS);
    expect(keys).toContain("Amperage");
    expect(keys).toContain("Voltage");
    expect(keys).toContain("Wattage");
    expect(keys).toContain("Lumens");
    expect(keys).toContain("Gauge");
    expect(keys).toContain("kVA");
    expect(keys).toContain("Ports");
    expect(keys).toContain("CCT");
    expect(keys).toContain("Height");
  });

  it("each entry has a non-empty unit string", () => {
    for (const [, meta] of Object.entries(NUMERIC_SPECS)) {
      expect(typeof meta.unit).toBe("string");
      expect(meta.unit.length).toBeGreaterThan(0);
    }
  });
});

// ─── parseAttribute — happy-path examples ─────────────────────────────────────

describe("parseAttribute – known numeric specs", () => {
  it("Amperage: '15A' → 15", () => {
    expect(parseAttribute("Amperage", "15A")).toEqual({ numeric: 15, unit: "A" });
  });

  it("Amperage: '20A' → 20", () => {
    expect(parseAttribute("Amperage", "20A")).toEqual({ numeric: 20, unit: "A" });
  });

  it("Amperage: '100A' → 100", () => {
    expect(parseAttribute("Amperage", "100A")).toEqual({ numeric: 100, unit: "A" });
  });

  it("Voltage: '120/240V' → 120 (first number)", () => {
    expect(parseAttribute("Voltage", "120/240V")).toEqual({ numeric: 120, unit: "V" });
  });

  it("Voltage: '240V' → 240", () => {
    expect(parseAttribute("Voltage", "240V")).toEqual({ numeric: 240, unit: "V" });
  });

  it("Voltage: '277/480V' → 277", () => {
    expect(parseAttribute("Voltage", "277/480V")).toEqual({ numeric: 277, unit: "V" });
  });

  it("Wattage: '150W LED' → 150", () => {
    expect(parseAttribute("Wattage", "150W LED")).toEqual({ numeric: 150, unit: "W" });
  });

  it("Wattage: '60W' → 60", () => {
    expect(parseAttribute("Wattage", "60W")).toEqual({ numeric: 60, unit: "W" });
  });

  it("Lumens: '1000 lm' → 1000", () => {
    expect(parseAttribute("Lumens", "1000 lm")).toEqual({ numeric: 1000, unit: "lm" });
  });

  it("Lumens: '3300 lm' → 3300", () => {
    expect(parseAttribute("Lumens", "3300 lm")).toEqual({ numeric: 3300, unit: "lm" });
  });

  it("Lumens: '42000 lm' → 42000", () => {
    expect(parseAttribute("Lumens", "42000 lm")).toEqual({ numeric: 42000, unit: "lm" });
  });

  it("Gauge: '12 AWG' → 12", () => {
    expect(parseAttribute("Gauge", "12 AWG")).toEqual({ numeric: 12, unit: "AWG" });
  });

  it("Gauge: '14 AWG' → 14", () => {
    expect(parseAttribute("Gauge", "14 AWG")).toEqual({ numeric: 14, unit: "AWG" });
  });

  it("Ports: '24-Port' → 24", () => {
    expect(parseAttribute("Ports", "24-Port")).toEqual({ numeric: 24, unit: "ports" });
  });

  it("Ports: '48-Port' → 48", () => {
    expect(parseAttribute("Ports", "48-Port")).toEqual({ numeric: 48, unit: "ports" });
  });

  it("CCT: '4000K' → 4000", () => {
    expect(parseAttribute("CCT", "4000K")).toEqual({ numeric: 4000, unit: "K" });
  });

  it("CCT: '5000K' → 5000", () => {
    expect(parseAttribute("CCT", "5000K")).toEqual({ numeric: 5000, unit: "K" });
  });

  it("Height: '42U' → 42", () => {
    expect(parseAttribute("Height", "42U")).toEqual({ numeric: 42, unit: "U" });
  });

  it("Height: '12U' → 12", () => {
    expect(parseAttribute("Height", "12U")).toEqual({ numeric: 12, unit: "U" });
  });

  it("kVA: '15 kVA' → 15", () => {
    expect(parseAttribute("kVA", "15 kVA")).toEqual({ numeric: 15, unit: "kVA" });
  });

  it("kVA: '112.5 kVA' → 112.5 (decimal)", () => {
    expect(parseAttribute("kVA", "112.5 kVA")).toEqual({ numeric: 112.5, unit: "kVA" });
  });

  it("kVA: '30 kVA' → 30", () => {
    expect(parseAttribute("kVA", "30 kVA")).toEqual({ numeric: 30, unit: "kVA" });
  });
});

// ─── parseAttribute — null cases ──────────────────────────────────────────────

describe("parseAttribute – returns null for non-numeric or unknown specs", () => {
  it("returns null for a spec name not in NUMERIC_SPECS", () => {
    expect(parseAttribute("Color", "Red")).toBeNull();
  });

  it("returns null for 'Type' (not numeric)", () => {
    expect(parseAttribute("Type", "GFCI")).toBeNull();
  });

  it("returns null for 'Material' (not numeric)", () => {
    expect(parseAttribute("Material", "Steel")).toBeNull();
  });

  it("returns null when no number is parseable from the value", () => {
    expect(parseAttribute("Voltage", "no-number")).toBeNull();
  });

  it("returns null when the value is a pure text string with no digits", () => {
    expect(parseAttribute("Amperage", "High")).toBeNull();
  });

  it("returns null for empty string value", () => {
    expect(parseAttribute("Amperage", "")).toBeNull();
  });

  it("returns null for an unknown spec name even with a numeric-looking value", () => {
    expect(parseAttribute("Junk", "100")).toBeNull();
  });
});

// ─── parseAttribute — deterministic ──────────────────────────────────────────

describe("parseAttribute – deterministic", () => {
  it("returns the same result on repeated calls", () => {
    const r1 = parseAttribute("Amperage", "15A");
    const r2 = parseAttribute("Amperage", "15A");
    expect(r1).toEqual(r2);
  });

  it("'120/240V' always returns the first number (120), never the second", () => {
    for (let i = 0; i < 5; i++) {
      expect(parseAttribute("Voltage", "120/240V")).toEqual({ numeric: 120, unit: "V" });
    }
  });
});
