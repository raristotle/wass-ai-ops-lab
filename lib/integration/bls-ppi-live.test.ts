import { describe, it, expect, afterEach } from "vitest";
import {
  blsPpiConfigured,
  blsSeriesToTrend,
  parseBlsResponse,
  PPI_SERIES,
} from "@/lib/integration/bls-ppi-live";

afterEach(() => {
  delete process.env.BLS_API_KEY;
});

describe("bls-ppi dormancy", () => {
  it("is dormant without BLS_API_KEY", () => {
    expect(blsPpiConfigured()).toBe(false);
  });
  it("activates once the key is set", () => {
    process.env.BLS_API_KEY = "k";
    expect(blsPpiConfigured()).toBe(true);
  });
});

describe("blsSeriesToTrend", () => {
  const meta = { id: "switchgear", seriesId: "WPU1175", label: "Switchgear" };
  it("computes month-over-month change from newest-first data", () => {
    const t = blsSeriesToTrend(meta, [
      { year: "2025", period: "M12", value: "146.0" },
      { year: "2025", period: "M11", value: "145.0" },
    ]);
    expect(t).not.toBeNull();
    expect(t!.index).toBe(146);
    expect(t!.changeMoM).toBeCloseTo(0.7, 1);
    expect(t!.trend).toBe("flat"); // |0.7| < FLAT_BAND_PCT(0.75)
    expect(t!.asOf).toBe("2025-M12");
  });
  it("flags an up trend for a larger move", () => {
    const t = blsSeriesToTrend(meta, [
      { year: "2025", period: "M12", value: "150.0" },
      { year: "2025", period: "M11", value: "145.0" },
    ]);
    expect(t!.trend).toBe("up");
  });
  it("skips the M13 annual-average period", () => {
    const t = blsSeriesToTrend(meta, [
      { year: "2025", period: "M13", value: "999" },
      { year: "2025", period: "M12", value: "146.0" },
      { year: "2025", period: "M11", value: "145.0" },
    ]);
    expect(t!.index).toBe(146); // M13 ignored
  });
  it("returns null when no numeric points", () => {
    expect(blsSeriesToTrend(meta, [{ year: "2025", period: "M12", value: "-" }])).toBeNull();
    expect(blsSeriesToTrend(meta, [])).toBeNull();
  });
});

describe("parseBlsResponse", () => {
  it("matches series by seriesID regardless of response order", () => {
    const json = {
      Results: {
        series: [
          { seriesID: "WPU1178", data: [{ year: "2025", period: "M12", value: "120" }] },
          { seriesID: "WPU117", data: [{ year: "2025", period: "M12", value: "200" }] },
        ],
      },
    };
    const out = parseBlsResponse(json);
    // PPI_SERIES order is electrical-equipment(WPU117), switchgear(WPU1175), lighting(WPU1178)
    expect(out.map((t) => t.seriesId)).toEqual(["WPU117", "WPU1178"]); // WPU1175 absent → skipped
    expect(PPI_SERIES.some((s) => s.seriesId === "WPU1175")).toBe(true);
  });
  it("returns [] for a malformed response", () => {
    expect(parseBlsResponse({})).toEqual([]);
  });
});
