import { describe, it, expect } from "vitest";
import { rowIsShared, diffFlags, countSharedRows } from "@/lib/product-finder-compare-diff";

describe("rowIsShared", () => {
  it("is shared when all present values match", () => {
    expect(rowIsShared(["120V", "120V", "120V"])).toBe(true);
  });
  it("a single present value (rest missing) is shared", () => {
    expect(rowIsShared(["120V", null, null])).toBe(true);
    expect(rowIsShared([null, null])).toBe(true);
  });
  it("differing present values are not shared", () => {
    expect(rowIsShared(["120V", "240V", "120V"])).toBe(false);
  });
  it("a missing value alone does not make an otherwise-equal row differ", () => {
    expect(rowIsShared(["20A", "20A", null])).toBe(true);
  });
});

describe("diffFlags", () => {
  it("flags nothing in a shared row", () => {
    expect(diffFlags(["120V", "120V", "120V"])).toEqual([false, false, false]);
  });
  it("flags the cells that differ from the first present value", () => {
    expect(diffFlags(["120V", "240V", "120V"])).toEqual([false, true, false]);
  });
  it("in a differing row, a missing cell counts as a difference", () => {
    expect(diffFlags(["20A", "30A", null])).toEqual([false, true, true]);
  });
});

describe("countSharedRows", () => {
  it("counts how many rows are shared", () => {
    const rows = [
      ["120V", "120V"], // shared
      ["20A", "30A"], // differs
      ["1", null], // shared (single present)
    ];
    expect(countSharedRows(rows)).toBe(2);
  });
});
