import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
  geocodioToPoint,
  googleToPoint,
  normalizeAddress,
  geocodingConfigured,
  geocode,
} from "@/lib/integration/geocoding-live";
import { getStore } from "@/lib/server/persistence";

// Reset the shared in-memory store between tests so cached coordinates from one
// case can't leak into another (getStore caches on globalThis).
beforeEach(() => {
  (globalThis as unknown as { __kvStore?: unknown }).__kvStore = undefined;
  // Geocodio/Google failure paths log via console.error; silence to keep output clean.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.GEOCODIO_API_KEY;
  delete process.env.GOOGLE_MAPS_API_KEY;
  delete process.env.GEO_GOOGLE_MONTHLY_CAP;
  (globalThis as unknown as { __kvStore?: unknown }).__kvStore = undefined;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("geocodingConfigured", () => {
  it("is true when only GEOCODIO_API_KEY is set", () => {
    process.env.GEOCODIO_API_KEY = "gk";
    expect(geocodingConfigured()).toBe(true);
  });
  it("is true when only GOOGLE_MAPS_API_KEY is set", () => {
    process.env.GOOGLE_MAPS_API_KEY = "gg";
    expect(geocodingConfigured()).toBe(true);
  });
  it("treats a whitespace-only key as unset (dormant)", () => {
    process.env.GEOCODIO_API_KEY = "   ";
    expect(geocodingConfigured()).toBe(false);
  });
});

describe("geocodioToPoint edge cases", () => {
  it("defaults formatted to '' when formatted_address is absent and accuracy to null", () => {
    const p = geocodioToPoint({ results: [{ location: { lat: 10, lng: 20 } }] });
    expect(p).toEqual({ lat: 10, lng: 20, formatted: "", accuracy: null, source: "geocodio" });
  });
  it("returns null when lat/lng are non-finite (Infinity)", () => {
    // Zod accepts the number Infinity, but the Number.isFinite guard rejects it.
    expect(geocodioToPoint({ results: [{ location: { lat: Infinity, lng: 20 } }] })).toBeNull();
    expect(geocodioToPoint({ results: [{ location: { lat: 10, lng: -Infinity } }] })).toBeNull();
  });
  it("returns null when location is missing entirely", () => {
    expect(geocodioToPoint({ results: [{ formatted_address: "X" }] })).toBeNull();
  });
});

describe("googleToPoint edge cases", () => {
  it("returns null when status is OK but results is missing", () => {
    expect(googleToPoint({ status: "OK" })).toBeNull();
  });
  it("returns null when status is OK but the results array is empty", () => {
    expect(googleToPoint({ status: "OK", results: [] })).toBeNull();
  });
  it("returns null when coords are non-finite even with OK status", () => {
    expect(
      googleToPoint({ status: "OK", results: [{ geometry: { location: { lat: Infinity, lng: 2 } } }] }),
    ).toBeNull();
  });
  it("defaults formatted to '' when formatted_address is absent", () => {
    const p = googleToPoint({ status: "OK", results: [{ geometry: { location: { lat: 3, lng: 4 } } }] });
    expect(p).toEqual({ lat: 3, lng: 4, formatted: "", accuracy: null, source: "google" });
  });
  it("returns null on a malformed payload", () => {
    expect(googleToPoint({ nope: true })).toBeNull();
  });
});

describe("normalizeAddress edge cases", () => {
  it("returns '' for whitespace-only input", () => {
    expect(normalizeAddress("   \t  ")).toBe("");
  });
});

describe("geocode — input + cache branches", () => {
  it("returns reason 'error' when the normalized address is empty", async () => {
    process.env.GEOCODIO_API_KEY = "gk";
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await geocode("    ")).toEqual({ enabled: false, reason: "error" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns a cached point (cached:true) without any network call on the second lookup", async () => {
    process.env.GEOCODIO_API_KEY = "gk";
    const fetchSpy = vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify({ results: [{ location: { lat: 1, lng: 2 }, accuracy: 0.8 }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const first = await geocode("123 Cache Ln");
    expect(first).toMatchObject({ enabled: true, cached: false });
    const second = await geocode("  123   CACHE   Ln  "); // normalizes to same key
    expect(second).toMatchObject({ enabled: true, cached: true });
    // Only the first lookup hit the network.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("swallows a store.get error and proceeds to fetch", async () => {
    process.env.GEOCODIO_API_KEY = "gk";
    const store = getStore();
    vi.spyOn(store, "get").mockRejectedValue(new Error("store down"));
    const fetchSpy = vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify({ results: [{ location: { lat: 5, lng: 6 } }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const r = await geocode("777 Resilient Rd");
    expect(r.enabled).toBe(true);
    if (r.enabled) expect(r.point.source).toBe("geocodio");
  });

  it("swallows a store.put error and still returns the freshly fetched point", async () => {
    process.env.GEOCODIO_API_KEY = "gk";
    const store = getStore();
    vi.spyOn(store, "put").mockRejectedValue(new Error("put down"));
    const fetchSpy = vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify({ results: [{ location: { lat: 7, lng: 8 } }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const r = await geocode("888 Putfail Ave");
    expect(r).toMatchObject({ enabled: true, cached: false });
  });
});

describe("geocode — Geocodio fetch error paths fail closed", () => {
  it("non-OK HTTP from Geocodio yields {enabled:false, reason:'error'}", async () => {
    process.env.GEOCODIO_API_KEY = "gk";
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => new Response("", { status: 500 })));
    expect(await geocode("1 Server Error Blvd")).toEqual({ enabled: false, reason: "error" });
  });

  it("a thrown/network error from Geocodio yields {enabled:false, reason:'error'}", async () => {
    process.env.GEOCODIO_API_KEY = "gk";
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => {
      throw new Error("net");
    }));
    expect(await geocode("2 Network Down St")).toEqual({ enabled: false, reason: "error" });
  });

  it("invalid JSON body from Geocodio (200 but unparseable) fails closed", async () => {
    process.env.GEOCODIO_API_KEY = "gk";
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => new Response("<<<not json>>>", { status: 200 })));
    expect(await geocode("3 Bad Json Way")).toEqual({ enabled: false, reason: "error" });
  });

  it("an empty Geocodio results array fails closed (no fallback when no Google key)", async () => {
    process.env.GEOCODIO_API_KEY = "gk";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response(JSON.stringify({ results: [] }), { status: 200 })),
    );
    expect(await geocode("4 No Results Pkwy")).toEqual({ enabled: false, reason: "error" });
  });
});

describe("geocode — capped Google fallback", () => {
  it("falls back to Google when Geocodio misses and the cap allows it", async () => {
    process.env.GEOCODIO_API_KEY = "gk";
    process.env.GOOGLE_MAPS_API_KEY = "gg";
    process.env.GEO_GOOGLE_MONTHLY_CAP = "100";
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string): Promise<Response> => {
      calls.push(url);
      if (url.includes("geocod.io")) {
        // Geocodio finds nothing → triggers the fallback.
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      }
      // Google succeeds.
      return new Response(
        JSON.stringify({ status: "OK", results: [{ formatted_address: "G", geometry: { location: { lat: 9, lng: 10 } } }] }),
        { status: 200 },
      );
    }));
    const r = await geocode("5 Fallback Dr");
    expect(r.enabled).toBe(true);
    if (r.enabled) {
      expect(r.point.source).toBe("google");
      expect(r.point.lat).toBe(9);
      expect(r.cached).toBe(false);
    }
    // Both providers were tried, Geocodio first.
    expect(calls.some((u) => u.includes("geocod.io"))).toBe(true);
    expect(calls.some((u) => u.includes("googleapis.com"))).toBe(true);
  });

  it("uses Google directly when only GOOGLE_MAPS_API_KEY is configured (no Geocodio)", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "gg";
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string): Promise<Response> => {
      calls.push(url);
      return new Response(
        JSON.stringify({ status: "OK", results: [{ geometry: { location: { lat: 11, lng: 12 } } }] }),
        { status: 200 },
      );
    }));
    const r = await geocode("6 Google Only Ct");
    expect(r.enabled).toBe(true);
    if (r.enabled) expect(r.point.source).toBe("google");
    // Geocodio was never called (no key).
    expect(calls.every((u) => u.includes("googleapis.com"))).toBe(true);
  });

  it("logs and fails closed when Google returns an operational error status (REQUEST_DENIED)", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "gg";
    const errSpy = vi.spyOn(console, "error");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response(JSON.stringify({ status: "REQUEST_DENIED" }), { status: 200 })),
    );
    const r = await geocode("7 Denied Loop");
    expect(r).toEqual({ enabled: false, reason: "error" });
    // The distinct operational status was surfaced to the log drain.
    const logged = errSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(logged).toContain("REQUEST_DENIED");
  });

  it("non-OK HTTP from Google fails closed", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "gg";
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => new Response("", { status: 502 })));
    expect(await geocode("8 Gateway Err Rd")).toEqual({ enabled: false, reason: "error" });
  });

  it("a thrown/network error from Google fails closed", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "gg";
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => {
      throw new Error("net");
    }));
    expect(await geocode("9 Throw St")).toEqual({ enabled: false, reason: "error" });
  });

  it("does NOT call Google when the usage counter reservation throws (fail closed)", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "gg";
    process.env.GEO_GOOGLE_MONTHLY_CAP = "100";
    const store = getStore();
    // Break the CAS counter read so mutate throws → the catch sets reserved=null
    // and Google must not be called.
    vi.spyOn(store, "getVersioned").mockRejectedValue(new Error("counter down"));
    let googleCalled = false;
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => {
      googleCalled = true;
      return new Response(JSON.stringify({ status: "OK", results: [] }), { status: 200 });
    }));
    const r = await geocode("10 Broken Counter Way");
    expect(r).toEqual({ enabled: false, reason: "error" });
    expect(googleCalled).toBe(false);
  });

  it("an invalid GEO_GOOGLE_MONTHLY_CAP falls back to the default ceiling (Google still callable)", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "gg";
    process.env.GEO_GOOGLE_MONTHLY_CAP = "not-a-number"; // → NaN → default 8000
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (): Promise<Response> =>
          new Response(
            JSON.stringify({ status: "OK", results: [{ geometry: { location: { lat: 13, lng: 14 } } }] }),
            { status: 200 },
          ),
      ),
    );
    const r = await geocode("11 Default Cap Blvd");
    expect(r.enabled).toBe(true);
    if (r.enabled) expect(r.point.source).toBe("google");
  });

  it("a negative GEO_GOOGLE_MONTHLY_CAP falls back to the default ceiling", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "gg";
    process.env.GEO_GOOGLE_MONTHLY_CAP = "-5"; // negative → default 8000
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (): Promise<Response> =>
          new Response(
            JSON.stringify({ status: "OK", results: [{ geometry: { location: { lat: 15, lng: 16 } } }] }),
            { status: 200 },
          ),
      ),
    );
    const r = await geocode("12 Negative Cap Rd");
    expect(r.enabled).toBe(true);
    if (r.enabled) expect(r.point.source).toBe("google");
  });
});
