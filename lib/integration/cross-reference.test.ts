/**
 * TDD tests for lib/integration/cross-reference.ts
 *
 * Tests cover:
 *  - competitorSkusFor: deterministic, 1–2 entries, well-formed SKU strings
 *  - lookupCrossReference: round-trip (lookup returns same product whose
 *    competitorSkusFor contains that SKU), case/whitespace-insensitive, unknown → null
 *  - crossReferencesFor: authoritative filter — every returned SKU round-trips
 *    to the same product; results are a subset of competitorSkusFor output
 *  - Full-catalog integrity: zero round-trip failures across ALL products
 */

import { describe, it, expect } from "vitest";
import {
  competitorSkusFor,
  lookupCrossReference,
  crossReferencesFor,
} from "@/lib/integration/cross-reference";
import { getCatalog } from "@/lib/catalog/index";
import type { CatalogProduct } from "@/features/product-finder/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeProduct(id: string): CatalogProduct {
  return {
    id,
    sku: `SKU-${id}`,
    name: `Product ${id}`,
    brand: "TestBrand",
    category: "electrical",
    subcategory: "Breakers",
    description: "Test product",
    unitPrice: 25.0,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "⚡",
  };
}

const PRODUCT_A = makeProduct("PROD-A-001");
const PRODUCT_B = makeProduct("PROD-B-002");

// ─── competitorSkusFor ────────────────────────────────────────────────────────

describe("competitorSkusFor", () => {
  it("returns 1 or 2 entries for a product", () => {
    const refs = competitorSkusFor(PRODUCT_A);
    expect(refs.length).toBeGreaterThanOrEqual(1);
    expect(refs.length).toBeLessThanOrEqual(2);
  });

  it("each entry has a non-empty competitorSku string", () => {
    const refs = competitorSkusFor(PRODUCT_A);
    for (const r of refs) {
      expect(typeof r.competitorSku).toBe("string");
      expect(r.competitorSku.length).toBeGreaterThan(0);
    }
  });

  it("each entry has a non-empty brand string", () => {
    const refs = competitorSkusFor(PRODUCT_A);
    for (const r of refs) {
      expect(typeof r.brand).toBe("string");
      expect(r.brand.length).toBeGreaterThan(0);
    }
  });

  it("competitorSku matches the expected format PREFIX-ALNUM", () => {
    // Format: one of the known prefixes, a dash, then uppercase alnum chars
    const refs = competitorSkusFor(PRODUCT_A);
    const KNOWN_PREFIXES = ["GRN", "ACE", "NSI", "LEG", "ORB"];
    for (const r of refs) {
      const [prefix, alnum] = r.competitorSku.split("-");
      expect(KNOWN_PREFIXES).toContain(prefix);
      expect(alnum).toMatch(/^[A-Z0-9]+$/);
    }
  });

  it("is deterministic — same product always yields the same result", () => {
    const refs1 = competitorSkusFor(PRODUCT_A);
    const refs2 = competitorSkusFor(PRODUCT_A);
    expect(refs1).toEqual(refs2);
  });

  it("different products produce different competitor SKUs (no accidental collision on fixture pair)", () => {
    const skusA = competitorSkusFor(PRODUCT_A).map((r) => r.competitorSku);
    const skusB = competitorSkusFor(PRODUCT_B).map((r) => r.competitorSku);
    // PROD-A-001 and PROD-B-002 should not produce identical first SKUs
    // (This is a smoke test — hash differences should produce different outputs)
    // We assert that not every SKU from A equals the same-index SKU from B
    const allSame = skusA.every((s, i) => s === skusB[i]);
    expect(allSame).toBe(false);
  });

  it("brand matches the prefix portion of the competitor SKU", () => {
    // The brand field should correspond to the prefix in the SKU
    const refs = competitorSkusFor(PRODUCT_A);
    for (const r of refs) {
      const [prefix] = r.competitorSku.split("-");
      expect(r.brand).toBe(prefix);
    }
  });
});

// ─── lookupCrossReference ─────────────────────────────────────────────────────

describe("lookupCrossReference", () => {
  it("returns null for an unknown SKU", () => {
    expect(lookupCrossReference("UNKNOWN-SKU-999")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(lookupCrossReference("")).toBeNull();
  });

  it("returns null for whitespace only", () => {
    expect(lookupCrossReference("   ")).toBeNull();
  });

  it("round-trip: looking up a product's first competitor SKU returns that product", () => {
    const catalog = getCatalog();
    const product = catalog.products[0];
    const refs = crossReferencesFor(product);
    expect(refs.length).toBeGreaterThan(0);

    const found = lookupCrossReference(refs[0].competitorSku);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(product.id);
  });

  it("round-trip: looking up second competitor SKU (when present) also returns the correct product", () => {
    // Find a product that has 2 refs
    const catalog = getCatalog();
    const productWith2 = catalog.products.find(
      (p) => crossReferencesFor(p).length === 2
    );
    expect(productWith2).toBeDefined();
    const refs = crossReferencesFor(productWith2!);
    const found = lookupCrossReference(refs[1].competitorSku);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(productWith2!.id);
  });

  it("lookup is case-insensitive — lowercase input returns the product", () => {
    const catalog = getCatalog();
    const product = catalog.products[0];
    const refs = crossReferencesFor(product);
    const lowerSku = refs[0].competitorSku.toLowerCase();
    const found = lookupCrossReference(lowerSku);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(product.id);
  });

  it("lookup trims surrounding whitespace", () => {
    const catalog = getCatalog();
    const product = catalog.products[0];
    const refs = crossReferencesFor(product);
    const paddedSku = `  ${refs[0].competitorSku}  `;
    const found = lookupCrossReference(paddedSku);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(product.id);
  });

  it("round-trip succeeds for 50 distinct catalog products without collision", () => {
    const catalog = getCatalog();
    const sample = catalog.products.slice(0, 50);

    for (const product of sample) {
      const refs = crossReferencesFor(product);
      expect(refs.length).toBeGreaterThan(0);

      for (const ref of refs) {
        const found = lookupCrossReference(ref.competitorSku);
        expect(found).not.toBeNull();
        expect(found!.id).toBe(product.id);
      }
    }
  });
});

// ─── crossReferencesFor ───────────────────────────────────────────────────────

describe("crossReferencesFor", () => {
  it("returns a subset of competitorSkusFor entries (authoritative filter)", () => {
    // crossReferencesFor only keeps SKUs that round-trip, so its output must be
    // a subset (by competitorSku) of what competitorSkusFor generates.
    const catalog = getCatalog();
    const product = catalog.products[5];
    const allSkus = new Set(competitorSkusFor(product).map((r) => r.competitorSku));
    const filtered = crossReferencesFor(product);
    for (const ref of filtered) {
      expect(allSkus.has(ref.competitorSku)).toBe(true);
    }
  });

  it("every SKU returned by crossReferencesFor round-trips to the same product", () => {
    const catalog = getCatalog();
    const product = catalog.products[5];
    const refs = crossReferencesFor(product);
    for (const ref of refs) {
      const found = lookupCrossReference(ref.competitorSku);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(product.id);
    }
  });

  it("is deterministic across multiple calls", () => {
    const catalog = getCatalog();
    const product = catalog.products[10];
    const refs1 = crossReferencesFor(product);
    const refs2 = crossReferencesFor(product);
    expect(refs1).toEqual(refs2);
  });
});

// ─── Full-catalog integrity ────────────────────────────────────────────────────

describe("full-catalog round-trip integrity", () => {
  it("every SKU in crossReferencesFor(p) resolves back to p.id — zero failures across all products", () => {
    const catalog = getCatalog();
    const failures: string[] = [];

    for (const product of catalog.products) {
      const refs = crossReferencesFor(product);
      for (const ref of refs) {
        const found = lookupCrossReference(ref.competitorSku);
        if (!found || found.id !== product.id) {
          failures.push(
            `product ${product.id}: SKU ${ref.competitorSku} → ${found?.id ?? "null"}`
          );
        }
      }
    }

    expect(failures).toHaveLength(0);
  });

  it("more than 95% of products still have at least one cross-reference after filtering", () => {
    const catalog = getCatalog();
    const total = catalog.products.length;
    const withRefs = catalog.products.filter(
      (p) => crossReferencesFor(p).length >= 1
    ).length;

    const pct = (withRefs / total) * 100;
    // With 8-char suffixes collisions are vanishingly rare; expect the filter
    // to preserve refs for virtually every product.
    expect(pct).toBeGreaterThan(95);
  });
});
