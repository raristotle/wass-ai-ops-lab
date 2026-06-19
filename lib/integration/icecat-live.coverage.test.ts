import { describe, it, expect, afterEach, vi } from "vitest";
import {
  ICECAT_API_URL,
  icecatConfigured,
  parseIcecatProduct,
  lookupDatasheet,
} from "@/lib/integration/icecat-live";

const GATE = "ICECAT_USERNAME";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env[GATE];
  delete process.env.ICECAT_API_TOKEN;
  delete process.env.ICECAT_CONTENT_TOKEN;
});

describe("icecatConfigured (dormancy gate)", () => {
  it("is false when ICECAT_USERNAME is unset", () => {
    expect(icecatConfigured()).toBe(false);
  });

  it("is false when ICECAT_USERNAME is only whitespace", () => {
    process.env[GATE] = "   ";
    expect(icecatConfigured()).toBe(false);
  });

  it("is true once ICECAT_USERNAME is set", () => {
    process.env[GATE] = "openIcecat-live";
    expect(icecatConfigured()).toBe(true);
  });
});

describe("parseIcecatProduct (edge cases)", () => {
  it("returns null when data is present but not an object", () => {
    expect(parseIcecatProduct({ data: "nope" })).toBeNull();
    expect(parseIcecatProduct({ data: 42 })).toBeNull();
  });

  it("returns null for a non-object / undefined top-level value", () => {
    expect(parseIcecatProduct(undefined)).toBeNull();
    expect(parseIcecatProduct("string")).toBeNull();
    expect(parseIcecatProduct(123)).toBeNull();
  });

  it("falls back to ManualPDFURL when PDFURL is absent", () => {
    const p = parseIcecatProduct({
      data: { GeneralInfo: { Description: { ManualPDFURL: "https://x/manual.pdf" } } },
    });
    expect(p!.datasheetUrl).toBe("https://x/manual.pdf");
  });

  it("falls back to LowPic when HighPic is absent", () => {
    const p = parseIcecatProduct({ data: { Image: { LowPic: "https://x/lo.jpg" } } });
    expect(p!.imageUrl).toBe("https://x/lo.jpg");
  });

  it("nulls out datasheet/image when neither source is present", () => {
    const p = parseIcecatProduct({ data: { GeneralInfo: {} } });
    expect(p!.datasheetUrl).toBeNull();
    expect(p!.imageUrl).toBeNull();
  });

  it("filters non-string and blank GTIN entries", () => {
    const p = parseIcecatProduct({
      data: { GeneralInfo: { GTIN: ["0711719709695", "  ", 12345, null, "0711719709701"] } },
    });
    expect(p!.gtins).toEqual(["0711719709695", "0711719709701"]);
  });

  it("yields empty gtins when GTIN is a scalar (not an array)", () => {
    const p = parseIcecatProduct({ data: { GeneralInfo: { GTIN: "0711719709695" } } });
    expect(p!.gtins).toEqual([]);
  });

  it("skips a FeaturesGroups entry whose Features is not an array", () => {
    const p = parseIcecatProduct({
      data: { FeaturesGroups: [{ Features: "broken" }, { notFeatures: [] }] },
    });
    expect(p!.specs).toEqual([]);
  });

  it("ignores feature rows missing a name or a value", () => {
    const p = parseIcecatProduct({
      data: {
        FeaturesGroups: [
          {
            Features: [
              { Feature: { Name: { Value: "Weight" } } }, // no value
              { PresentationValue: "orphan" }, // no name
              { Feature: { Name: { Value: "Color" } }, PresentationValue: "White" }, // good
            ],
          },
        ],
      },
    });
    expect(p!.specs).toEqual([{ name: "Color", value: "White" }]);
  });

  it("prefers PresentationValue over raw Value when both exist", () => {
    const p = parseIcecatProduct({
      data: {
        FeaturesGroups: [
          {
            Features: [
              {
                Feature: { Name: { Value: "Weight" } },
                PresentationValue: "4.5 kg",
                Value: "4500",
              },
            ],
          },
        ],
      },
    });
    expect(p!.specs).toEqual([{ name: "Weight", value: "4.5 kg" }]);
  });

  it("trims whitespace from string fields", () => {
    const p = parseIcecatProduct({
      data: { GeneralInfo: { Brand: "  Sony  ", Title: "  PS5  " } },
    });
    expect(p!.brand).toBe("Sony");
    expect(p!.title).toBe("PS5");
  });
});

const OK_BODY = {
  data: {
    GeneralInfo: {
      Brand: "Sony",
      ProductCode: "CFI-1015A",
      Title: "PlayStation 5",
      GTIN: ["0711719709695"],
      Description: { PDFURL: "https://x/ds.pdf" },
    },
    Image: { HighPic: "https://x/hi.jpg" },
    FeaturesGroups: [
      { Features: [{ Feature: { Name: { Value: "Color" } }, PresentationValue: "White" }] },
    ],
  },
};

describe("lookupDatasheet (dormant gate)", () => {
  it("returns {enabled:false, no-keys} and makes NO network call when unconfigured", async () => {
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await lookupDatasheet({ gtin: "0711719709695" })).toEqual({
      enabled: false,
      reason: "no-keys",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("treats a whitespace-only username as dormant (no-keys)", async () => {
    process.env[GATE] = "   ";
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await lookupDatasheet({ gtin: "123" })).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("lookupDatasheet (query shaping)", () => {
  it("returns no-match (no fetch) when neither GTIN nor brand+mpn is provided", async () => {
    process.env[GATE] = "shop";
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await lookupDatasheet({})).toEqual({ enabled: false, reason: "no-match" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns no-match when only brand is present (mpn missing)", async () => {
    process.env[GATE] = "shop";
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await lookupDatasheet({ brand: "Sony" })).toEqual({ enabled: false, reason: "no-match" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns no-match when query fields are only whitespace", async () => {
    process.env[GATE] = "shop";
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await lookupDatasheet({ gtin: "   ", brand: "  ", mpn: "  " })).toEqual({
      enabled: false,
      reason: "no-match",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("builds the GTIN query against the live API with shopname + lang", async () => {
    process.env[GATE] = "shop";
    const fetchSpy = vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify(OK_BODY), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    await lookupDatasheet({ gtin: "  0711719709695  " });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url.startsWith(`${ICECAT_API_URL}?`)).toBe(true);
    const parsed = new URL(url);
    expect(parsed.searchParams.get("GTIN")).toBe("0711719709695"); // trimmed
    expect(parsed.searchParams.get("shopname")).toBe("shop");
    expect(parsed.searchParams.get("lang")).toBe("EN");
    expect(parsed.searchParams.has("Brand")).toBe(false);
    // No optional tokens => only the Accept header.
    const headers = init.headers as Record<string, string>;
    expect(headers.Accept).toBe("application/json");
    expect(headers["api-token"]).toBeUndefined();
    expect(headers["content-token"]).toBeUndefined();
  });

  it("uppercases the ProductCode and prefers brand+mpn shaping when no GTIN", async () => {
    process.env[GATE] = "shop";
    const fetchSpy = vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify(OK_BODY), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    await lookupDatasheet({ brand: "  Sony  ", mpn: "  cfi-1015a  " });
    const [url] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("Brand")).toBe("Sony");
    expect(parsed.searchParams.get("ProductCode")).toBe("CFI-1015A");
    expect(parsed.searchParams.has("GTIN")).toBe(false);
  });

  it("prefers GTIN over brand+mpn when both are supplied", async () => {
    process.env[GATE] = "shop";
    const fetchSpy = vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify(OK_BODY), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    await lookupDatasheet({ gtin: "999", brand: "Sony", mpn: "cfi-1015a" });
    const [url] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("GTIN")).toBe("999");
    expect(parsed.searchParams.has("Brand")).toBe(false);
  });

  it("attaches api-token and content-token headers when configured", async () => {
    process.env[GATE] = "shop";
    process.env.ICECAT_API_TOKEN = "api-xyz";
    process.env.ICECAT_CONTENT_TOKEN = "content-abc";
    const fetchSpy = vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify(OK_BODY), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    await lookupDatasheet({ gtin: "0711719709695" });
    const [, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["api-token"]).toBe("api-xyz");
    expect(headers["content-token"]).toBe("content-abc");
  });

  it("sets a 12s abort timeout signal on the request", async () => {
    process.env[GATE] = "shop";
    const fetchSpy = vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify(OK_BODY), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    await lookupDatasheet({ gtin: "0711719709695" });
    const [, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("lookupDatasheet (response handling)", () => {
  it("returns an enabled result with the parsed product on a 200", async () => {
    process.env[GATE] = "shop";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response(JSON.stringify(OK_BODY), { status: 200 })),
    );

    const r = await lookupDatasheet({ gtin: "0711719709695" });
    expect(r.enabled).toBe(true);
    if (!r.enabled) throw new Error("expected enabled result");
    expect(r.source).toBe("Open Icecat");
    expect(r.product.brand).toBe("Sony");
    expect(r.product.gtins).toEqual(["0711719709695"]);
    expect(r.product.specs).toEqual([{ name: "Color", value: "White" }]);
    expect(typeof r.fetchedAt).toBe("string");
    expect(Number.isNaN(Date.parse(r.fetchedAt))).toBe(false);
  });

  it("maps a 4xx (not found / brand not authorized) to graceful no-match without logging", async () => {
    process.env[GATE] = "shop";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response("", { status: 404 })),
    );
    expect(await lookupDatasheet({ gtin: "0711719709695" })).toEqual({
      enabled: false,
      reason: "no-match",
    });
    expect(errSpy).not.toHaveBeenCalled();
  });

  it("maps a 401 not-authorized to no-match (sponsor gating)", async () => {
    process.env[GATE] = "shop";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response("", { status: 401 })),
    );
    expect(await lookupDatasheet({ gtin: "0711719709695" })).toEqual({
      enabled: false,
      reason: "no-match",
    });
  });

  it("fails closed (fetch-failed) and logs on a 5xx upstream response", async () => {
    process.env[GATE] = "shop";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response("", { status: 500 })),
    );
    expect(await lookupDatasheet({ gtin: "0711719709695" })).toEqual({
      enabled: false,
      reason: "fetch-failed",
    });
    expect(errSpy).toHaveBeenCalledTimes(1);
    const logged = String(errSpy.mock.calls[0][0]);
    expect(logged).toContain("icecat");
    expect(logged).toContain("500");
  });

  it("fails closed (fetch-failed) when fetch itself rejects (network/timeout)", async () => {
    process.env[GATE] = "shop";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => {
        throw new Error("network down");
      }),
    );
    expect(await lookupDatasheet({ gtin: "0711719709695" })).toEqual({
      enabled: false,
      reason: "fetch-failed",
    });
  });

  it("returns no-match (not fetch-failed) when the body is not valid JSON", async () => {
    process.env[GATE] = "shop";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response("<<not json>>", { status: 200 })),
    );
    // json() throws -> caught -> null -> parseIcecatProduct(null) -> null -> no-match
    expect(await lookupDatasheet({ gtin: "0711719709695" })).toEqual({
      enabled: false,
      reason: "no-match",
    });
  });

  it("returns no-match when JSON parses but has no data section", async () => {
    process.env[GATE] = "shop";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );
    expect(await lookupDatasheet({ gtin: "0711719709695" })).toEqual({
      enabled: false,
      reason: "no-match",
    });
  });
});
