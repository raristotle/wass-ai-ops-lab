import { describe, it, expect } from "vitest";
import { confidenceBand, BAND_META } from "@/lib/product-finder-cross-confidence";

describe("confidenceBand", () => {
  it("bands at 95 / 80", () => {
    expect(confidenceBand(97)).toBe("verified");
    expect(confidenceBand(95)).toBe("verified");
    expect(confidenceBand(94)).toBe("probable");
    expect(confidenceBand(80)).toBe("probable");
    expect(confidenceBand(79)).toBe("needs-review");
    expect(confidenceBand(0)).toBe("needs-review");
  });
  it("has metadata for every band", () => {
    for (const b of ["verified", "probable", "needs-review"] as const) {
      expect(BAND_META[b].label.length).toBeGreaterThan(0);
      expect(BAND_META[b].color).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});
