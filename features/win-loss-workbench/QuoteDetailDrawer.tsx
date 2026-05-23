"use client";

import { X, TrendingUp, TrendingDown, Minus, DollarSign, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { QuoteRecord } from "@/lib/win-loss";
import {
  OUTCOME_COLORS, OUTCOME_LABELS, LOSS_REASON_LABELS,
  LOSS_REASON_COLORS, SBU_COLORS,
} from "@/lib/win-loss";

interface Props {
  open: boolean;
  onClose: () => void;
  record: QuoteRecord | null;
}

function OutcomeBadge({ outcome }: { outcome: QuoteRecord["outcome"] }) {
  const color = OUTCOME_COLORS[outcome];
  const label = OUTCOME_LABELS[outcome];
  return (
    <span
      className="rounded border px-2 py-0.5 text-[10px] font-semibold"
      style={{ borderColor: `${color}40`, backgroundColor: `${color}15`, color }}
    >
      {label}
    </span>
  );
}

function DeltaTag({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-xs text-muted-foreground">—</span>;
  const Icon  = delta > 0 ? TrendingDown : delta < 0 ? TrendingUp : Minus;
  const color = delta > 0 ? "#00AA13" : delta < 0 ? "#DB6B30" : "#4F758B";
  const sign  = delta > 0 ? "+" : "";
  return (
    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color }}>
      <Icon className="h-3.5 w-3.5" />
      {sign}{delta.toFixed(1)}% vs competitor
    </span>
  );
}

export function QuoteDetailDrawer({ open, onClose, record }: Props) {
  if (!open || !record) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-[440px] flex-col border-l bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{record.quoteNumber}</p>
              <OutcomeBadge outcome={record.outcome} />
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {record.customer} · {record.month}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto divide-y">
          {/* Overview */}
          <div className="px-5 py-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Customer</p>
              <p className="mt-0.5 text-xs font-medium">{record.customer}</p>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Region</p>
              <p className="mt-0.5 text-xs font-medium">{record.region}</p>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Sales Owner</p>
              <p className="mt-0.5 text-xs font-medium">{record.salesOwner}</p>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">SBU</p>
              <span
                className="mt-0.5 inline-block rounded border px-1.5 py-0.5 text-[9px] font-semibold text-white"
                style={{ backgroundColor: SBU_COLORS[record.sbu], borderColor: SBU_COLORS[record.sbu] }}
              >
                {record.sbu}
              </span>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Product Family</p>
              <p className="mt-0.5 text-xs font-medium">{record.productFamily}</p>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Primary SKU</p>
              <p className="mt-0.5 text-[11px] font-mono font-medium">{record.primarySku}</p>
            </div>
          </div>

          {/* Financials */}
          <div className="px-5 py-4">
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />Financials
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[9px] text-muted-foreground">Quote Value</p>
                <p className="mt-0.5 text-base font-bold tabular-nums text-[#1D252D] dark:text-foreground">
                  {formatCurrency(record.quoteValue)}
                </p>
              </div>
              {record.outcome === "won" && record.wonValue !== null ? (
                <div className="rounded-lg border bg-[#00AA13]/5 border-[#00AA13]/20 p-3">
                  <p className="text-[9px] text-muted-foreground">Won Value</p>
                  <p className="mt-0.5 text-base font-bold tabular-nums text-[#00AA13]">
                    {formatCurrency(record.wonValue)}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border bg-[#DB6B30]/5 border-[#DB6B30]/20 p-3">
                  <p className="text-[9px] text-muted-foreground">At Risk</p>
                  <p className="mt-0.5 text-base font-bold tabular-nums text-[#DB6B30]">
                    {formatCurrency(record.quoteValue)}
                  </p>
                </div>
              )}
              {record.marginPct !== null && (
                <div className={cn(
                  "rounded-lg border p-3",
                  record.marginPct < 12
                    ? "bg-[#DB6B30]/5 border-[#DB6B30]/20"
                    : "bg-card",
                )}>
                  <p className="text-[9px] text-muted-foreground">Margin</p>
                  <p className={cn(
                    "mt-0.5 text-base font-bold tabular-nums",
                    record.marginPct < 12 ? "text-[#DB6B30]" : "text-[#1D252D] dark:text-foreground",
                  )}>
                    {record.marginPct.toFixed(1)}%
                    {record.marginPct < 12 && (
                      <span className="ml-1 text-[9px] text-[#DB6B30]">below floor</span>
                    )}
                  </p>
                </div>
              )}
              {record.competitorPrice !== null && (
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-[9px] text-muted-foreground">Competitor Price</p>
                  <p className="mt-0.5 text-base font-bold tabular-nums">
                    {formatCurrency(record.competitorPrice)}
                  </p>
                </div>
              )}
            </div>
            {record.priceDelta !== null && (
              <div className="mt-3">
                <DeltaTag delta={record.priceDelta} />
              </div>
            )}
          </div>

          {/* Competitor / Loss context */}
          {(record.competitor || record.lossReason) && (
            <div className="px-5 py-4">
              <p className="mb-3 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />Competitive Context
              </p>
              {record.competitor && (
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground">Competitor:</span>
                  <span className="rounded border px-2 py-0.5 text-[10px] font-semibold bg-muted">
                    {record.competitor}
                  </span>
                </div>
              )}
              {record.lossReason && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground">Loss Reason:</span>
                  <span
                    className="rounded border px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      color: LOSS_REASON_COLORS[record.lossReason],
                      borderColor: `${LOSS_REASON_COLORS[record.lossReason]}40`,
                      backgroundColor: `${LOSS_REASON_COLORS[record.lossReason]}15`,
                    }}
                  >
                    {LOSS_REASON_LABELS[record.lossReason]}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="px-5 py-4">
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              Notes
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{record.notes}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3">
          <p className="text-center text-[9px] text-muted-foreground">
            PROTOTYPE ONLY · Mock data · No ERP writes
          </p>
        </div>
      </aside>
    </>
  );
}
