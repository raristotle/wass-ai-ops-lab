/**
 * Rep scorecard (#18) — pure, $0. Rolls the shipped quote data into per-rep sales
 * metrics (volume, win rate, avg margin, cross-sell attach, cycle time) so a sales
 * manager has the visibility that justifies the pilot. No new tracking — computed
 * from quotes already in the store; rep attribution is injected by the caller
 * (the quote's audit-trail author).
 */

export interface ScorecardQuote {
  status: "draft" | "sent" | "won" | "lost";
  marginPct?: number;
  createdAt: number;
  convertedAt?: number;
  lines: { category: string }[];
  rep: string;
}

export interface RepStat {
  rep: string;
  volume: number;
  decided: number; // won + lost
  won: number;
  winRate: number | null; // won / decided
  avgMarginPct: number | null;
  crossSellAttachPct: number; // share of quotes spanning >1 category
  avgCycleDays: number | null; // mean created→won days
}

export function repScorecard(quotes: ScorecardQuote[]): RepStat[] {
  const byRep = new Map<string, ScorecardQuote[]>();
  for (const q of quotes) {
    const arr = byRep.get(q.rep) ?? [];
    arr.push(q);
    byRep.set(q.rep, arr);
  }

  const stats: RepStat[] = [];
  for (const [rep, qs] of byRep) {
    const won = qs.filter((q) => q.status === "won").length;
    const lost = qs.filter((q) => q.status === "lost").length;
    const decided = won + lost;

    const margins: number[] = [];
    let crossSell = 0;
    const cycles: number[] = [];
    for (const q of qs) {
      if (typeof q.marginPct === "number") margins.push(q.marginPct);
      if (new Set(q.lines.map((l) => l.category)).size > 1) crossSell += 1;
      if (q.status === "won" && typeof q.convertedAt === "number") {
        const d = (q.convertedAt - q.createdAt) / 86_400_000;
        if (d >= 0) cycles.push(d);
      }
    }
    const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

    stats.push({
      rep,
      volume: qs.length,
      decided,
      won,
      winRate: decided > 0 ? won / decided : null,
      avgMarginPct: mean(margins),
      crossSellAttachPct: qs.length ? crossSell / qs.length : 0,
      avgCycleDays: mean(cycles),
    });
  }

  return stats.sort((a, b) => b.volume - a.volume || (b.winRate ?? 0) - (a.winRate ?? 0));
}
