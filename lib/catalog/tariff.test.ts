import { describe, it, expect } from "vitest";
import { tariffRate, tariffForLine, tariffRollup } from "@/lib/catalog/tariff";

describe("tariffRate", () => {
  it("is zero with no Section-301 exposure (non-China origin)", () => {
    expect(tariffRate({ htsCode: "8536100012", section301: false })).toEqual({ ratePct: 0, program: "none" });
  });
  it("applies the chapter-85 Section-301 rate (25%) for China-origin electrical goods", () => {
    expect(tariffRate({ htsCode: "8536100012", section301: true })).toEqual({ ratePct: 0.25, program: "Section 301" });
  });
  it("uses the default rate for an unlisted chapter", () => {
    expect(tariffRate({ htsCode: "6506100099", section301: true })).toEqual({ ratePct: 0.075, program: "Section 301" });
  });
});

describe("tariffForLine", () => {
  it("computes dutyPerUnit = unitPrice × rate, dutyLine = × qty", () => {
    const d = tariffForLine({ htsCode: "8536100012", countryOfOrigin: "CN", section301: true, unitPrice: 100, qty: 5 });
    expect(d.ratePct).toBe(0.25);
    expect(d.dutyPerUnit).toBe(25);
    expect(d.dutyLine).toBe(125);
    expect(d.countryOfOrigin).toBe("CN");
  });
  it("is zero duty when not exposed", () => {
    const d = tariffForLine({ htsCode: "8536100012", countryOfOrigin: "US", section301: false, unitPrice: 100, qty: 5 });
    expect(d.dutyPerUnit).toBe(0);
    expect(d.dutyLine).toBe(0);
  });
  it("treats qty < 1 as 1", () => {
    expect(tariffForLine({ htsCode: "8536100012", countryOfOrigin: "CN", section301: true, unitPrice: 40, qty: 0 }).dutyLine).toBe(10);
  });
});

describe("tariffRollup", () => {
  it("sums duty over exposed lines only", () => {
    const duties = [
      tariffForLine({ htsCode: "8536100012", countryOfOrigin: "CN", section301: true, unitPrice: 100, qty: 2 }), // 50
      tariffForLine({ htsCode: "8536100012", countryOfOrigin: "US", section301: false, unitPrice: 100, qty: 2 }), // 0
      tariffForLine({ htsCode: "8504400000", countryOfOrigin: "CN", section301: true, unitPrice: 200, qty: 1 }), // 50
    ];
    expect(tariffRollup(duties)).toEqual({ exposedLines: 2, totalDuty: 100 });
  });
});
