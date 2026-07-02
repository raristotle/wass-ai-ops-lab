import { describe, it, expect } from "vitest";
import { lookupXref, xrefIndexSize, xrefIndexStats, crossRelationMeta } from "@/lib/catalog/xref-index";

describe("bulk cross-reference index (ingested manufacturer xref files)", () => {
  it("indexes hundreds of thousands of part keys across both directions", () => {
    expect(xrefIndexSize()).toBeGreaterThan(100_000);
  });

  it("crosses a competitor part to its documented target (Eaton CD530MF7W → Leviton)", () => {
    const hits = lookupXref("CD530MF7W");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => /leviton/i.test(h.targetBrand) && h.targetPart.toUpperCase().includes("530MF7W"))).toBe(true);
    expect(hits[0].source.length).toBeGreaterThan(0); // every hit cites its source file
    expect(hits[0].matchedAs).toBe("competitor");
  });

  it("resolves the REVERSE direction (B1): searching the target part finds the competitor(s) that cross to it", () => {
    // 530MF7WLEV is the Leviton target of CD530MF7W; a rep typing the target number should still get a hit.
    const hits = lookupXref("530MF7WLEV");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.matchedAs === "target" && /CD530MF7W/i.test(h.competitorPart))).toBe(true);
  });

  it("normalizes the query (case/separators) and returns capped, well-formed hits with a relation (B2)", () => {
    const hits = lookupXref("cd530mf7w");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.length).toBeLessThanOrEqual(8);
    for (const h of hits) {
      expect(h.competitorPart.length).toBeGreaterThan(0);
      expect(h.targetPart.length).toBeGreaterThan(0);
      expect(["equivalent", "functional-substitute"]).toContain(h.relation);
      expect(["competitor", "target"]).toContain(h.matchedAs);
    }
  });

  it("banded relation meta (B2) maps equivalent/functional to a labelled, colored chip", () => {
    expect(crossRelationMeta("equivalent").label).toMatch(/equivalent/i);
    expect(crossRelationMeta("functional-substitute").label).toMatch(/substitute/i);
    expect(crossRelationMeta("equivalent").color).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it("exposes build stats for the health cold-start metric (B5)", () => {
    const s = xrefIndexStats();
    expect(s.rows).toBeGreaterThan(500_000);
    expect(s.keys).toBeGreaterThan(100_000);
    expect(s.buildMs).toBeGreaterThanOrEqual(0);
  });
});
