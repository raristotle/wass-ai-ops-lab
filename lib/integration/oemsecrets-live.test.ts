import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getOemsecretsOffers,
  mapOemsecretsToOffers,
  oemsecretsConfigured,
  type OsResponse,
} from "@/lib/integration/oemsecrets-live";

const FIXTURE: OsResponse = {
  stock: [
    {
      distributor: { distributor_name: "Digi-Key", franchised: true },
      stock: "5,000",
      lead_time: "5",
      buy_now_url: "https://www.digikey.com/p/xyz",
      prices: { USD: [{ unit_break: "1", unit_price: "$3.10" }, { unit_break: 500, unit_price: 2.2 }] },
    },
    {
      distributor: "Broker Trading Co", // bare string distributor, no franchised flag
      stock: 12,
      prices: [{ unit_break: 1, unit_price: 9.5 }],
    },
  ],
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("oemsecretsConfigured", () => {
  it("is false when blank, true once set", () => {
    vi.stubEnv("OEMSECRETS_API_TOKEN", "  ");
    expect(oemsecretsConfigured()).toBe(false);
    vi.stubEnv("OEMSECRETS_API_TOKEN", "tok");
    expect(oemsecretsConfigured()).toBe(true);
  });
});

describe("mapOemsecretsToOffers (pure)", () => {
  it("coerces string numbers/currency and franchised→authorized", () => {
    const [dk] = mapOemsecretsToOffers(FIXTURE);
    expect(dk.source).toBe("Digi-Key");
    expect(dk.authorized).toBe(true);
    expect(dk.stock).toBe(5000); // "5,000" coerced
    expect(dk.leadDays).toBe(5);
    expect(dk.unitPrice).toBe(3.1); // entry (qty-1) price, not the deep-volume floor
    expect(dk.priceBreaks).toEqual([
      { qty: 1, price: 3.1 },
      { qty: 500, price: 2.2 },
    ]);
    expect(dk.url).toBe("https://www.digikey.com/p/xyz");
  });

  it("treats a bare-string distributor with no flag as NOT authorized", () => {
    const [, broker] = mapOemsecretsToOffers(FIXTURE);
    expect(broker.source).toBe("Broker Trading Co");
    expect(broker.authorized).toBe(false); // ← never over-credit a broker
    expect(broker.stock).toBe(12);
    expect(broker.leadDays).toBeNull();
    expect(broker.unitPrice).toBe(9.5);
  });

  it("drops malformed price rows and returns [] for empty input", () => {
    const offers = mapOemsecretsToOffers({
      stock: [{ distributor: "X", prices: [{ unit_break: "abc", unit_price: "" }] }],
    });
    expect(offers[0].priceBreaks).toEqual([]);
    expect(offers[0].unitPrice).toBeNull();
    expect(mapOemsecretsToOffers({})).toEqual([]);
  });
});

describe("getOemsecretsOffers (dormant gate)", () => {
  it("returns {no-keys} and never fetches when unkeyed", async () => {
    vi.stubEnv("OEMSECRETS_API_TOKEN", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(await getOemsecretsOffers("ABC")).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled(); // ← $0: zero network until keyed
  });

  it("maps a live response when keyed", async () => {
    vi.stubEnv("OEMSECRETS_API_TOKEN", "tok");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(FIXTURE), { status: 200 }));
    const result = await getOemsecretsOffers("ABC");
    expect(result.enabled).toBe(true);
    if (result.enabled) {
      expect(result.source).toBe("OEMsecrets");
      expect(result.offers).toHaveLength(2);
    }
  });

  it("fails closed on non-OK, no-data, and thrown fetch", async () => {
    vi.stubEnv("OEMSECRETS_API_TOKEN", "tok");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("x", { status: 503 }));
    expect(await getOemsecretsOffers("ABC")).toEqual({ enabled: false, reason: "fetch-failed" });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("{}", { status: 200 }));
    expect(await getOemsecretsOffers("ABC")).toEqual({ enabled: false, reason: "no-data" });
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("down"));
    expect(await getOemsecretsOffers("ABC")).toEqual({ enabled: false, reason: "fetch-failed" });
  });
});
