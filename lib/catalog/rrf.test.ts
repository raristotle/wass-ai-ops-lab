import { describe, it, expect } from "vitest";
import { reciprocalRankFusion } from "@/lib/catalog/rrf";

describe("reciprocalRankFusion", () => {
  it("ranks an item that's top of both lists first", () => {
    const a = ["x", "b", "c"];
    const b = ["x", "d", "e"];
    expect(reciprocalRankFusion([a, b])[0]).toBe("x");
  });

  it("rewards agreement across lists over a single high rank", () => {
    // 'b' is 2nd in both; 'a' is 1st in one and absent from the other.
    const l1 = ["a", "b"];
    const l2 = ["c", "b"];
    const fused = reciprocalRankFusion([l1, l2]);
    expect(fused[0]).toBe("b");
  });

  it("includes every item from every list (union, never shrinks)", () => {
    const fused = reciprocalRankFusion([["a", "b"], ["b", "c"]]);
    expect([...fused].sort()).toEqual(["a", "b", "c"]);
  });

  it("supports a custom key for object items", () => {
    const l1 = [{ id: "p1" }, { id: "p2" }];
    const l2 = [{ id: "p2" }, { id: "p1" }];
    const fused = reciprocalRankFusion([l1, l2], { key: (o) => o.id });
    expect(fused.map((o) => o.id).sort()).toEqual(["p1", "p2"]);
  });

  it("a single list round-trips its own order", () => {
    expect(reciprocalRankFusion([["a", "b", "c"]])).toEqual(["a", "b", "c"]);
  });

  it("an item #1 in both lists outranks an item #1 in only one", () => {
    // 'x' is 1st in both; 'a' is 1st in l1 only, 'c' 1st in l2 only.
    const fused = reciprocalRankFusion([["x", "a"], ["x", "c"]]);
    expect(fused[0]).toBe("x");
  });
});
