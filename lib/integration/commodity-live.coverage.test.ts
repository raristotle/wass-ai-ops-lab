import { describe, it, expect, afterEach, vi } from "vitest";
import { commodityConfigured, getLiveCommodityIndex } from "@/lib/integration/commodity-live";

const GATE = "FRED_API_KEY";

/** A FRED series/observations body (newest-first, USD/metric ton). */
function fredBody(observations: Array<{ date: string; value: string }>) {
  return { observations };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env[GATE];
});

describe("commodityConfigured (dormancy gate)", () => {
  it("is false when the key is unset", () => {
    delete process.env[GATE];
    expect(commodityConfigured()).toBe(false);
  });

  it("is false when the key is only whitespace", () => {
    process.env[GATE] = "   ";
    expect(commodityConfigured()).toBe(false);
  });

  it("is true when a real key is set", () => {
    process.env[GATE] = "abc123";
    expect(commodityConfigured()).toBe(true);
  });
});

describe("getLiveCommodityIndex — dormant branch", () => {
  it("is dormant and makes NO network call when the key is unset", async () => {
    delete process.env[GATE];
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse(fredBody([])));
    vi.stubGlobal("fetch", fetchSpy);

    expect(await getLiveCommodityIndex()).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("is dormant when the key is only whitespace (trimmed to empty)", async () => {
    process.env[GATE] = "   ";
    const fetchSpy = vi.fn(async (): Promise<Response> => jsonResponse(fredBody([])));
    vi.stubGlobal("fetch", fetchSpy);

    expect(await getLiveCommodityIndex()).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("getLiveCommodityIndex — success path", () => {
  it("fetches both series, builds quotes, and hits the documented FRED URL/params", async () => {
    process.env[GATE] = "secret key/with+chars";
    const urls: string[] = [];
    const fetchSpy = vi.fn(async (url: string): Promise<Response> => {
      urls.push(url);
      if (url.includes("PCOPPUSDM")) {
        return jsonResponse(
          fredBody([
            { date: "2026-05-01", value: "9200" },
            { date: "2026-04-01", value: "9000" },
          ]),
        );
      }
      // aluminum (PALUMUSDM)
      return jsonResponse(
        fredBody([
          { date: "2026-05-01", value: "2900" },
          { date: "2026-04-01", value: "2850" },
        ]),
      );
    });
    vi.stubGlobal("fetch", fetchSpy);

    const r = await getLiveCommodityIndex();
    expect(r.enabled).toBe(true);
    if (!r.enabled) throw new Error("expected enabled result");
    expect(r.source).toBe("FRED (Federal Reserve Economic Data)");
    expect(r.quotes).toHaveLength(2);

    const copper = r.quotes.find((q) => q.id === "copper");
    const aluminum = r.quotes.find((q) => q.id === "aluminum");
    expect(copper).toBeDefined();
    expect(aluminum).toBeDefined();
    expect(copper!.label).toBe("Copper");
    expect(copper!.unit).toBe("$/lb");
    expect(copper!.price).toBeCloseTo(9200 / 2204.62, 2);
    expect(copper!.asOf).toBe("2026-05-01");
    expect(copper!.trend).toBe("up");

    // fetchedAt is a valid ISO timestamp.
    expect(typeof r.fetchedAt).toBe("string");
    expect(Number.isNaN(Date.parse(r.fetchedAt))).toBe(false);

    // One call per series, with the right query params + URL-encoded key.
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(urls.some((u) => u.includes("series_id=PCOPPUSDM"))).toBe(true);
    expect(urls.some((u) => u.includes("series_id=PALUMUSDM"))).toBe(true);
    for (const u of urls) {
      expect(u).toContain("https://api.stlouisfed.org/fred/series/observations?");
      expect(u).toContain("file_type=json");
      expect(u).toContain("sort_order=desc");
      expect(u).toContain("limit=2");
      // Key is URL-encoded — the raw "/" and "+" must not appear verbatim.
      expect(u).toContain(`api_key=${encodeURIComponent("secret key/with+chars")}`);
    }
  });

  it("treats a zero-valued prior as 0% change (no divide-by-zero) via the live path", async () => {
    process.env[GATE] = "k";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string): Promise<Response> => {
        if (url.includes("PCOPPUSDM")) {
          // prior value "0" → (latest-0)/0 guarded by `prior > 0 ? ... : 0`.
          return jsonResponse(
            fredBody([
              { date: "2026-05-01", value: "9200" },
              { date: "2026-04-01", value: "0" },
            ]),
          );
        }
        return jsonResponse(fredBody([{ date: "2026-05-01", value: "." }]));
      }),
    );

    const r = await getLiveCommodityIndex();
    expect(r.enabled).toBe(true);
    if (!r.enabled) throw new Error("expected enabled result");
    const copper = r.quotes.find((q) => q.id === "copper");
    expect(copper).toBeDefined();
    expect(copper!.change30d).toBe(0);
    expect(copper!.trend).toBe("flat");
  });

  it("keeps a partial result when only one series returns usable data", async () => {
    process.env[GATE] = "k";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string): Promise<Response> => {
        if (url.includes("PCOPPUSDM")) {
          return jsonResponse(fredBody([{ date: "2026-05-01", value: "9200" }]));
        }
        // aluminum: all missing markers → fredToQuote returns null → dropped.
        return jsonResponse(fredBody([{ date: "2026-05-01", value: "." }]));
      }),
    );

    const r = await getLiveCommodityIndex();
    expect(r.enabled).toBe(true);
    if (!r.enabled) throw new Error("expected enabled result");
    expect(r.quotes).toHaveLength(1);
    expect(r.quotes[0].id).toBe("copper");
  });
});

describe("getLiveCommodityIndex — fail-closed branches", () => {
  it("fails closed (no-keys) when BOTH series return a non-OK response", async () => {
    process.env[GATE] = "k";
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => jsonResponse("", 500)));

    expect(await getLiveCommodityIndex()).toEqual({ enabled: false, reason: "no-keys" });
  });

  it("fails closed (no-keys) when fetch itself rejects (network/timeout) for both series", async () => {
    process.env[GATE] = "k";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => {
        throw new Error("net down");
      }),
    );

    expect(await getLiveCommodityIndex()).toEqual({ enabled: false, reason: "no-keys" });
  });

  it("fails closed (no-keys) when the body has no observations array at all", async () => {
    process.env[GATE] = "k";
    // 200 OK but { } → json.observations is undefined → ?? [] → null quote → dropped.
    vi.stubGlobal("fetch", vi.fn(async (): Promise<Response> => jsonResponse({})));

    expect(await getLiveCommodityIndex()).toEqual({ enabled: false, reason: "no-keys" });
  });

  it("fails closed (no-keys) when every observation is a FRED missing-value marker", async () => {
    process.env[GATE] = "k";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (): Promise<Response> => jsonResponse(fredBody([{ date: "2026-05-01", value: "." }]))),
    );

    expect(await getLiveCommodityIndex()).toEqual({ enabled: false, reason: "no-keys" });
  });
});
