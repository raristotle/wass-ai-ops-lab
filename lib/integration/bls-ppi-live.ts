/**
 * BLS Producer Price Index (PPI) live feed (REAL) — env-gated DORMANT, $0 (DI-11).
 *
 * Complements the shipped FRED metals strip (commodity-live.ts) with US Bureau of
 * Labor Statistics PRODUCER price trends for the categories an electrical
 * distributor actually quotes — electrical equipment, switchgear/controls, and
 * lighting fixtures — so the commodity strip can show "switchgear PPI +2.1% MoM"
 * alongside copper/aluminum spot.
 *
 * BLS Public Data API v2 is FREE. Keyless works (~25 queries/day); a free
 * registration key lifts it to 500/day + change calcs. We gate on BLS_API_KEY so
 * the seam is dormant (zero network) until the free key is set, and the key also
 * unlocks the higher quota. Data is US-Government public domain.
 *
 *   BLS_API_KEY — the free v2 registration key (also the dormancy switch).
 *
 * The JSON→trend transform is pure + unit-tested; only the thin POST touches the
 * network and fails closed to {enabled:false}. Server-only.
 */

import { logApiError } from "@/lib/server/log";
import type { CommodityTrend } from "@/lib/product-finder-commodity";
import { FLAT_BAND_PCT } from "@/lib/product-finder-commodity";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

export const BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

/**
 * Electrical-relevant PPI commodity series, verified live (REQUEST_SUCCEEDED with
 * current data). "wpu" = not seasonally adjusted. Re-check the wire/cable detail
 * codes against the official PPI series-ID list before adding more.
 */
export const PPI_SERIES: { id: string; seriesId: string; label: string }[] = [
  { id: "electrical-equipment", seriesId: "WPU117", label: "Electrical machinery & equipment" },
  { id: "switchgear", seriesId: "WPU1175", label: "Switchgear & industrial controls" },
  { id: "lighting", seriesId: "WPU1178", label: "Lighting fixtures & equipment" },
];

/** True only when the free BLS_API_KEY is set. Single source of dormancy. */
export function blsPpiConfigured(): boolean {
  return Boolean(env("BLS_API_KEY"));
}

export interface PpiPoint {
  year: string;
  /** "M01".."M12" (monthly); "M13" = annual average. */
  period: string;
  value: number;
}

export interface PpiTrend {
  id: string;
  seriesId: string;
  label: string;
  /** Most-recent index value. */
  index: number;
  /** Percent change vs the prior month. */
  changeMoM: number;
  trend: CommodityTrend;
  /** "2025-M12" — the period the index reflects. */
  asOf: string;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Pure: turn one BLS series' `data[]` (the API returns it newest-first) into a
 * month-over-month trend. Returns null if there aren't ≥1 numeric observations.
 * `value` arrives as a string and must be parsed.
 */
export function blsSeriesToTrend(
  meta: { id: string; seriesId: string; label: string },
  data: { year?: string; period?: string; value?: string }[],
): PpiTrend | null {
  const points: PpiPoint[] = [];
  for (const d of data) {
    const v = Number(d.value);
    // PPI has only monthly periods M01-M12 plus M13 (annual avg); skip the annual
    // average so a month-over-month change compares two actual months.
    if (Number.isFinite(v) && d.year && d.period && d.period !== "M13") {
      points.push({ year: d.year, period: d.period, value: v });
    }
  }
  if (points.length === 0) return null;
  const latest = points[0];
  const prior = points.length > 1 ? points[1] : latest;
  const changeMoM = prior.value > 0 ? round1(((latest.value - prior.value) / prior.value) * 100) : 0;
  const trend: CommodityTrend =
    Math.abs(changeMoM) < FLAT_BAND_PCT ? "flat" : changeMoM > 0 ? "up" : "down";
  return {
    id: meta.id,
    seriesId: meta.seriesId,
    label: meta.label,
    index: latest.value,
    changeMoM,
    trend,
    asOf: `${latest.year}-${latest.period}`,
  };
}

/** Pure: map a full BLS API response to the trend list (order-independent: matches by seriesID). */
export function parseBlsResponse(json: unknown): PpiTrend[] {
  const series = ((json as { Results?: { series?: unknown } })?.Results?.series ?? []) as {
    seriesID?: string;
    data?: { year?: string; period?: string; value?: string }[];
  }[];
  const byId = new Map(series.map((s) => [s.seriesID, s.data ?? []]));
  const out: PpiTrend[] = [];
  for (const meta of PPI_SERIES) {
    const data = byId.get(meta.seriesId);
    if (!data) continue;
    const trend = blsSeriesToTrend(meta, data);
    if (trend) out.push(trend);
  }
  return out;
}

export type BlsPpiResult =
  | { enabled: true; source: "BLS PPI"; trends: PpiTrend[]; fetchedAt: string }
  | { enabled: false; reason: "no-keys" | "fetch-failed" | "no-data" };

/**
 * Live PPI trends for the electrical categories, or {enabled:false} when dormant /
 * on error. Requests the current + prior year so a month-over-month change exists.
 */
export async function getPpiTrends(currentYear: number): Promise<BlsPpiResult> {
  const key = env("BLS_API_KEY");
  if (!key) return { enabled: false, reason: "no-keys" }; // ← dormant: no key ⇒ no network
  try {
    const res = await fetch(BLS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seriesid: PPI_SERIES.map((s) => s.seriesId),
        startyear: String(currentYear - 1),
        endyear: String(currentYear),
        registrationkey: key,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      logApiError("bls-ppi", new Error(`BLS HTTP ${res.status}`));
      return { enabled: false, reason: "fetch-failed" };
    }
    const json = (await res.json().catch(() => null)) as { status?: string } | null;
    if (!json || json.status !== "REQUEST_SUCCEEDED") {
      return { enabled: false, reason: "fetch-failed" };
    }
    const trends = parseBlsResponse(json);
    if (trends.length === 0) return { enabled: false, reason: "no-data" };
    return { enabled: true, source: "BLS PPI", trends, fetchedAt: new Date().toISOString() };
  } catch (e) {
    logApiError("bls-ppi", e);
    return { enabled: false, reason: "fetch-failed" };
  }
}
