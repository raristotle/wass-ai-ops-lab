import { describe, it, expect } from "vitest";
import { TERMS_BLOCKS, resolveTerms } from "@/lib/product-finder-terms";

describe("TERMS_BLOCKS", () => {
  it("has unique ids and non-empty labels/texts", () => {
    const ids = TERMS_BLOCKS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of TERMS_BLOCKS) {
      expect(b.label.trim().length, b.id).toBeGreaterThan(0);
      expect(b.text.trim().length, b.id).toBeGreaterThan(0);
    }
  });

  it("covers the distributor staples", () => {
    const ids = new Set(TERMS_BLOCKS.map((b) => b.id));
    for (const required of ["freight", "returns", "payment", "escalation"]) {
      expect(ids.has(required), required).toBe(true);
    }
  });
});

describe("resolveTerms", () => {
  it("resolves ids to texts in canonical block order regardless of input order", () => {
    const out = resolveTerms(["payment", "freight"]);
    expect(out).toHaveLength(2);
    expect(out[0]).toContain("Freight");
    expect(out[1]).toContain("Net 30");
  });

  it("drops unknown ids and handles empty input", () => {
    expect(resolveTerms(["nope", "returns"])).toHaveLength(1);
    expect(resolveTerms([])).toEqual([]);
  });
});
