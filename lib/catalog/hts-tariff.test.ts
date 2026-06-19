import { describe, it, expect } from "vitest";
import {
  htsEntryForSubcategory,
  landedTariffForLine,
  hts10,
  SECTION_232_STEEL_PCT,
} from "@/lib/catalog/hts-tariff";
import { HTS_CODE_ENTRIES } from "@/data/real/hts-codes";

describe("HTS code table", () => {
  it("has unique subcategories and well-formed codes/rates", () => {
    const subs = HTS_CODE_ENTRIES.map((e) => e.subcategory);
    expect(new Set(subs).size).toBe(subs.length);
    for (const e of HTS_CODE_ENTRIES) {
      expect(e.hts, e.subcategory).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
      expect(e.mfnDutyPct, e.subcategory).toBeGreaterThanOrEqual(0);
      expect(e.mfnDutyPct, e.subcategory).toBeLessThan(1);
      expect(e.section301Pct, e.subcategory).toBeGreaterThanOrEqual(0);
      expect(e.section301Pct, e.subcategory).toBeLessThanOrEqual(0.25);
    }
  });
  it("covers a broad set of subcategories", () => {
    expect(HTS_CODE_ENTRIES.length).toBeGreaterThanOrEqual(70);
  });
});

describe("hts10", () => {
  it("renders a dotted 8-digit code as a 10-digit code", () => {
    expect(hts10("8536.20.00")).toBe("8536200000");
    expect(hts10("9107.00.80")).toBe("9107008000");
    expect(hts10("8536.20.00")).toMatch(/^\d{10}$/);
  });
});

describe("htsEntryForSubcategory", () => {
  it("resolves a known subcategory", () => {
    expect(htsEntryForSubcategory("Circuit Breakers")?.hts).toBe("8536.20.00");
  });
  it("returns null for an unmapped subcategory", () => {
    expect(htsEntryForSubcategory("Nonexistent Subcat ZZZ")).toBeNull();
  });
});

describe("landedTariffForLine", () => {
  it("stacks MFN + Section 301 for a China-origin breaker", () => {
    const t = landedTariffForLine({
      subcategory: "Circuit Breakers",
      countryOfOrigin: "CN",
      section301: true,
      unitPrice: 100,
      qty: 5,
    })!;
    expect(t.mfnDutyPct).toBe(0.027);
    expect(t.section301Pct).toBe(0.25);
    expect(t.section232Pct).toBe(0);
    expect(t.ratePct).toBeCloseTo(0.277, 4);
    expect(t.dutyPerUnit).toBe(27.7);
    expect(t.dutyLine).toBe(138.5);
    expect(t.htsCode).toBe("8536200000");
    expect(t.program).toBe("MFN 2.7% + Section 301 25%");
  });

  it("charges nothing for US-origin goods", () => {
    const t = landedTariffForLine({
      subcategory: "Circuit Breakers",
      countryOfOrigin: "US",
      section301: false,
      unitPrice: 100,
      qty: 5,
    })!;
    expect(t.ratePct).toBe(0);
    expect(t.dutyLine).toBe(0);
    expect(t.program).toBe("none");
  });

  it("applies MFN but not Section 301 for a non-China import", () => {
    const t = landedTariffForLine({
      subcategory: "Circuit Breakers",
      countryOfOrigin: "MX",
      section301: false,
      unitPrice: 100,
      qty: 1,
    })!;
    expect(t.mfnDutyPct).toBe(0.027);
    expect(t.section301Pct).toBe(0);
    expect(t.ratePct).toBe(0.027);
  });

  it("uses the PER-SUBCATEGORY 301 rate (datacom is List 4A 7.5%, not a flat 25%)", () => {
    const t = landedTariffForLine({
      subcategory: "Network Switches",
      countryOfOrigin: "CN",
      section301: true,
      unitPrice: 100,
      qty: 1,
    })!;
    expect(t.section301Pct).toBe(0.075);
    expect(t.ratePct).toBe(0.075); // MFN Free + 7.5% 301
  });

  it("stacks Section 232 for steel articles (cable tray) on top of 301", () => {
    const cn = landedTariffForLine({
      subcategory: "Cable Tray",
      countryOfOrigin: "CN",
      section301: true,
      unitPrice: 100,
      qty: 1,
    })!;
    expect(cn.section232Pct).toBe(SECTION_232_STEEL_PCT);
    expect(cn.ratePct).toBeCloseTo(0.25 + SECTION_232_STEEL_PCT, 4); // 301 + 232

    // Steel 232 applies to non-China imports too (no 301 there).
    const mx = landedTariffForLine({
      subcategory: "Cable Tray",
      countryOfOrigin: "MX",
      section301: false,
      unitPrice: 100,
      qty: 1,
    })!;
    expect(mx.section301Pct).toBe(0);
    expect(mx.section232Pct).toBe(SECTION_232_STEEL_PCT);
  });

  it("returns null for an unmapped subcategory (caller falls back)", () => {
    expect(
      landedTariffForLine({ subcategory: "Nope ZZZ", countryOfOrigin: "CN", section301: true, unitPrice: 10 }),
    ).toBeNull();
  });
});
