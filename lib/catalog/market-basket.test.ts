import { describe, it, expect } from "vitest";
import {
  mineAssociationRules,
  consequentsFor,
  indexByAntecedent,
  type Basket,
} from "@/lib/catalog/market-basket";

function basket(...subs: string[]): Basket {
  return { items: subs.map((s, i) => ({ productId: `${s}-${i}`, subcategory: s })) };
}

describe("mineAssociationRules", () => {
  it("computes support, confidence, and lift correctly", () => {
    // 10 baskets: A in 5, B in 5, A&B together in 4.
    const baskets: Basket[] = [
      basket("A", "B"), basket("A", "B"), basket("A", "B"), basket("A", "B"),
      basket("A", "C"),
      basket("B", "C"),
      basket("C", "D"), basket("C", "D"), basket("D"), basket("E"),
    ];
    const rules = mineAssociationRules(baskets, { grain: "subcategory", minCount: 2, minLift: 0 });
    const ab = rules.find((r) => r.a === "A" && r.b === "B")!;
    expect(ab).toBeDefined();
    expect(ab.count).toBe(4);
    expect(ab.support).toBeCloseTo(0.4, 5); // 4/10
    expect(ab.confidence).toBeCloseTo(0.8, 5); // 4/5
    expect(ab.lift).toBeCloseTo(1.6, 5); // 0.8 / (5/10)
  });

  it("drops pairs below minCount and minLift", () => {
    const baskets: Basket[] = [basket("A", "B"), basket("A", "C"), basket("X", "Y")];
    // A&B co-occur once → below default minCount 2.
    expect(mineAssociationRules(baskets).find((r) => r.a === "A" && r.b === "B")).toBeUndefined();
    // minLift filter
    const everywhere: Basket[] = Array.from({ length: 6 }, () => basket("P", "Q"));
    const r = mineAssociationRules(everywhere, { minCount: 2, minLift: 2 });
    // P↔Q always co-occur but lift is 1 (both ubiquitous) → filtered at minLift 2.
    expect(r).toEqual([]);
  });

  it("returns [] for no baskets and sorts by lift desc", () => {
    expect(mineAssociationRules([])).toEqual([]);
    const baskets: Basket[] = [
      basket("A", "B"), basket("A", "B"), basket("A", "B"),
      basket("A", "C"), basket("A", "C"),
      basket("C"), basket("C"), basket("B"),
    ];
    const rules = mineAssociationRules(baskets, { minCount: 2, minLift: 0 });
    for (let i = 1; i < rules.length; i++) expect(rules[i - 1].lift).toBeGreaterThanOrEqual(rules[i].lift);
  });

  it("handles multi-word keys that contain spaces (regression: pair-key delimiter)", () => {
    // Real subcategory names contain spaces ("Wall Plates & Covers"). If the
    // ordered-pair key were space-delimited, the split would corrupt every such
    // antecedent and silently drop the rule. These keys must round-trip exactly.
    const SW = "Switches";
    const WP = "Wall Plates & Covers";
    const CF = "Conduit Fittings";
    const baskets: Basket[] = [
      basket(SW, WP), basket(SW, WP), basket(SW, WP),
      basket(SW, CF), basket(SW, CF),
      basket(WP), basket(CF),
    ];
    const rules = mineAssociationRules(baskets, { grain: "subcategory", minCount: 2, minLift: 0 });
    const swToWp = rules.find((r) => r.a === SW && r.b === WP);
    expect(swToWp, "Switches → Wall Plates & Covers rule must survive the multi-word key").toBeDefined();
    expect(swToWp!.b).toBe(WP); // consequent key is intact, not truncated at the first space
    expect(swToWp!.count).toBe(3);
    // The spaced antecedent indexes/looks up by its full name.
    expect(consequentsFor(rules, SW).some((r) => r.b === WP)).toBe(true);
  });

  it("mines at product grain when asked", () => {
    const baskets: Basket[] = [
      { items: [{ productId: "p1", subcategory: "A" }, { productId: "p2", subcategory: "B" }] },
      { items: [{ productId: "p1", subcategory: "A" }, { productId: "p2", subcategory: "B" }] },
    ];
    const rules = mineAssociationRules(baskets, { grain: "product", minCount: 2, minLift: 0 });
    expect(rules.some((r) => r.a === "p1" && r.b === "p2" && r.grain === "product")).toBe(true);
  });
});

describe("consequentsFor + indexByAntecedent", () => {
  const baskets: Basket[] = [
    basket("A", "B"), basket("A", "B"), basket("A", "C"), basket("A", "C"), basket("B", "C"),
  ];
  const rules = mineAssociationRules(baskets, { minCount: 2, minLift: 0 });
  it("returns A's consequents best-first", () => {
    const cs = consequentsFor(rules, "A");
    expect(cs.every((r) => r.a === "A")).toBe(true);
  });
  it("indexes rules by antecedent", () => {
    const idx = indexByAntecedent(rules);
    expect(idx.get("A")?.every((r) => r.a === "A")).toBe(true);
  });
});
