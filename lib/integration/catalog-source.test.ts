/**
 * TDD — RED first.
 * Tests for lib/integration/catalog-source.ts
 * Run: npx vitest run lib/integration/catalog-source.test.ts
 */

import { describe, it, expect } from "vitest";
import { mockCatalogProvider } from "@/lib/integration/catalog-source";
import { CATALOG_SIZE } from "@/lib/catalog/generate";

const FIXED_NOW = new Date("2026-06-06T12:00:00.000Z");

describe("mockCatalogProvider.getSource(now)", () => {
  // Call once — building 60k catalog is ~200ms; reuse the result.
  const source = mockCatalogProvider.getSource(FIXED_NOW);

  it("source is 'PIM (simulated)'", () => {
    expect(source.source).toBe("PIM (simulated)");
  });

  it(`productCount equals CATALOG_SIZE (${CATALOG_SIZE})`, () => {
    expect(source.productCount).toBe(CATALOG_SIZE);
  });

  it("categories equals 6 (electrical, datacom, oem-electrical, av, security, safety)", () => {
    expect(source.categories).toBe(6);
  });

  it("subcategories is greater than 40", () => {
    expect(source.subcategories).toBeGreaterThan(40);
  });

  it("attributeCompleteness is 100 (every generated product has >=1 isNonNeg spec)", () => {
    // If exactly 100 that's ideal; >=99 is also acceptable but we document it.
    expect(source.attributeCompleteness).toBeGreaterThanOrEqual(99);
    // Log an informational note if not exactly 100
    if (source.attributeCompleteness !== 100) {
      console.info(
        `[catalog-source] attributeCompleteness = ${source.attributeCompleteness}% (not 100; see spec note)`
      );
    }
    // Primary assertion: should be 100 since generateCatalog enforces isNonNeg
    expect(source.attributeCompleteness).toBe(100);
  });

  it("lastSyncedAt reflects the injected now (ISO string of FIXED_NOW)", () => {
    expect(source.lastSyncedAt).toBe(FIXED_NOW.toISOString());
  });

  it("is deterministic — calling getSource twice with same now returns identical values", () => {
    const a = mockCatalogProvider.getSource(FIXED_NOW);
    const b = mockCatalogProvider.getSource(FIXED_NOW);
    expect(a).toEqual(b);
  });

  it("lastSyncedAt changes when now changes", () => {
    const other = new Date("2026-07-01T09:00:00.000Z");
    const s = mockCatalogProvider.getSource(other);
    expect(s.lastSyncedAt).toBe(other.toISOString());
    // The rest stays the same
    expect(s.productCount).toBe(CATALOG_SIZE);
    expect(s.categories).toBe(6);
  });
});
