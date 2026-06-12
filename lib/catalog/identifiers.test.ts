import { describe, it, expect } from "vitest";
import {
  identifierKey,
  normalizeMpn,
  normalizeCatalogNumber,
  sameIdentifier,
  isValidGtin,
  normalizeGtin,
} from "@/lib/catalog/identifiers";

describe("identifierKey / normalizeMpn", () => {
  it("strips separators and uppercases for comparison", () => {
    expect(identifierKey("af09-30-10-13")).toBe("AF09301013");
    expect(identifierKey("3RT2026-1AK60")).toBe("3RT20261AK60");
    expect(identifierKey("  qo 115 ")).toBe("QO115");
  });

  it("normalizeMpn preserves separators for display, collapses whitespace", () => {
    expect(normalizeMpn("  af09-30-10-13 ")).toBe("AF09-30-10-13");
    expect(normalizeMpn("FT2X12X10   HD")).toBe("FT2X12X10 HD");
    expect(normalizeCatalogNumber("qo115")).toBe("QO115");
  });

  it("sameIdentifier matches across formatting, rejects empties", () => {
    expect(sameIdentifier("AF09-30-10-13", "af093010 13")).toBe(true);
    expect(sameIdentifier("QO115", "QO120")).toBe(false);
    expect(sameIdentifier("", "")).toBe(false);
    expect(sameIdentifier("---", "---")).toBe(false);
  });
});

describe("GTIN validation", () => {
  it("accepts valid check digits (known-good GTINs)", () => {
    expect(isValidGtin("036000291452")).toBe(true); // canonical UPC-A example
    expect(isValidGtin("4006381333931")).toBe(true); // canonical EAN-13 example
    expect(isValidGtin("96385074")).toBe(true); // canonical GTIN-8 example
  });

  it("rejects bad check digits, lengths, and non-digits", () => {
    expect(isValidGtin("036000291453")).toBe(false);
    expect(isValidGtin("12345")).toBe(false);
    expect(isValidGtin("03600029145X")).toBe(false);
    expect(isValidGtin("")).toBe(false);
  });

  it("normalizeGtin strips separators and returns null for invalid input", () => {
    expect(normalizeGtin("0 36000 29145 2")).toBe("036000291452");
    expect(normalizeGtin("4-006381-333931")).toBe("4006381333931");
    expect(normalizeGtin("036000291453")).toBeNull();
    expect(normalizeGtin("not-a-gtin")).toBeNull();
  });
});
