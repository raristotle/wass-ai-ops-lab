import { describe, it, expect, afterEach, vi } from "vitest";
import { uspsToVerified, addressVerifyConfigured, verifyAddress } from "@/lib/integration/address-verify-live";

afterEach(() => {
  delete process.env.USPS_CLIENT_ID;
  delete process.env.USPS_CLIENT_SECRET;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  // Clear any cached token between tests.
  (globalThis as unknown as { __uspsToken?: unknown }).__uspsToken = undefined;
});

describe("uspsToVerified", () => {
  it("shapes a USPS v3 response into a VerifiedAddress with ZIP+4", () => {
    const v = uspsToVerified({
      address: { streetAddress: "475 LENFANT PLZ SW", city: "WASHINGTON", state: "DC", ZIPCode: "20260", ZIPPlus4: "0004" },
    });
    expect(v).toEqual({ streetAddress: "475 LENFANT PLZ SW", city: "WASHINGTON", state: "DC", zip5: "20260", zip4: "0004", source: "usps" });
  });
  it("returns null on a malformed payload", () => {
    expect(uspsToVerified({ nope: true })).toBeNull();
    expect(uspsToVerified(null)).toBeNull();
  });
});

describe("addressVerifyConfigured / verifyAddress", () => {
  it("is dormant and makes NO network call without both creds", async () => {
    expect(addressVerifyConfigured()).toBe(false);
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await verifyAddress({ street: "1 Main St" })).toEqual({ enabled: false, reason: "not-configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetches a form-encoded token then verifies on the happy path", async () => {
    process.env.USPS_CLIENT_ID = "id";
    process.env.USPS_CLIENT_SECRET = "secret";
    const calls: { url: string; init?: RequestInit }[] = [];
    const fetchSpy = vi.fn(async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const u = String(url);
      calls.push({ url: u, init });
      if (u.includes("/oauth2/")) return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 });
      return new Response(
        JSON.stringify({ address: { streetAddress: "1 MAIN ST", city: "AKRON", state: "OH", ZIPCode: "44308", ZIPPlus4: "1234" } }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchSpy);
    const r = await verifyAddress({ street: "1 main st", city: "Akron", state: "OH" });
    expect(r.enabled).toBe(true);
    if (r.enabled) expect(r.verified).toMatchObject({ zip5: "44308", zip4: "1234", source: "usps" });

    // The token call MUST be form-urlencoded (RFC 6749 / USPS v3) — JSON breaks activation.
    const token = calls.find((c) => c.url.includes("/oauth2/"));
    expect(token).toBeDefined();
    const th = token?.init?.headers as Record<string, string> | undefined;
    expect(th?.["Content-Type"]).toBe("application/x-www-form-urlencoded");
    const body = new URLSearchParams(String(token?.init?.body));
    expect(body.get("grant_type")).toBe("client_credentials");
    expect(body.get("client_id")).toBe("id");
    // The address call carries the Bearer token.
    const addr = calls.find((c) => c.url.includes("/addresses/"));
    const ah = addr?.init?.headers as Record<string, string> | undefined;
    expect(ah?.["Authorization"]).toBe("Bearer tok");
  });

  it("fails closed (no throw) when the token call errors", async () => {
    process.env.USPS_CLIENT_ID = "id";
    process.env.USPS_CLIENT_SECRET = "secret";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => new Response("no", { status: 401 })));
    expect(await verifyAddress({ street: "1 Main St" })).toEqual({ enabled: false, reason: "error" });
  });
});
