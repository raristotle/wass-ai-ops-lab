import { describe, it, expect, afterEach, vi } from "vitest";
import {
  frankfurterToRates,
  configuredCurrencies,
  fxConfigured,
  getIndicativeRates,
} from "@/lib/integration/fx-live";

afterEach(() => {
  delete process.env.FX_QUOTE_CURRENCIES;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("frankfurterToRates", () => {
  const payload = { amount: 1, base: "USD", date: "2026-06-15", rates: { CAD: 1.36, MXN: 17.1 } };

  it("shapes a Frankfurter response into the requested currencies in order", () => {
    const r = frankfurterToRates(payload, ["CAD", "MXN"]);
    expect(r).toEqual({
      base: "USD",
      asOf: "2026-06-15",
      rates: [
        { currency: "CAD", rate: 1.36, asOf: "2026-06-15" },
        { currency: "MXN", rate: 17.1, asOf: "2026-06-15" },
      ],
    });
  });

  it("drops missing / non-positive rates and returns null when none survive", () => {
    expect(frankfurterToRates(payload, ["EUR"])).toBeNull();
    const bad = { base: "USD", date: "2026-06-15", rates: { CAD: 0, MXN: -1 } };
    expect(frankfurterToRates(bad, ["CAD", "MXN"])).toBeNull();
  });

  it("returns null on an unusable payload", () => {
    expect(frankfurterToRates({ nope: true }, ["CAD"])).toBeNull();
    expect(frankfurterToRates(null, ["CAD"])).toBeNull();
  });
});

describe("configuredCurrencies / fxConfigured", () => {
  it("is dormant (empty) when the env var is unset", () => {
    expect(configuredCurrencies()).toEqual([]);
    expect(fxConfigured()).toBe(false);
  });

  it("parses, uppercases, de-dupes, excludes USD, validates, and caps at 5", () => {
    process.env.FX_QUOTE_CURRENCIES = "cad, USD, mxn, cad, eur , gbp, jpy, chf, zzz1";
    expect(configuredCurrencies()).toEqual(["CAD", "MXN", "EUR", "GBP", "JPY"]);
    expect(fxConfigured()).toBe(true);
  });
});

describe("getIndicativeRates", () => {
  it("is dormant and makes NO network call when unconfigured", async () => {
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await getIndicativeRates();
    expect(r).toEqual({ enabled: false, reason: "not-configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns enabled rates on a good response", async () => {
    // Unique currency keeps the daily cache key distinct from other tests.
    process.env.FX_QUOTE_CURRENCIES = "AUD";
    const fetchSpy = vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify({ base: "USD", date: "2026-06-15", rates: { AUD: 1.5 } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const r = await getIndicativeRates();
    expect(r.enabled).toBe(true);
    if (r.enabled) expect(r.rates.rates[0]).toEqual({ currency: "AUD", rate: 1.5, asOf: "2026-06-15" });
  });

  it("returns error (and does not throw) on an upstream failure", async () => {
    process.env.FX_QUOTE_CURRENCIES = "NZD";
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("nope", { status: 503 }));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await getIndicativeRates();
    expect(r).toEqual({ enabled: false, reason: "error" });
  });
});
