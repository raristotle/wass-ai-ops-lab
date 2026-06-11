import { describe, it, expect } from "vitest";
import {
  reorderSuggestions,
  favoritePicks,
  REORDER_DUE_DAYS,
} from "@/lib/product-finder-foryou";
import type { Order } from "@/lib/product-finder-store";
import { CATALOG_PRODUCTS } from "@/data/mock/catalog-products";
import type { ProductSnapshot } from "@/features/product-finder/types";

const DAY = 86_400_000;
const NOW = 1_780_000_000_000;
const [pA, pB, pC] = CATALOG_PRODUCTS;

function order(over: Partial<Order> & Pick<Order, "id" | "placedAt" | "lines">): Order {
  return { total: 100, customerId: null, customerName: null, ...over };
}

const none = new Set<string>();

describe("reorderSuggestions", () => {
  it("returns empty for no orders", () => {
    expect(reorderSuggestions([], none, NOW)).toEqual([]);
  });

  it("aggregates frequency and keeps the most recent qty/customer", () => {
    const orders = [
      order({ id: "o1", placedAt: NOW - 40 * DAY, lines: [{ product: pA, qty: 10 }], customerName: "Acme" }),
      order({ id: "o2", placedAt: NOW - 5 * DAY, lines: [{ product: pA, qty: 4 }], customerName: "Globex" }),
    ];
    const [s] = reorderSuggestions(orders, none, NOW);
    expect(s.product.id).toBe(pA.id);
    expect(s.timesOrdered).toBe(2);
    expect(s.lastQty).toBe(4);
    expect(s.lastOrderedAt).toBe(NOW - 5 * DAY);
    expect(s.customerName).toBe("Globex");
    expect(s.due).toBe(false);
  });

  it("flags products last ordered ≥ REORDER_DUE_DAYS ago as due, ranked first", () => {
    const orders = [
      // pA ordered twice but recently; pB once, long ago
      order({ id: "o1", placedAt: NOW - 2 * DAY, lines: [{ product: pA, qty: 1 }] }),
      order({ id: "o2", placedAt: NOW - 3 * DAY, lines: [{ product: pA, qty: 1 }] }),
      order({ id: "o3", placedAt: NOW - (REORDER_DUE_DAYS + 5) * DAY, lines: [{ product: pB, qty: 2 }] }),
    ];
    const out = reorderSuggestions(orders, none, NOW);
    expect(out[0].product.id).toBe(pB.id);
    expect(out[0].due).toBe(true);
    expect(out[1].product.id).toBe(pA.id);
    expect(out[1].due).toBe(false);
  });

  it("breaks ties by frequency then recency", () => {
    const orders = [
      order({ id: "o1", placedAt: NOW - 1 * DAY, lines: [{ product: pA, qty: 1 }, { product: pB, qty: 1 }] }),
      order({ id: "o2", placedAt: NOW - 2 * DAY, lines: [{ product: pA, qty: 1 }] }),
      order({ id: "o3", placedAt: NOW - 3 * DAY, lines: [{ product: pC, qty: 1 }] }),
    ];
    const out = reorderSuggestions(orders, none, NOW);
    expect(out.map((s) => s.product.id)).toEqual([pA.id, pB.id, pC.id]);
  });

  it("excludes products already in the cart", () => {
    const orders = [order({ id: "o1", placedAt: NOW - DAY, lines: [{ product: pA, qty: 1 }, { product: pB, qty: 1 }] })];
    const out = reorderSuggestions(orders, new Set([pA.id]), NOW);
    expect(out.map((s) => s.product.id)).toEqual([pB.id]);
  });

  it("caps at k", () => {
    const orders = [
      order({ id: "o1", placedAt: NOW - DAY, lines: [{ product: pA, qty: 1 }, { product: pB, qty: 1 }, { product: pC, qty: 1 }] }),
    ];
    expect(reorderSuggestions(orders, none, NOW, 2)).toHaveLength(2);
  });
});

describe("favoritePicks", () => {
  const snap = (id: string): ProductSnapshot => ({
    id,
    name: `Product ${id}`,
    brand: "Brand",
    unitPrice: 10,
    imageIcon: "🔌",
    category: "electrical",
  });

  it("filters excluded ids and preserves order", () => {
    const favs = [snap("a"), snap("b"), snap("c")];
    expect(favoritePicks(favs, new Set(["b"]), 4).map((f) => f.id)).toEqual(["a", "c"]);
  });

  it("caps at k", () => {
    const favs = [snap("a"), snap("b"), snap("c")];
    expect(favoritePicks(favs, new Set(), 2)).toHaveLength(2);
  });

  it("returns empty for no favorites", () => {
    expect(favoritePicks([], new Set(), 4)).toEqual([]);
  });
});
