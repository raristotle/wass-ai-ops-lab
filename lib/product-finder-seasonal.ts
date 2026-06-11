/**
 * Seasonal / event merchandising — pure & deterministic.
 *
 * One curated demand signal at a time (storm prep, heat, construction season,
 * datacom refresh), rotating by epoch-week so every demo day shows something
 * and the same browser sees the same banner all week. Simulated — a weather or
 * market feed is a drop-in upgrade at the same seam.
 *
 * Every pick query is verified non-zero against the catalog by the live
 * browser pass (job-wizard lesson: phrasing matters).
 */

export interface SeasonalPick {
  label: string;
  /** Run through runNlSearch — plain-English friendly. */
  query: string;
}

export interface SeasonalEvent {
  id: string;
  icon: string;
  title: string;
  blurb: string;
  picks: SeasonalPick[];
}

export const SEASONAL_EVENTS: readonly SeasonalEvent[] = [
  {
    id: "storm-prep",
    icon: "🌀",
    title: "Storm watch — Gulf Coast",
    blurb: "Crews stage ahead of the front: surge protection, temporary power, and PPE move first.",
    picks: [
      { label: "Surge protection", query: "surge protective device" },
      { label: "Portable power", query: "portable power" },
      { label: "Hi-vis & PPE", query: "safety vest" },
    ],
  },
  {
    id: "summer-heat",
    icon: "🌡️",
    title: "Heat advisory season",
    blurb: "Summer loads peak — cooling, ventilation, and heat-stress PPE are trending at the counter.",
    picks: [
      { label: "AC service calls", query: "AC disconnect" },
      { label: "Cooling PPE", query: "cooling" },
      { label: "Eye protection", query: "safety glasses" },
    ],
  },
  {
    id: "construction-kickoff",
    icon: "🏗️",
    title: "Construction season kickoff",
    blurb: "Permits are moving — rough-in commodities lead: wire, conduit, boxes, and breakers.",
    picks: [
      { label: "Wire & cable", query: "NM-B cable" },
      { label: "Conduit & fittings", query: "EMT conduit" },
      { label: "Boxes & covers", query: "old work box" },
    ],
  },
  {
    id: "datacom-refresh",
    icon: "🖥️",
    title: "Q-end datacom refresh",
    blurb: "Budget-flush season — network upgrades close fast when the gear is in stock.",
    picks: [
      { label: "Network switches", query: "PoE network switch" },
      { label: "Cat6 runs", query: "Cat6 cable 1000ft" },
      { label: "Patch panels", query: "patch panel" },
    ],
  },
] as const;

const WEEK_MS = 7 * 86_400_000;

/** The week's event — rotates deterministically through SEASONAL_EVENTS. */
export function seasonalEvent(now: number): SeasonalEvent {
  const week = Math.floor(now / WEEK_MS);
  return SEASONAL_EVENTS[week % SEASONAL_EVENTS.length];
}
