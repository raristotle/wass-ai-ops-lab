import { describe, it, expect } from "vitest";
import { BOM_CROSS_ENTRIES } from "@/data/real/bom-crosses";

describe("BOM_CROSS_ENTRIES (rep-supplied Crouse-Hinds ↔ Appleton interchange crosses)", () => {
  it("holds the 23 validated crosses, each source-cited (never generated/scraped)", () => {
    expect(BOM_CROSS_ENTRIES).toHaveLength(23);
    for (const e of BOM_CROSS_ENTRIES) {
      expect(e.aBrand).toMatch(/Crouse-Hinds/);
      expect(e.bBrand).toMatch(/Appleton/);
      expect(e.aMpn.trim().length).toBeGreaterThan(0);
      expect(e.bMpn.trim().length).toBeGreaterThan(0);
      expect(e.sourceKind).toBe("distributor-cross");
      expect(e.sourceUrl.trim().length).toBeGreaterThan(0); // provenance required
      expect(e.verifiedAt).toBe("2026-06-24");
      // Both Wesco SKUs carried as stated attributes (the augment-SKUs ask).
      expect(e.statedAttributes?.["Crouse-Hinds Wesco SKU"]).toMatch(/^\d{6,}$/);
      expect(e.statedAttributes?.["Appleton Wesco SKU"]).toMatch(/^\d{6,}$/);
    }
  });

  it("includes the independently-validated set-screw coupling cross (461 ↔ 5075S)", () => {
    const x = BOM_CROSS_ENTRIES.find((e) => e.aMpn === "461" && e.bMpn === "5075S");
    expect(x).toBeDefined();
    expect(x?.statedAttributes?.["Crouse-Hinds Wesco SKU"]).toBe("78456410461");
    expect(x?.statedAttributes?.["Appleton Wesco SKU"]).toBe("68785585106");
    expect(x?.notes).toMatch(/wesco\.com/i);
  });

  it("has no duplicate Crouse-Hinds part numbers", () => {
    const mpns = BOM_CROSS_ENTRIES.map((e) => e.aMpn.toUpperCase());
    expect(new Set(mpns).size).toBe(mpns.length);
  });
});
