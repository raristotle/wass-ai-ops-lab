import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
  nexarSearchToEnrichment,
  enrichByMpn,
  type NexarPart,
} from "@/lib/integration/nexar-live";

// ── helpers ──────────────────────────────────────────────────────────────────
function tokenResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
function graphqlResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Build a fetch stub that answers the OAuth token URL and the GraphQL URL
 * differently, so each enrichByMpn call exercises both hops deterministically.
 */
function makeFetch(opts: {
  token?: Response | (() => Response | Promise<Response>) | Error;
  graphql?: Response | (() => Response | Promise<Response>) | Error;
}) {
  return vi.fn(async (url: string): Promise<Response> => {
    const isToken = String(url).includes("identity.nexar.com");
    const handler = isToken ? opts.token : opts.graphql;
    if (handler === undefined) {
      throw new Error(`unexpected fetch to ${url}`);
    }
    if (handler instanceof Error) throw handler;
    if (typeof handler === "function") return handler();
    return handler;
  });
}

function setKeys() {
  process.env.NEXAR_CLIENT_ID = "id";
  process.env.NEXAR_CLIENT_SECRET = "secret";
}

beforeEach(() => {
  // Silence the structured error logger so non-OK paths don't spam test output,
  // while still letting us assert it was invoked.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.NEXAR_CLIENT_ID;
  delete process.env.NEXAR_CLIENT_SECRET;
});

// A primary part whose GraphQL result yields a non-null enrichment.
const ENRICH_PART: NexarPart = {
  mpn: "LM339N",
  name: "LM339N comparator",
  manufacturer: { name: "Texas Instruments" },
};

function graphqlOk(parts: NexarPart[]): Response {
  return graphqlResponse({
    data: { supSearchMpn: { results: parts.map((p) => ({ part: p })) } },
  });
}

// ── nexarSearchToEnrichment: default/fallback branches ─────────────────────────
describe("nexarSearchToEnrichment — fallback branches", () => {
  it("falls back name→mpn, manufacturer→'—', and drops non-numeric price breaks", () => {
    const parts: NexarPart[] = [
      {
        mpn: "BARE-1",
        // no name, no manufacturer, no octopartUrl, no bestDatasheet
        documentCollections: [
          // a collection whose document has no name → name falls back to collection name
          { name: "Env", documents: [{ url: "https://x/env.pdf" }] },
          // a collection with neither doc name nor collection name → "Document"
          { documents: [{ url: "https://x/anon.pdf" }] },
          // a collection with no documents at all → contributes nothing
          { name: "Empty" },
        ],
        sellers: [
          {
            // company with no name / not verified
            company: {},
            offers: [
              {
                // no sku, no inventoryLevel, no clickUrl
                prices: [
                  { quantity: 10, price: 1.25, currency: "EUR" },
                  { quantity: 100 }, // dropped: price not a number
                  { price: 0.99 }, // dropped: quantity not a number
                  { quantity: 50, price: 0.8 }, // currency falls back to USD
                ],
              },
            ],
          },
          {
            // a seller with NO offers → stock 0, sku "", clickUrl null, empty breaks
            company: { name: "NoOffers", isVerified: false },
          },
        ],
      },
    ];

    const e = nexarSearchToEnrichment(parts);
    expect(e).not.toBeNull();
    if (!e) return;

    expect(e.name).toBe("BARE-1"); // name fell back to mpn
    expect(e.manufacturer).toBe("—"); // manufacturer fell back
    expect(e.datasheetUrl).toBeNull();
    expect(e.octopartUrl).toBeNull();

    // Compliance: two docs survive (both have urls), with name fallbacks.
    expect(e.compliance).toEqual([
      { name: "Env", url: "https://x/env.pdf", mimeType: null },
      { name: "Document", url: "https://x/anon.pdf", mimeType: null },
    ]);

    // First seller: defaults applied, two valid price breaks, USD fallback.
    expect(e.distributors[0]).toEqual({
      name: "—",
      verified: false,
      stock: 0,
      sku: "",
      clickUrl: null,
      priceBreaks: [
        { qty: 10, price: 1.25, currency: "EUR" },
        { qty: 50, price: 0.8, currency: "USD" },
      ],
    });

    // Second seller has no offers at all.
    expect(e.distributors[1]).toEqual({
      name: "NoOffers",
      verified: false,
      stock: 0,
      sku: "",
      clickUrl: null,
      priceBreaks: [],
    });

    // secondSources covers all parts; manufacturer falls back to "—".
    expect(e.secondSources).toEqual([
      { mpn: "BARE-1", manufacturer: "—", octopartUrl: null },
    ]);
  });

  it("treats a part with no sellers / no documentCollections as empty arrays", () => {
    const e = nexarSearchToEnrichment([{ mpn: "X1" }]);
    expect(e).not.toBeNull();
    if (!e) return;
    expect(e.compliance).toEqual([]);
    expect(e.distributors).toEqual([]);
    expect(e.secondSources).toEqual([{ mpn: "X1", manufacturer: "—", octopartUrl: null }]);
  });

  // ── null entries in the parts list (Nexar's results[].part is nullable) ──
  // Fixed: nexarSearchToEnrichment filters nulls, so a leading null can't hide a
  // valid later part and a trailing null can't throw.
  it("skips a leading null part and promotes the first valid part to primary", () => {
    const parts = [null as unknown as NexarPart, { mpn: "VALID", manufacturer: { name: "TI" } }];
    const e = nexarSearchToEnrichment(parts);
    expect(e).not.toBeNull();
    expect(e!.mpn).toBe("VALID");
    expect(e!.manufacturer).toBe("TI");
  });

  it("drops a trailing null part instead of throwing in secondSources", () => {
    const parts = [{ mpn: "PRIMARY", manufacturer: { name: "TI" } }, null as unknown as NexarPart];
    const e = nexarSearchToEnrichment(parts);
    expect(e!.mpn).toBe("PRIMARY");
    expect(e!.secondSources).toEqual([{ mpn: "PRIMARY", manufacturer: "TI", octopartUrl: null }]);
  });
});

// ── enrichByMpn: auth-failed branch ────────────────────────────────────────────
describe("enrichByMpn — auth-failed", () => {
  it("returns auth-failed when the token endpoint is non-OK", async () => {
    setKeys();
    vi.stubGlobal("fetch", makeFetch({ token: tokenResponse("", 401) }));
    const r = await enrichByMpn("LM339");
    expect(r).toEqual({ enabled: false, reason: "auth-failed" });
  });

  it("returns auth-failed when the token body has no access_token", async () => {
    setKeys();
    vi.stubGlobal("fetch", makeFetch({ token: tokenResponse({ expires_in: 3600 }) }));
    const r = await enrichByMpn("LM339");
    expect(r).toEqual({ enabled: false, reason: "auth-failed" });
  });

  it("returns auth-failed when the token body is invalid JSON", async () => {
    setKeys();
    vi.stubGlobal(
      "fetch",
      makeFetch({
        token: new Response("not json", { status: 200, headers: { "Content-Type": "text/plain" } }),
      }),
    );
    const r = await enrichByMpn("LM339");
    expect(r).toEqual({ enabled: false, reason: "auth-failed" });
  });
});

// ── enrichByMpn: fetch-failed branches ─────────────────────────────────────────
describe("enrichByMpn — fetch-failed", () => {
  it("returns fetch-failed and logs when GraphQL is non-OK", async () => {
    setKeys();
    vi.stubGlobal(
      "fetch",
      makeFetch({
        token: tokenResponse({ access_token: "tok", expires_in: 3600 }),
        graphql: graphqlResponse("", 500),
      }),
    );
    const r = await enrichByMpn("LM339");
    expect(r).toEqual({ enabled: false, reason: "fetch-failed" });
    expect(console.error).toHaveBeenCalled();
  });

  it("returns fetch-failed when GraphQL responds 200 with an errors[] array", async () => {
    setKeys();
    vi.stubGlobal(
      "fetch",
      makeFetch({
        token: tokenResponse({ access_token: "tok", expires_in: 3600 }),
        graphql: graphqlResponse({ errors: [{ message: "bad query" }] }),
      }),
    );
    const r = await enrichByMpn("LM339");
    expect(r).toEqual({ enabled: false, reason: "fetch-failed" });
    expect(console.error).toHaveBeenCalled();
  });

  it("returns fetch-failed (caught) when the GraphQL fetch throws", async () => {
    setKeys();
    vi.stubGlobal(
      "fetch",
      makeFetch({
        token: tokenResponse({ access_token: "tok", expires_in: 3600 }),
        graphql: new Error("network down"),
      }),
    );
    const r = await enrichByMpn("LM339");
    expect(r).toEqual({ enabled: false, reason: "fetch-failed" });
    expect(console.error).toHaveBeenCalled();
  });
});

// ── enrichByMpn: no-data branch ────────────────────────────────────────────────
describe("enrichByMpn — no-data", () => {
  it("returns no-data when GraphQL succeeds but results are empty", async () => {
    setKeys();
    vi.stubGlobal(
      "fetch",
      makeFetch({
        token: tokenResponse({ access_token: "tok", expires_in: 3600 }),
        graphql: graphqlOk([]),
      }),
    );
    const r = await enrichByMpn("LM339");
    expect(r).toEqual({ enabled: false, reason: "no-data" });
  });

  it("returns no-data when the data envelope is missing entirely", async () => {
    setKeys();
    vi.stubGlobal(
      "fetch",
      makeFetch({
        token: tokenResponse({ access_token: "tok", expires_in: 3600 }),
        graphql: graphqlResponse({}),
      }),
    );
    const r = await enrichByMpn("LM339");
    expect(r).toEqual({ enabled: false, reason: "no-data" });
  });
});

// ── enrichByMpn: success path ──────────────────────────────────────────────────
describe("enrichByMpn — success", () => {
  it("returns enabled enrichment with the expected envelope and ISO fetchedAt", async () => {
    setKeys();
    vi.stubGlobal(
      "fetch",
      makeFetch({
        token: tokenResponse({ access_token: "tok", expires_in: 3600 }),
        graphql: graphqlOk([ENRICH_PART]),
      }),
    );
    const r = await enrichByMpn("LM339N");
    expect(r.enabled).toBe(true);
    if (!r.enabled) return;
    expect(r.source).toBe("Nexar (Octopart)");
    expect(r.enrichment.mpn).toBe("LM339N");
    expect(r.enrichment.manufacturer).toBe("Texas Instruments");
    // fetchedAt is an ISO-8601 timestamp.
    expect(() => new Date(r.fetchedAt).toISOString()).not.toThrow();
    expect(r.fetchedAt).toBe(new Date(r.fetchedAt).toISOString());
  });

  it("clamps limit to a maximum of 10 in the GraphQL variables", async () => {
    setKeys();
    const fetchSpy = makeFetch({
      token: tokenResponse({ access_token: "tok", expires_in: 3600 }),
      graphql: graphqlOk([ENRICH_PART]),
    });
    vi.stubGlobal("fetch", fetchSpy);
    await enrichByMpn("LM339N", { limit: 999 });

    // Find the GraphQL call and inspect the request body's variables.limit.
    const gqlCall = fetchSpy.mock.calls.find((c) => String(c[0]).includes("api.nexar.com"));
    expect(gqlCall).toBeDefined();
    const init = (gqlCall as unknown as [string, RequestInit])[1];
    const sent = JSON.parse(String(init.body)) as { variables: { mpn: string; limit: number } };
    expect(sent.variables.limit).toBe(10);
    expect(sent.variables.mpn).toBe("LM339N");
  });

  it("defaults limit to 5 when no opts are provided", async () => {
    setKeys();
    const fetchSpy = makeFetch({
      token: tokenResponse({ access_token: "tok", expires_in: 3600 }),
      graphql: graphqlOk([ENRICH_PART]),
    });
    vi.stubGlobal("fetch", fetchSpy);
    await enrichByMpn("LM339N");
    const gqlCall = fetchSpy.mock.calls.find((c) => String(c[0]).includes("api.nexar.com"));
    const init = (gqlCall as unknown as [string, RequestInit])[1];
    const sent = JSON.parse(String(init.body)) as { variables: { limit: number } };
    expect(sent.variables.limit).toBe(5);
  });
});

// ── getToken caching behaviour (exercised through enrichByMpn) ──────────────────
describe("enrichByMpn — token caching", () => {
  it("reuses a cached token across calls (token endpoint hit at most once)", async () => {
    setKeys();
    // expires_in large enough that the cache stays valid for the whole test.
    const fetchSpy = makeFetch({
      token: tokenResponse({ access_token: "tok-cached", expires_in: 86_400 }),
      graphql: graphqlOk([ENRICH_PART]),
    });
    vi.stubGlobal("fetch", fetchSpy);

    await enrichByMpn("A");
    await enrichByMpn("B");
    await enrichByMpn("C");

    const tokenCalls = fetchSpy.mock.calls.filter((c) => String(c[0]).includes("identity.nexar.com"));
    // The OAuth token is cached in-process (module-level), so across three
    // enrichByMpn calls the token endpoint is hit at most once — and may be 0 if
    // an earlier test already warmed the shared cache. The invariant under test
    // is that caching prevents per-call re-auth, i.e. strictly fewer than 3.
    expect(tokenCalls.length).toBeLessThanOrEqual(1);
    // All three GraphQL calls still happened (one enrichment per call).
    const gqlCalls = fetchSpy.mock.calls.filter((c) => String(c[0]).includes("api.nexar.com"));
    expect(gqlCalls.length).toBe(3);
  });
});
