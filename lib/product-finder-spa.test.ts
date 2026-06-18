import { describe, it, expect } from "vitest";
import { spaForLine, claimForLine, spaClaimbacks, type SpaQuote } from "@/lib/product-finder-spa";
import { estimatedUnitCost } from "@/lib/product-finder-margin";
import type { CatalogProduct } from "@/features/product-finder/types";

function product(over: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "p1",
    sku: "SKU-1",
    name: "Test Breaker",
    brand: "Square D",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "x",
    unitPrice: 100,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "⚡",
    ...over,
  };
}

describe("spaForLine", () => {
  it("matches a brand-level SPA", () => {
    expect(spaForLine(product({ brand: "Eaton" }), null)?.ref).toBe("SPA-EAT-2026-077");
  });
  it("returns null for an uncovered brand", () => {
    expect(spaForLine(product({ brand: "NoName Co" }), null)).toBeNull();
  });
  it("a customer-scoped SPA wins over the brand rule for that customer", () => {
    expect(spaForLine(product({ brand: "Square D" }), "CUST-001")?.ref).toBe("SPA-SQD-GULF-2026");
    expect(spaForLine(product({ brand: "Square D" }), "CUST-999")?.ref).toBe("SPA-SQD-2026-114");
  });
});

describe("claimForLine", () => {
  it("computes claimable = standardCost × rebatePct × qty", () => {
    const p = product({ brand: "Eaton" });
    const std = estimatedUnitCost(p);
    const claim = claimForLine({ product: p, qty: 10 }, null)!;
    expect(claim.rebatePct).toBe(0.07);
    expect(claim.claimablePerUnit).toBeCloseTo(Math.round(std * 0.07 * 100) / 100, 2);
    expect(claim.claimable).toBeCloseTo(Math.round(claim.claimablePerUnit * 10 * 100) / 100, 2);
    expect(claim.qty).toBe(10);
  });
  it("returns null when no SPA covers the brand", () => {
    expect(claimForLine({ product: product({ brand: "NoName Co" }), qty: 5 }, null)).toBeNull();
  });
  it("treats qty < 1 as 1", () => {
    expect(claimForLine({ product: product({ brand: "Eaton" }), qty: 0 }, null)!.qty).toBe(1);
  });
});

describe("spaClaimbacks", () => {
  const quotes: SpaQuote[] = [
    {
      number: "Q-1",
      customer: "Gulf Coast",
      customerId: "CUST-001",
      lines: [
        { product: product({ sku: "A", brand: "Square D" }), qty: 10 }, // customer SPA 12%
        { product: product({ sku: "B", brand: "NoName Co" }), qty: 5 }, // no SPA
      ],
    },
    {
      number: "Q-2",
      customer: "Acme",
      customerId: "CUST-002",
      lines: [{ product: product({ sku: "C", brand: "Eaton" }), qty: 4 }],
    },
  ];

  it("aggregates only SPA-covered lines, with a per-manufacturer breakdown", () => {
    const s = spaClaimbacks(quotes);
    expect(s.lineCount).toBe(2); // the NoName line is excluded
    expect(s.totalClaimable).toBeGreaterThan(0);
    const mfrs = s.byManufacturer.map((m) => m.manufacturer).sort();
    expect(mfrs).toEqual(["Eaton", "Square D"]);
    // Breakdown is sorted by claimable desc and sums to the total.
    const sum = s.byManufacturer.reduce((n, m) => n + m.claimable, 0);
    expect(Math.round(sum * 100) / 100).toBeCloseTo(s.totalClaimable, 2);
  });

  it("the Gulf Coast Square D line uses the 12% customer SPA", () => {
    const s = spaClaimbacks(quotes);
    const row = s.rows.find((r) => r.sku === "A")!;
    expect(row.rebatePct).toBe(0.12);
    expect(row.ref).toBe("SPA-SQD-GULF-2026");
  });

  it("empty input yields a zero summary", () => {
    expect(spaClaimbacks([])).toEqual({ totalClaimable: 0, lineCount: 0, byManufacturer: [], rows: [] });
  });
});
