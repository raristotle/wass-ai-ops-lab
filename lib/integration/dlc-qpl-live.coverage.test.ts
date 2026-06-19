import { describe, it, expect, afterEach, vi } from "vitest";
import {
  DLC_LOOKUP_URL,
  dlcQplConfigured,
  parseDlcLookup,
  lookupDlcListing,
} from "@/lib/integration/dlc-qpl-live";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.DLC_QPL_API_TOKEN;
});

// Helper: a fetch stub returning a JSON 200 with the given body.
function okJson(body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
}

describe("parseDlcLookup edge cases", () => {
  it("reads lowercase/snake-case field variants under `result`", () => {
    const l = parseDlcLookup({
      result: {
        product_id: "PID1",
        status: "Approved - Published",
        product_name: "Lamp",
        brand: "BrandX",
        manufacturer: "MfgX",
        qpl: "nlc",
        date_qualified: "2025-02-02",
      },
    });
    expect(l).not.toBeNull();
    expect(l!.productId).toBe("PID1");
    expect(l!.listed).toBe(true);
    expect(l!.productName).toBe("Lamp");
    expect(l!.brand).toBe("BrandX");
    expect(l!.manufacturer).toBe("MfgX");
    expect(l!.qpl).toBe("nlc");
    expect(l!.dateQualified).toBe("2025-02-02");
  });

  it("reads `Result` (capitalized) envelope", () => {
    const l = parseDlcLookup({ Result: { "Product ID": "CAP", Status: "Approved" } });
    expect(l).not.toBeNull();
    expect(l!.productId).toBe("CAP");
    expect(l!.listed).toBe(true);
  });

  it("reads fields at the root when there is no result wrapper", () => {
    const l = parseDlcLookup({ "Product ID": "ROOT", Status: "Approved - Published" });
    expect(l).not.toBeNull();
    expect(l!.productId).toBe("ROOT");
    expect(l!.listed).toBe(true);
  });

  it("returns a listing with empty productId when only a status is present", () => {
    const l = parseDlcLookup({ result: { Status: "Approved - Published" } });
    expect(l).not.toBeNull();
    expect(l!.productId).toBe(""); // null productId is normalized to ""
    expect(l!.listed).toBe(true);
    expect(l!.brand).toBeNull();
  });

  it("is not listed when status is approved-published but also says delisted", () => {
    const l = parseDlcLookup({ result: { "Product ID": "Z", Status: "Approved - Published (Delisted)" } });
    expect(l).not.toBeNull();
    expect(l!.listed).toBe(false); // delist guard wins
  });

  it("is not listed for a non-approval status string", () => {
    const l = parseDlcLookup({ result: { "Product ID": "Z2", Status: "Pending Review" } });
    expect(l).not.toBeNull();
    expect(l!.listed).toBe(false);
    expect(l!.status).toBe("Pending Review");
  });

  it("returns null for non-object inputs", () => {
    expect(parseDlcLookup(undefined)).toBeNull();
    expect(parseDlcLookup("nope")).toBeNull();
    expect(parseDlcLookup(42)).toBeNull();
  });

  it("treats blank/whitespace-only strings as null fields", () => {
    const l = parseDlcLookup({ result: { "Product ID": "PID", Status: "Approved", "Brand Name": "   " } });
    expect(l).not.toBeNull();
    expect(l!.brand).toBeNull();
  });
});

describe("lookupDlcListing dormant + guard branches", () => {
  it("returns no-keys when the token is unset (dormant, zero network)", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const r = await lookupDlcListing("PID");
    expect(r).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled(); // never touches the network when dormant
  });

  it("returns no-match for an empty/whitespace product id (no network)", async () => {
    process.env.DLC_QPL_API_TOKEN = "tok";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const r = await lookupDlcListing("   ");
    expect(r).toEqual({ enabled: false, reason: "no-match" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("lookupDlcListing live path (token set, network mocked)", () => {
  it("returns a parsed listing on a 200 success", async () => {
    process.env.DLC_QPL_API_TOKEN = "tok";
    vi.stubGlobal(
      "fetch",
      okJson({
        result: {
          "Product ID": "PRWKL5S5",
          Status: "Approved - Published",
          "Product Name": "WallPack 5000",
          "Brand Name": "Acme",
          QPL: "ssl",
        },
      }),
    );
    const r = await lookupDlcListing("PRWKL5S5");
    expect(r.enabled).toBe(true);
    if (r.enabled) {
      expect(r.source).toBe("DLC QPL");
      expect(r.listing.listed).toBe(true);
      expect(r.listing.productId).toBe("PRWKL5S5");
      expect(r.listing.brand).toBe("Acme");
      // fetchedAt is an ISO timestamp
      expect(typeof r.fetchedAt).toBe("string");
      expect(Number.isNaN(Date.parse(r.fetchedAt))).toBe(false);
    }
  });

  it("sends the bearer token and url-encodes the product id", async () => {
    process.env.DLC_QPL_API_TOKEN = "secret-token";
    const fetchSpy = okJson({ result: { "Product ID": "A B&C", Status: "Approved" } });
    vi.stubGlobal("fetch", fetchSpy);
    await lookupDlcListing("A B&C");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(calledUrl).toBe(`${DLC_LOOKUP_URL}?product=${encodeURIComponent("A B&C")}`);
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer secret-token");
    expect(headers.Accept).toBe("application/json");
  });

  it("maps HTTP 401 to not-authorized", async () => {
    process.env.DLC_QPL_API_TOKEN = "tok";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 401 })));
    const r = await lookupDlcListing("PID");
    expect(r).toEqual({ enabled: false, reason: "not-authorized" });
  });

  it("maps HTTP 403 to not-authorized", async () => {
    process.env.DLC_QPL_API_TOKEN = "tok";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 403 })));
    const r = await lookupDlcListing("PID");
    expect(r).toEqual({ enabled: false, reason: "not-authorized" });
  });

  it("maps a non-OK status (500) to fetch-failed and logs", async () => {
    process.env.DLC_QPL_API_TOKEN = "tok";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));
    const r = await lookupDlcListing("PID");
    expect(r).toEqual({ enabled: false, reason: "fetch-failed" });
    expect(errSpy).toHaveBeenCalled();
  });

  it("returns fetch-failed when the network throws", async () => {
    process.env.DLC_QPL_API_TOKEN = "tok";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("net down");
      }),
    );
    const r = await lookupDlcListing("PID");
    expect(r).toEqual({ enabled: false, reason: "fetch-failed" });
    expect(errSpy).toHaveBeenCalled();
  });

  it("returns no-match when the body has no usable result fields", async () => {
    process.env.DLC_QPL_API_TOKEN = "tok";
    vi.stubGlobal("fetch", okJson({ error: "not found" }));
    const r = await lookupDlcListing("PID");
    expect(r).toEqual({ enabled: false, reason: "no-match" });
  });

  it("returns no-match when the body is not valid JSON (json() rejects)", async () => {
    process.env.DLC_QPL_API_TOKEN = "tok";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<<not json>>", { status: 200 })),
    );
    const r = await lookupDlcListing("PID");
    // json() rejects → caught → null → parseDlcLookup(null) → null → no-match
    expect(r).toEqual({ enabled: false, reason: "no-match" });
  });
});
