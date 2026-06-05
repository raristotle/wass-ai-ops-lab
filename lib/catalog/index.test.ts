import { describe, it, expect } from "vitest";
import { getCatalog } from "@/lib/catalog/index";

describe("getCatalog", () => {
  it("returns a cached singleton (same reference)", () => {
    expect(getCatalog()).toBe(getCatalog());
  });
  it("indexes 20000 products by id with a haystack", () => {
    const c = getCatalog();
    expect(c.products).toHaveLength(20000);
    expect(c.byId.get(c.products[0].id)).toBe(c.products[0]);
    expect(c.haystack).toHaveLength(20000);
    expect(c.haystack[0]).toBe(c.haystack[0].toLowerCase());
  });
});
