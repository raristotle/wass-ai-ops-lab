import { describe, it, expect, afterEach, vi } from "vitest";
import {
  blsSeriesToTrend,
  parseBlsResponse,
  getPpiTrends,
  BLS_API_URL,
  PPI_SERIES,
} from "@/lib/integration/bls-ppi-live";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.BLS_API_KEY;
});

/** A REQUEST_SUCCEEDED body covering all three series, newest-first data. */
function successBody() {
  return {
    status: "REQUEST_SUCCEEDED",
    Results: {
      series: [
        {
          seriesID: "WPU117",
          data: [
            { year: "2026", period: "M05", value: "210.0" },
            { year: "2026", period: "M04", value: "200.0" },
          ],
        },
        {
          seriesID: "WPU1175",
          data: [
            { year: "2026", period: "M05", value: "145.0" },
            { year: "2026", period: "M04", value: "150.0" },
          ],
        },
        {
          seriesID: "WPU1178",
          data: [
            { year: "2026", period: "M05", value: "120.5" },
            { year: "2026", period: "M04", value: "120.4" },
          ],
        },
      ],
    },
  };
}

describe("blsSeriesToTrend — uncovered pure branches", () => {
  const meta = { id: "switchgear", seriesId: "WPU1175", label: "Switchgear" };

  it("flags a down trend when the latest month dropped", () => {
    const t = blsSeriesToTrend(meta, [
      { year: "2026", period: "M05", value: "140.0" },
      { year: "2026", period: "M04", value: "150.0" },
    ]);
    expect(t).not.toBeNull();
    expect(t!.trend).toBe("down");
    expect(t!.changeMoM).toBeCloseTo(-6.7, 1);
  });

  it("uses latest as its own prior when only one point exists (changeMoM 0, flat)", () => {
    const t = blsSeriesToTrend(meta, [{ year: "2026", period: "M05", value: "146.0" }]);
    expect(t).not.toBeNull();
    expect(t!.index).toBe(146);
    expect(t!.changeMoM).toBe(0);
    expect(t!.trend).toBe("flat");
    expect(t!.asOf).toBe("2026-M05");
  });

  it("returns changeMoM 0 when the prior value is non-positive (zero-divide guard)", () => {
    const t = blsSeriesToTrend(meta, [
      { year: "2026", period: "M05", value: "5" },
      { year: "2026", period: "M04", value: "0" },
    ]);
    expect(t).not.toBeNull();
    expect(t!.changeMoM).toBe(0);
    expect(t!.trend).toBe("flat");
  });

  it("skips NaN/non-finite observations but keeps the finite ones", () => {
    const t = blsSeriesToTrend(meta, [
      { year: "2026", period: "M05", value: "abc" },
      { year: "2026", period: "M04", value: "100" },
      { year: "2026", period: "M03", value: "98" },
    ]);
    expect(t).not.toBeNull();
    // first finite point becomes "latest"
    expect(t!.index).toBe(100);
    expect(t!.asOf).toBe("2026-M04");
  });

  it("requires both year and period to keep a point", () => {
    expect(
      blsSeriesToTrend(meta, [{ period: "M05", value: "100" }]),
    ).toBeNull();
    expect(
      blsSeriesToTrend(meta, [{ year: "2026", value: "100" }]),
    ).toBeNull();
  });
});

describe("parseBlsResponse — additional shapes", () => {
  it("skips a series whose data has no usable points", () => {
    const json = {
      Results: {
        series: [
          { seriesID: "WPU117", data: [{ year: "2026", period: "M13", value: "999" }] },
          { seriesID: "WPU1175", data: [{ year: "2026", period: "M05", value: "150" }] },
        ],
      },
    };
    const out = parseBlsResponse(json);
    // WPU117 only had an annual-average point → dropped; WPU1175 kept.
    expect(out.map((t) => t.seriesId)).toEqual(["WPU1175"]);
  });

  it("defaults missing data[] to [] (series present, no data key)", () => {
    const json = { Results: { series: [{ seriesID: "WPU117" }] } };
    expect(parseBlsResponse(json)).toEqual([]);
  });

  it("returns [] when Results.series is missing entirely", () => {
    expect(parseBlsResponse({ Results: {} })).toEqual([]);
    expect(parseBlsResponse(null)).toEqual([]);
    expect(parseBlsResponse(undefined)).toEqual([]);
  });
});

describe("getPpiTrends — dormant gate", () => {
  it("returns {enabled:false, reason:'no-keys'} and does NO network when the key is unset", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = await getPpiTrends(2026);
    expect(res).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("treats a whitespace-only key as unset (env() trims)", async () => {
    process.env.BLS_API_KEY = "   ";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = await getPpiTrends(2026);
    expect(res).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("getPpiTrends — live path (mocked fetch)", () => {
  it("parses a REQUEST_SUCCEEDED body into trends and reports fetchedAt", async () => {
    process.env.BLS_API_KEY = "free-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(successBody()), { status: 200 })),
    );
    const res = await getPpiTrends(2026);
    expect(res.enabled).toBe(true);
    if (!res.enabled) throw new Error("expected enabled");
    expect(res.source).toBe("BLS PPI");
    expect(res.trends).toHaveLength(3);
    expect(typeof res.fetchedAt).toBe("string");
    expect(Number.isNaN(Date.parse(res.fetchedAt))).toBe(false);
    const switchgear = res.trends.find((t) => t.seriesId === "WPU1175");
    expect(switchgear!.trend).toBe("down"); // 150 → 145
  });

  it("POSTs the configured series + the current and prior year and the key", async () => {
    process.env.BLS_API_KEY = "free-key";
    const fetchSpy = vi.fn(
      async () => new Response(JSON.stringify(successBody()), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    await getPpiTrends(2026);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(BLS_API_URL);
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.registrationkey).toBe("free-key");
    expect(body.startyear).toBe("2025");
    expect(body.endyear).toBe("2026");
    expect(body.seriesid).toEqual(PPI_SERIES.map((s) => s.seriesId));
  });

  it("fails closed with reason:'fetch-failed' on a non-OK HTTP response", async () => {
    process.env.BLS_API_KEY = "free-key";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));
    const res = await getPpiTrends(2026);
    expect(res).toEqual({ enabled: false, reason: "fetch-failed" });
    expect(errSpy).toHaveBeenCalled(); // logApiError emitted
  });

  it("fails closed when the body status is not REQUEST_SUCCEEDED", async () => {
    process.env.BLS_API_KEY = "free-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ status: "REQUEST_NOT_PROCESSED" }), { status: 200 }),
      ),
    );
    const res = await getPpiTrends(2026);
    expect(res).toEqual({ enabled: false, reason: "fetch-failed" });
  });

  it("fails closed when the JSON body is unparseable", async () => {
    process.env.BLS_API_KEY = "free-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not json", { status: 200 })),
    );
    const res = await getPpiTrends(2026);
    expect(res).toEqual({ enabled: false, reason: "fetch-failed" });
  });

  it("returns reason:'no-data' when REQUEST_SUCCEEDED carries no usable series", async () => {
    process.env.BLS_API_KEY = "free-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ status: "REQUEST_SUCCEEDED", Results: { series: [] } }),
            { status: 200 },
          ),
      ),
    );
    const res = await getPpiTrends(2026);
    expect(res).toEqual({ enabled: false, reason: "no-data" });
  });

  it("fails closed with reason:'fetch-failed' when fetch itself throws (network/timeout)", async () => {
    process.env.BLS_API_KEY = "free-key";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("net");
      }),
    );
    const res = await getPpiTrends(2026);
    expect(res).toEqual({ enabled: false, reason: "fetch-failed" });
    expect(errSpy).toHaveBeenCalled();
  });
});
