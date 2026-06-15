/**
 * Live commodity index (REAL) — upgrades the simulated metals strip to real
 * copper/aluminum prices from FRED (Federal Reserve Economic Data), env-gated
 * exactly like the Mouser/Digi-Key distributor seam: real data only when
 * FRED_API_KEY is set, otherwise the caller falls back to the deterministic
 * simulation. Fetched per request, never stored. Zero cost until a key is added
 * (FRED is free).
 *
 * FRED carries monthly global metal prices in USD per metric ton
 * (PCOPPUSDM, PALUMUSDM); we convert to $/lb and compute the change vs the prior
 * observation. The JSON→quote step (`fredToQuote`) is pure and unit-tested; only
 * the thin fetch wrapper touches the network.
 */

import { FLAT_BAND_PCT, type CommodityTrend } from "@/lib/product-finder-commodity";

const LB_PER_METRIC_TON = 2204.62;

export interface LiveCommodityQuote {
  id: string;
  label: string;
  unit: string;
  price: number;
  change30d: number;
  trend: CommodityTrend;
  /** Observation date the price reflects (e.g. "2026-05-01"). */
  asOf: string;
}

interface SeriesMeta {
  id: string;
  label: string;
  seriesId: string;
}

const SERIES: SeriesMeta[] = [
  { id: "copper", label: "Copper", seriesId: "PCOPPUSDM" },
  { id: "aluminum", label: "Aluminum", seriesId: "PALUMUSDM" },
];

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** True when the live feed is configured (free FRED key present). */
export function commodityConfigured(): boolean {
  return Boolean(env("FRED_API_KEY"));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export interface FredObservation {
  date: string;
  value: string;
}

/**
 * Pure: turn FRED observations (sorted newest-first, USD/metric ton) into a
 * $/lb quote with the change vs the prior observation. Returns null if no usable
 * numeric observation exists (FRED uses "." for missing values).
 */
export function fredToQuote(observations: FredObservation[], meta: { id: string; label: string }): LiveCommodityQuote | null {
  const valid = observations.filter((o) => o.value !== "." && Number.isFinite(Number(o.value)));
  if (valid.length === 0) return null;
  const latest = Number(valid[0].value) / LB_PER_METRIC_TON;
  const prior = valid.length > 1 ? Number(valid[1].value) / LB_PER_METRIC_TON : latest;
  const change30d = prior > 0 ? round1(((latest - prior) / prior) * 100) : 0;
  const trend: CommodityTrend =
    Math.abs(change30d) < FLAT_BAND_PCT ? "flat" : change30d > 0 ? "up" : "down";
  return {
    id: meta.id,
    label: meta.label,
    unit: "$/lb",
    price: round2(latest),
    change30d,
    trend,
    asOf: valid[0].date,
  };
}

async function fetchSeries(meta: SeriesMeta, key: string): Promise<LiveCommodityQuote | null> {
  const url =
    `https://api.stlouisfed.org/fred/series/observations?series_id=${meta.seriesId}` +
    `&api_key=${encodeURIComponent(key)}&file_type=json&sort_order=desc&limit=2`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as { observations?: FredObservation[] };
  return fredToQuote(json.observations ?? [], { id: meta.id, label: meta.label });
}

export type LiveCommodityResult =
  | { enabled: true; source: string; quotes: LiveCommodityQuote[]; fetchedAt: string }
  | { enabled: false; reason: "no-keys" };

/** Live copper/aluminum index, or {enabled:false} when no key is configured. */
export async function getLiveCommodityIndex(): Promise<LiveCommodityResult> {
  const key = env("FRED_API_KEY");
  if (!key) return { enabled: false, reason: "no-keys" };
  const settled = await Promise.allSettled(SERIES.map((m) => fetchSeries(m, key)));
  const quotes = settled
    .map((s) => (s.status === "fulfilled" ? s.value : null))
    .filter((q): q is LiveCommodityQuote => q !== null);
  if (quotes.length === 0) return { enabled: false, reason: "no-keys" };
  return { enabled: true, source: "FRED (Federal Reserve Economic Data)", quotes, fetchedAt: new Date().toISOString() };
}
