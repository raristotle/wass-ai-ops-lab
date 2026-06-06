import { describe, it, expect } from "vitest";
import { searchProducts, getTotalBranchStock, getTotalDCStock } from "@/data/mock/catalog-products";

// ─── searchProducts ────────────────────────────────────────────────────────────

describe("searchProducts", () => {
  it("returns all products for an empty query", () => {
    const all = searchProducts("");
    expect(all.length).toBeGreaterThan(0);
  });

  it("returns products matching by name", () => {
    const results = searchProducts("Square D QO115");
    expect(results.some((p) => p.id === "CB-SQD-QO115")).toBe(true);
  });

  it("returns products matching by SKU", () => {
    const results = searchProducts("QO115");
    expect(results.some((p) => p.sku === "QO115")).toBe(true);
  });

  it("returns products matching by brand", () => {
    const results = searchProducts("eaton");
    // At least one result should be from Eaton brand
    expect(results.some((p) => p.brand.toLowerCase().includes("eaton"))).toBe(true);
  });

  it("returns products matching by spec value", () => {
    const results = searchProducts("15A");
    expect(results.length).toBeGreaterThan(0);
    // All returned products should mention 15A somewhere in their spec text
    results.forEach((p) => {
      const hay = [
        p.name, p.sku, p.brand, p.category, p.subcategory, p.description,
        ...p.specs.map((s) => `${s.name} ${s.value}`),
      ].join(" ").toLowerCase();
      expect(hay).toContain("15a");
    });
  });

  it("returns empty array for unrecognised query", () => {
    const results = searchProducts("zzznomatch99999");
    expect(results).toHaveLength(0);
  });

  it("is case-insensitive", () => {
    const lower = searchProducts("cat6");
    const upper = searchProducts("CAT6");
    expect(lower.length).toBe(upper.length);
    expect(lower.map((p) => p.id).sort()).toEqual(upper.map((p) => p.id).sort());
  });
});

// ─── getTotalBranchStock ───────────────────────────────────────────────────────

describe("getTotalBranchStock", () => {
  it("sums all branch quantities", () => {
    const product = searchProducts("Square D QO115")[0];
    const total = getTotalBranchStock(product);
    expect(total).toBe(
      product.branchStock.reduce((s, b) => s + b.quantity, 0)
    );
  });

  it("returns 0 for a product with no branch stock", () => {
    // GE THQL1115 has all branches at 0 (filtered out so branchStock is [])
    const results = searchProducts("THQL1115");
    const product = results.find((p) => p.id === "CB-GE-THQL1115");
    expect(product).toBeDefined();
    if (product) {
      expect(getTotalBranchStock(product)).toBe(0);
    }
  });
});

// ─── getTotalDCStock ───────────────────────────────────────────────────────────

describe("getTotalDCStock", () => {
  it("sums all DC quantities", () => {
    const product = searchProducts("Square D QO115")[0];
    const total = getTotalDCStock(product);
    expect(total).toBe(
      product.dcStock.reduce((s, d) => s + d.quantity, 0)
    );
  });
});

// ─── BOM quantity regex (mirrors parseBom logic in store) ─────────────────────

describe("BOM quantity regex", () => {
  const QTY_REGEX = /^(\d+)[x×\s]+(.+)/i;

  it("parses '20x 15A circuit breaker'", () => {
    const match = "20x 15A circuit breaker".match(QTY_REGEX);
    if (match === null) throw new Error("Expected regex match");
    expect(match[1]).toBe("20");
    expect(match[2].trim()).toBe("15A circuit breaker");
  });

  it("parses '5 Cat6 cable' (space separator)", () => {
    const match = "5 Cat6 cable".match(QTY_REGEX);
    if (match === null) throw new Error("Expected regex match");
    expect(match[1]).toBe("5");
    expect(match[2].trim()).toBe("Cat6 cable");
  });

  it("returns null for line with no leading quantity", () => {
    const match = "Cat6 cable 1000ft".match(QTY_REGEX);
    expect(match).toBeNull();
  });

  it("defaults quantity to 1 when no match", () => {
    const raw = "Cat6 cable";
    const match = raw.match(QTY_REGEX);
    const quantity = match ? parseInt(match[1]) : 1;
    expect(quantity).toBe(1);
  });
});
