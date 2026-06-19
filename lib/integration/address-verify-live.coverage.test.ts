import { describe, it, expect, afterEach, vi } from "vitest";
import { uspsToVerified, addressVerifyConfigured, verifyAddress } from "@/lib/integration/address-verify-live";

afterEach(() => {
  delete process.env.USPS_CLIENT_ID;
  delete process.env.USPS_CLIENT_SECRET;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  // Reset the in-process OAuth token cache between tests.
  (globalThis as unknown as { __uspsToken?: unknown }).__uspsToken = undefined;
});

// Token-endpoint helper: any /oauth2/ URL returns a token, everything else (the
// /addresses/ call) returns the supplied address body.
function fetchWith(opts: {
  tokenBody?: unknown;
  tokenStatus?: number;
  addressBody?: unknown;
  addressStatus?: number;
}) {
  return vi.fn(async (url: string | URL | Request): Promise<Response> => {
    const u = String(url);
    if (u.includes("/oauth2/")) {
      return new Response(
        opts.tokenBody === undefined ? JSON.stringify({ access_token: "tok", expires_in: 3600 }) : JSON.stringify(opts.tokenBody),
        { status: opts.tokenStatus ?? 200 },
      );
    }
    return new Response(
      opts.addressBody === undefined
        ? JSON.stringify({ address: { streetAddress: "1 MAIN ST", city: "AKRON", state: "OH", ZIPCode: "44308", ZIPPlus4: "1234" } })
        : JSON.stringify(opts.addressBody),
      { status: opts.addressStatus ?? 200 },
    );
  });
}

describe("uspsToVerified — ZIP+4 absent / secondary present", () => {
  it("maps zip4 to null when ZIPPlus4 is missing", () => {
    const v = uspsToVerified({
      address: { streetAddress: "1 MAIN ST", city: "AKRON", state: "OH", ZIPCode: "44308" },
    });
    expect(v).toEqual({ streetAddress: "1 MAIN ST", city: "AKRON", state: "OH", zip5: "44308", zip4: null, source: "usps" });
  });

  it("ignores extra fields (e.g. secondaryAddress) but still parses", () => {
    const v = uspsToVerified({
      address: { streetAddress: "1 MAIN ST", secondaryAddress: "STE 5", city: "AKRON", state: "OH", ZIPCode: "44308" },
    });
    expect(v?.zip4).toBeNull();
    expect(v?.source).toBe("usps");
  });

  it("returns null when a required field (state) is missing", () => {
    expect(uspsToVerified({ address: { streetAddress: "1 MAIN ST", city: "AKRON", ZIPCode: "44308" } })).toBeNull();
  });
});

describe("addressVerifyConfigured — env handling", () => {
  it("is true only when BOTH creds are non-empty", () => {
    process.env.USPS_CLIENT_ID = "id";
    expect(addressVerifyConfigured()).toBe(false); // secret missing
    process.env.USPS_CLIENT_SECRET = "secret";
    expect(addressVerifyConfigured()).toBe(true);
  });

  it("treats whitespace-only creds as unconfigured", () => {
    process.env.USPS_CLIENT_ID = "   ";
    process.env.USPS_CLIENT_SECRET = "   ";
    expect(addressVerifyConfigured()).toBe(false);
  });
});

describe("verifyAddress — token paths", () => {
  it("fails closed when the token JSON is malformed (schema miss)", async () => {
    process.env.USPS_CLIENT_ID = "id";
    process.env.USPS_CLIENT_SECRET = "secret";
    const fetchSpy = fetchWith({ tokenBody: { not_a_token: true } });
    vi.stubGlobal("fetch", fetchSpy);
    expect(await verifyAddress({ street: "1 Main St" })).toEqual({ enabled: false, reason: "error" });
    // Only the token hop happened; no address call once the token is null.
    expect(fetchSpy.mock.calls.every((c) => String(c[0]).includes("/oauth2/"))).toBe(true);
  });

  it("fails closed (no throw) when the token fetch THROWS a network error", async () => {
    process.env.USPS_CLIENT_ID = "id";
    process.env.USPS_CLIENT_SECRET = "secret";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNRESET");
      }),
    );
    expect(await verifyAddress({ street: "1 Main St" })).toEqual({ enabled: false, reason: "error" });
  });

  it("defaults the TTL when expires_in is absent and still verifies", async () => {
    process.env.USPS_CLIENT_ID = "id";
    process.env.USPS_CLIENT_SECRET = "secret";
    vi.stubGlobal("fetch", fetchWith({ tokenBody: { access_token: "tok" } }));
    const r = await verifyAddress({ street: "1 main st" });
    expect(r.enabled).toBe(true);
    // Cache should now hold a token with an exp ~1h out (default 3600s).
    const cached = (globalThis as unknown as { __uspsToken?: { token: string; exp: number } }).__uspsToken;
    expect(cached?.token).toBe("tok");
    expect(cached && cached.exp > Date.now() + 30 * 60_000).toBe(true);
  });

  it("reuses a cached, unexpired token and SKIPS the token hop", async () => {
    process.env.USPS_CLIENT_ID = "id";
    process.env.USPS_CLIENT_SECRET = "secret";
    // Pre-seed a valid cached token far in the future.
    (globalThis as unknown as { __uspsToken?: { token: string; exp: number } }).__uspsToken = {
      token: "cached-tok",
      exp: Date.now() + 3_600_000,
    };
    const fetchSpy = fetchWith({});
    vi.stubGlobal("fetch", fetchSpy);
    const r = await verifyAddress({ street: "1 Main St" });
    expect(r.enabled).toBe(true);
    // No /oauth2/ call: every fetch went straight to /addresses/.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0][0])).toContain("/addresses/");
  });

  it("refreshes the token when the cached one is within the 60s expiry window", async () => {
    process.env.USPS_CLIENT_ID = "id";
    process.env.USPS_CLIENT_SECRET = "secret";
    // Cached token expires in 30s — inside the 60s skew, so it must be refreshed.
    (globalThis as unknown as { __uspsToken?: { token: string; exp: number } }).__uspsToken = {
      token: "stale-tok",
      exp: Date.now() + 30_000,
    };
    const fetchSpy = fetchWith({ tokenBody: { access_token: "fresh-tok", expires_in: 3600 } });
    vi.stubGlobal("fetch", fetchSpy);
    const r = await verifyAddress({ street: "1 Main St" });
    expect(r.enabled).toBe(true);
    // A token hop happened and the address call used the FRESH bearer.
    const tokenCall = fetchSpy.mock.calls.find((c) => String(c[0]).includes("/oauth2/"));
    expect(tokenCall).toBeDefined();
    const addrCall = fetchSpy.mock.calls.find((c) => String(c[0]).includes("/addresses/"));
    const ah = (addrCall as unknown as [string, RequestInit] | undefined)?.[1]?.headers as Record<string, string> | undefined;
    expect(ah?.["Authorization"]).toBe("Bearer fresh-tok");
  });
});

describe("verifyAddress — address-call paths", () => {
  it("fails closed when the address call returns a non-OK status", async () => {
    process.env.USPS_CLIENT_ID = "id";
    process.env.USPS_CLIENT_SECRET = "secret";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", fetchWith({ addressStatus: 500 }));
    expect(await verifyAddress({ street: "1 Main St" })).toEqual({ enabled: false, reason: "error" });
  });

  it("fails closed when the address body is malformed (parser returns null)", async () => {
    process.env.USPS_CLIENT_ID = "id";
    process.env.USPS_CLIENT_SECRET = "secret";
    vi.stubGlobal("fetch", fetchWith({ addressBody: { unexpected: "shape" } }));
    expect(await verifyAddress({ street: "1 Main St" })).toEqual({ enabled: false, reason: "error" });
  });

  it("fails closed (no throw) when the address fetch THROWS", async () => {
    process.env.USPS_CLIENT_ID = "id";
    process.env.USPS_CLIENT_SECRET = "secret";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL | Request): Promise<Response> => {
        if (String(url).includes("/oauth2/")) return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 });
        throw new Error("address-timeout");
      }),
    );
    expect(await verifyAddress({ street: "1 Main St" })).toEqual({ enabled: false, reason: "error" });
  });

  it("forwards all optional address fields (secondary, city, state, zip) into the query", async () => {
    process.env.USPS_CLIENT_ID = "id";
    process.env.USPS_CLIENT_SECRET = "secret";
    const fetchSpy = fetchWith({});
    vi.stubGlobal("fetch", fetchSpy);
    const r = await verifyAddress({ street: "1 main st", secondary: "Apt 4B", city: "Akron", state: "OH", zip: "44308" });
    expect(r.enabled).toBe(true);
    const addrUrl = String(fetchSpy.mock.calls.find((c) => String(c[0]).includes("/addresses/"))?.[0]);
    const qs = new URLSearchParams(addrUrl.split("?")[1]);
    expect(qs.get("streetAddress")).toBe("1 main st");
    expect(qs.get("secondaryAddress")).toBe("Apt 4B");
    expect(qs.get("city")).toBe("Akron");
    expect(qs.get("state")).toBe("OH");
    expect(qs.get("ZIPCode")).toBe("44308");
  });

  it("omits optional query params when only street is supplied", async () => {
    process.env.USPS_CLIENT_ID = "id";
    process.env.USPS_CLIENT_SECRET = "secret";
    const fetchSpy = fetchWith({});
    vi.stubGlobal("fetch", fetchSpy);
    await verifyAddress({ street: "1 main st" });
    const addrUrl = String(fetchSpy.mock.calls.find((c) => String(c[0]).includes("/addresses/"))?.[0]);
    const qs = new URLSearchParams(addrUrl.split("?")[1]);
    expect(qs.get("streetAddress")).toBe("1 main st");
    expect(qs.has("secondaryAddress")).toBe(false);
    expect(qs.has("city")).toBe(false);
    expect(qs.has("ZIPCode")).toBe(false);
  });
});
