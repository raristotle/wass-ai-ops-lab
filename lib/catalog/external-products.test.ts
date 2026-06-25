import { describe, it, expect } from "vitest";
import { EXTERNAL_PRODUCTS } from "@/lib/catalog/external-products";

describe("EXTERNAL_PRODUCTS (openly-accessible bulk-source tier)", () => {
  const es = EXTERNAL_PRODUCTS.filter((p) => p.id.startsWith("EXT-ES-"));
  const hub = EXTERNAL_PRODUCTS.filter((p) => p.id.startsWith("EXT-HUB-"));

  it("augments the catalog by 100k+ real, source-cited records", () => {
    expect(EXTERNAL_PRODUCTS.length).toBeGreaterThanOrEqual(100_000);
    expect(es.length).toBeGreaterThanOrEqual(300); // ENERGY STAR lighting
    expect(hub.length).toBeGreaterThanOrEqual(100_000); // Hubbell sitemap SKUs
  });

  it("every record is electrical, SKU'd, deduped, honestly priced + sourced", () => {
    const skus = new Set<string>();
    for (const p of EXTERNAL_PRODUCTS) {
      expect(p.sku.trim().length).toBeGreaterThan(0);
      expect(p.brand.trim().length).toBeGreaterThan(0);
      expect(p.name.trim().length).toBeGreaterThan(0);
      expect(p.category).toBe("electrical");
      expect(p.unitPrice).toBe(0); // no list price in bulk sources — "price on request"
      expect(p.specSheetUrl).toMatch(/^https?:\/\//);
      const k = p.sku.toUpperCase().replace(/[^A-Z0-9]/g, "");
      expect(skus.has(k)).toBe(false); // deduped by SKU
      skus.add(k);
    }
  });

  it("ENERGY STAR records are spec-rich + public-domain cited", () => {
    for (const p of es.slice(0, 50)) {
      expect(p.specs.some((s) => s.isNonNeg)).toBe(true);
      expect(p.specSheetUrl).toMatch(/energystar\.gov/);
    }
  });

  it("Hubbell records are real-brand identity records cited to the manufacturer site", () => {
    expect(hub.some((p) => /Burndy|Killark|Bryant|Wiegmann|Acme Electric|Hubbell/i.test(p.brand))).toBe(true);
    for (const p of hub.slice(0, 50)) {
      expect(p.specSheetUrl).toMatch(/hubbell\.com/);
      expect(p.priceNote).toMatch(/identity record/i);
    }
  });
});
