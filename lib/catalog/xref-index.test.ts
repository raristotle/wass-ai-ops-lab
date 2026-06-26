import { describe, it, expect } from "vitest";
import { lookupXref, xrefIndexSize } from "@/lib/catalog/xref-index";

describe("bulk cross-reference index (ingested manufacturer xref files)", () => {
  it("indexes hundreds of thousands of competitor parts", () => {
    expect(xrefIndexSize()).toBeGreaterThan(100_000);
  });

  it("crosses a competitor part to its documented target (Eaton CD530MF7W → Leviton)", () => {
    const hits = lookupXref("CD530MF7W");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => /leviton/i.test(h.targetBrand) && h.targetPart.toUpperCase().includes("530MF7W"))).toBe(true);
    expect(hits[0].source.length).toBeGreaterThan(0); // every hit cites its source file
  });

  it("normalizes the query (case/separators) and returns capped, well-formed hits", () => {
    const hits = lookupXref("cd530mf7w");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.length).toBeLessThanOrEqual(8);
    for (const h of hits) {
      expect(h.competitorPart.length).toBeGreaterThan(0);
      expect(h.targetPart.length).toBeGreaterThan(0);
      expect(["equivalent", "functional-substitute"]).toContain(h.relation);
    }
  });
});
