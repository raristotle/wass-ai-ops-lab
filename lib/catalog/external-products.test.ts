import { describe, it, expect } from "vitest";
import { EXTERNAL_PRODUCTS } from "@/lib/catalog/external-products";
import { ENERGY_STAR_LIGHTING } from "@/data/real/energy-star-lighting";

describe("EXTERNAL_PRODUCTS (openly-licensed bulk-source tier — ENERGY STAR)", () => {
  it("ingests the ENERGY STAR public-domain lighting batch (real, source-cited)", () => {
    expect(ENERGY_STAR_LIGHTING.length).toBeGreaterThanOrEqual(300);
    expect(EXTERNAL_PRODUCTS.length).toBeGreaterThanOrEqual(300);
    for (const p of EXTERNAL_PRODUCTS) {
      expect(p.sku.trim().length).toBeGreaterThan(0);
      expect(p.brand.trim().length).toBeGreaterThan(0);
      expect(p.name.trim().length).toBeGreaterThan(0);
      expect(p.specs.length).toBeGreaterThan(0);
      expect(p.specs.some((s) => s.isNonNeg)).toBe(true); // catalog isNonNeg invariant
      expect(p.category).toBe("electrical");
      // Honest provenance: every record cites its public-domain source, no per-unit price.
      expect(p.specSheetUrl).toMatch(/energystar\.gov/);
      expect(p.unitPrice).toBe(0);
      expect(p.priceNote).toMatch(/public-domain|price on request/i);
    }
  });

  it("has unique SKUs (deduped) and real lighting brands", () => {
    const skus = EXTERNAL_PRODUCTS.map((p) => p.sku.toUpperCase().replace(/[^A-Z0-9]/g, ""));
    expect(new Set(skus).size).toBe(skus.length);
    const brands = new Set(EXTERNAL_PRODUCTS.map((p) => p.brand));
    // Spot-check a few real lighting brands Wesco carries.
    expect([...brands].some((b) => /philips/i.test(b))).toBe(true);
    expect([...brands].some((b) => /sylvania|satco|ge|feit/i.test(b))).toBe(true);
  });
});
