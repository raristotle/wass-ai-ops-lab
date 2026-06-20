import { describe, it, expect } from "vitest";
import {
  normalizeAttribute,
  normalizeAttributes,
  normalizeRecord,
  attributeCoverage,
} from "@/lib/ingest/attribute-normalize";
import type { IngestRecord } from "@/lib/ingest/source-adapter";

describe("normalizeAttribute", () => {
  it("maps name + parses numeric and canonical unit", () => {
    const n = normalizeAttribute({ name: "Amperage", value: "20 A" });
    expect(n).toMatchObject({ key: "amperage", label: "Amperage", value: "20 A", numeric: 20, unit: "A" });
    expect(n?.raw).toEqual({ name: "Amperage", value: "20 A" });
  });

  it("parses a value with no space before the unit", () => {
    expect(normalizeAttribute({ name: "Voltage", value: "120VAC" })).toMatchObject({ numeric: 120, unit: "V" });
  });

  it("keeps the first number of a range and the raw value", () => {
    const n = normalizeAttribute({ name: "Voltage", value: "120/240 V" });
    expect(n?.numeric).toBe(120);
    expect(n?.value).toBe("120/240 V");
    expect(n?.unit).toBe("V");
  });

  it("does NOT invent a unit when the source has none", () => {
    const n = normalizeAttribute({ name: "Poles", value: "2" });
    expect(n).toMatchObject({ key: "poles", numeric: 2 });
    expect(n?.unit).toBeUndefined();
  });

  it("drops a unit from a mismatched family rather than asserting it", () => {
    // trade-size expects inches; a "mm" reading is kept as raw value, no canonical unit.
    const n = normalizeAttribute({ name: "Diameter", value: "12 mm" });
    expect(n?.unit).toBeUndefined();
    expect(n?.value).toBe("12 mm");
  });

  it("never invents a unit from a trailing WORD with no adjacent number (honesty)", () => {
    // "Class F" must NOT become °F; "Grade A" must NOT become A; the unit must follow a number.
    expect(normalizeAttribute({ name: "Operating Temperature", value: "Class F" })?.unit).toBeUndefined();
    expect(normalizeAttribute({ name: "Amperage", value: "Grade A" })?.unit).toBeUndefined();
    expect(normalizeAttribute({ name: "Amperage", value: "Grade A" })?.numeric).toBeUndefined();
    // A real adjacent reading still parses.
    expect(normalizeAttribute({ name: "Operating Temperature", value: "75 °C" })?.unit).toBe("°C");
  });

  it("returns null for an unmapped name or an empty value", () => {
    expect(normalizeAttribute({ name: "Warranty", value: "5 years" })).toBeNull();
    expect(normalizeAttribute({ name: "Amperage", value: "   " })).toBeNull();
  });
});

describe("normalizeAttributes", () => {
  it("dedupes by canonical key (first wins) and collects unmapped names", () => {
    const { normalized, unmapped } = normalizeAttributes([
      { name: "Amps", value: "20 A" },
      { name: "Current Rating", value: "30 A" }, // same canonical key → ignored (first wins)
      { name: "Poles", value: "1" },
      { name: "Warranty", value: "5 yr" }, // unmapped
    ]);
    expect(normalized.map((n) => n.key)).toEqual(["amperage", "poles"]);
    expect(normalized[0].value).toBe("20 A"); // first occurrence kept
    expect(unmapped).toEqual([{ name: "Warranty", value: "5 yr" }]);
  });
});

describe("normalizeRecord", () => {
  const base: IngestRecord = { mpn: "X", sourceUrl: "https://s/1", confidence: 96 };

  it("attaches normalizedAttributes derived from raw attributes", () => {
    const r = normalizeRecord({ ...base, attributes: [{ name: "Amperage", value: "20 A" }, { name: "Poles", value: "1" }] });
    expect(r.normalizedAttributes?.map((n) => n.key)).toEqual(["amperage", "poles"]);
    // raw attributes are preserved untouched
    expect(r.attributes).toHaveLength(2);
  });

  it("leaves a record without attributes unchanged", () => {
    const r = normalizeRecord(base);
    expect(r.normalizedAttributes).toBeUndefined();
    expect(r).toBe(base);
  });

  it("does not attach an empty normalizedAttributes when nothing maps", () => {
    const r = normalizeRecord({ ...base, attributes: [{ name: "Warranty", value: "5 yr" }] });
    expect(r.normalizedAttributes).toBeUndefined();
  });
});

describe("attributeCoverage", () => {
  it("reports mapped ÷ seen across records, ignoring empty values", () => {
    const records: IngestRecord[] = [
      { mpn: "A", sourceUrl: "u", confidence: 96, attributes: [{ name: "Amps", value: "20 A" }, { name: "Warranty", value: "5 yr" }] },
      { mpn: "B", sourceUrl: "u", confidence: 96, attributes: [{ name: "Voltage", value: "120 V" }, { name: "Blank", value: "  " }] },
    ];
    const cov = attributeCoverage(records);
    expect(cov.attributesSeen).toBe(3); // blank value ignored
    expect(cov.attributesMapped).toBe(2); // amps + voltage
    expect(cov.coverage).toBe(67);
  });

  it("is 0 for no attributes", () => {
    expect(attributeCoverage([{ mpn: "A", sourceUrl: "u", confidence: 96 }])).toEqual({
      attributesSeen: 0,
      attributesMapped: 0,
      coverage: 0,
    });
  });
});
