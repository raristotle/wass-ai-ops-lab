import { describe, it, expect, afterEach, vi } from "vitest";
import { shippingConfigured, shippoRatesToQuotes, getShippingRates } from "@/lib/integration/shipping-live";

const ADDR = { name: "Dock A", street1: "1 Main", city: "Houston", state: "TX", zip: "77002", country: "US" };
const PARCEL = { length: "5", width: "5", height: "5", distance_unit: "in", weight: "2", mass_unit: "lb" };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.SHIPPO_API_TOKEN;
});

// ── shippingConfigured: whitespace-only token is treated as dormant (env() trim) ──
describe("shippingConfigured (env trimming)", () => {
  it("treats a whitespace-only token as dormant", () => {
    process.env.SHIPPO_API_TOKEN = "   ";
    expect(shippingConfigured()).toBe(false);
  });

  it("trims surrounding whitespace and stays configured", () => {
    process.env.SHIPPO_API_TOKEN = "  shippo_test_x  ";
    expect(shippingConfigured()).toBe(true);
  });
});

// ── shippoRatesToQuotes: edge cases not covered by the sibling test ──
describe("shippoRatesToQuotes (edge cases)", () => {
  it("returns [] for an empty rates array", () => {
    expect(shippoRatesToQuotes([])).toEqual([]);
  });

  it("defaults currency to USD, service to provider, token to '', estimatedDays to null", () => {
    const quotes = shippoRatesToQuotes([
      { object_id: "r1", provider: "USPS", amount: "9.99" }, // no servicelevel, no currency, no estimated_days
    ]);
    expect(quotes).toEqual([
      {
        carrier: "USPS",
        service: "USPS", // falls back to provider when servicelevel.name is absent
        serviceToken: "",
        amount: 9.99,
        currency: "USD",
        estimatedDays: null,
        rateId: "r1",
      },
    ]);
  });

  it("treats a null servicelevel safely (optional chaining)", () => {
    const quotes = shippoRatesToQuotes([
      { object_id: "r1", provider: "UPS", servicelevel: null, amount: "4.00", currency: "EUR" },
    ]);
    expect(quotes[0].service).toBe("UPS");
    expect(quotes[0].serviceToken).toBe("");
    expect(quotes[0].currency).toBe("EUR");
  });

  it("drops a row missing provider even when object_id + amount are valid", () => {
    const quotes = shippoRatesToQuotes([
      { object_id: "r1", amount: "3.00" }, // no provider → dropped
      { object_id: "r2", provider: "DHL", amount: "3.50" },
    ]);
    expect(quotes.map((q) => q.carrier)).toEqual(["DHL"]);
  });

  it("keeps estimated_days === 0 as a number (not coerced to null)", () => {
    const quotes = shippoRatesToQuotes([
      { object_id: "r1", provider: "USPS", amount: "1.00", estimated_days: 0 },
    ]);
    expect(quotes[0].estimatedDays).toBe(0);
  });

  it("drops a row whose amount is undefined (Number(undefined) is NaN)", () => {
    const quotes = shippoRatesToQuotes([
      { object_id: "r1", provider: "USPS" }, // amount missing
    ]);
    expect(quotes).toEqual([]);
  });
});

// ── getShippingRates: live fetch branches (gate set, network mocked) ──
describe("getShippingRates (live fetch, mocked network)", () => {
  it("success: parses rates and returns enabled result with an ISO fetchedAt", async () => {
    process.env.SHIPPO_API_TOKEN = "shippo_test_live";
    const body = {
      rates: [
        { object_id: "r2", provider: "UPS", servicelevel: { name: "Ground", token: "ups_ground" }, amount: "12.50", currency: "USD", estimated_days: 3 },
        { object_id: "r1", provider: "USPS", servicelevel: { name: "Priority", token: "usps_priority" }, amount: "8.30", currency: "USD", estimated_days: 2 },
      ],
    };
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    const r = await getShippingRates({ addressFrom: ADDR, addressTo: ADDR, parcel: PARCEL });

    expect(r.enabled).toBe(true);
    if (r.enabled) {
      expect(r.source).toBe("Shippo");
      // cheapest first
      expect(r.quotes.map((q) => q.carrier)).toEqual(["USPS", "UPS"]);
      expect(r.quotes[0].amount).toBe(8.3);
      // fetchedAt is a valid ISO timestamp
      expect(typeof r.fetchedAt).toBe("string");
      expect(Number.isNaN(Date.parse(r.fetchedAt))).toBe(false);
    }

    // verify request shape: Shippo endpoint, ShippoToken auth, async:false, parcel wrapped in array
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.goshippo.com/shipments/");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("ShippoToken shippo_test_live");
    expect(headers["Content-Type"]).toBe("application/json");
    const sent = JSON.parse(init.body as string);
    expect(sent.async).toBe(false);
    expect(sent.parcels).toEqual([PARCEL]);
    expect(sent.address_from).toEqual(ADDR);
    expect(sent.address_to).toEqual(ADDR);
  });

  it("success with missing 'rates' field: enabled with empty quotes (json.rates ?? [])", async () => {
    process.env.SHIPPO_API_TOKEN = "shippo_test_live";
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response(JSON.stringify({ messages: ["ok"] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    const r = await getShippingRates({ addressFrom: ADDR, addressTo: ADDR, parcel: PARCEL });

    expect(r).toEqual({ enabled: true, source: "Shippo", quotes: [], fetchedAt: expect.any(String) });
  });

  it("success with unparseable body: .catch(() => ({})) yields enabled + empty quotes", async () => {
    process.env.SHIPPO_API_TOKEN = "shippo_test_live";
    // 200 but the body is not JSON → res.json() rejects → caught → {} → rates ?? []
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("<<not json>>", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    const r = await getShippingRates({ addressFrom: ADDR, addressTo: ADDR, parcel: PARCEL });

    expect(r.enabled).toBe(true);
    if (r.enabled) expect(r.quotes).toEqual([]);
  });

  it("non-OK (HTTP 500): fails closed with reason 'error' and logs", async () => {
    process.env.SHIPPO_API_TOKEN = "shippo_test_live";
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("", { status: 500 }));
    vi.stubGlobal("fetch", fetchSpy);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await getShippingRates({ addressFrom: ADDR, addressTo: ADDR, parcel: PARCEL });

    expect(r).toEqual({ enabled: false, reason: "error" });
    expect(errSpy).toHaveBeenCalledTimes(1);
    // the log line carries the route + HTTP status
    expect(String(errSpy.mock.calls[0][0])).toContain("shippo:rates");
    expect(String(errSpy.mock.calls[0][0])).toContain("Shippo HTTP 500");
  });

  it("non-OK (HTTP 401 auth failure): fails closed with reason 'error'", async () => {
    process.env.SHIPPO_API_TOKEN = "shippo_test_bad";
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => new Response("Unauthorized", { status: 401 })));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await getShippingRates({ addressFrom: ADDR, addressTo: ADDR, parcel: PARCEL });

    expect(r).toEqual({ enabled: false, reason: "error" });
  });

  it("fetch throws (network/timeout): caught, fails closed with reason 'error' and logs", async () => {
    process.env.SHIPPO_API_TOKEN = "shippo_test_live";
    const fetchSpy = vi.fn(async (): Promise<Response> => {
      throw new Error("network down");
    });
    vi.stubGlobal("fetch", fetchSpy);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await getShippingRates({ addressFrom: ADDR, addressTo: ADDR, parcel: PARCEL });

    expect(r).toEqual({ enabled: false, reason: "error" });
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(String(errSpy.mock.calls[0][0])).toContain("network down");
  });

  it("AbortSignal.timeout firing (simulated): caught and fails closed", async () => {
    process.env.SHIPPO_API_TOKEN = "shippo_test_live";
    const fetchSpy = vi.fn(async (): Promise<Response> => {
      const err = new Error("The operation timed out.");
      err.name = "TimeoutError";
      throw err;
    });
    vi.stubGlobal("fetch", fetchSpy);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await getShippingRates({ addressFrom: ADDR, addressTo: ADDR, parcel: PARCEL });

    expect(r).toEqual({ enabled: false, reason: "error" });
  });

  it("dormant guard: whitespace-only token short-circuits before any fetch", async () => {
    process.env.SHIPPO_API_TOKEN = "   ";
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    const r = await getShippingRates({ addressFrom: ADDR, addressTo: ADDR, parcel: PARCEL });

    expect(r).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
