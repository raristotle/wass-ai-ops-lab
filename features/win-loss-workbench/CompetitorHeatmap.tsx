"use client";

import React from "react";
import { computeHeatmap, COMPETITORS, ALL_PRODUCT_FAMILIES, PRODUCT_FAMILY_SHORT } from "@/lib/win-loss";
import type { QuoteRecord, HeatmapCell } from "@/lib/win-loss";
import { cn } from "@/lib/utils";

interface Props { records: QuoteRecord[] }

function cellBg(winRate: number | null): string {
  if (winRate === null) return "bg-muted/30 text-muted-foreground/40";
  if (winRate >= 65)   return "bg-[#00AA13] text-white";
  if (winRate >= 50)   return "bg-[#00573F] text-white";
  if (winRate >= 35)   return "bg-[#EAAA00] text-[#1D252D]";
  return "bg-[#DB6B30] text-white";
}

function CellTip({ cell }: { cell: HeatmapCell }) {
  if (cell.total === 0) return <span className="text-[9px]">—</span>;
  return (
    <span className="text-[10px] font-semibold tabular-nums">
      {cell.winRate}%
    </span>
  );
}

export function CompetitorHeatmap({ records }: Props) {
  const cells = computeHeatmap(records);
  const lookup = new Map(cells.map((c) => [`${c.competitor}||${c.productFamily}`, c]));

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Competitor Heatmap
      </p>
      <p className="mb-3 text-xs text-muted-foreground">
        Win rate by competitor × product family — darker green = stronger position
      </p>

      <div className="overflow-x-auto">
        <div
          className="grid gap-px min-w-max"
          style={{ gridTemplateColumns: `96px repeat(${ALL_PRODUCT_FAMILIES.length}, 56px)` }}
        >
          {/* Column headers */}
          <div className="h-8" /> {/* empty corner */}
          {ALL_PRODUCT_FAMILIES.map((pf) => (
            <div
              key={pf}
              title={pf}
              className="flex h-8 items-center justify-center px-1"
            >
              <span className="text-[9px] font-semibold text-muted-foreground text-center leading-tight">
                {PRODUCT_FAMILY_SHORT[pf]}
              </span>
            </div>
          ))}

          {/* Rows */}
          {COMPETITORS.map((competitor) => (
            <React.Fragment key={competitor}>
              {/* Row header */}
              <div
                className="flex h-10 items-center pr-2"
              >
                <span className="text-[10px] font-medium text-muted-foreground truncate">
                  {competitor}
                </span>
              </div>

              {/* Cells */}
              {ALL_PRODUCT_FAMILIES.map((pf) => {
                const cell = lookup.get(`${competitor}||${pf}`);
                const winRate = cell?.winRate ?? null;
                const total   = cell?.total ?? 0;
                return (
                  <div
                    key={`${competitor}-${pf}`}
                    title={
                      total === 0
                        ? `${competitor} × ${pf}: no data`
                        : `${competitor} × ${pf}: ${winRate}% (${cell!.won}W / ${cell!.lost}L)`
                    }
                    className={cn(
                      "flex h-10 items-center justify-center rounded-sm transition-opacity hover:opacity-80",
                      cellBg(winRate),
                    )}
                  >
                    {cell ? <CellTip cell={cell} /> : <span className="text-[9px]">—</span>}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Legend</span>
        {[
          { label: "≥ 65%",    bg: "bg-[#00AA13]", text: "text-white" },
          { label: "50–64%",   bg: "bg-[#00573F]", text: "text-white" },
          { label: "35–49%",   bg: "bg-[#EAAA00]", text: "text-[#1D252D]" },
          { label: "< 35%",    bg: "bg-[#DB6B30]", text: "text-white" },
          { label: "No data",  bg: "bg-muted/30",  text: "text-muted-foreground/40" },
        ].map(({ label, bg, text }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={cn("h-3 w-3 rounded-sm", bg)} />
            <span className={cn("text-[9px]", text === "text-[#1D252D]" ? "text-[#1D252D] dark:text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
