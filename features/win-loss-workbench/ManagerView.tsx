"use client";

import { Trophy, TrendingDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { computeRepLeaderboard, SBU_COLORS } from "@/lib/win-loss";
import type { QuoteRecord, RepStat } from "@/lib/win-loss";

interface Props { records: QuoteRecord[] }

function WinRateBar({ rate }: { rate: number }) {
  const color =
    rate >= 55 ? "#00AA13"
    : rate >= 40 ? "#EAAA00"
    : "#DB6B30";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${rate}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-9 text-right text-[10px] font-semibold tabular-nums" style={{ color }}>
        {rate}%
      </span>
    </div>
  );
}

function RepRow({ stat, rank }: { stat: RepStat; rank: number }) {
  const isConcern = stat.winRate < 30 && stat.total >= 5;
  return (
    <tr className={cn(
      "border-b last:border-0 transition-colors",
      isConcern ? "bg-[#DB6B30]/5" : "hover:bg-muted/20",
    )}>
      <td className="py-2 pl-4 pr-2">
        <div className="flex items-center gap-1.5">
          {rank <= 3 ? (
            <Trophy
              className="h-3 w-3 shrink-0"
              style={{ color: rank === 1 ? "#EAAA00" : rank === 2 ? "#B7C9D3" : "#DB6B30" }}
            />
          ) : (
            <span className="w-3 text-center text-[10px] text-muted-foreground">{rank}</span>
          )}
          <span className="text-xs font-medium">{stat.salesOwner}</span>
          {isConcern && (
            <AlertCircle className="h-3 w-3 shrink-0 text-[#DB6B30]" aria-label="Win rate below 30% threshold" />
          )}
        </div>
      </td>
      <td className="px-3 py-2">
        <WinRateBar rate={stat.winRate} />
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-center text-xs tabular-nums text-muted-foreground">
        {stat.won} / {stat.total}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right text-xs font-semibold tabular-nums text-[#004986]">
        {formatCurrency(stat.wonValue)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right text-xs tabular-nums text-muted-foreground">
        {formatCurrency(stat.lostValue)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right text-xs tabular-nums">
        {stat.avgMargin !== null ? (
          <span className={cn(
            "font-medium",
            stat.avgMargin < 12 ? "text-[#DB6B30]" : stat.avgMargin >= 18 ? "text-[#00AA13]" : "",
          )}>
            {stat.avgMargin.toFixed(1)}%
          </span>
        ) : "—"}
      </td>
    </tr>
  );
}

function SbuSummary({ records }: { records: QuoteRecord[] }) {
  const byType: Record<string, { won: number; lost: number; wonValue: number }> = {};
  for (const r of records) {
    if (r.outcome !== "won" && r.outcome !== "lost") continue;
    if (!byType[r.sbu]) byType[r.sbu] = { won: 0, lost: 0, wonValue: 0 };
    if (r.outcome === "won") { byType[r.sbu]!.won++; byType[r.sbu]!.wonValue += r.wonValue ?? r.quoteValue; }
    else byType[r.sbu]!.lost++;
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {(["CSS", "EES", "UBS"] as const).map((sbu) => {
        const d = byType[sbu] ?? { won: 0, lost: 0, wonValue: 0 };
        const total = d.won + d.lost;
        const wr = total === 0 ? 0 : Math.round((d.won / total) * 100);
        const color = SBU_COLORS[sbu];
        return (
          <div key={sbu} className="rounded-lg border bg-card p-3" style={{ borderTopWidth: 2, borderTopColor: color }}>
            <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color }}>{sbu}</p>
            <p className="mt-1 text-xl font-bold tabular-nums" style={{ color }}>
              {wr}%
            </p>
            <p className="text-[10px] text-muted-foreground">win rate</p>
            <p className="mt-1 text-[10px] font-medium">{formatCurrency(d.wonValue)}</p>
            <p className="text-[9px] text-muted-foreground">revenue won</p>
          </div>
        );
      })}
    </div>
  );
}

function AlertFeed({ records }: { records: QuoteRecord[] }) {
  const alerts: Array<{ text: string; color: string }> = [];

  // Low-margin wins
  const lowMargin = records.filter(
    (r) => r.outcome === "won" && r.marginPct !== null && r.marginPct < 12,
  );
  if (lowMargin.length >= 2) {
    alerts.push({
      text: `${lowMargin.length} won quotes are below the 12% margin floor — review pricing discipline.`,
      color: "#DB6B30",
    });
  }

  // Reps with low win rate
  const leaderboard = computeRepLeaderboard(records).filter(
    (r) => r.winRate < 30 && r.total >= 5,
  );
  for (const rep of leaderboard) {
    alerts.push({
      text: `${rep.salesOwner}: ${rep.winRate}% win rate on ${rep.total} quotes — coaching opportunity.`,
      color: "#EAAA00",
    });
  }

  // Any quote lost by large delta
  const bigLosses = records.filter(
    (r) => r.outcome === "lost" && r.priceDelta !== null && r.priceDelta < -15,
  );
  if (bigLosses.length >= 3) {
    alerts.push({
      text: `${bigLosses.length} quotes lost with price gap >15% — systematic pricing issue detected.`,
      color: "#DB6B30",
    });
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-md border bg-muted/20 px-3 py-4 text-center">
        <p className="text-xs text-muted-foreground">No active alerts for selected filters</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {alerts.map((alert, i) => (
        <li key={i} className="flex items-start gap-2 rounded-md border bg-card px-3 py-2">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: alert.color }} />
          <p className="text-xs text-muted-foreground leading-snug">{alert.text}</p>
        </li>
      ))}
    </ul>
  );
}

export function ManagerView({ records }: Props) {
  const leaderboard = computeRepLeaderboard(records);

  return (
    <div className="space-y-6">
      {/* SBU breakdown */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          SBU Performance
        </p>
        <SbuSummary records={records} />
      </div>

      {/* Rep leaderboard */}
      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Rep Leaderboard
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Sorted by won revenue · reps below 30% win rate flagged
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="py-2 pl-4 pr-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rep</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-36">Win Rate</th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">W / Total</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Won $</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Lost $</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Avg Margin</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((stat, i) => (
                <RepRow key={stat.salesOwner} stat={stat} rank={i + 1} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert feed */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Manager Alerts
        </p>
        <AlertFeed records={records} />
      </div>

      <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2">
        <TrendingDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground">
          PROTOTYPE ONLY · All data is simulated · No ERP writes · Human review required
        </p>
      </div>
    </div>
  );
}
