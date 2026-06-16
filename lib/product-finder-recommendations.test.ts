import { describe, it, expect } from "vitest";
import { alsoBought, optimizeSubstitution } from "@/lib/product-finder-recommendations";
import type { Order } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";

function prod(id: string, over: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id, sku: id, name: `Product ${id}`, brand: "Acme", category: "electrical",
    subcategory: "Circuit Breakers", description: "", unitPrice: 20, uom: "ea", specs: [],
    preferred: false, branchStock: [], dcStock: [], externalSources: [], imageIcon: "x", ...over,
  };
}
function order(id: string, ids: string[]): Order {
  return {
    id, placedAt: 1, total: 0, customerId: null, customerName: null,
    lines: ids.map((p) => ({ product: prod(p), qty: 1 })),
  };
}

describe("alsoBought (co-occurrence CF)", () => {
  const orders: Order[] = [
    order("o1", ["A", "B", "C"]),
    order("o2", ["A", "B"]),
    order("o3", ["A", "C", "B"]),
    order("o4", ["X", "Y"]), // no seed A
  ];

  it("ranks co-ordered products by how many of the seed's orders contained them", () => {
    const out = alsoBought(orders, "A");
    expect(out.map((o) => [o.product.id, o.coOrders])).toEqual([
      ["B", 3],
      ["C", 2],
    ]);
  });

  it("excludes the seed and any excludeIds (e.g. cart contents)", () => {
    const out = alsoBought(orders, "A", { excludeIds: new Set(["B"]) });
    expect(out.map((o) => o.product.id)).toEqual(["C"]);
  });

  it("counts a co-product at most once per order", () => {
    const dup: Order[] = [order("o1", ["A", "B", "B"])]; // B twice in one order
    expect(alsoBought(dup, "A")[0].coOrders).toBe(1);
  });

  it("returns empty when the seed was never ordered", () => {
    expect(alsoBought(orders, "ZZZ")).toEqual([]);
  });
});

describe("optimizeSubstitution (availability + margin)", () => {
  const stock = (p: CatalogProduct): number => (p.id === "out" ? 0 : 5);

  it("ranks in-stock first, then preferred, then cheaper; with reasons", () => {
    const cands = [
      prod("out", { unitPrice: 5 }), // cheapest but out of stock
      prod("plain", { unitPrice: 30 }),
      prod("pref", { unitPrice: 40, preferred: true }),
    ];
    const out = optimizeSubstitution(cands, stock);
    expect(out.map((s) => s.product.id)).toEqual(["pref", "plain", "out"]);
    expect(out[0].reasons).toContain("Preferred line");
    expect(out[0].reasons.some((r) => r.startsWith("In stock"))).toBe(true);
    expect(out[2].inStock).toBe(false);
  });
});
