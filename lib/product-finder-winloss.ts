import type { SavedQuote } from "@/lib/product-finder-quotes";

/**
 * Win/loss pricing insights — pure aggregations over saved quotes.
 *
 * Every saved quote captures its blended margin (marginPct) and ends life as
 * won or lost. Crossing the two answers the question reps actually have while
 * discounting: "at this margin, do quotes like this close?"
 */

export interface MarginBand {
  label: string;
  /** Inclusive lower bound (fraction, e.g. 0.15). */
  min: number;
  /** Exclusive upper bound; null = open-ended. */
  max: number | null;
}

export const MARGIN_BANDS: readonly MarginBand[] = [
  { label: "<15%", min: 0, max: 0.15 },
  { label: "15–20%", min: 0.15, max: 0.2 },
  { label: "20–25%", min: 0.2, max: 0.25 },
  { label: "25–30%", min: 0.25, max: 0.3 },
  { label: "30%+", min: 0.3, max: null },
];

/** Minimum decided quotes in a band before we surface guidance from it. */
export const MIN_DECIDED = 3;

export interface BandStat {
  band: string;
  won: number;
  lost: number;
  decided: number;
  /** won / decided; 0 when no decided quotes. */
  winRate: number;
}

/** The band a margin fraction falls into (negative margins clamp to the lowest). */
export function bandFor(marginPct: number): MarginBand {
  const m = Math.max(0, marginPct);
  for (const band of MARGIN_BANDS) {
    if (m >= band.min && (band.max === null || m < band.max)) return band;
  }
  // Unreachable — the last band is open-ended — but keeps TS total.
  return MARGIN_BANDS[MARGIN_BANDS.length - 1];
}

/** Decided (won/lost) quotes that captured a margin at save time. */
function decidedQuotes(quotes: SavedQuote[]): SavedQuote[] {
  return quotes.filter(
    (q) => (q.status === "won" || q.status === "lost") && q.marginPct !== undefined
  );
}

/** Win/loss counts per margin band, in MARGIN_BANDS order. */
export function winLossByBand(quotes: SavedQuote[]): BandStat[] {
  const stats = MARGIN_BANDS.map((band) => ({ band: band.label, won: 0, lost: 0, decided: 0, winRate: 0 }));
  for (const q of decidedQuotes(quotes)) {
    // decidedQuotes guarantees marginPct is present
    const idx = MARGIN_BANDS.indexOf(bandFor(q.marginPct as number));
    const s = stats[idx];
    if (q.status === "won") s.won += 1;
    else s.lost += 1;
    s.decided += 1;
  }
  for (const s of stats) s.winRate = s.decided === 0 ? 0 : s.won / s.decided;
  return stats;
}

export interface WinLossSummary {
  decided: number;
  /** Mean margin of won quotes (fraction), null when none. */
  avgMarginWon: number | null;
  avgMarginLost: number | null;
  overallWinRate: number;
}

export function winLossSummary(quotes: SavedQuote[]): WinLossSummary {
  const decided = decidedQuotes(quotes);
  const won = decided.filter((q) => q.status === "won");
  const lost = decided.filter((q) => q.status === "lost");
  const avg = (xs: SavedQuote[]) =>
    xs.length === 0 ? null : xs.reduce((s, q) => s + (q.marginPct as number), 0) / xs.length;
  return {
    decided: decided.length,
    avgMarginWon: avg(won),
    avgMarginLost: avg(lost),
    overallWinRate: decided.length === 0 ? 0 : won.length / decided.length,
  };
}

export interface MarginGuidance {
  band: string;
  bandWinRate: number;
  bandDecided: number;
  overallWinRate: number;
  /** Ready-to-render sentence. */
  message: string;
}

/**
 * Guidance for the rep's CURRENT margin: how quotes in this band have closed,
 * vs the overall rate. Null until the band has MIN_DECIDED decided quotes.
 */
export function marginGuidance(
  quotes: SavedQuote[],
  currentMarginPct: number
): MarginGuidance | null {
  const band = bandFor(currentMarginPct);
  const stats = winLossByBand(quotes);
  const stat = stats[MARGIN_BANDS.indexOf(band)];
  if (stat.decided < MIN_DECIDED) return null;
  const summary = winLossSummary(quotes);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  return {
    band: band.label,
    bandWinRate: stat.winRate,
    bandDecided: stat.decided,
    overallWinRate: summary.overallWinRate,
    message: `Quotes in the ${band.label} margin band historically win ${pct(stat.winRate)} (n=${stat.decided}; all quotes ${pct(summary.overallWinRate)})`,
  };
}
