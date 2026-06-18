import { describe, it, expect } from "vitest";
import { rankOffers, bestOffer, offerSources, priceCurve, entryPrice, type Offer } from "@/lib/product-finder-offers";

const offer = (over: Partial<Offer> = {}): Offer => ({
  source: "X", authorized: false, stock: 10, leadDays: 0, unitPrice: 5, priceBreaks: [], url: null, ...over,
});

describe("rankOffers", () => {
  it("puts in-stock offers ahead of out-of-stock", () => {
    const ranked = rankOffers([offer({ source: "oos", stock: 0, unitPrice: 1 }), offer({ source: "in", stock: 5, unitPrice: 9 })]);
    expect(ranked[0].source).toBe("in");
  });

  it("within a stock group, ranks by lowest unit price", () => {
    const ranked = rankOffers([offer({ source: "hi", unitPrice: 9 }), offer({ source: "lo", unitPrice: 3 })]);
    expect(ranked.map((o) => o.source)).toEqual(["lo", "hi"]);
  });

  it("breaks a price tie toward the authorized source", () => {
    const ranked = rankOffers([offer({ source: "broker", authorized: false }), offer({ source: "auth", authorized: true })]);
    expect(ranked[0].source).toBe("auth");
  });

  it("sinks unpriced offers below priced ones in the same stock group", () => {
    const ranked = rankOffers([offer({ source: "none", unitPrice: null }), offer({ source: "priced", unitPrice: 7 })]);
    expect(ranked[0].source).toBe("priced");
  });
});

describe("bestOffer + offerSources", () => {
  it("bestOffer returns the top of the ranked ladder", () => {
    expect(bestOffer([offer({ source: "a", unitPrice: 8 }), offer({ source: "b", unitPrice: 2 })])?.source).toBe("b");
    expect(bestOffer([])).toBeNull();
  });
  it("offerSources is the distinct source list", () => {
    expect(offerSources([offer({ source: "a" }), offer({ source: "a" }), offer({ source: "b" })])).toEqual(["a", "b"]);
  });
});

describe("entryPrice", () => {
  it("returns the price at the smallest qty break, not the volume floor", () => {
    expect(entryPrice([{ qty: 100, price: 0.8 }, { qty: 1, price: 2.5 }, { qty: 10, price: 1.5 }])).toBe(2.5);
  });
  it("returns null with no breaks", () => {
    expect(entryPrice([])).toBeNull();
  });
});

describe("priceCurve", () => {
  it("dedups by qty (lowest price wins) and sorts ascending", () => {
    expect(
      priceCurve([
        { qty: 100, price: 0.8 },
        { qty: 1, price: 1.0 },
        { qty: 1, price: 0.9 },
        { qty: 10, price: 0.95 },
      ]),
    ).toEqual([
      { qty: 1, price: 0.9 },
      { qty: 10, price: 0.95 },
      { qty: 100, price: 0.8 },
    ]);
  });
});
