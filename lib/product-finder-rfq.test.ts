import { describe, it, expect } from "vitest";
import { summarizeRfq, rfqDraftLines, rfqHeadline } from "@/lib/product-finder-rfq";
import type { ScoredBomLine } from "@/lib/product-finder-bom";
import type { CatalogProduct } from "@/features/product-finder/types";

function prod(id: string): CatalogProduct {
  return {
    id, sku: id, name: id, brand: "Acme", category: "electrical", subcategory: "Circuit Breakers",
    description: "", unitPrice: 10, uom: "ea", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}
function line(opts: Partial<ScoredBomLine>): ScoredBomLine {
  return { raw: "x", qty: 1, query: "x", match: null, confidence: 0, tier: null, alternates: [], ...opts };
}

describe("summarizeRfq", () => {
  it("counts matched, high-confidence, needs-review, and unmatched lines", () => {
    const lines = [
      line({ match: prod("A"), confidence: 0.95, tier: "high", qty: 2 }),
      line({ match: prod("B"), confidence: 0.6, tier: "medium" }),
      line({ match: null, tier: null }), // unmatched
    ];
    const s = summarizeRfq(lines, 1);
    expect(s.totalLines).toBe(3);
    expect(s.matched).toBe(2);
    expect(s.highConfidence).toBe(1);
    expect(s.unmatched).toBe(1);
    expect(s.needsReview).toBe(2); // the medium match + the unmatched line
    expect(s.crossable).toBe(1);
    expect(s.draftLineCount).toBe(2);
  });

  it("handles an empty BOM", () => {
    const s = summarizeRfq([]);
    expect(s.totalLines).toBe(0);
    expect(s.needsReview).toBe(0);
  });
});

describe("rfqDraftLines", () => {
  it("returns one cart line per matched product, preserving quantity", () => {
    const lines = [
      line({ match: prod("A"), qty: 5 }),
      line({ match: null, qty: 3 }),
      line({ match: prod("C"), qty: 2 }),
    ];
    const draft = rfqDraftLines(lines);
    expect(draft.map((d) => [d.product.id, d.qty])).toEqual([["A", 5], ["C", 2]]);
  });
});

describe("rfqHeadline", () => {
  it("summarizes matches, review count, and crossable parts", () => {
    const s = summarizeRfq(
      [line({ match: prod("A"), tier: "high" }), line({ match: null })],
      2,
    );
    const h = rfqHeadline(s);
    expect(h).toMatch(/1 of 2 lines matched/);
    expect(h).toMatch(/1 to review/);
    expect(h).toMatch(/2 competitor parts crossable/);
  });

  it("prompts when empty", () => {
    expect(rfqHeadline(summarizeRfq([]))).toMatch(/Paste or upload/);
  });
});
