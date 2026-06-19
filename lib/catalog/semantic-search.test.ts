import { describe, it, expect } from "vitest";
import { fuseSemanticLane } from "@/lib/catalog/semantic-search";
import type { CatalogProduct } from "@/features/product-finder/types";

const p = (id: string): CatalogProduct => ({ id, sku: id, name: id } as unknown as CatalogProduct);

describe("fuseSemanticLane", () => {
  const items = [p("a"), p("b"), p("c"), p("d")];

  it("returns items unchanged when there is no semantic signal", () => {
    expect(fuseSemanticLane(items, [])).toBe(items);
    expect(fuseSemanticLane([], ["a"])).toEqual([]);
  });

  it("returns the same set of ids (never drops or injects products)", () => {
    const out = fuseSemanticLane(items, ["d", "c"]);
    expect(out.map((x) => x.id).sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("lifts a semantically-relevant item that keyword ranked low", () => {
    // 'd' is last by keyword but #1 semantically → fusion should pull it up.
    const out = fuseSemanticLane(items, ["d", "c", "b", "a"]);
    const posD = out.findIndex((x) => x.id === "d");
    expect(posD).toBeLessThan(3); // moved up from last
  });

  it("ignores semantic ids not present in the result set", () => {
    const out = fuseSemanticLane(items, ["zzz", "a"]);
    expect(out.map((x) => x.id).sort()).toEqual(["a", "b", "c", "d"]);
  });
});
