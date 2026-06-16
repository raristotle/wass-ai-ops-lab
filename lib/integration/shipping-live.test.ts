import { describe, it, expect, afterEach, vi } from "vitest";
import { shippingConfigured, shippoRatesToQuotes, getShippingRates } from "@/lib/integration/shipping-live";

const ADDR = { street1: "1 Main", city: "Houston", state: "TX", zip: "77002", country: "US" };
const PARCEL = { length: "5", width: "5", height: "5", distance_unit: "in", weight: "2", mass_unit: "lb" };

afterEach(() => {
  delete process.env.SHIPPO_API_TOKEN;
  vi.unstubAllGlobals();
});

describe("shippingConfigured", () => {
  it("is false when the token is unset (dormant)", () => {
    expect(shippingConfigured()).toBe(false);
    process.env.SHIPPO_API_TOKEN = "shippo_test_x";
    expect(shippingConfigured()).toBe(true);
  });
});

describe("shippoRatesToQuotes (pure)", () => {
  it("maps rates, coerces the string amount, sorts cheapest first, drops malformed", () => {
    const quotes = shippoRatesToQuotes([
      { object_id: "r2", provider: "UPS", servicelevel: { name: "Ground", token: "ups_ground" }, amount: "12.50", currency: "USD", estimated_days: 3 },
      { object_id: "r1", provider: "USPS", servicelevel: { name: "Priority", token: "usps_priority" }, amount: "8.30", currency: "USD", estimated_days: 2 },
      { provider: "FedEx", amount: "5.00" }, // dropped — no object_id
      { object_id: "r3", provider: "DHL", amount: "not-a-number" }, // dropped — bad amount
    ]);
    expect(quotes.map((q) => [q.carrier, q.amount])).toEqual([
      ["USPS", 8.3],
      ["UPS", 12.5],
    ]);
    expect(quotes[0].estimatedDays).toBe(2);
  });
});

describe("getShippingRates (dormant)", () => {
  it("returns no-keys and makes NO network call when unset", async () => {
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await getShippingRates({ addressFrom: ADDR, addressTo: ADDR, parcel: PARCEL });
    expect(r).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
