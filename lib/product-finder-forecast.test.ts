import { describe, it, expect } from "vitest";
import { demandForecast, WINDOW_DAYS } from "@/lib/product-finder-forecast";
import type { Order } from "@/lib/product-finder-store";
import type { SavedQuote } from "@/lib/product-finder-quotes";
import type { CatalogProduct } from "@/features/product-finder/types";

const DAY = 86_400_000;
const NOW = 1_781_400_000_000;

function product(id: string, subcategory: string, name = `P-${id}`): CatalogProduct {
  return {
    id,
    sku: id,
    name,
    brand: "Brand",
    category: "electrical",
    subcategory,
    description: "",
    unitPrice: 10,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "⚡",
  };
}

function order(daysAgo: number, lines: { p: CatalogProduct; qty: number }[]): Order {
  return {
    id: `o-${daysAgo}-${lines[0].p.id}`,
    placedAt: NOW - daysAgo * DAY,
    lines: lines.map((l) => ({ product: l.p, qty: l.qty })),
    total: 100,
    customerId: null,
    customerName: null,
  };
}

function wonQuote(daysAgo: number, lines: { p: CatalogProduct; qty: number }[], over: Partial<SavedQuote> = {}): SavedQuote {
  return {
    id: `q-${daysAgo}-${lines[0].p.id}`,
    number: "Q-X",
    customer: "A",
    project: "",
    lines: lines.map((l) => ({ product: l.p, qty: l.qty })),
    total: 100,
    status: "won",
    createdAt: NOW - daysAgo * DAY,
    customerId: null,
    ...over,
  };
}

const breaker = product("b1", "Circuit Breakers");
const breaker2 = product("b2", "Circuit Breakers");
const wire = product("w1", "Wire & Cable");

describe("demandForecast", () => {
  it("returns empty for no demand", () => {
    expect(demandForecast([], [], NOW)).toEqual([]);
  });

  it("aggregates order + won-quote lines per subcategory, sorted by volume", () => {
    const orders = [order(10, [{ p: breaker, qty: 10 }]), order(20, [{ p: wire, qty: 4 }])];
    const quotes = [wonQuote(5, [{ p: breaker2, qty: 6 }])];
    const out = demandForecast(orders, quotes, NOW);
    expect(out[0].subcategory).toBe("Circuit Breakers");
    expect(out[0].qty90d).toBe(16);
    expect(out[0].events).toBe(2);
    expect(out[1].subcategory).toBe("Wire & Cable");
    expect(out[1].qty90d).toBe(4);
  });

  it("ignores events outside the trailing window and non-won quotes", () => {
    const orders = [order(WINDOW_DAYS + 5, [{ p: breaker, qty: 50 }])];
    const quotes = [
      { ...wonQuote(5, [{ p: breaker, qty: 3 }]), status: "sent" as const },
      wonQuote(8, [{ p: breaker, qty: 2 }]),
    ];
    const out = demandForecast(orders, quotes, NOW);
    expect(out).toHaveLength(1);
    expect(out[0].qty90d).toBe(2);
  });

  it("does not double-count converted won quotes (their orders carry the demand)", () => {
    const orders = [order(5, [{ p: breaker, qty: 10 }])];
    const quotes = [wonQuote(5, [{ p: breaker, qty: 10 }], { convertedOrderId: "order-x" })];
    const out = demandForecast(orders, quotes, NOW);
    expect(out[0].qty90d).toBe(10);
  });

  it("computes trend from half-window comparison", () => {
    // up: all volume recent
    const up = demandForecast([order(5, [{ p: breaker, qty: 10 }])], [], NOW);
    expect(up[0].trend).toBe("up");
    // down: all volume old
    const down = demandForecast([order(80, [{ p: breaker, qty: 10 }])], [], NOW);
    expect(down[0].trend).toBe("down");
    // flat: balanced halves
    const flat = demandForecast(
      [order(80, [{ p: breaker, qty: 10 }]), order(5, [{ p: breaker, qty: 10 }])],
      [],
      NOW
    );
    expect(flat[0].trend).toBe("flat");
  });

  it("projects 30-day demand with a trend adjustment", () => {
    // 30 units over 90d → 10/month; trend up → ~13
    const out = demandForecast(
      [order(10, [{ p: breaker, qty: 20 }]), order(30, [{ p: breaker, qty: 10 }])],
      [],
      NOW
    );
    expect(out[0].monthlyRate).toBeCloseTo(10, 1);
    expect(out[0].trend).toBe("up");
    expect(out[0].projected30d).toBe(13);
  });

  it("identifies the top product per subcategory", () => {
    const out = demandForecast(
      [order(5, [{ p: breaker, qty: 3 }, { p: breaker2, qty: 9 }])],
      [],
      NOW
    );
    expect(out[0].topProduct).toEqual({ id: "b2", name: "P-b2", qty: 9 });
  });

  it("caps the list at k", () => {
    const subs = ["A", "B", "C"].map((s, i) => order(5, [{ p: product(`x${i}`, s), qty: i + 1 }]));
    expect(demandForecast(subs, [], NOW, 2)).toHaveLength(2);
  });

  it("is deterministic", () => {
    const orders = [order(5, [{ p: breaker, qty: 3 }])];
    expect(demandForecast(orders, [], NOW)).toEqual(demandForecast(orders, [], NOW));
  });
});
