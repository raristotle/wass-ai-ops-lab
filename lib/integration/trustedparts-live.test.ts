import { afterEach, describe, expect, it, vi } from "vitest";
import {
  eciaConfigured,
  getTrustedPartsOffers,
  mapTrustedPartsToOffers,
  type TpResponse,
} from "@/lib/integration/trustedparts-live";

const FIXTURE: TpResponse = {
  Parts: [
    {
      Distributors: [
        {
          DistributorName: "Mouser Electronics",
          Authorized: true,
          StockQuantity: 1240,
          LeadTime: 3,
          BuyNowURL: "https://www.mouser.com/p/abc",
          PriceBreaks: [
            { Quantity: 1, Price: 2.5 },
            { Quantity: 100, Price: 1.8 },
          ],
        },
        {
          DistributorName: "Avnet",
          Authorized: true,
          StockQuantity: 0,
          // no lead time, no price breaks, no url — all should null out
        },
      ],
    },
  ],
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("eciaConfigured", () => {
  it("is false when the key is absent or blank", () => {
    vi.stubEnv("ECIA_API_KEY", "");
    expect(eciaConfigured()).toBe(false);
    vi.stubEnv("ECIA_API_KEY", "   ");
    expect(eciaConfigured()).toBe(false);
  });
  it("is true once the key is set", () => {
    vi.stubEnv("ECIA_API_KEY", "tok_live");
    expect(eciaConfigured()).toBe(true);
  });
});

describe("mapTrustedPartsToOffers (pure)", () => {
  it("maps distributors to offers with lowest-break unit price", () => {
    const offers = mapTrustedPartsToOffers(FIXTURE);
    expect(offers).toHaveLength(2);
    const mouser = offers[0];
    expect(mouser.source).toBe("Mouser Electronics");
    expect(mouser.authorized).toBe(true);
    expect(mouser.stock).toBe(1240);
    expect(mouser.leadDays).toBe(3);
    expect(mouser.unitPrice).toBe(2.5); // entry (qty-1) price, not the deep-volume floor
    expect(mouser.priceBreaks).toEqual([
      { qty: 1, price: 2.5 },
      { qty: 100, price: 1.8 },
    ]);
    expect(mouser.url).toBe("https://www.mouser.com/p/abc");
  });

  it("nulls missing fields and leaves unpriced offers with null unitPrice", () => {
    const [, avnet] = mapTrustedPartsToOffers(FIXTURE);
    expect(avnet.source).toBe("Avnet");
    expect(avnet.stock).toBe(0);
    expect(avnet.leadDays).toBeNull();
    expect(avnet.unitPrice).toBeNull();
    expect(avnet.priceBreaks).toEqual([]);
    expect(avnet.url).toBeNull();
  });

  it("treats Authorized!==false as authorized and drops malformed breaks", () => {
    const offers = mapTrustedPartsToOffers({
      Parts: [{ Distributors: [{ DistributorName: "X", PriceBreaks: [{ Quantity: 1 }, { Price: 5 }] }] }],
    });
    expect(offers[0].authorized).toBe(true); // undefined Authorized → authorized
    expect(offers[0].priceBreaks).toEqual([]); // both breaks malformed
    expect(offers[0].unitPrice).toBeNull();
  });

  it("returns [] for an empty/garbage response", () => {
    expect(mapTrustedPartsToOffers({})).toEqual([]);
    expect(mapTrustedPartsToOffers({ Parts: [] })).toEqual([]);
  });
});

describe("getTrustedPartsOffers (dormant gate)", () => {
  it("returns {enabled:false, no-keys} and never fetches when unkeyed", async () => {
    vi.stubEnv("ECIA_API_KEY", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await getTrustedPartsOffers("ABC-123");
    expect(result).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled(); // ← $0: zero network until keyed
  });

  it("maps a live response when keyed", async () => {
    vi.stubEnv("ECIA_API_KEY", "tok_live");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(FIXTURE), { status: 200 }),
    );
    const result = await getTrustedPartsOffers("ABC-123");
    expect(result.enabled).toBe(true);
    if (result.enabled) {
      expect(result.source).toBe("TrustedParts (ECIA)");
      expect(result.offers).toHaveLength(2);
    }
  });

  it("fails closed to {fetch-failed} on a non-OK response", async () => {
    vi.stubEnv("ECIA_API_KEY", "tok_live");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 500 }));
    expect(await getTrustedPartsOffers("ABC-123")).toEqual({ enabled: false, reason: "fetch-failed" });
  });

  it("returns {no-data} when the response has no offers", async () => {
    vi.stubEnv("ECIA_API_KEY", "tok_live");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    expect(await getTrustedPartsOffers("ABC-123")).toEqual({ enabled: false, reason: "no-data" });
  });

  it("fails closed to {fetch-failed} when fetch throws", async () => {
    vi.stubEnv("ECIA_API_KEY", "tok_live");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    expect(await getTrustedPartsOffers("ABC-123")).toEqual({ enabled: false, reason: "fetch-failed" });
  });
});
