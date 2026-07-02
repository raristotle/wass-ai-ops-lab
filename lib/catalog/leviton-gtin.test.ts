import { describe, it, expect } from "vitest";
import { resolveLevitonGtin, levitonGtinCount } from "@/lib/catalog/leviton-gtin";

describe("Leviton GTIN resolution (B11)", () => {
  it("indexes the full parsed Leviton UPC set", () => {
    expect(levitonGtinCount()).toBeGreaterThan(8000);
  });

  it("resolves a 12-digit GTIN-12 to its Leviton MPN", () => {
    const r = resolveLevitonGtin("078477251471");
    expect(r).not.toBeNull();
    expect(r?.mpn).toBe("530MF7WLEV");
    expect(r?.gtin).toBe("078477251471");
  });

  it("resolves the 11-digit UPC-A (leading zero dropped) to the same MPN", () => {
    const r = resolveLevitonGtin("78477251471");
    expect(r?.mpn).toBe("530MF7WLEV");
    expect(r?.gtin).toBe("078477251471"); // normalized to GTIN-12
  });

  it("ignores separators/spaces in the scanned value", () => {
    expect(resolveLevitonGtin("0 78477 25147 1")?.mpn).toBe("530MF7WLEV");
  });

  it("returns null for non-UPC-shaped input without needing the map", () => {
    expect(resolveLevitonGtin("CD530MF7W")).toBeNull(); // a part number, not a UPC
    expect(resolveLevitonGtin("")).toBeNull();
    expect(resolveLevitonGtin("123")).toBeNull(); // too short
  });

  it("returns null for a UPC-shaped number that isn't a known Leviton GTIN", () => {
    expect(resolveLevitonGtin("999999999999")).toBeNull();
  });
});
