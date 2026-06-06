import { describe, it, expect } from "vitest";
import { isInStock, leadTimeFor } from "@/lib/product-finder-leadtime";
import type { CatalogProduct } from "@/features/product-finder/types";

// ─── Minimal product factory ──────────────────────────────────────────────────

function makeProduct(
  id: string,
  branchQtys: number[],
  dcQtys: number[]
): CatalogProduct {
  return {
    id,
    sku: `SKU-${id}`,
    name: `Product ${id}`,
    brand: "TestBrand",
    category: "electrical",
    subcategory: "breakers",
    description: "Test product",
    unitPrice: 10,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock: branchQtys.map((quantity, i) => ({
      branchId: `B${i}`,
      branchName: `Branch ${i}`,
      city: "Houston",
      state: "TX",
      quantity,
    })),
    dcStock: dcQtys.map((quantity, i) => ({
      dcId: `DC${i}`,
      dcName: `DC ${i}`,
      location: "TX",
      quantity,
    })),
    externalSources: [],
    imageIcon: "🔌",
  };
}

const IN_STOCK_BRANCH = makeProduct("in-branch", [5, 10], []);
const IN_STOCK_DC = makeProduct("in-dc", [], [20]);
const IN_STOCK_BOTH = makeProduct("in-both", [3], [7]);
const OOS_PRODUCT = makeProduct("oos-001", [0, 0], [0]);
const OOS_EMPTY = makeProduct("oos-empty", [], []);

const LEAD_TIME_BUCKETS = ["3–5 business days", "1–2 weeks", "2–3 weeks", "4–6 weeks"];

// ─── isInStock ────────────────────────────────────────────────────────────────

describe("isInStock", () => {
  it("returns true when branchStock has quantity > 0", () => {
    expect(isInStock(IN_STOCK_BRANCH)).toBe(true);
  });

  it("returns true when dcStock has quantity > 0 (branch is zero)", () => {
    expect(isInStock(IN_STOCK_DC)).toBe(true);
  });

  it("returns true when both branch and DC have stock", () => {
    expect(isInStock(IN_STOCK_BOTH)).toBe(true);
  });

  it("returns false when all branch and DC quantities are 0", () => {
    expect(isInStock(OOS_PRODUCT)).toBe(false);
  });

  it("returns false when branchStock and dcStock are empty arrays", () => {
    expect(isInStock(OOS_EMPTY)).toBe(false);
  });

  it("returns false when some branch entries are 0 but total is 0", () => {
    const p = makeProduct("partial-oos", [0, 0, 0], [0]);
    expect(isInStock(p)).toBe(false);
  });
});

// ─── leadTimeFor ──────────────────────────────────────────────────────────────

describe("leadTimeFor", () => {
  it("returns null for an in-stock product (branch stock)", () => {
    expect(leadTimeFor(IN_STOCK_BRANCH)).toBeNull();
  });

  it("returns null for an in-stock product (DC stock)", () => {
    expect(leadTimeFor(IN_STOCK_DC)).toBeNull();
  });

  it("returns a non-null string for an out-of-stock product", () => {
    const result = leadTimeFor(OOS_PRODUCT);
    expect(result).not.toBeNull();
    expect(typeof result).toBe("string");
  });

  it("returns one of the four defined buckets for an OOS product", () => {
    const result = leadTimeFor(OOS_PRODUCT);
    expect(LEAD_TIME_BUCKETS).toContain(result);
  });

  it("is deterministic: same product id always yields the same bucket", () => {
    const first = leadTimeFor(OOS_PRODUCT);
    const second = leadTimeFor(OOS_PRODUCT);
    const third = leadTimeFor({ ...OOS_PRODUCT }); // object copy, same id
    expect(first).toBe(second);
    expect(first).toBe(third);
  });

  it("same id, different other fields → same bucket (id is the only input)", () => {
    const a = makeProduct("consistent-id", [0], [0]);
    const b = { ...a, name: "Different Name", unitPrice: 999 };
    expect(leadTimeFor(a)).toBe(leadTimeFor(b));
  });

  it("distribution sanity: two different ids can produce different buckets", () => {
    // Build a large set and assert we see at least 2 distinct buckets.
    const results = new Set<string | null>();
    for (let i = 0; i < 100; i++) {
      const p = makeProduct(`dist-test-${i}`, [], []);
      results.add(leadTimeFor(p));
    }
    // At minimum we should hit more than one bucket out of 4 across 100 ids
    expect(results.size).toBeGreaterThan(1);
  });

  it("returns null for empty-arrays product when it has incidental stock via branchStock", () => {
    const p = makeProduct("has-stock", [1], []);
    expect(leadTimeFor(p)).toBeNull();
  });
});
