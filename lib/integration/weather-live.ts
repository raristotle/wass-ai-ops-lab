/**
 * NWS (National Weather Service) jobsite-weather adapter (REAL) — env-gated
 * DORMANT, $0 until enabled. NWS api.weather.gov is free and key-less, BUT it
 * requires a User-Agent that identifies the app with a contact, and our standing
 * rule is zero network until explicitly enabled — so we gate on WEATHER_CONTACT,
 * which is both the dormancy switch AND the NWS-required identity. Two-step
 * lookup (points → forecast). The forecast→install-risk transform is pure +
 * unit-tested; install-risk flags are tuned for electrical field work (terminations,
 * PVC cement torque spec, aerial/lift limits, storm holds).
 *
 *   WEATHER_CONTACT — e.g. "ops@example.com" or a URL. The gate + NWS identity.
 */

import { logApiError } from "@/lib/server/log";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** True only when a WEATHER_CONTACT is set. Single source of dormancy. */
export function weatherConfigured(): boolean {
  return Boolean(env("WEATHER_CONTACT"));
}

// ── NWS forecast shape (only the fields we read; defensive) ──
export interface NwsPeriod {
  name?: string;
  startTime?: string;
  isDaytime?: boolean;
  temperature?: number;
  temperatureUnit?: string;
  probabilityOfPrecipitation?: { value?: number | null };
  windSpeed?: string;
  shortForecast?: string;
}
export interface NwsForecast {
  properties?: { periods?: NwsPeriod[] };
}

export type InstallRiskLevel = "ok" | "caution" | "hold";

export interface AssessedPeriod {
  name: string;
  startTime: string | null;
  tempF: number | null;
  precipPct: number | null;
  windMph: number | null;
  shortForecast: string | null;
  risk: InstallRiskLevel;
  flags: string[];
}

/** Parse an NWS wind string ("5 to 10 mph", "15 mph") to its max mph, or null. */
export function parseWindMph(windSpeed: string | undefined): number | null {
  if (!windSpeed) return null;
  const nums = windSpeed.match(/\d+/g);
  if (!nums || nums.length === 0) return null;
  return Math.max(...nums.map(Number));
}

/**
 * Pure: assess electrical-install risk for one forecast period. Flags are field-
 * crew-oriented; level escalates ok → caution → hold as conditions worsen.
 */
export function assessInstallRisk(period: NwsPeriod): AssessedPeriod {
  const tempF = typeof period.temperature === "number" ? period.temperature : null;
  const precipPct =
    typeof period.probabilityOfPrecipitation?.value === "number"
      ? period.probabilityOfPrecipitation.value
      : null;
  const windMph = parseWindMph(period.windSpeed);
  const short = period.shortForecast ?? "";
  const storms = /thunder|storm/i.test(short);

  const flags: string[] = [];
  if (precipPct != null && precipPct >= 60) flags.push("Rain likely — protect terminations & open conduit");
  if (tempF != null && tempF <= 32) flags.push("Freezing — PVC cement & torque specs out of range");
  if (windMph != null && windMph >= 25) flags.push("High wind — limit aerial/lift work");
  if (storms) flags.push("Storms forecast — pause outdoor energized work");

  let risk: InstallRiskLevel = "ok";
  const hold = storms || (precipPct != null && precipPct >= 80) || (windMph != null && windMph >= 35);
  if (hold) risk = "hold";
  else if (flags.length > 0) risk = "caution";

  return {
    name: period.name ?? "",
    startTime: period.startTime ?? null,
    tempF,
    precipPct,
    windMph,
    shortForecast: period.shortForecast ?? null,
    risk,
    flags,
  };
}

export interface WeatherOutlook {
  periods: AssessedPeriod[];
  /** Worst risk across the returned periods — drives the badge color. */
  worst: InstallRiskLevel;
}

const RISK_ORDER: Record<InstallRiskLevel, number> = { ok: 0, caution: 1, hold: 2 };

/** Pure: NWS forecast JSON → assessed outlook (first `limit` periods + worst risk). */
export function forecastToOutlook(forecast: NwsForecast, limit = 4): WeatherOutlook {
  const periods = (forecast.properties?.periods ?? []).slice(0, limit).map(assessInstallRisk);
  const worst = periods.reduce<InstallRiskLevel>(
    (acc, p) => (RISK_ORDER[p.risk] > RISK_ORDER[acc] ? p.risk : acc),
    "ok",
  );
  return { periods, worst };
}

export type WeatherResult =
  | { enabled: true; source: "NWS"; outlook: WeatherOutlook; fetchedAt: string }
  | { enabled: false; reason: "no-keys" | "fetch-failed" | "no-data" | "out-of-area" };

function userAgent(contact: string): string {
  return `meridian-product-finder (${contact})`;
}

/**
 * Jobsite weather outlook for a coordinate via NWS. Returns {enabled:false} when
 * dormant (no contact), out of NWS coverage (US only), or on any fetch error —
 * callers hide the badge and never see a throw.
 */
export async function getJobsiteWeather(lat: number, lng: number): Promise<WeatherResult> {
  const contact = env("WEATHER_CONTACT");
  if (!contact) return { enabled: false, reason: "no-keys" }; // ← dormant: zero network until set

  const headers = { Accept: "application/geo+json", "User-Agent": userAgent(contact) };
  try {
    // Step 1: resolve the gridpoint forecast URL for this coordinate.
    const pointsRes = await fetch(`https://api.weather.gov/points/${lat},${lng}`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    if (pointsRes.status === 404) return { enabled: false, reason: "out-of-area" }; // outside US grid
    if (!pointsRes.ok) {
      logApiError("weather:points", new Error(`NWS points HTTP ${pointsRes.status}`));
      return { enabled: false, reason: "fetch-failed" };
    }
    const points = (await pointsRes.json().catch(() => ({}))) as { properties?: { forecast?: string } };
    const forecastUrl = points.properties?.forecast;
    if (!forecastUrl) return { enabled: false, reason: "no-data" };

    // Step 2: fetch the forecast periods.
    const fcRes = await fetch(forecastUrl, { headers, signal: AbortSignal.timeout(10_000) });
    if (!fcRes.ok) {
      logApiError("weather:forecast", new Error(`NWS forecast HTTP ${fcRes.status}`));
      return { enabled: false, reason: "fetch-failed" };
    }
    const forecast = (await fcRes.json().catch(() => ({}))) as NwsForecast;
    const outlook = forecastToOutlook(forecast);
    if (outlook.periods.length === 0) return { enabled: false, reason: "no-data" };
    return { enabled: true, source: "NWS", outlook, fetchedAt: new Date().toISOString() };
  } catch (e) {
    logApiError("weather:forecast", e);
    return { enabled: false, reason: "fetch-failed" };
  }
}
