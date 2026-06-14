import { describe, it, expect } from "vitest";
import { BRANDS, DEFAULT_BRAND_ID, getBrand, isBrandId, BRAND_IDS } from "@/lib/brand";

describe("brand config", () => {
  it("ships meridian (default) and wesco profiles with complete fields", () => {
    expect(DEFAULT_BRAND_ID).toBe("meridian");
    expect(BRAND_IDS).toContain("wesco");
    for (const b of Object.values(BRANDS)) {
      expect(b.name).toBeTruthy();
      expect(b.logoMark).toBeTruthy();
      expect(b.logoSub).toBeTruthy();
      expect(b.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("getBrand resolves known ids and falls back to the default", () => {
    expect(getBrand("wesco").name).toBe("Wesco");
    expect(getBrand("meridian").logoMark).toBe("MERIDIAN");
    expect(getBrand(null).id).toBe("meridian");
    expect(getBrand("nonexistent").id).toBe("meridian");
  });

  it("isBrandId guards membership", () => {
    expect(isBrandId("wesco")).toBe(true);
    expect(isBrandId("nope")).toBe(false);
    expect(isBrandId(null)).toBe(false);
  });
});
