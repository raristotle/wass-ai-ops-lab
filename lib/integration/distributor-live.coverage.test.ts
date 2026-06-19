import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
  liveDistributorsConfigured,
  mapMouserParts,
  mapDigiKeyProducts,
  getLiveQuotes,
} from "@/lib/integration/distributor-live";

const MOUSER_KEY = "MOUSER_API_KEY";
const DK_ID = "DIGIKEY_CLIENT_ID";
const DK_SECRET = "DIGIKEY_CLIENT_SECRET";

// The module memoizes a Digi-Key OAuth token on globalThis; wipe it between
// tests so cache state never leaks across cases.
function clearTokenCache() {
  delete (globalThis as unknown as { __dkToken?: unknown }).__dkToken;
}

beforeEach(() => {
  clearTokenCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env[MOUSER_KEY];
  delete process.env[DK_ID];
  delete process.env[DK_SECRET];
  clearTokenCache();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// ── liveDistributorsConfigured (dormancy gate) ───────────────────────────

describe("liveDistributorsConfigured", () => {
  it("is empty when no keys are configured", () => {
    expect(liveDistributorsConfigured()).toEqual([]);
  });

  it("treats whitespace-only credentials as unset (CR/space trimming)", () => {
    process.env[MOUSER_KEY] = "   ";
    process.env[DK_ID] = "\r";
    process.env[DK_SECRET] = " ";
    expect(liveDistributorsConfigured()).toEqual([]);
  });

  it("lists Mouser when only the Mouser key is present", () => {
    process.env[MOUSER_KEY] = "mk";
    expect(liveDistributorsConfigured()).toEqual(["Mouser Electronics"]);
  });

  it("requires BOTH Digi-Key id and secret (id alone is not enough)", () => {
    process.env[DK_ID] = "id";
    expect(liveDistributorsConfigured()).toEqual([]);
    process.env[DK_SECRET] = "sec";
    expect(liveDistributorsConfigured()).toEqual(["Digi-Key"]);
  });

  it("lists both distributors when all keys are present", () => {
    process.env[MOUSER_KEY] = "mk";
    process.env[DK_ID] = "id";
    process.env[DK_SECRET] = "sec";
    expect(liveDistributorsConfigured()).toEqual(["Mouser Electronics", "Digi-Key"]);
  });
});

// ── mapMouserParts edge branches ─────────────────────────────────────────

describe("mapMouserParts — edge branches", () => {
  it("caps output at two matched parts", () => {
    const parts = [
      { ManufacturerPartNumber: "QO120-A", PriceBreaks: [{ Quantity: 1, Price: "$1.00" }] },
      { ManufacturerPartNumber: "QO120-B", PriceBreaks: [{ Quantity: 1, Price: "$2.00" }] },
      { ManufacturerPartNumber: "QO120-C", PriceBreaks: [{ Quantity: 1, Price: "$3.00" }] },
    ];
    const quotes = mapMouserParts(parts, "QO120");
    expect(quotes).toHaveLength(2);
    expect(quotes.map((q) => q.matchedPart)).toEqual(["QO120-A", "QO120-B"]);
  });

  it("falls back to nulls/empties when optional fields are missing", () => {
    const quotes = mapMouserParts([{ ManufacturerPartNumber: "ABC123" }], "ABC123");
    expect(quotes).toHaveLength(1);
    const q = quotes[0];
    expect(q.manufacturer).toBe("");
    expect(q.description).toBe("");
    expect(q.unitPrice).toBeNull();
    expect(q.priceBreaks).toEqual([]);
    expect(q.stock).toBeNull();
    expect(q.datasheetUrl).toBeNull();
    expect(q.productUrl).toBeNull();
  });

  it("skips parts with no ManufacturerPartNumber", () => {
    const parts = [{ Manufacturer: "Nobody", Description: "no MPN" }];
    expect(mapMouserParts(parts, "QO120")).toHaveLength(0);
  });

  it("drops non-positive and non-numeric price breaks, defaulting qty to 1", () => {
    const parts = [
      {
        ManufacturerPartNumber: "QO120",
        PriceBreaks: [
          { Price: "$0.00" }, // zero → dropped
          { Quantity: 0, Price: "bad" }, // NaN → dropped
          { Price: "$5.50" }, // kept, qty defaults to 1
        ],
      },
    ];
    const [q] = mapMouserParts(parts, "QO120");
    expect(q.priceBreaks).toEqual([{ qty: 1, price: 5.5 }]);
    expect(q.unitPrice).toBe(5.5);
  });

  it("truncates priceBreaks to the first four", () => {
    const parts = [
      {
        ManufacturerPartNumber: "QO120",
        PriceBreaks: [
          { Quantity: 1, Price: "$5" },
          { Quantity: 10, Price: "$4" },
          { Quantity: 100, Price: "$3" },
          { Quantity: 1000, Price: "$2" },
          { Quantity: 10000, Price: "$1" },
        ],
      },
    ];
    const [q] = mapMouserParts(parts, "QO120");
    expect(q.priceBreaks).toHaveLength(4);
    expect(q.priceBreaks[3]).toEqual({ qty: 1000, price: 2 });
  });

  it("returns null stock when availability text lacks an 'In Stock' count", () => {
    const parts = [{ ManufacturerPartNumber: "QO120", Availability: "Call for availability" }];
    expect(mapMouserParts(parts, "QO120")[0].stock).toBeNull();
  });
});

// ── mapDigiKeyProducts edge branches ─────────────────────────────────────

describe("mapDigiKeyProducts — edge branches", () => {
  it("caps output at two matched products", () => {
    const products = [
      { ManufacturerProductNumber: "G2R-A", UnitPrice: 1, QuantityAvailable: 1 },
      { ManufacturerProductNumber: "G2R-B", UnitPrice: 2, QuantityAvailable: 2 },
      { ManufacturerProductNumber: "G2R-C", UnitPrice: 3, QuantityAvailable: 3 },
    ];
    expect(mapDigiKeyProducts(products, "G2R")).toHaveLength(2);
  });

  it("nulls unitPrice when it is zero, negative, or missing", () => {
    const products = [
      { ManufacturerProductNumber: "AAA-0", UnitPrice: 0 },
      { ManufacturerProductNumber: "AAA-1", UnitPrice: -5 },
      { ManufacturerProductNumber: "AAA-2" },
    ];
    expect(mapDigiKeyProducts(products, "AAA-0")[0].unitPrice).toBeNull();
    expect(mapDigiKeyProducts(products, "AAA-1")[0].unitPrice).toBeNull();
    expect(mapDigiKeyProducts(products, "AAA-2")[0].unitPrice).toBeNull();
  });

  it("keeps a zero quantity (finite) but nulls a missing one", () => {
    const products = [
      { ManufacturerProductNumber: "BBB-0", QuantityAvailable: 0 },
      { ManufacturerProductNumber: "BBB-1" },
    ];
    expect(mapDigiKeyProducts(products, "BBB-0")[0].stock).toBe(0);
    expect(mapDigiKeyProducts(products, "BBB-1")[0].stock).toBeNull();
  });

  it("falls back to empty strings / nulls for missing nested fields", () => {
    const [q] = mapDigiKeyProducts([{ ManufacturerProductNumber: "CCC" }], "CCC");
    expect(q.manufacturer).toBe("");
    expect(q.description).toBe("");
    expect(q.datasheetUrl).toBeNull();
    expect(q.productUrl).toBeNull();
    expect(q.priceBreaks).toEqual([]);
  });

  it("skips products with no ManufacturerProductNumber", () => {
    expect(mapDigiKeyProducts([{ Manufacturer: { Name: "x" } }], "CCC")).toHaveLength(0);
  });
});

// ── getLiveQuotes: Mouser live path via fetch ────────────────────────────

describe("getLiveQuotes — Mouser fetch path", () => {
  it("is fully dormant (no fetch) when no distributor is configured", async () => {
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse({}));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await getLiveQuotes("QO120")).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("parses a 200 Mouser body into quotes and hits the keyword endpoint", async () => {
    process.env[MOUSER_KEY] = "mk-123";
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string): Promise<Response> => {
        urls.push(url);
        return jsonResponse({
          SearchResults: {
            Parts: [
              {
                ManufacturerPartNumber: "QO120",
                Manufacturer: "Square D",
                Description: "MCB",
                Availability: "1,250 In Stock",
                PriceBreaks: [{ Quantity: 1, Price: "$11.42" }],
                DataSheetUrl: "https://m/ds.pdf",
                ProductDetailUrl: "https://m/p",
              },
            ],
          },
        });
      }),
    );

    const quotes = await getLiveQuotes("QO120");
    expect(quotes).toHaveLength(1);
    expect(quotes[0]).toMatchObject({
      distributor: "Mouser Electronics",
      matchedPart: "QO120",
      unitPrice: 11.42,
      stock: 1250,
    });
    expect(urls[0]).toContain("https://api.mouser.com/api/v1/search/keyword?apiKey=mk-123");
  });

  it("fails closed (no quotes) on a non-OK Mouser response", async () => {
    process.env[MOUSER_KEY] = "mk-123";
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => jsonResponse("", 500)));
    expect(await getLiveQuotes("QO120")).toEqual([]);
  });

  it("fails closed when the Mouser fetch itself rejects (network/timeout)", async () => {
    process.env[MOUSER_KEY] = "mk-123";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => {
        throw new Error("net down");
      }),
    );
    expect(await getLiveQuotes("QO120")).toEqual([]);
  });

  it("returns empty when the Mouser body has no SearchResults.Parts", async () => {
    process.env[MOUSER_KEY] = "mk-123";
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => jsonResponse({ Errors: [] })));
    expect(await getLiveQuotes("QO120")).toEqual([]);
  });
});

// ── getLiveQuotes: Digi-Key live path (OAuth token + search) ─────────────

describe("getLiveQuotes — Digi-Key fetch path", () => {
  function configureDigiKey() {
    process.env[DK_ID] = "dk-id";
    process.env[DK_SECRET] = "dk-secret";
  }

  it("obtains a token then parses a 200 search body into quotes", async () => {
    configureDigiKey();
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit): Promise<Response> => {
        urls.push(url);
        if (url.includes("/oauth2/token")) {
          return jsonResponse({ access_token: "tok-abc", expires_in: 600 });
        }
        // Search call must carry the bearer + client-id headers.
        const headers = init?.headers as Record<string, string>;
        expect(headers.Authorization).toBe("Bearer tok-abc");
        expect(headers["X-DIGIKEY-Client-Id"]).toBe("dk-id");
        return jsonResponse({
          Products: [
            {
              ManufacturerProductNumber: "G2R-1-SND-DC24",
              Manufacturer: { Name: "Omron" },
              Description: { ProductDescription: "relay" },
              QuantityAvailable: 4321,
              UnitPrice: 4.56,
            },
          ],
        });
      }),
    );

    const quotes = await getLiveQuotes("G2R-1-SND-DC24");
    expect(quotes).toHaveLength(1);
    expect(quotes[0]).toMatchObject({ distributor: "Digi-Key", unitPrice: 4.56, stock: 4321 });
    expect(urls.some((u) => u.includes("/oauth2/token"))).toBe(true);
    expect(urls.some((u) => u.includes("/products/v4/search/keyword"))).toBe(true);
  });

  it("returns no Digi-Key quotes when the token request is non-OK (and logs)", async () => {
    configureDigiKey();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string): Promise<Response> => {
        if (url.includes("/oauth2/token")) return new Response("denied", { status: 401 });
        throw new Error("should not reach search");
      }),
    );

    expect(await getLiveQuotes("G2R")).toEqual([]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const logged = String(warnSpy.mock.calls[0][0]);
    expect(logged).toContain("Digi-Key token request failed");
    expect(logged).toContain("401");
  });

  it("returns no Digi-Key quotes when the token body lacks access_token (and logs)", async () => {
    configureDigiKey();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string): Promise<Response> => {
        if (url.includes("/oauth2/token")) return jsonResponse({ token_type: "bearer" });
        throw new Error("should not reach search");
      }),
    );

    expect(await getLiveQuotes("G2R")).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      "[distributor-live] Digi-Key token response had no access_token",
    );
  });

  it("returns no Digi-Key quotes (and logs) when the search call is non-OK", async () => {
    configureDigiKey();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string): Promise<Response> => {
        if (url.includes("/oauth2/token")) return jsonResponse({ access_token: "tok", expires_in: 600 });
        return new Response("", { status: 503 });
      }),
    );

    expect(await getLiveQuotes("G2R")).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith("[distributor-live] Digi-Key search failed: 503");
  });

  it("reuses a cached, unexpired token without re-hitting the OAuth endpoint", async () => {
    configureDigiKey();
    let tokenCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string): Promise<Response> => {
        if (url.includes("/oauth2/token")) {
          tokenCalls += 1;
          return jsonResponse({ access_token: "tok", expires_in: 3600 });
        }
        return jsonResponse({ Products: [] });
      }),
    );

    await getLiveQuotes("G2R");
    await getLiveQuotes("AAA");
    // Token fetched once and reused on the second search.
    expect(tokenCalls).toBe(1);
  });

  it("defaults the token TTL to 600s when expires_in is absent/non-numeric", async () => {
    configureDigiKey();
    let tokenCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string): Promise<Response> => {
        if (url.includes("/oauth2/token")) {
          tokenCalls += 1;
          return jsonResponse({ access_token: "tok" }); // no expires_in
        }
        return jsonResponse({ Products: [] });
      }),
    );

    await getLiveQuotes("G2R");
    // A default-TTL token is still cached (>30s in the future), so the second
    // call reuses it rather than re-authenticating.
    await getLiveQuotes("AAA");
    expect(tokenCalls).toBe(1);
  });

  it("fails closed when the token fetch rejects (network/timeout)", async () => {
    configureDigiKey();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => {
        throw new Error("net");
      }),
    );
    expect(await getLiveQuotes("G2R")).toEqual([]);
  });
});

// ── getLiveQuotes: both distributors combined ────────────────────────────

describe("getLiveQuotes — combined fan-out", () => {
  it("merges Mouser + Digi-Key results and tolerates one side failing", async () => {
    process.env[MOUSER_KEY] = "mk";
    process.env[DK_ID] = "id";
    process.env[DK_SECRET] = "sec";

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string): Promise<Response> => {
        if (url.includes("api.mouser.com")) {
          return jsonResponse({
            SearchResults: {
              Parts: [{ ManufacturerPartNumber: "QO120", PriceBreaks: [{ Quantity: 1, Price: "$1" }] }],
            },
          });
        }
        if (url.includes("/oauth2/token")) {
          return jsonResponse({ access_token: "tok", expires_in: 600 });
        }
        // Digi-Key search fails — must not sink the Mouser result.
        return new Response("", { status: 500 });
      }),
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const quotes = await getLiveQuotes("QO120");
    expect(quotes).toHaveLength(1);
    expect(quotes[0].distributor).toBe("Mouser Electronics");
  });
});
