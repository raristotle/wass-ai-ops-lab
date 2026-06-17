import { describe, it, expect, afterEach, vi } from "vitest";
import {
  geocodioToPoint,
  googleToPoint,
  normalizeAddress,
  geocodingConfigured,
  geocode,
} from "@/lib/integration/geocoding-live";

afterEach(() => {
  delete process.env.GEOCODIO_API_KEY;
  delete process.env.GOOGLE_MAPS_API_KEY;
  delete process.env.GEO_GOOGLE_MONTHLY_CAP;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("geocodioToPoint", () => {
  it("shapes the first result into a GeoPoint", () => {
    const p = geocodioToPoint({
      results: [{ formatted_address: "123 Main St, Pittsburgh, PA 15219", location: { lat: 40.44, lng: -79.99 }, accuracy: 1 }],
    });
    expect(p).toEqual({ lat: 40.44, lng: -79.99, formatted: "123 Main St, Pittsburgh, PA 15219", accuracy: 1, source: "geocodio" });
  });
  it("returns null on an empty / malformed payload", () => {
    expect(geocodioToPoint({ results: [] })).toBeNull();
    expect(geocodioToPoint({ nope: true })).toBeNull();
  });
});

describe("googleToPoint", () => {
  it("shapes an OK response and ignores non-OK status", () => {
    const ok = googleToPoint({ status: "OK", results: [{ formatted_address: "X", geometry: { location: { lat: 1, lng: 2 } } }] });
    expect(ok).toEqual({ lat: 1, lng: 2, formatted: "X", accuracy: null, source: "google" });
    expect(googleToPoint({ status: "ZERO_RESULTS", results: [] })).toBeNull();
  });
});

describe("normalizeAddress", () => {
  it("trims, collapses whitespace, lowercases", () => {
    expect(normalizeAddress("  123   Main  ST ")).toBe("123 main st");
  });
});

describe("geocodingConfigured / geocode", () => {
  it("is dormant and makes NO network call when unconfigured", async () => {
    expect(geocodingConfigured()).toBe(false);
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await geocode("123 Main St")).toEqual({ enabled: false, reason: "not-configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns a point via Geocodio when keyed", async () => {
    process.env.GEOCODIO_API_KEY = "gk";
    const fetchSpy = vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify({ results: [{ location: { lat: 41.1, lng: -81.5 }, accuracy: 0.9 }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const r = await geocode("100 Geocodio Way, Akron OH");
    expect(r.enabled).toBe(true);
    if (r.enabled) expect(r.point.source).toBe("geocodio");
  });

  it("does NOT call Google once the monthly cap is reached", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "gg";
    process.env.GEO_GOOGLE_MONTHLY_CAP = "0"; // cap 0 → never call Google
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await geocode("999 Capped Rd, Nowhere TX");
    expect(r).toEqual({ enabled: false, reason: "error" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("never exceeds the Google monthly cap under concurrency (atomic reservation)", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "gg";
    process.env.GEO_GOOGLE_MONTHLY_CAP = "10";
    // Extreme single-key contention legitimately exhausts mutate's retries and
    // fails CLOSED (skips Google) — that's the intended safe behavior; silence
    // those expected logs.
    vi.spyOn(console, "error").mockImplementation(() => {});
    let googleCalls = 0;
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => {
      googleCalls++;
      return new Response(JSON.stringify({ status: "ZERO_RESULTS", results: [] }), { status: 200 });
    }));
    // 50 concurrent geocodes of DISTINCT addresses (no cache hit), Geocodio absent.
    await Promise.all(Array.from({ length: 50 }, (_, i) => geocode(`distinct addr ${i}`)));
    expect(googleCalls).toBeLessThanOrEqual(10);
  });
});
