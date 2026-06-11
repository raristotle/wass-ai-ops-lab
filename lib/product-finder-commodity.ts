/**
 * Simulated commodity index — pure & deterministic.
 *
 * Electrical distribution pricing lives on metals (copper above all). This
 * module fabricates a credible daily index via a seeded random walk over the
 * epoch-day number: same value all day, every browser, no Date.now inside.
 * Advisory only — product pricing stays deterministic; the UI uses this for
 * trend nudges and "pricing as of" notes.
 */

export type CommodityTrend = "up" | "down" | "flat";

export interface CommodityQuote {
  /** Metal key, e.g. "copper". */
  id: string;
  label: string;
  unit: string;
  /** Simulated spot price for the day containing `now`. */
  price: number;
  /** Percent change vs 30 days earlier (e.g. 3.1 = +3.1%). */
  change30d: number;
  trend: CommodityTrend;
}

const DAY_MS = 86_400_000;

/** Trend threshold: |30-day change| below this reads as flat. */
export const FLAT_BAND_PCT = 0.75;

interface MetalDef {
  id: string;
  label: string;
  unit: string;
  base: number;
  /** Max absolute daily move as a fraction of base (walk step size). */
  dailyStep: number;
}

const METALS: MetalDef[] = [
  { id: "copper", label: "Copper", unit: "$/lb", base: 4.2, dailyStep: 0.012 },
  { id: "aluminum", label: "Aluminum", unit: "$/lb", base: 1.32, dailyStep: 0.01 },
];

function stableHash(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) ^ s.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash;
}

/** Deterministic pseudo-random in [-1, 1) for a metal+day pair. */
function dayJitter(metalId: string, day: number): number {
  return (stableHash(`${metalId}:${day}`) % 20001) / 10000 - 1;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Simulated price for a metal on a given epoch-day.
 * A bounded walk: base price plus the sum of the last 90 daily jitters, so
 * consecutive days move smoothly and the level can't drift unboundedly.
 */
export function priceOnDay(metalId: string, day: number): number {
  const def = METALS.find((m) => m.id === metalId);
  if (!def) return 0;
  let offset = 0;
  for (let d = day - 89; d <= day; d++) {
    offset += dayJitter(def.id, d) * def.dailyStep * def.base;
  }
  // Clamp the walk to ±12% of base so the simulation stays plausible.
  const cap = def.base * 0.12;
  const clamped = Math.max(-cap, Math.min(cap, offset));
  return round2(def.base + clamped);
}

/** The day's index for every tracked metal, derived from `now` (epoch ms). */
export function commodityIndex(now: number): CommodityQuote[] {
  const day = Math.floor(now / DAY_MS);
  return METALS.map((def) => {
    const price = priceOnDay(def.id, day);
    const prior = priceOnDay(def.id, day - 30);
    const change30d = prior > 0 ? round2(((price - prior) / prior) * 100) : 0;
    const trend: CommodityTrend =
      Math.abs(change30d) < FLAT_BAND_PCT ? "flat" : change30d > 0 ? "up" : "down";
    return { id: def.id, label: def.label, unit: def.unit, price, change30d, trend };
  });
}

/** The copper quote (the one wire & cable pricing actually follows). */
export function copperQuote(now: number): CommodityQuote {
  // METALS always contains copper, so the find can't miss.
  return commodityIndex(now).find((q) => q.id === "copper") as CommodityQuote;
}
