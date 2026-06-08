import { describe, it, expect } from "vitest";
import { lineEtaDays, orderEtaDays, addDays, etaLabel } from "@/lib/product-finder-delivery";
import type { CatalogProduct } from "@/features/product-finder/types";

function makeProduct(
  id: string,
  opts: { myBranch?: number; otherBranch?: number; dc?: number } = {},
): CatalogProduct {
  const branchStock = [];
  if (opts.myBranch) branchStock.push({ branchId: "B-HOU-01", branchName: "Houston", city: "Houston", state: "TX", quantity: opts.myBranch });
  if (opts.otherBranch) branchStock.push({ branchId: "B-DAL-01", branchName: "Dallas", city: "Dallas", state: "TX", quantity: opts.otherBranch });
  return {
    id, sku: id.toUpperCase(), name: `Product ${id}`, brand: "B", category: "electrical",
    subcategory: "Circuit Breakers", description: "", unitPrice: 10, uom: "EA", specs: [],
    preferred: false, branchStock,
    dcStock: opts.dc ? [{ dcId: "DC1", dcName: "DC", location: "Dallas", quantity: opts.dc }] : [],
    externalSources: [], imageIcon: "⚡",
  };
}

describe("lineEtaDays", () => {
  it("ships fastest when in stock at the rep's branch", () => {
    expect(lineEtaDays(makeProduct("a", { myBranch: 5 }), "B-HOU-01")).toBe(2);
  });

  it("uses transfer time when stock is at another branch", () => {
    expect(lineEtaDays(makeProduct("a", { otherBranch: 5 }), "B-HOU-01")).toBe(5);
  });

  it("uses transfer time when only the DC has stock", () => {
    expect(lineEtaDays(makeProduct("a", { dc: 50 }), "B-HOU-01")).toBe(5);
  });

  it("falls back to a lead-time bucket when out of stock everywhere", () => {
    const eta = lineEtaDays(makeProduct("a"), "B-HOU-01");
    expect([5, 14, 21, 42]).toContain(eta);
    expect(eta).toBeGreaterThanOrEqual(5);
  });

  it("without a branchId, any branch stock counts as transfer time", () => {
    expect(lineEtaDays(makeProduct("a", { myBranch: 3 }))).toBe(2); // aggregate branch qty > 0
  });
});

describe("orderEtaDays", () => {
  it("is the slowest line (ships complete)", () => {
    const lines = [
      { product: makeProduct("a", { myBranch: 5 }) }, // 2
      { product: makeProduct("b", { dc: 10 }) },      // 5
    ];
    expect(orderEtaDays(lines, "B-HOU-01")).toBe(5);
  });

  it("is 0 for an empty order", () => {
    expect(orderEtaDays([], "B-HOU-01")).toBe(0);
  });
});

describe("addDays", () => {
  it("adds calendar days without mutating the input", () => {
    const today = new Date("2026-06-08T00:00:00Z");
    const out = addDays(today, 5);
    expect(out.getTime()).toBeGreaterThan(today.getTime());
    expect(today.toISOString()).toBe("2026-06-08T00:00:00.000Z");
  });
});

describe("etaLabel", () => {
  it("pluralizes correctly", () => {
    expect(etaLabel(1)).toBe("~1 day");
    expect(etaLabel(5)).toBe("~5 days");
  });
});
