// lib/win-loss.ts — Win-Loss Workbench types + stat helpers

export type QuoteOutcome = "won" | "lost" | "pending" | "no-bid";

export type LossReason =
  | "price"
  | "lead-time"
  | "relationship"
  | "spec-mismatch"
  | "incumbent"
  | "no-decision"
  | "other";

export type ProductFamily =
  | "Circuit Breakers"
  | "Panelboards"
  | "Wire & Cable"
  | "Conduit"
  | "Lighting"
  | "Motor Controls"
  | "Power Infrastructure"
  | "Data Center"
  | "Wiring Devices"
  | "Transformers";

export type SBU = "CSS" | "EES" | "UBS";

export interface QuoteRecord {
  id: string;
  quoteNumber: string;
  month: string;              // "YYYY-MM"
  customer: string;
  salesOwner: string;
  sbu: SBU;
  productFamily: ProductFamily;
  competitor: string | null;
  outcome: QuoteOutcome;
  lossReason: LossReason | null;
  quoteValue: number;
  wonValue: number | null;
  competitorPrice: number | null;
  priceDelta: number | null;  // %, negative = we were more expensive than competitor
  marginPct: number | null;   // only on won quotes
  skuCount: number;
  primarySku: string;
  region: string;
  notes: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

export const LOSS_REASON_LABELS: Record<LossReason, string> = {
  "price":         "Price Too High",
  "lead-time":     "Lead Time",
  "relationship":  "Relationship / Loyalty",
  "spec-mismatch": "Spec Mismatch",
  "incumbent":     "Incumbent Vendor",
  "no-decision":   "No Decision / Shelved",
  "other":         "Other / Unknown",
};

export const LOSS_REASON_COLORS: Record<LossReason, string> = {
  "price":         "#DB6B30",
  "lead-time":     "#EAAA00",
  "relationship":  "#4F758B",
  "spec-mismatch": "#64CCC9",
  "incumbent":     "#004986",
  "no-decision":   "#B7C9D3",
  "other":         "#1D252D",
};

export const OUTCOME_COLORS: Record<QuoteOutcome, string> = {
  won:       "#00AA13",
  lost:      "#DB6B30",
  pending:   "#EAAA00",
  "no-bid":  "#B7C9D3",
};

export const OUTCOME_LABELS: Record<QuoteOutcome, string> = {
  won:       "Won",
  lost:      "Lost",
  pending:   "Pending",
  "no-bid":  "No Bid",
};

export const COMPETITORS = [
  "Grainger",
  "Graybar",
  "Rexel",
  "City Electric",
  "Anixter",
  "Other",
] as const;

export type Competitor = typeof COMPETITORS[number];

export const ALL_PRODUCT_FAMILIES: ProductFamily[] = [
  "Circuit Breakers",
  "Panelboards",
  "Wire & Cable",
  "Conduit",
  "Lighting",
  "Motor Controls",
  "Power Infrastructure",
  "Data Center",
  "Wiring Devices",
  "Transformers",
];

export const PRODUCT_FAMILY_SHORT: Record<ProductFamily, string> = {
  "Circuit Breakers":   "CBs",
  "Panelboards":        "Panels",
  "Wire & Cable":       "Wire",
  "Conduit":            "Conduit",
  "Lighting":           "Lighting",
  "Motor Controls":     "Motors",
  "Power Infrastructure": "Power",
  "Data Center":        "Data Ctr",
  "Wiring Devices":     "Wiring",
  "Transformers":       "Xfmr",
};

export const SALES_OWNERS = [
  "Mike Torres",
  "Sarah Chen",
  "David Kim",
  "Rachel Foster",
  "James Cooper",
  "Priya Patel",
] as const;

export const REGIONS = [
  "Northeast",
  "Southeast",
  "Midwest",
  "West",
  "Southwest",
] as const;

export const SBU_COLORS: Record<SBU, string> = {
  CSS: "#004986",
  EES: "#00573F",
  UBS: "#64CCC9",
};

// ── Derived types ──────────────────────────────────────────────────────────────

export interface TopStats {
  totalQuotes: number;
  wonQuotes: number;
  lostQuotes: number;
  winRate: number;
  totalValue: number;
  wonValue: number;
  lostValue: number;
  avgMargin: number | null;
  avgPriceDelta: number | null;
}

export interface MonthlyTrend {
  month: string;
  monthLabel: string;
  winRate: number;
  won: number;
  lost: number;
  total: number;
  quoteVolume: number;
}

export interface ReasonBreakdown {
  reason: LossReason;
  label: string;
  count: number;
  pct: number;
  lostValue: number;
}

export interface HeatmapCell {
  competitor: string;
  productFamily: ProductFamily;
  winRate: number | null;
  won: number;
  lost: number;
  total: number;
}

export interface DeltaBucket {
  bucket: string;
  label: string;
  won: number;
  lost: number;
}

export interface RepStat {
  salesOwner: string;
  total: number;
  won: number;
  lost: number;
  winRate: number;
  wonValue: number;
  lostValue: number;
  avgMargin: number | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function shortMonthLabel(m: string): string {
  const [y, mo] = m.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(mo!, 10) - 1]} ${y!.slice(2)}`;
}

function decided(records: QuoteRecord[]): QuoteRecord[] {
  return records.filter((r) => r.outcome === "won" || r.outcome === "lost");
}

// ── Stat functions ─────────────────────────────────────────────────────────────

export function computeTopStats(records: QuoteRecord[]): TopStats {
  const d = decided(records);
  const won  = d.filter((r) => r.outcome === "won");
  const lost = d.filter((r) => r.outcome === "lost");
  const margins = won.filter((r) => r.marginPct !== null).map((r) => r.marginPct!);
  const deltas  = d.filter((r) => r.priceDelta !== null).map((r) => r.priceDelta!);
  return {
    totalQuotes: d.length,
    wonQuotes:   won.length,
    lostQuotes:  lost.length,
    winRate: d.length === 0 ? 0 : Math.round((won.length / d.length) * 100),
    totalValue: d.reduce((s, r) => s + r.quoteValue, 0),
    wonValue:   won.reduce((s, r) => s + (r.wonValue ?? r.quoteValue), 0),
    lostValue:  lost.reduce((s, r) => s + r.quoteValue, 0),
    avgMargin:
      margins.length === 0 ? null : margins.reduce((s, v) => s + v, 0) / margins.length,
    avgPriceDelta:
      deltas.length === 0 ? null : deltas.reduce((s, v) => s + v, 0) / deltas.length,
  };
}

export function computeMonthlyTrend(records: QuoteRecord[]): MonthlyTrend[] {
  const byMonth = new Map<string, { won: number; lost: number; volume: number }>();
  for (const r of records) {
    if (r.outcome !== "won" && r.outcome !== "lost") continue;
    const entry = byMonth.get(r.month) ?? { won: 0, lost: 0, volume: 0 };
    if (r.outcome === "won") { entry.won++; entry.volume += r.wonValue ?? r.quoteValue; }
    else { entry.lost++; }
    byMonth.set(r.month, entry);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { won, lost, volume }]) => ({
      month,
      monthLabel: shortMonthLabel(month),
      winRate: Math.round((won / Math.max(won + lost, 1)) * 100),
      won,
      lost,
      total: won + lost,
      quoteVolume: volume,
    }));
}

export function computeReasonBreakdown(records: QuoteRecord[]): ReasonBreakdown[] {
  const lost = records.filter((r) => r.outcome === "lost" && r.lossReason !== null);
  const totals = new Map<LossReason, { count: number; value: number }>();
  for (const r of lost) {
    const key = r.lossReason!;
    const entry = totals.get(key) ?? { count: 0, value: 0 };
    entry.count++;
    entry.value += r.quoteValue;
    totals.set(key, entry);
  }
  const total = lost.length;
  return [...totals.entries()]
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([reason, { count, value }]) => ({
      reason,
      label: LOSS_REASON_LABELS[reason],
      count,
      pct: Math.round((count / Math.max(total, 1)) * 100),
      lostValue: value,
    }));
}

export function computeHeatmap(records: QuoteRecord[]): HeatmapCell[] {
  const d = decided(records).filter((r) => r.competitor !== null);
  const map = new Map<string, { won: number; lost: number }>();
  for (const r of d) {
    const key = `${r.competitor}||${r.productFamily}`;
    const entry = map.get(key) ?? { won: 0, lost: 0 };
    if (r.outcome === "won") entry.won++;
    else entry.lost++;
    map.set(key, entry);
  }
  const cells: HeatmapCell[] = [];
  for (const competitor of COMPETITORS) {
    for (const productFamily of ALL_PRODUCT_FAMILIES) {
      const key = `${competitor}||${productFamily}`;
      const entry = map.get(key);
      if (!entry) {
        cells.push({ competitor, productFamily, winRate: null, won: 0, lost: 0, total: 0 });
      } else {
        const total = entry.won + entry.lost;
        cells.push({
          competitor,
          productFamily,
          winRate: Math.round((entry.won / total) * 100),
          won: entry.won,
          lost: entry.lost,
          total,
        });
      }
    }
  }
  return cells;
}

const DELTA_BUCKETS = [
  { bucket: "lt-10",    label: "< −10%",      min: -Infinity, max: -10 },
  { bucket: "neg10",    label: "−10 to −5%",  min: -10,       max: -5  },
  { bucket: "neg5to0",  label: "−5 to 0%",    min: -5,        max: 0   },
  { bucket: "0to5",     label: "0 to +5%",    min: 0,         max: 5   },
  { bucket: "5to10",    label: "+5 to +10%",  min: 5,         max: 10  },
  { bucket: "gt10",     label: "> +10%",       min: 10,        max: Infinity },
] as const;

export function computeDeltaBuckets(records: QuoteRecord[]): DeltaBucket[] {
  const d = decided(records).filter((r) => r.priceDelta !== null);
  return DELTA_BUCKETS.map(({ bucket, label, min, max }) => {
    const inBucket = d.filter((r) => r.priceDelta! >= min && r.priceDelta! < max);
    return {
      bucket,
      label,
      won:  inBucket.filter((r) => r.outcome === "won").length,
      lost: inBucket.filter((r) => r.outcome === "lost").length,
    };
  });
}

export function computeRepLeaderboard(records: QuoteRecord[]): RepStat[] {
  const d = decided(records);
  const byRep = new Map<
    string,
    { won: number; lost: number; wonValue: number; lostValue: number; margins: number[] }
  >();
  for (const r of d) {
    const entry = byRep.get(r.salesOwner) ?? { won: 0, lost: 0, wonValue: 0, lostValue: 0, margins: [] };
    if (r.outcome === "won") {
      entry.won++;
      entry.wonValue += r.wonValue ?? r.quoteValue;
      if (r.marginPct !== null) entry.margins.push(r.marginPct);
    } else {
      entry.lost++;
      entry.lostValue += r.quoteValue;
    }
    byRep.set(r.salesOwner, entry);
  }
  return [...byRep.entries()]
    .map(([salesOwner, { won, lost, wonValue, lostValue, margins }]) => ({
      salesOwner,
      total: won + lost,
      won,
      lost,
      winRate: Math.round((won / Math.max(won + lost, 1)) * 100),
      wonValue,
      lostValue,
      avgMargin:
        margins.length === 0 ? null : margins.reduce((s, v) => s + v, 0) / margins.length,
    }))
    .sort((a, b) => b.wonValue - a.wonValue);
}
