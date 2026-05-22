"use client";

import { useMemo, Fragment } from "react";
import { EPROC_PLATFORMS, PLATFORM_CATEGORY } from "@/lib/risk/eproc";
import type { EprocAccount, EprocScore, RiskLevel } from "@/lib/risk/eproc";
import { cn } from "@/lib/utils";

export type ScoredAccount = { account: EprocAccount; score: EprocScore };

interface Props {
  scored: ScoredAccount[];
  sbus: string[];
  onCellClick: (platform: string, sbu: string) => void;
  selectedPlatform?: string | null;
  selectedSbu?: string | null;
}

const RISK_ORDER: Record<RiskLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };

function cellBg(level: RiskLevel | undefined): string {
  if (level === "critical") return "bg-red-600 text-white";
  if (level === "high")     return "bg-orange-500 text-white";
  if (level === "medium")   return "bg-yellow-400 text-slate-900";
  if (level === "low")      return "bg-emerald-500 text-white";
  return "";
}

export function EprocHeatmap({ scored, sbus, onCellClick, selectedPlatform, selectedSbu }: Props) {
  // Map keyed by "sbu__platform" → worst-risk scored account list
  const cellMap = useMemo(() => {
    const map = new Map<string, ScoredAccount[]>();
    for (const s of scored) {
      for (const p of s.account.platforms) {
        const key = `${s.account.sbu}__${p.platform}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(s);
      }
    }
    return map;
  }, [scored]);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Risk Heatmap — SBU × Platform
        </h2>
        <p className="text-xs text-muted-foreground">Click a cell to filter the table</p>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `180px repeat(${EPROC_PLATFORMS.length}, minmax(68px, 1fr))` }}
        >
          {/* Header row */}
          <div />
          {EPROC_PLATFORMS.map((p) => (
            <div
              key={p}
              className="px-1 py-1 text-center text-[10px] font-medium leading-tight text-muted-foreground"
              title={PLATFORM_CATEGORY[p]}
            >
              {p}
            </div>
          ))}

          {/* One row per SBU */}
          {sbus.map((sbu) => (
            <Fragment key={sbu}>
              <div className="flex items-center pr-2 text-xs font-medium text-muted-foreground truncate">
                {sbu}
              </div>
              {EPROC_PLATFORMS.map((platform) => {
                const accounts = cellMap.get(`${sbu}__${platform}`) ?? [];
                const worstLevel = accounts.length > 0
                  ? [...accounts].sort((a, b) => RISK_ORDER[b.score.riskLevel] - RISK_ORDER[a.score.riskLevel])[0].score.riskLevel
                  : undefined;
                const isSelected = selectedPlatform === platform && selectedSbu === sbu;

                return (
                  <button
                    key={platform}
                    onClick={() => accounts.length > 0 ? onCellClick(platform, sbu) : undefined}
                    disabled={accounts.length === 0}
                    title={
                      accounts.length > 0
                        ? `${accounts.length} account${accounts.length > 1 ? "s" : ""} · worst: ${worstLevel}`
                        : "No accounts"
                    }
                    className={cn(
                      "h-10 w-full rounded text-xs font-semibold transition-all",
                      accounts.length === 0
                        ? "bg-slate-800/30 cursor-default opacity-40"
                        : cn(cellBg(worstLevel), "cursor-pointer hover:opacity-80 active:scale-95"),
                      isSelected && "ring-2 ring-white ring-offset-1 ring-offset-card",
                    )}
                  >
                    {accounts.length > 0 ? accounts.length : ""}
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground">
        <span className="font-medium">Max risk per cell:</span>
        {(["low", "medium", "high", "critical"] as RiskLevel[]).map((l) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className={cn("inline-block h-3 w-3 rounded", cellBg(l).split(" ")[0])} />
            <span className="capitalize">{l}</span>
          </span>
        ))}
        <span className="ml-1">· Number = account count</span>
      </div>
    </div>
  );
}
