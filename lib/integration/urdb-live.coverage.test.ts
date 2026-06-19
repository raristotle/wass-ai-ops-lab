import { describe, it, expect, afterEach, vi } from "vitest";
import {
  urdbConfigured,
  parseUrdbItem,
  parseUrdbResponse,
  lookupUtilityRates,
  URDB_URL,
} from "@/lib/integration/urdb-live";

const GATE = "OPENEI_API_KEY";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.OPENEI_API_KEY;
});

/** A realistic full-detail URDB Commercial tariff item. */
const URDB_ITEM = {
  label: "5e1d...abc",
  utility: "Pacific Gas & Electric Co",
  name: "A-10 Medium General Demand-Metered Service",
  sector: "Commercial",
  fixedchargefirstmeter: "59.93158",
  fixedchargeunits: "$/month",
  energyratestructure: [[{ rate: 0.18 }]],
  demandratestructure: [[{ rate: 23.5 }]],
  startdate: "1577836800",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("urdbConfigured gate edge cases", () => {
  it("is false when the key is only whitespace (trimmed to empty)", () => {
    process.env[GATE] = "   ";
    expect(urdbConfigured()).toBe(false);
  });
  it("is true for a real non-empty key", () => {
    process.env[GATE] = "real-key";
    expect(urdbConfigured()).toBe(true);
  });
});

describe("parseUrdbItem extra edges", () => {
  it("defaults label to empty string and all optionals to null when fields absent", () => {
    const r = parseUrdbItem({});
    expect(r.label).toBe("");
    expect(r.utility).toBeNull();
    expect(r.name).toBeNull();
    expect(r.sector).toBeNull();
    expect(r.fixedCharge).toBeNull();
    expect(r.fixedChargeUnits).toBeNull();
    expect(r.hasDemandCharges).toBe(false);
    expect(r.hasEnergyCharges).toBe(false);
    expect(r.startDate).toBeNull();
  });

  it("normalizes a full item including numeric fixed charge and startDate", () => {
    const r = parseUrdbItem(URDB_ITEM);
    expect(r.label).toBe("5e1d...abc");
    expect(r.utility).toBe("Pacific Gas & Electric Co");
    expect(r.name).toBe("A-10 Medium General Demand-Metered Service");
    expect(r.sector).toBe("Commercial");
    expect(r.fixedCharge).toBeCloseTo(59.93158);
    expect(r.fixedChargeUnits).toBe("$/month");
    expect(r.hasDemandCharges).toBe(true);
    expect(r.hasEnergyCharges).toBe(true);
    expect(r.startDate).toBe("1577836800");
  });

  it("treats a non-finite numeric fixed charge as null (num() guard)", () => {
    const r = parseUrdbItem({ label: "x", fixedchargefirstmeter: "not-a-number" });
    expect(r.fixedCharge).toBeNull();
  });

  it("accepts a numeric (non-string) fixed charge value", () => {
    const r = parseUrdbItem({ label: "x", fixedchargefirstmeter: 12.25 });
    expect(r.fixedCharge).toBe(12.25);
  });

  it("trims string fields and treats whitespace-only strings as null", () => {
    const r = parseUrdbItem({ label: "  L  ", utility: "   ", name: "  PG&E A-1  " });
    expect(r.label).toBe("L");
    expect(r.utility).toBeNull();
    expect(r.name).toBe("PG&E A-1");
  });

  it("flags demand-only via demandratestructure (no energy)", () => {
    const r = parseUrdbItem({ label: "x", demandratestructure: [[{ rate: 9 }]] });
    expect(r.hasDemandCharges).toBe(true);
    expect(r.hasEnergyCharges).toBe(false);
  });

  it("ignores empty structure arrays (length 0 ⇒ no charges)", () => {
    const r = parseUrdbItem({
      label: "x",
      energyratestructure: [],
      demandratestructure: [],
      flatdemandstructure: [],
    });
    expect(r.hasDemandCharges).toBe(false);
    expect(r.hasEnergyCharges).toBe(false);
  });

  it("treats non-array structure fields as absent", () => {
    const r = parseUrdbItem({
      label: "x",
      energyratestructure: "nope",
      demandratestructure: { a: 1 },
    });
    expect(r.hasDemandCharges).toBe(false);
    expect(r.hasEnergyCharges).toBe(false);
  });
});

describe("parseUrdbResponse extra edges", () => {
  it("returns [] when json is null / not an object", () => {
    expect(parseUrdbResponse(null)).toEqual([]);
    expect(parseUrdbResponse(undefined)).toEqual([]);
    expect(parseUrdbResponse("string")).toEqual([]);
    expect(parseUrdbResponse(42)).toEqual([]);
  });

  it("returns [] when items is present but not an array", () => {
    expect(parseUrdbResponse({ items: { not: "an array" } })).toEqual([]);
    expect(parseUrdbResponse({ items: null })).toEqual([]);
  });

  it("applies the default limit of 10", () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ label: `r${i}` }));
    const out = parseUrdbResponse({ items });
    expect(out).toHaveLength(10);
    expect(out[0].label).toBe("r0");
    expect(out[9].label).toBe("r9");
  });

  it("normalizes each item through parseUrdbItem", () => {
    const out = parseUrdbResponse({ items: [URDB_ITEM] });
    expect(out).toHaveLength(1);
    expect(out[0].utility).toBe("Pacific Gas & Electric Co");
    expect(out[0].hasDemandCharges).toBe(true);
  });
});

describe("lookupUtilityRates — dormant / input guards (no network)", () => {
  it("returns no-keys and makes NO network call when the key is unset", async () => {
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse({ items: [] }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await lookupUtilityRates("1 Market St, San Francisco, CA")).toEqual({
      enabled: false,
      reason: "no-keys",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns no-keys when the key is whitespace-only", async () => {
    process.env[GATE] = "   ";
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse({ items: [] }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await lookupUtilityRates("1 Market St")).toEqual({
      enabled: false,
      reason: "no-keys",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns no-match for an empty / whitespace address without calling fetch", async () => {
    process.env[GATE] = "key";
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse({ items: [] }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await lookupUtilityRates("   ")).toEqual({
      enabled: false,
      reason: "no-match",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("lookupUtilityRates — success path", () => {
  it("returns parsed rates + OpenEI URDB source + ISO fetchedAt on a 200", async () => {
    process.env[GATE] = "key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => jsonResponse({ items: [URDB_ITEM] })),
    );

    const r = await lookupUtilityRates("1 Market St, San Francisco, CA");
    expect(r.enabled).toBe(true);
    if (!r.enabled) throw new Error("expected enabled");
    expect(r.source).toBe("OpenEI URDB");
    expect(r.address).toBe("1 Market St, San Francisco, CA");
    expect(r.rates).toHaveLength(1);
    expect(r.rates[0].utility).toBe("Pacific Gas & Electric Co");
    expect(r.rates[0].hasDemandCharges).toBe(true);
    // fetchedAt is a valid round-trippable ISO timestamp
    expect(new Date(r.fetchedAt).toISOString()).toBe(r.fetchedAt);
  });

  it("trims the address before using it as the returned address + query param", async () => {
    process.env[GATE] = "key";
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse({ items: [URDB_ITEM] }));
    vi.stubGlobal("fetch", fetchSpy);

    const r = await lookupUtilityRates("   2 Embarcadero   ");
    if (!r.enabled) throw new Error("expected enabled");
    expect(r.address).toBe("2 Embarcadero");
  });

  it("builds the OpenEI request URL with the gated key + expected query params", async () => {
    process.env[GATE] = "secret-openei-key";
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse({ items: [URDB_ITEM] }));
    vi.stubGlobal("fetch", fetchSpy);

    await lookupUtilityRates("1 Market St", "Industrial");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url.startsWith(`${URDB_URL}?`)).toBe(true);
    const qs = new URLSearchParams(url.slice(url.indexOf("?") + 1));
    expect(qs.get("version")).toBe("7");
    expect(qs.get("format")).toBe("json");
    expect(qs.get("detail")).toBe("full");
    expect(qs.get("approved")).toBe("true");
    expect(qs.get("sector")).toBe("Industrial");
    expect(qs.get("address")).toBe("1 Market St");
    expect(qs.get("limit")).toBe("10");
    expect(qs.get("api_key")).toBe("secret-openei-key");
    // an abort signal is supplied (timeout)
    expect((init as RequestInit & { signal?: unknown }).signal).toBeDefined();
  });

  it("defaults the sector to Commercial when not provided", async () => {
    process.env[GATE] = "key";
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse({ items: [URDB_ITEM] }));
    vi.stubGlobal("fetch", fetchSpy);

    await lookupUtilityRates("1 Market St");
    const [url] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    const qs = new URLSearchParams(url.slice(url.indexOf("?") + 1));
    expect(qs.get("sector")).toBe("Commercial");
  });
});

describe("lookupUtilityRates — failure paths fail closed", () => {
  it("returns fetch-failed on a non-OK response (and logs the HTTP status)", async () => {
    process.env[GATE] = "key";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response("", { status: 500 })),
    );

    expect(await lookupUtilityRates("1 Market St")).toEqual({
      enabled: false,
      reason: "fetch-failed",
    });
    expect(errSpy).toHaveBeenCalled();
    const logged = String(errSpy.mock.calls[0][0]);
    expect(logged).toContain("urdb");
    expect(logged).toContain("500");
  });

  it("returns no-match when items is an empty array", async () => {
    process.env[GATE] = "key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => jsonResponse({ items: [] })),
    );
    expect(await lookupUtilityRates("1 Market St")).toEqual({
      enabled: false,
      reason: "no-match",
    });
  });

  it("returns no-match when the JSON body has no items (json() → null path tolerated)", async () => {
    process.env[GATE] = "key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => jsonResponse({ error: "bad request" })),
    );
    expect(await lookupUtilityRates("1 Market St")).toEqual({
      enabled: false,
      reason: "no-match",
    });
  });

  it("returns no-match when the body is malformed JSON (res.json rejects → caught → null)", async () => {
    process.env[GATE] = "key";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (): Promise<Response> =>
          new Response("<<not json>>", {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      ),
    );
    // parseUrdbResponse(null) → [] → no-match (does NOT throw)
    expect(await lookupUtilityRates("1 Market St")).toEqual({
      enabled: false,
      reason: "no-match",
    });
  });

  it("fails closed (fetch-failed) when fetch itself rejects (network/timeout)", async () => {
    process.env[GATE] = "key";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => {
        throw new Error("network down");
      }),
    );
    expect(await lookupUtilityRates("1 Market St")).toEqual({
      enabled: false,
      reason: "fetch-failed",
    });
    expect(errSpy).toHaveBeenCalled();
  });
});
