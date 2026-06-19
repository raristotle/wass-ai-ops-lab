import { describe, it, expect, afterEach, vi } from "vitest";
import {
  apiSearch,
  apiSuggest,
  apiGetProduct,
  apiAssistant,
  apiCrossSavings,
  apiCrossMatch,
  apiBomAnalyze,
  apiGoesWith,
  apiResolve,
  filtersToQuery,
} from "@/lib/product-finder-api";
import type { FilterState } from "@/features/product-finder/types";

/** Minimal valid FilterState for building query strings. */
function makeFilters(overrides: Partial<FilterState> = {}): FilterState {
  return {
    query: "",
    categories: new Set(),
    subcategories: new Set(),
    brands: new Set(),
    onlyBranchStock: false,
    onlyDCStock: false,
    onlyPreferred: false,
    onlyActive: false,
    onlyWithCrosses: false,
    priceMin: null,
    priceMax: null,
    sortKey: "relevance",
    viewMode: "list",
    specFilters: {},
    specRanges: {},
    ...overrides,
  };
}

/** Build a fetch mock that returns a JSON body with a 200 status. */
function jsonOk(body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
}

/** Build a fetch mock that returns a non-OK status with an empty body. */
function status(code: number) {
  return vi.fn(async () => new Response("", { status: code }));
}

/** Build a fetch mock that rejects (simulates a network/connection error). */
function networkError() {
  return vi.fn(async () => {
    throw new Error("net");
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─── filtersToQuery: scalar branches not exercised by the existing test ────────

describe("filtersToQuery — scalar filter branches", () => {
  it("serializes all scalar facets, booleans, price bounds, sort, paging", () => {
    const filters = makeFilters({
      query: "breaker",
      categories: new Set(["electrical"] as never),
      subcategories: new Set(["breakers"]),
      brands: new Set(["Square D", "Eaton"]),
      onlyBranchStock: true,
      onlyDCStock: true,
      onlyPreferred: true,
      onlyActive: true,
      onlyWithCrosses: true,
      priceMin: 10,
      priceMax: 250,
      sortKey: "price-asc" as never,
    });
    const qs = filtersToQuery(filters, 2, 50);
    const sp = new URLSearchParams(qs);

    expect(sp.get("q")).toBe("breaker");
    expect(sp.get("category")).toBe("electrical");
    expect(sp.get("subcategory")).toBe("breakers");
    expect(sp.get("brand")).toBe("Square D,Eaton");
    expect(sp.get("onlyBranchStock")).toBe("true");
    expect(sp.get("onlyDCStock")).toBe("true");
    expect(sp.get("onlyPreferred")).toBe("true");
    expect(sp.get("onlyActive")).toBe("true");
    expect(sp.get("onlyWithCrosses")).toBe("true");
    expect(sp.get("priceMin")).toBe("10");
    expect(sp.get("priceMax")).toBe("250");
    expect(sp.get("sort")).toBe("price-asc");
    expect(sp.get("page")).toBe("2");
    expect(sp.get("pageSize")).toBe("50");
  });

  it("omits optional facets when empty and treats priceMin=0 as present (not null)", () => {
    const filters = makeFilters({ priceMin: 0 });
    const sp = new URLSearchParams(filtersToQuery(filters, 0, 24));

    expect(sp.has("q")).toBe(false);
    expect(sp.has("category")).toBe(false);
    expect(sp.has("brand")).toBe(false);
    expect(sp.has("onlyBranchStock")).toBe(false);
    // priceMin uses `!= null` so 0 is serialized
    expect(sp.get("priceMin")).toBe("0");
    expect(sp.has("priceMax")).toBe(false);
  });

  it("skips empty spec value arrays and undefined range bounds", () => {
    const filters = makeFilters({
      specFilters: { Amperage: [] },
      specRanges: { Voltage: {} },
    });
    const sp = new URLSearchParams(filtersToQuery(filters, 0, 24));
    expect(sp.has("spec.Amperage")).toBe(false);
    expect(sp.has("specmin.Voltage")).toBe(false);
    expect(sp.has("specmax.Voltage")).toBe(false);
  });

  it("tolerates undefined specFilters/specRanges via the ?? fallback", () => {
    const filters = makeFilters();
    // @ts-expect-error — exercise the nullish-coalescing guard
    filters.specFilters = undefined;
    // @ts-expect-error — exercise the nullish-coalescing guard
    filters.specRanges = undefined;
    expect(() => filtersToQuery(filters, 0, 24)).not.toThrow();
  });
});

// ─── apiSearch ─────────────────────────────────────────────────────────────────

describe("apiSearch", () => {
  it("returns the parsed JSON body and hits the search endpoint with the query", async () => {
    const body = { items: [{ id: "p1" }], total: 1, page: 0 };
    const fetchMock = jsonOk(body);
    vi.stubGlobal("fetch", fetchMock);

    const res = await apiSearch(makeFilters({ query: "wire" }), 0);
    expect(res).toEqual(body);
    const url = (fetchMock.mock.calls[0] as unknown as [string])[0];
    expect(url).toContain("/api/products/search?");
    expect(url).toContain("q=wire");
    expect(url).toContain("pageSize=24"); // default applied
  });

  it("throws on a non-OK response (does NOT fail closed)", async () => {
    vi.stubGlobal("fetch", status(500));
    await expect(apiSearch(makeFilters(), 0)).rejects.toThrow("search failed: 500");
  });
});

// ─── apiSuggest ──────────────────────────────────────────────────────────────

describe("apiSuggest", () => {
  it("returns the items array on success and url-encodes the query", async () => {
    const fetchMock = jsonOk({ items: [{ label: "Romex 12/2" }] });
    vi.stubGlobal("fetch", fetchMock);

    const out = await apiSuggest("12/2 wire");
    expect(out).toEqual([{ label: "Romex 12/2" }]);
    const url = (fetchMock.mock.calls[0] as unknown as [string])[0];
    expect(url).toContain("/api/products/suggest?q=");
    expect(url).toContain(encodeURIComponent("12/2 wire"));
  });

  it("returns [] on a non-OK response", async () => {
    vi.stubGlobal("fetch", status(404));
    await expect(apiSuggest("x")).resolves.toEqual([]);
  });
});

// ─── apiGetProduct ───────────────────────────────────────────────────────────

describe("apiGetProduct", () => {
  it("fetches by id without branchId and returns the parsed detail", async () => {
    const detail = { id: "abc", name: "Widget" };
    const fetchMock = jsonOk(detail);
    vi.stubGlobal("fetch", fetchMock);

    const res = await apiGetProduct("abc 1");
    expect(res).toEqual(detail);
    const url = (fetchMock.mock.calls[0] as unknown as [string])[0];
    expect(url).toBe(`/api/products/${encodeURIComponent("abc 1")}`);
    expect(url).not.toContain("branchId");
  });

  it("appends an encoded branchId when provided", async () => {
    const fetchMock = jsonOk({ id: "abc" });
    vi.stubGlobal("fetch", fetchMock);

    await apiGetProduct("abc", "br 42");
    const url = (fetchMock.mock.calls[0] as unknown as [string])[0];
    expect(url).toContain(`?branchId=${encodeURIComponent("br 42")}`);
  });

  it("throws on a non-OK response", async () => {
    vi.stubGlobal("fetch", status(503));
    await expect(apiGetProduct("abc")).rejects.toThrow("detail failed: 503");
  });
});

// ─── apiAssistant ────────────────────────────────────────────────────────────

describe("apiAssistant", () => {
  it("POSTs the chat history and returns the parsed reply on success", async () => {
    const body = { enabled: true, reply: "Hi there", toolsUsed: ["search"] };
    const fetchMock = jsonOk(body);
    vi.stubGlobal("fetch", fetchMock);

    const res = await apiAssistant([{ role: "user", content: "hello" }]);
    expect(res).toEqual(body);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/assistant");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      messages: [{ role: "user", content: "hello" }],
    });
  });

  it("returns the unavailable fallback on a non-OK response", async () => {
    vi.stubGlobal("fetch", status(500));
    const res = await apiAssistant([]);
    expect(res).toEqual({
      enabled: true,
      reply: "Sorry — Ask Meridian is unavailable right now.",
      toolsUsed: [],
    });
  });

  it("returns the unavailable fallback when fetch throws", async () => {
    vi.stubGlobal("fetch", networkError());
    const res = await apiAssistant([]);
    expect(res.enabled).toBe(true);
    expect(res.reply).toContain("unavailable");
    expect(res.toolsUsed).toEqual([]);
  });
});

// ─── apiCrossSavings ─────────────────────────────────────────────────────────

describe("apiCrossSavings", () => {
  it("returns the candidates map on success", async () => {
    const candidates = { "SKU-1": [{ id: "c1" }] };
    const fetchMock = jsonOk({ candidates });
    vi.stubGlobal("fetch", fetchMock);

    const res = await apiCrossSavings(["SKU-1"]);
    expect(res).toEqual(candidates);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/crosses/savings");
    expect(JSON.parse(init.body as string)).toEqual({ skus: ["SKU-1"] });
  });

  it("returns {} when the body omits candidates (?? fallback)", async () => {
    vi.stubGlobal("fetch", jsonOk({}));
    await expect(apiCrossSavings(["SKU-1"])).resolves.toEqual({});
  });

  it("returns {} on a non-OK response", async () => {
    vi.stubGlobal("fetch", status(500));
    await expect(apiCrossSavings(["SKU-1"])).resolves.toEqual({});
  });

  it("returns {} when fetch throws", async () => {
    vi.stubGlobal("fetch", networkError());
    await expect(apiCrossSavings(["SKU-1"])).resolves.toEqual({});
  });
});

// ─── apiCrossMatch ───────────────────────────────────────────────────────────

describe("apiCrossMatch", () => {
  it("returns the suggestions array on success", async () => {
    const suggestions = [{ id: "s1" }, null];
    vi.stubGlobal("fetch", jsonOk({ suggestions }));
    const res = await apiCrossMatch(["q1", "q2"]);
    expect(res).toEqual(suggestions);
  });

  it("maps each query to null on a non-OK response", async () => {
    vi.stubGlobal("fetch", status(500));
    const res = await apiCrossMatch(["a", "b", "c"]);
    expect(res).toEqual([null, null, null]);
  });

  it("maps each query to null when fetch throws", async () => {
    vi.stubGlobal("fetch", networkError());
    const res = await apiCrossMatch(["a", "b"]);
    expect(res).toEqual([null, null]);
  });
});

// ─── apiBomAnalyze ───────────────────────────────────────────────────────────

describe("apiBomAnalyze", () => {
  it("returns rows + compliance + tariff from the body on success", async () => {
    const body = {
      rows: [{ sku: "S1", qty: 2 }],
      compliance: { lines: 1, ulListed: 1 },
      tariff: { exposedLines: 1, totalDuty: 5 },
    };
    const fetchMock = jsonOk(body);
    vi.stubGlobal("fetch", fetchMock);

    const res = await apiBomAnalyze([{ sku: "S1", qty: 2 }], "br1");
    expect(res.rows).toEqual(body.rows);
    expect(res.compliance).toEqual(body.compliance);
    expect(res.tariff).toEqual(body.tariff);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      items: [{ sku: "S1", qty: 2 }],
      branchId: "br1",
    });
  });

  it("falls back to EMPTY compliance/tariff when the body omits them", async () => {
    vi.stubGlobal("fetch", jsonOk({ rows: [] }));
    const res = await apiBomAnalyze([]);
    expect(res.rows).toEqual([]);
    expect(res.compliance).toEqual({
      lines: 0,
      ulListed: 0,
      notUlListed: 0,
      rohsIssues: 0,
      prop65: 0,
      tariffExposed: 0,
      flagged: 0,
    });
    expect(res.tariff).toEqual({ exposedLines: 0, totalDuty: 0 });
  });

  it("returns the empty analysis on a non-OK response", async () => {
    vi.stubGlobal("fetch", status(500));
    const res = await apiBomAnalyze([{ sku: "S1", qty: 1 }]);
    expect(res.rows).toEqual([]);
    expect(res.tariff).toEqual({ exposedLines: 0, totalDuty: 0 });
  });

  it("returns the empty analysis when fetch throws", async () => {
    vi.stubGlobal("fetch", networkError());
    const res = await apiBomAnalyze([{ sku: "S1", qty: 1 }]);
    expect(res.rows).toEqual([]);
    expect(res.compliance.flagged).toBe(0);
  });
});

// ─── apiGoesWith ─────────────────────────────────────────────────────────────

describe("apiGoesWith", () => {
  it("returns items on success and encodes the id in the path", async () => {
    const items = [{ id: "g1" }];
    const fetchMock = jsonOk({ items });
    vi.stubGlobal("fetch", fetchMock);

    const res = await apiGoesWith("prod 7");
    expect(res).toEqual(items);
    const url = (fetchMock.mock.calls[0] as unknown as [string])[0];
    expect(url).toBe(`/api/products/${encodeURIComponent("prod 7")}/goeswith`);
  });

  it("returns [] on a non-OK response", async () => {
    vi.stubGlobal("fetch", status(404));
    await expect(apiGoesWith("p1")).resolves.toEqual([]);
  });
});

// ─── apiResolve ──────────────────────────────────────────────────────────────

describe("apiResolve", () => {
  it("returns the parsed resolution on success and encodes the query", async () => {
    const body = { product: { id: "p1" }, matchedVia: "sku" };
    const fetchMock = jsonOk(body);
    vi.stubGlobal("fetch", fetchMock);

    const res = await apiResolve("ABC 123");
    expect(res).toEqual(body);
    const url = (fetchMock.mock.calls[0] as unknown as [string])[0];
    expect(url).toContain("/api/products/resolve?q=");
    expect(url).toContain(encodeURIComponent("ABC 123"));
  });

  it("returns the null resolution on a non-OK response", async () => {
    vi.stubGlobal("fetch", status(404));
    await expect(apiResolve("x")).resolves.toEqual({ product: null, matchedVia: null });
  });

  it("returns the null resolution when fetch throws", async () => {
    vi.stubGlobal("fetch", networkError());
    await expect(apiResolve("x")).resolves.toEqual({ product: null, matchedVia: null });
  });
});
