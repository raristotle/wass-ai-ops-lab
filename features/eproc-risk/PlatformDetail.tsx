"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PLATFORM_CATEGORY } from "@/lib/risk/eproc";
import type { EprocAccount, EprocScore, EprocPlatform, RiskLevel } from "@/lib/risk/eproc";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

export type ScoredAccount = { account: EprocAccount; score: EprocScore };

interface Props {
  open: boolean;
  onClose: () => void;
  platform: string | null;
  sbu: string | null;
  scored: ScoredAccount[];
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

const ADOPTION_VARIANT: Record<string, BadgeVariant> = {
  expanding:  "success",
  deployed:   "default",
  piloting:   "secondary",
  evaluating: "outline",
};

const RISK_TEXT: Record<RiskLevel, string> = {
  critical: "text-red-500",
  high:     "text-orange-500",
  medium:   "text-yellow-500",
  low:      "text-emerald-500",
};

export function PlatformDetail({ open, onClose, platform, sbu, scored }: Props) {
  const accounts = useMemo(() => {
    if (!platform) return [];
    return scored
      .filter(
        (s) =>
          s.account.platforms.some((p) => p.platform === platform) &&
          (!sbu || s.account.sbu === sbu),
      )
      .sort((a, b) => b.score.riskScore - a.score.riskScore);
  }, [scored, platform, sbu]);

  const avgScore =
    accounts.length > 0
      ? Math.round(accounts.reduce((s, a) => s + a.score.riskScore, 0) / accounts.length)
      : 0;

  const avgLevel: RiskLevel =
    avgScore >= 76 ? "critical" : avgScore >= 51 ? "high" : avgScore >= 26 ? "medium" : "low";

  const ctaCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const { score } of accounts) {
      map[score.ctaLabel] = (map[score.ctaLabel] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [accounts]);

  const totalRevenue = accounts.reduce((s, a) => s + a.account.annualRevenueUsd, 0);

  if (!open || !platform) return null;

  const category = PLATFORM_CATEGORY[platform as EprocPlatform] ?? "—";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col border-l bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">{platform}</h2>
            <p className="text-xs text-muted-foreground">{category}</p>
            {sbu && <p className="mt-0.5 text-xs text-muted-foreground">SBU: {sbu}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 border-b px-5 py-4">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[10px] text-muted-foreground">Accounts</p>
            <p className="text-xl font-bold">{accounts.length}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[10px] text-muted-foreground">Avg Risk</p>
            <p className={cn("text-xl font-bold", RISK_TEXT[avgLevel])}>{avgScore}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[10px] text-muted-foreground">Revenue</p>
            <p className="text-xl font-bold">${(totalRevenue / 1e6).toFixed(1)}M</p>
          </div>
        </div>

        {/* CTA breakdown */}
        {ctaCounts.length > 0 && (
          <div className="border-b px-5 py-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recommended Actions
            </p>
            <div className="space-y-1.5">
              {ctaCounts.map(([label, count]) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span>{label}</span>
                  <Badge variant="secondary" className="tabular-nums">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Account list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Accounts ({accounts.length})
          </p>
          <div className="space-y-2">
            {accounts.map(({ account, score }) => {
              const rec = account.platforms.find((p) => p.platform === platform);
              return (
                <div key={account.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{account.name}</p>
                      <p className="text-[10px] text-muted-foreground">{account.sbu}</p>
                    </div>
                    <span className={cn("shrink-0 text-sm font-bold tabular-nums", RISK_TEXT[score.riskLevel])}>
                      {score.riskScore}
                    </span>
                  </div>

                  {rec && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge
                        variant={ADOPTION_VARIANT[rec.adoptionLevel] ?? "outline"}
                        className="text-[9px] capitalize"
                      >
                        {rec.adoptionLevel}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] capitalize">
                        {rec.integrationStatus} integration
                      </Badge>
                      {account.competitorPresent && (
                        <Badge variant="destructive" className="text-[9px]">
                          Competitor
                        </Badge>
                      )}
                    </div>
                  )}

                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    {formatCurrency(account.annualRevenueUsd)} · {account.owner}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3">
          <p className="text-center text-[10px] text-muted-foreground">
            PROTOTYPE ONLY · Data is simulated · Not for operational use
          </p>
        </div>
      </aside>
    </>
  );
}
