import { describe, it, expect } from "vitest";
import { getCatalog } from "@/lib/catalog/index";
import { CATALOG_SIZE } from "@/lib/catalog/generate";

describe("getCatalog", () => {
  it("returns a cached singleton (same reference)", () => {
    expect(getCatalog()).toBe(getCatalog());
  });
  it("indexes CATALOG_SIZE products by id with a haystack", () => {
    const c = getCatalog();
    expect(c.products).toHaveLength(CATALOG_SIZE);
    expect(c.byId.get(c.products[0].id)).toBe(c.products[0]);
    expect(c.haystack).toHaveLength(CATALOG_SIZE);
    expect(c.haystack[0]).toBe(c.haystack[0].toLowerCase());
  });
});
