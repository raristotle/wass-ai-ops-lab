import { describe, it, expect } from "vitest";
import { resolveAttribute, canonicalUnit, normalizeName, ATTRIBUTE_TAXONOMY } from "@/lib/ingest/attribute-taxonomy";

describe("ATTRIBUTE_TAXONOMY", () => {
  it("has unique canonical keys", () => {
    const keys = ATTRIBUTE_TAXONOMY.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("normalizeName", () => {
  it("lowercases, drops parentheticals, and collapses punctuation", () => {
    expect(normalizeName("Current Rating (A)")).toBe("current rating");
    expect(normalizeName("No. of Poles")).toBe("no of poles");
  });
});

describe("resolveAttribute", () => {
  it("maps common spellings of the same concept to one canonical key", () => {
    for (const name of ["Amps", "Amperage", "Current Rating (A)", "Rated Current"]) {
      expect(resolveAttribute(name)?.key, name).toBe("amperage");
    }
    expect(resolveAttribute("Voltage")?.key).toBe("voltage");
    expect(resolveAttribute("No. of Poles")?.key).toBe("poles");
    expect(resolveAttribute("Interrupting Rating")?.key).toBe("interrupting-rating");
    expect(resolveAttribute("AIC")?.key).toBe("interrupting-rating");
  });

  it("does NOT map the ambiguous bare IEC symbol 'In' to amperage", () => {
    expect(resolveAttribute("In")).toBeNull();
  });

  it("resolves via the token fallback for compound names", () => {
    expect(resolveAttribute("Color Temperature (CCT)")?.key).toBe("color-temperature");
    expect(resolveAttribute("Conductor Material")?.key).toBe("material");
  });

  it("maps the D5 lifecycle signal onto the canonical lifecycle-status key", () => {
    expect(resolveAttribute("Lifecycle status")?.key).toBe("lifecycle-status");
    expect(resolveAttribute("End of life")?.key).toBe("lifecycle-status");
  });

  it("returns null for an unknown attribute name", () => {
    expect(resolveAttribute("Warranty Period")).toBeNull();
    expect(resolveAttribute("")).toBeNull();
  });
});

describe("canonicalUnit", () => {
  it("maps unit spellings to canonical symbols", () => {
    expect(canonicalUnit("amps")).toBe("A");
    expect(canonicalUnit("VAC")).toBe("V");
    expect(canonicalUnit("kA")).toBe("kAIC");
    expect(canonicalUnit("lumens")).toBe("lm");
    expect(canonicalUnit('"')).toBe("in");
  });

  it("returns undefined for an unrecognized unit", () => {
    expect(canonicalUnit("widgets")).toBeUndefined();
  });
});
