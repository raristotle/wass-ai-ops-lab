import { describe, it, expect } from "vitest";
import { parseNameplate, nameplateQuery } from "@/lib/product-finder-nameplate";

describe("parseNameplate", () => {
  it("extracts catalog number, manufacturer, voltage, amperage, AIC, phase", () => {
    const text = "SQUARE D\nCAT NO. QO260\n120/240V 60A 1PH\n10kA AIC";
    const f = parseNameplate(text);
    expect(f.catalogNumber).toBe("QO260");
    expect(f.manufacturer).toBe("Square D");
    expect(f.voltage).toBe("120/240V");
    expect(f.amperage).toBe("60A");
    expect(f.interruptRating).toBe("10KA");
    expect(f.phase).toBe("1PH");
  });

  it("canonicalizes brand aliases and parses HP", () => {
    expect(parseNameplate("CUTLER-HAMMER motor starter 5 HP 480V 3 PHASE").manufacturer).toBe("Eaton");
    expect(parseNameplate("GENERAL ELECTRIC panel").manufacturer).toBe("GE");
    expect(parseNameplate("5 HP motor").horsepower).toBe("5HP");
  });

  it("does not false-match a brand inside a longer word", () => {
    // 'ge' must not match inside 'voltage'.
    expect(parseNameplate("rated voltage 480").manufacturer).toBeUndefined();
  });

  it("returns an empty object for text with no recognizable fields", () => {
    expect(parseNameplate("hello world")).toEqual({});
  });
});

describe("nameplateQuery", () => {
  it("prefers the catalog number when present", () => {
    expect(nameplateQuery({ catalogNumber: "QO260", manufacturer: "Square D", amperage: "60A" })).toBe("QO260");
  });
  it("falls back to manufacturer + specs", () => {
    expect(nameplateQuery({ manufacturer: "Eaton", amperage: "100A", voltage: "480V" })).toBe("Eaton 100A 480V");
  });
  it("is empty when nothing parsed", () => {
    expect(nameplateQuery({})).toBe("");
  });
});
