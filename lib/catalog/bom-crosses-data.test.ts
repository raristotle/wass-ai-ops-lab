import { describe, it, expect } from "vitest";
import { BOM_CROSS_ENTRIES } from "@/data/real/bom-crosses";

describe("BOM_CROSS_ENTRIES (rep-supplied Crouse-Hinds ↔ Appleton interchange crosses)", () => {
  it("holds the 23 crosses, each source-cited (never generated/scraped)", () => {
    expect(BOM_CROSS_ENTRIES).toHaveLength(23);
    for (const e of BOM_CROSS_ENTRIES) {
      expect(e.aBrand).toMatch(/Crouse-Hinds/);
      expect(e.bBrand).toMatch(/Appleton/);
      expect(e.aMpn.trim().length).toBeGreaterThan(0);
      expect(e.bMpn.trim().length).toBeGreaterThan(0);
      // Each pair is either manufacturer-confirmed (Appleton's own tool) or rep-asserted.
      expect(["manufacturer-cross", "distributor-cross"]).toContain(e.sourceKind);
      expect(e.sourceUrl.trim().length).toBeGreaterThan(0); // provenance required
      expect(e.verifiedAt).toBe("2026-06-24");
      // Both Wesco SKUs carried as stated attributes (the augment-SKUs ask).
      expect(e.statedAttributes?.["Crouse-Hinds Wesco SKU"]).toMatch(/^\d{6,}$/);
      expect(e.statedAttributes?.["Appleton Wesco SKU"]).toMatch(/^\d{6,}$/);
    }
  });

  it("has 21 manufacturer-confirmed crosses (Appleton tool) and 2 rep-asserted strut straps", () => {
    const confirmed = BOM_CROSS_ENTRIES.filter((e) => e.sourceKind === "manufacturer-cross");
    const repOnly = BOM_CROSS_ENTRIES.filter((e) => e.sourceKind === "distributor-cross");
    expect(confirmed).toHaveLength(21);
    expect(repOnly).toHaveLength(2);
    // The 2 unconfirmed are exactly the GRC strut straps the Appleton tool returned no cross for.
    expect(repOnly.map((e) => e.aMpn).sort()).toEqual(["496-4", "496-5"]);
    // Every confirmed entry cites the authoritative Appleton tool.
    for (const e of confirmed) {
      expect(e.sourceUrl).toMatch(/edt\.youritdept\.com\/crossref/);
      expect(e.notes).toMatch(/Confirmed by the Appleton Group Competitor Cross Reference tool/);
    }
  });

  it("includes the independently-validated set-screw coupling cross (461 ↔ 5075S)", () => {
    const x = BOM_CROSS_ENTRIES.find((e) => e.aMpn === "461" && e.bMpn === "5075S");
    expect(x).toBeDefined();
    expect(x?.sourceKind).toBe("manufacturer-cross");
    expect(x?.statedAttributes?.["Crouse-Hinds Wesco SKU"]).toBe("78456410461");
    expect(x?.statedAttributes?.["Appleton Wesco SKU"]).toBe("68785585106");
    expect(x?.notes).toMatch(/wesco\.com/i);
  });

  it("has no duplicate Crouse-Hinds part numbers", () => {
    const mpns = BOM_CROSS_ENTRIES.map((e) => e.aMpn.toUpperCase());
    expect(new Set(mpns).size).toBe(mpns.length);
  });
});
