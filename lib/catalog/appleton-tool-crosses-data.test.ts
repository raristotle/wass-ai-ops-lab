import { describe, it, expect } from "vitest";
import { APPLETON_TOOL_CROSS_ENTRIES } from "@/data/real/appleton-tool-crosses";

describe("APPLETON_TOOL_CROSS_ENTRIES (real catalog products crossed via Appleton's own tool)", () => {
  it("holds the 10 RACO/Bridgeport fitting crosses, all manufacturer-sourced and cited", () => {
    expect(APPLETON_TOOL_CROSS_ENTRIES).toHaveLength(10);
    for (const e of APPLETON_TOOL_CROSS_ENTRIES) {
      expect(["RACO", "Bridgeport"]).toContain(e.aBrand);
      expect(e.bBrand).toMatch(/Appleton/);
      expect(e.aMpn.trim().length).toBeGreaterThan(0);
      expect(e.bMpn.trim().length).toBeGreaterThan(0);
      expect(e.relation).toBe("equivalent");
      // Every entry is from Appleton's authoritative tool — no rep-only or scraped pairs here.
      expect(e.sourceKind).toBe("manufacturer-cross");
      expect(e.sourceUrl).toMatch(/edt\.youritdept\.com\/crossref/);
      expect(e.notes).toMatch(/Appleton Group Competitor Cross Reference tool/);
    }
  });

  it("crosses real uncrossed catalog parts (e.g. RACO 2602 → Appleton TC501)", () => {
    const x = APPLETON_TOOL_CROSS_ENTRIES.find((e) => e.aMpn === "2602");
    expect(x?.bMpn).toBe("TC501");
    const y = APPLETON_TOOL_CROSS_ENTRIES.find((e) => e.aMpn === "251-DC2");
    expect(y?.aBrand).toBe("Bridgeport");
    expect(y?.bMpn).toBe("TC602");
  });

  it("has no duplicate competitor part numbers", () => {
    const mpns = APPLETON_TOOL_CROSS_ENTRIES.map((e) => `${e.aBrand}:${e.aMpn}`.toUpperCase());
    expect(new Set(mpns).size).toBe(mpns.length);
  });
});
