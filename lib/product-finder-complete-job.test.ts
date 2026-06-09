import { describe, it, expect } from "vitest";
import { suggestCompletions } from "@/lib/product-finder-complete-job";
import type { CatalogProduct } from "@/features/product-finder/types";

function p(id: string, subcategory: string): CatalogProduct {
  return {
    id, sku: id.toUpperCase(), name: `Product ${id}`, brand: "B", category: "electrical",
    subcategory, description: "", unitPrice: 10, uom: "EA", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "⚡",
  };
}

describe("suggestCompletions", () => {
  // Complement resolver: breaker → [load center, lugs]; conduit → [fittings]
  const complements: Record<string, CatalogProduct[]> = {
    "Circuit Breakers": [p("lc1", "Load Centers"), p("lug1", "Lugs & Wire Connectors")],
    "Conduit": [p("fit1", "Conduit Fittings")],
  };
  const resolver = (prod: CatalogProduct) => complements[prod.subcategory] ?? [];

  it("suggests complements the basket is missing", () => {
    const basket = [{ product: p("b1", "Circuit Breakers") }];
    const out = suggestCompletions(basket, resolver);
    expect(out.map((s) => s.product.id)).toEqual(["lc1", "lug1"]);
    expect(out[0].reason).toContain("Product b1");
  });

  it("skips complements whose subcategory is already covered", () => {
    const basket = [
      { product: p("b1", "Circuit Breakers") },
      { product: p("b2", "Load Centers") }, // covers Load Centers
    ];
    const out = suggestCompletions(basket, resolver);
    expect(out.map((s) => s.product.id)).toEqual(["lug1"]);
  });

  it("never suggests a product already in the basket", () => {
    const basket = [
      { product: p("b1", "Circuit Breakers") },
      { product: p("lug1", "Lugs & Wire Connectors") },
    ];
    const out = suggestCompletions(basket, resolver);
    expect(out.find((s) => s.product.id === "lug1")).toBeUndefined();
  });

  it("dedups across multiple basket items", () => {
    const shared = (prod: CatalogProduct) =>
      prod.subcategory === "Conduit" ? [p("fit1", "Conduit Fittings")] : [];
    const basket = [
      { product: p("c1", "Conduit") },
      { product: p("c2", "Conduit") },
    ];
    const out = suggestCompletions(basket, shared);
    expect(out).toHaveLength(1);
    expect(out[0].product.id).toBe("fit1");
  });

  it("caps results at k", () => {
    const basket = [{ product: p("b1", "Circuit Breakers") }];
    expect(suggestCompletions(basket, resolver, 1)).toHaveLength(1);
  });

  it("returns nothing for an empty basket", () => {
    expect(suggestCompletions([], resolver)).toEqual([]);
  });
});
