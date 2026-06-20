import { describe, it, expect } from "vitest";
import { buildAccount360, type AccountLine, type SubcatEdge } from "@/lib/product-finder-account-360";

const adjacency = new Map<string, SubcatEdge[]>([
  ["Switches", [{ to: "Wall Plates & Covers", required: true }, { to: "Wire & Cable", required: false }]],
  ["Circuit Breakers", [{ to: "Lugs & Connectors", required: true }, { to: "Surge Protective Devices", required: false }]],
  ["Wire & Cable", [{ to: "Lugs & Connectors", required: true }]],
]);

function line(subcategory: string, amount: number, sku?: string): AccountLine {
  return { subcategory, amount, sku, name: sku };
}

describe("buildAccount360", () => {
  it("ranks purchased families by spend with share", () => {
    const a = buildAccount360(
      [line("Circuit Breakers", 800, "CB1"), line("Switches", 200, "SW1")],
      adjacency,
    );
    expect(a.purchased[0].subcategory).toBe("Circuit Breakers");
    expect(a.purchased[0].share).toBeCloseTo(0.8, 5);
    expect(a.summary.totalSpend).toBe(1000);
    expect(a.summary.distinctFamilies).toBe(2);
  });

  it("surfaces whitespace: adjacent families they don't buy from us", () => {
    const a = buildAccount360([line("Circuit Breakers", 1000, "CB1")], adjacency);
    const subs = a.whitespace.map((w) => w.subcategory);
    expect(subs).toContain("Lugs & Connectors"); // required companion of breakers
    expect(subs).toContain("Surge Protective Devices"); // recommended companion
    // Required gap sorts first and is flagged.
    expect(a.whitespace[0].subcategory).toBe("Lugs & Connectors");
    expect(a.whitespace[0].required).toBe(true);
    expect(a.summary.requiredGapCount).toBe(1);
  });

  it("does NOT flag a family they already buy as whitespace", () => {
    const a = buildAccount360(
      [line("Circuit Breakers", 1000, "CB1"), line("Lugs & Connectors", 50, "LUG1")],
      adjacency,
    );
    expect(a.whitespace.map((w) => w.subcategory)).not.toContain("Lugs & Connectors");
  });

  it("aggregates a reorder shortlist by line frequency", () => {
    const a = buildAccount360(
      [line("Switches", 10, "SW1"), line("Switches", 10, "SW1"), line("Switches", 30, "SW2")],
      adjacency,
    );
    expect(a.topReorder[0].sku).toBe("SW1"); // 2 lines beats SW2's 1
    expect(a.topReorder[0].lines).toBe(2);
  });

  it("handles an empty history without throwing", () => {
    const a = buildAccount360([], adjacency);
    expect(a.purchased).toEqual([]);
    expect(a.whitespace).toEqual([]);
    expect(a.summary.totalSpend).toBe(0);
  });
});
