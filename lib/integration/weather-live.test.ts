import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assessInstallRisk,
  forecastToOutlook,
  getJobsiteWeather,
  parseWindMph,
  weatherConfigured,
  type NwsForecast,
} from "@/lib/integration/weather-live";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("weatherConfigured", () => {
  it("is false when WEATHER_CONTACT is blank, true once set", () => {
    vi.stubEnv("WEATHER_CONTACT", "  ");
    expect(weatherConfigured()).toBe(false);
    vi.stubEnv("WEATHER_CONTACT", "ops@example.com");
    expect(weatherConfigured()).toBe(true);
  });
});

describe("parseWindMph", () => {
  it("takes the max number from a range or single value", () => {
    expect(parseWindMph("5 to 10 mph")).toBe(10);
    expect(parseWindMph("15 mph")).toBe(15);
    expect(parseWindMph("Calm")).toBeNull();
    expect(parseWindMph(undefined)).toBeNull();
  });
});

describe("assessInstallRisk (pure)", () => {
  it("returns ok with no flags for benign weather", () => {
    const a = assessInstallRisk({
      name: "Today",
      temperature: 68,
      probabilityOfPrecipitation: { value: 10 },
      windSpeed: "5 mph",
      shortForecast: "Sunny",
    });
    expect(a.risk).toBe("ok");
    expect(a.flags).toEqual([]);
    expect(a.windMph).toBe(5);
  });

  it("flags rain + freezing + high wind as caution", () => {
    const a = assessInstallRisk({
      temperature: 30,
      probabilityOfPrecipitation: { value: 65 },
      windSpeed: "20 to 28 mph",
      shortForecast: "Rain and snow",
    });
    expect(a.risk).toBe("caution");
    expect(a.flags).toHaveLength(3); // rain, freezing, wind
  });

  it("escalates storms to hold regardless of other values", () => {
    const a = assessInstallRisk({ shortForecast: "Scattered Thunderstorms", probabilityOfPrecipitation: { value: 40 } });
    expect(a.risk).toBe("hold");
    expect(a.flags.some((f) => /Storms/.test(f))).toBe(true);
  });

  it("escalates very high precip or wind to hold", () => {
    expect(assessInstallRisk({ probabilityOfPrecipitation: { value: 85 }, shortForecast: "Rain" }).risk).toBe("hold");
    expect(assessInstallRisk({ windSpeed: "40 mph", shortForecast: "Windy" }).risk).toBe("hold");
  });

  it("nulls missing temperature/precip without throwing", () => {
    const a = assessInstallRisk({ shortForecast: "Cloudy" });
    expect(a.tempF).toBeNull();
    expect(a.precipPct).toBeNull();
    expect(a.risk).toBe("ok");
  });
});

describe("forecastToOutlook (pure)", () => {
  const FORECAST: NwsForecast = {
    properties: {
      periods: [
        { name: "Today", temperature: 70, probabilityOfPrecipitation: { value: 10 }, windSpeed: "5 mph", shortForecast: "Sunny" },
        { name: "Tonight", temperature: 28, probabilityOfPrecipitation: { value: 20 }, windSpeed: "10 mph", shortForecast: "Clear" },
        { name: "Tuesday", temperature: 55, probabilityOfPrecipitation: { value: 90 }, windSpeed: "12 mph", shortForecast: "Thunderstorms" },
        { name: "Wed", temperature: 60, probabilityOfPrecipitation: { value: 15 }, windSpeed: "8 mph", shortForecast: "Cloudy" },
        { name: "Thu", temperature: 62, probabilityOfPrecipitation: { value: 5 }, windSpeed: "6 mph", shortForecast: "Sunny" },
      ],
    },
  };

  it("assesses up to `limit` periods and reports the worst risk", () => {
    const outlook = forecastToOutlook(FORECAST, 4);
    expect(outlook.periods).toHaveLength(4);
    expect(outlook.worst).toBe("hold"); // Tuesday storms
  });

  it("returns ok worst for a calm window", () => {
    const outlook = forecastToOutlook({ properties: { periods: [FORECAST.properties!.periods![0]] } });
    expect(outlook.worst).toBe("ok");
  });

  it("handles an empty forecast", () => {
    expect(forecastToOutlook({})).toEqual({ periods: [], worst: "ok" });
  });
});

describe("getJobsiteWeather (dormant gate + 2-step)", () => {
  it("returns {no-keys} and never fetches when no contact is set", async () => {
    vi.stubEnv("WEATHER_CONTACT", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(await getJobsiteWeather(40, -75)).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled(); // ← zero network until enabled
  });

  it("resolves points→forecast and returns an outlook when enabled", async () => {
    vi.stubEnv("WEATHER_CONTACT", "ops@example.com");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ properties: { forecast: "https://api.weather.gov/gridpoints/X/1,2/forecast" } }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ properties: { periods: [{ name: "Today", temperature: 70, probabilityOfPrecipitation: { value: 10 }, windSpeed: "5 mph", shortForecast: "Sunny" }] } }),
          { status: 200 },
        ),
      );
    const result = await getJobsiteWeather(40, -75);
    expect(result.enabled).toBe(true);
    if (result.enabled) expect(result.outlook.periods).toHaveLength(1);
    // sends an identifying User-Agent (NWS requirement)
    expect((fetchSpy.mock.calls[0][1]?.headers as Record<string, string>)["User-Agent"]).toContain("ops@example.com");
  });

  it("maps a 404 from points to out-of-area (non-US coordinate)", async () => {
    vi.stubEnv("WEATHER_CONTACT", "ops@example.com");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("not found", { status: 404 }));
    expect(await getJobsiteWeather(51.5, -0.12)).toEqual({ enabled: false, reason: "out-of-area" });
  });

  it("fails closed when the forecast fetch throws", async () => {
    vi.stubEnv("WEATHER_CONTACT", "ops@example.com");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("down"));
    expect(await getJobsiteWeather(40, -75)).toEqual({ enabled: false, reason: "fetch-failed" });
  });
});
