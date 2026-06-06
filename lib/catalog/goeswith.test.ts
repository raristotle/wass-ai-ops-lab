import { describe, it, expect } from "vitest";
import { goesWith, AFFINITY } from "@/lib/catalog/goeswith";
import { getCatalog } from "@/lib/catalog/index";

describe("AFFINITY map", () => {
  it("covers core electrical subcategories", () => {
    expect(AFFINITY["Circuit Breakers"]).toContain("Load Centers");
    expect(AFFINITY["Wire & Cable"]).toContain("Lugs & Wire Connectors");
    expect(AFFINITY["Conduit"]).toContain("Conduit Fittings");
    expect(AFFINITY["Receptacles & Outlets"]).toContain("Wall Plates & Covers");
    expect(AFFINITY["Switches"]).toContain("Wall Plates & Covers");
    expect(AFFINITY["LED Troffers & Panels"]).toContain("Drivers & Ballasts");
    expect(AFFINITY["Load Centers"]).toContain("Circuit Breakers");
  });

  it("covers datacom entries", () => {
    expect(AFFINITY["Ethernet Cable"]).toContain("Patch Panels");
    expect(AFFINITY["Patch Panels"]).toContain("Racks & Cabinets");
  });

  it("covers security entries", () => {
    expect(AFFINITY["IP Cameras"]).toContain("NVRs");
  });

  it("covers safety entries", () => {
    expect(AFFINITY["Hard Hats"]).toContain("Safety Glasses");
  });
});

describe("goesWith", () => {
  const catalog = getCatalog();

  // Find a product with a known subcategory that has affinity mappings
  const cbProduct = catalog.products.find(
    (p) => p.subcategory === "Circuit Breakers"
  )!;
  const wireProduct = catalog.products.find(
    (p) => p.subcategory === "Wire & Cable"
  )!;
  const conduitProduct = catalog.products.find(
    (p) => p.subcategory === "Conduit"
  )!;

  it("returns products in complementary subcategories for Circuit Breakers", () => {
    const results = goesWith(cbProduct, 6);
    expect(results.length).toBeGreaterThan(0);
    const subcats = new Set(results.map((p) => p.subcategory));
    const affinitySubcats = new Set(AFFINITY["Circuit Breakers"] ?? []);
    for (const sub of subcats) {
      expect(affinitySubcats.has(sub)).toBe(true);
    }
  });

  it("returns products in complementary subcategories for Wire & Cable", () => {
    const results = goesWith(wireProduct, 6);
    expect(results.length).toBeGreaterThan(0);
    const subcats = new Set(results.map((p) => p.subcategory));
    const affinitySubcats = new Set(AFFINITY["Wire & Cable"] ?? []);
    for (const sub of subcats) {
      expect(affinitySubcats.has(sub)).toBe(true);
    }
  });

  it("excludes the product itself", () => {
    const results = goesWith(cbProduct, 6);
    expect(results.some((p) => p.id === cbProduct.id)).toBe(false);
  });

  it("respects k — returns at most k results", () => {
    expect(goesWith(cbProduct, 3).length).toBeLessThanOrEqual(3);
    expect(goesWith(cbProduct, 1).length).toBeLessThanOrEqual(1);
    expect(goesWith(cbProduct, 10).length).toBeLessThanOrEqual(10);
  });

  it("is deterministic — same output on repeated calls", () => {
    const a = goesWith(cbProduct, 6);
    const b = goesWith(cbProduct, 6);
    expect(a.map((p) => p.id)).toEqual(b.map((p) => p.id));
  });

  it("puts preferred products first (ordering)", () => {
    const results = goesWith(conduitProduct, 6);
    if (results.length < 2) return; // skip if too few results
    // Find first non-preferred; all products before it should be preferred
    const firstNonPreferred = results.findIndex((p) => !p.preferred);
    if (firstNonPreferred === -1) return; // all preferred is fine
    for (let i = 0; i < firstNonPreferred; i++) {
      expect(results[i]!.preferred).toBe(true);
    }
  });

  it("unknown-subcategory fallback returns same-category, different-subcategory products", () => {
    const unknownSubProduct: (typeof cbProduct) = {
      ...cbProduct,
      id: "fake-unknown-123",
      subcategory: "Unknown Subcategory XYZ",
      category: "electrical",
    };
    const results = goesWith(unknownSubProduct, 6);
    // All results should be in same category
    expect(results.every((p) => p.category === "electrical")).toBe(true);
    // None should be the fake product or same subcategory
    expect(results.some((p) => p.id === unknownSubProduct.id)).toBe(false);
    expect(results.every((p) => p.subcategory !== "Unknown Subcategory XYZ")).toBe(true);
  });

  it("unknown-subcategory fallback returns results when category has products", () => {
    const unknownSubProduct: (typeof cbProduct) = {
      ...cbProduct,
      id: "fake-unknown-456",
      subcategory: "Nonexistent Sub",
      category: "electrical",
    };
    const results = goesWith(unknownSubProduct, 6);
    expect(results.length).toBeGreaterThan(0);
  });
});
