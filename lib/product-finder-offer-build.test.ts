import { describe, expect, it } from "vitest";
import { internalOffer, liveQuoteToOffer } from "@/lib/product-finder-offer-build";
import type { CatalogProduct } from "@/features/product-finder/types";
import type { LiveQuote } from "@/lib/integration/distributor-live";

const product = (over: Partial<CatalogProduct> = {}): CatalogProduct => ({
  id: "GEN-1", sku: "ACME-1", name: "Acme breaker", brand: "Acme",
  category: "electrical", subcategory: "Circuit Breakers", description: "x",
  unitPrice: 100, uom: "EA", specs: [{ name: "A", value: "20", isNonNeg: true }],
  preferred: false, branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  dataSource: "simulated", lifecycleStatus: "Active", ...over,
});

describe("internalOffer", () => {
  it("is authorized, sums branch+DC stock, and 0-day lead from branch", () => {
    const o = internalOffer(
      product({
        branchStock: [{ branchId: "B1", branchName: "Houston", city: "Houston", state: "TX", quantity: 7 }],
        dcStock: [{ dcId: "DC1", dcName: "Dallas DC", location: "Dallas", quantity: 40 }],
      }),
    );
    expect(o.source).toBe("Meridian");
    expect(o.authorized).toBe(true);
    expect(o.stock).toBe(47);
    expect(o.leadDays).toBe(0);
    expect(o.unitPrice).toBe(100); // qty-1 tier = list price
    expect(o.priceBreaks).toEqual([
      { qty: 1, price: 100 },
      { qty: 10, price: 95 },
      { qty: 50, price: 90 },
      { qty: 100, price: 85 },
    ]);
  });

  it("uses ~2-day lead when only the DC stocks it", () => {
    const o = internalOffer(product({ dcStock: [{ dcId: "DC1", dcName: "DC", location: "TX", quantity: 5 }] }));
    expect(o.leadDays).toBe(2);
    expect(o.stock).toBe(5);
  });

  it("nulls lead time when nothing is on hand", () => {
    const o = internalOffer(product());
    expect(o.stock).toBe(0);
    expect(o.leadDays).toBeNull();
  });
});

describe("liveQuoteToOffer", () => {
  const quote = (over: Partial<LiveQuote> = {}): LiveQuote => ({
    distributor: "Mouser Electronics", matchedPart: "MP", manufacturer: "Acme",
    description: "x", unitPrice: 2.5, priceBreaks: [{ qty: 1, price: 2.5 }, { qty: 100, price: 1.9 }],
    stock: 1000, datasheetUrl: null, productUrl: "https://mouser.com/p", ...over,
  });

  it("maps an authorized distributor quote, preferring the quoted unit price", () => {
    const o = liveQuoteToOffer(quote());
    expect(o.source).toBe("Mouser Electronics");
    expect(o.authorized).toBe(true);
    expect(o.stock).toBe(1000);
    expect(o.unitPrice).toBe(2.5);
    expect(o.url).toBe("https://mouser.com/p");
  });

  it("falls back to the entry break when unitPrice is null", () => {
    const o = liveQuoteToOffer(quote({ unitPrice: null }));
    expect(o.unitPrice).toBe(2.5); // smallest-qty break
  });
});
