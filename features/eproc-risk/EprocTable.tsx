"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { EprocAccount, EprocScore, RiskLevel, CtaType } from "@/lib/risk/eproc";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

export type ScoredAccount = { account: EprocAccount; score: EprocScore };

type SortKey = "name" | "sbu" | "annualRevenueUsd" | "riskScore" | "riskLevel" | "cta";
type SortDir = "asc" | "desc";

const RISK_LEVELS: RiskLevel[] = ["critical", "high", "medium", "low"];
const RISK_ORDER: Record<RiskLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

const RISK_VARIANT: Record<RiskLevel, BadgeVariant> = {
  critical: "destructive",
  high:     "warning",
  medium:   "secondary",
  low:      "success",
};

const CTA_VARIANT: Record<CtaType, BadgeVariant> = {
  "sales-discovery": "default",
  "integrate":       "warning",
  "pricing-setup":   "secondary",
  "api-readiness":   "outline",
  "edi-readiness":   "outline",
};

const SCORE_BAR_COLOR: Record<RiskLevel, string> = {
  critical: "bg-red-500",
  high:     "bg-orange-500",
  medium:   "bg-yellow-500",
  low:      "bg-emerald-500",
};

const PAGE_SIZE = 10;

interface Props {
  scored: ScoredAccount[];
  filterRiskLevel: string | null;
  filterPlatform?: string | null;
  filterSbu?: string | null;
  onRiskLevelFilter: (level: string | null) => void;
}

export function EprocTable({ scored, filterRiskLevel, filterPlatform, filterSbu, onRiskLevelFilter }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("riskScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return scored.filter((s) => {
      if (filterRiskLevel && s.score.riskLevel !== filterRiskLevel) return false;
      if (filterPlatform && !s.account.platforms.some((p) => p.platform === filterPlatform)) return false;
      if (filterSbu && s.account.sbu !== filterSbu) return false;
      return true;
    });
  }, [scored, filterRiskLevel, filterPlatform, filterSbu]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string | number, bv: string | number;
      switch (sortKey) {
        case "annualRevenueUsd": av = a.account.annualRevenueUsd;  bv = b.account.annualRevenueUsd;  break;
        case "riskScore":        av = a.score.riskScore;            bv = b.score.riskScore;            break;
        case "riskLevel":        av = RISK_ORDER[a.score.riskLevel]; bv = RISK_ORDER[b.score.riskLevel]; break;
        case "cta":              av = a.score.cta;                  bv = b.score.cta;                  break;
        case "sbu":              av = a.account.sbu;                bv = b.account.sbu;                break;
        default:                 av = a.account.name;               bv = b.account.name;
      }
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  }

  function countByLevel(level: RiskLevel) {
    return scored.filter((s) => s.score.riskLevel === level).length;
  }

  const SORT_COLS: { key: SortKey; label: string }[] = [
    { key: "name",            label: "Account"     },
    { key: "sbu",             label: "SBU"         },
    { key: "annualRevenueUsd",label: "Revenue"     },
    { key: "riskScore",       label: "Risk Score"  },
    { key: "riskLevel",       label: "Level"       },
    { key: "cta",             label: "CTA"         },
  ];

  return (
    <div className="rounded-lg border bg-card">
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b px-4 py-2">
        <button
          onClick={() => { onRiskLevelFilter(null); setPage(0); }}
          className={cn(
            "rounded px-3 py-1 text-xs font-medium transition-colors",
            !filterRiskLevel
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          All ({scored.length})
        </button>
        {RISK_LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => { onRiskLevelFilter(level); setPage(0); }}
            className={cn(
              "rounded px-3 py-1 text-xs font-medium capitalize transition-colors",
              filterRiskLevel === level
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            {level} ({countByLevel(level)})
          </button>
        ))}
        {(filterPlatform || filterSbu) && (
          <span className="ml-2 rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
            {[filterSbu, filterPlatform].filter(Boolean).join(" · ")} — heatmap filter active
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              {SORT_COLS.map(({ key, label }) => (
                <th
                  key={key}
                  className="cursor-pointer select-none px-4 py-2 hover:text-foreground"
                  onClick={() => toggleSort(key)}
                >
                  {label} {sortKey === key ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
              ))}
              <th className="px-4 py-2">Owner</th>
              <th className="px-4 py-2">Platforms</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No accounts match the current filter.
                </td>
              </tr>
            )}
            {paginated.map(({ account, score }) => (
              <tr key={account.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-medium">{account.name}</span>
                  {account.competitorPresent && (
                    <span className="ml-1.5 text-[9px] font-semibold text-red-400 uppercase">⚠ Competitor</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{account.sbu}</td>
                <td className="px-4 py-3 tabular-nums">{formatCurrency(account.annualRevenueUsd)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", SCORE_BAR_COLOR[score.riskLevel])}
                        style={{ width: `${score.riskScore}%` }}
                      />
                    </div>
                    <span className="tabular-nums text-xs">{score.riskScore}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={RISK_VARIANT[score.riskLevel]} className="capitalize">
                    {score.riskLevel}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={CTA_VARIANT[score.cta]} className="text-[10px]">
                    {score.ctaLabel}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{account.owner}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {account.platforms.map((p) => p.platform).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded px-2 py-1 hover:bg-muted disabled:opacity-30"
            >
              ←
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="rounded px-2 py-1 hover:bg-muted disabled:opacity-30"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
