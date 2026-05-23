"use client";

import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { MOCK_QUOTES } from "@/data/mock/win-loss";
import type { QuoteRecord } from "@/lib/win-loss";
import {
  computeTopStats,
  COMPETITORS, ALL_PRODUCT_FAMILIES, SALES_OWNERS, REGIONS,
} from "@/lib/win-loss";
import { WinRateTrend }      from "./WinRateTrend";
import { LossReasonsChart }  from "./LossReasonsChart";
import { CompetitorHeatmap } from "./CompetitorHeatmap";
import { PriceDeltaChart }   from "./PriceDeltaChart";
import { QuoteTable }        from "./QuoteTable";
import { QuoteDetailDrawer } from "./QuoteDetailDrawer";
import { InsightCards }      from "./InsightCards";
import { ManagerView }       from "./ManagerView";
import { generateInsights }  from "@/lib/pricing-insights";

// ── KPI Card ───────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, accent, Icon,
}: {
  label: string; value: string; sub: string;
  accent: string; Icon: React.ElementType;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground/40" />
      </div>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums", accent)}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

// ── Filter helpers ─────────────────────────────────────────────────────────────

const TIME_RANGES = [
  { label: "All 2025",   months: 12 },
  { label: "Last 6 mo",  months: 6  },
  { label: "Last 3 mo",  months: 3  },
] as const;

type TimeRange = typeof TIME_RANGES[number]["months"];

const SORTED_MONTHS = [...new Set(MOCK_QUOTES.map((q) => q.month))].sort();
const LAST_MONTH = SORTED_MONTHS[SORTED_MONTHS.length - 1]!;

function monthsInRange(months: TimeRange): Set<string> {
  const all = [...SORTED_MONTHS];
  return new Set(all.slice(-months));
}

// ── WinLossPage ────────────────────────────────────────────────────────────────

export function WinLossPage() {
  const [timeRange,   setTimeRange]   = useState<TimeRange>(12);
  const [sbu,         setSbu]         = useState<string>("all");
  const [rep,         setRep]         = useState<string>("all");
  const [region,      setRegion]      = useState<string>("all");
  const [productFam,  setProductFam]  = useState<string>("all");
  const [competitor,  setCompetitor]  = useState<string>("all");
  const [selected,    setSelected]    = useState<QuoteRecord | null>(null);
  const [activeTab,   setActiveTab]   = useState<"overview" | "insights" | "manager">("overview");

  const activeMonths = useMemo(() => monthsInRange(timeRange), [timeRange]);

  const filtered = useMemo<QuoteRecord[]>(() => {
    return MOCK_QUOTES.filter((r) => {
      if (!activeMonths.has(r.month))                           return false;
      if (sbu         !== "all" && r.sbu         !== sbu)        return false;
      if (rep         !== "all" && r.salesOwner  !== rep)        return false;
      if (region      !== "all" && r.region      !== region)     return false;
      if (productFam  !== "all" && r.productFamily !== productFam) return false;
      if (competitor  !== "all") {
        if (competitor === "__none__") { if (r.competitor !== null) return false; }
        else { if (r.competitor !== competitor) return false; }
      }
      return true;
    });
  }, [activeMonths, sbu, rep, region, productFam, competitor]);

  const stats    = useMemo(() => computeTopStats(filtered),     [filtered]);
  const insights = useMemo(() => generateInsights(filtered),   [filtered]);

  // Derive current month label for display
  const [y, m] = LAST_MONTH.split("-");
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const currentLabel = `${monthNames[parseInt(m!, 10) - 1]} ${y}`;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-[#1D252D] dark:text-foreground">
          Win-Loss & Competitive Intelligence
        </h1>
        <p className="text-sm text-muted-foreground">
          Quote outcomes · competitor benchmarks · price delta · margin tracking
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-3">
        {/* Time range toggle */}
        <div className="flex rounded-lg border bg-muted p-0.5">
          {TIME_RANGES.map(({ label, months }) => (
            <button
              key={months}
              onClick={() => setTimeRange(months)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                timeRange === months
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Dropdowns */}
        {[
          { label: "SBU",     value: sbu,        setValue: setSbu,        options: ["CSS","EES","UBS"] },
          { label: "Rep",     value: rep,        setValue: setRep,        options: [...SALES_OWNERS] },
          { label: "Region",  value: region,     setValue: setRegion,     options: [...REGIONS] },
          { label: "Product", value: productFam, setValue: setProductFam, options: ALL_PRODUCT_FAMILIES },
          { label: "Vs.",     value: competitor, setValue: setCompetitor, options: [...COMPETITORS] },
        ].map(({ label, value, setValue, options }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="rounded border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#00AA13]"
            >
              <option value="all">All</option>
              {options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        ))}

        <span className="ml-auto text-[10px] text-muted-foreground">
          {filtered.length} of {MOCK_QUOTES.length} quotes · through {currentLabel}
        </span>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Win Rate"
          value={`${stats.winRate}%`}
          sub={`${stats.wonQuotes} won · ${stats.lostQuotes} lost`}
          accent={stats.winRate >= 55 ? "text-[#00AA13]" : stats.winRate >= 40 ? "text-[#EAAA00]" : "text-[#DB6B30]"}
          Icon={Target}
        />
        <KpiCard
          label="Revenue Won"
          value={formatCurrency(stats.wonValue)}
          sub={`of ${formatCurrency(stats.totalValue)} quoted`}
          accent="text-[#004986]"
          Icon={TrendingUp}
        />
        <KpiCard
          label="Revenue Lost"
          value={formatCurrency(stats.lostValue)}
          sub="to competitors"
          accent={stats.lostValue > 200000 ? "text-[#DB6B30]" : "text-[#EAAA00]"}
          Icon={TrendingDown}
        />
        <KpiCard
          label="Avg Margin"
          value={stats.avgMargin !== null ? `${stats.avgMargin.toFixed(1)}%` : "—"}
          sub="won quotes only"
          accent={
            stats.avgMargin === null ? "text-muted-foreground"
            : stats.avgMargin >= 18 ? "text-[#00AA13]"
            : stats.avgMargin >= 12 ? "text-[#EAAA00]"
            : "text-[#DB6B30]"
          }
          Icon={DollarSign}
        />
      </div>

      {/* Tab bar */}
      <div className="flex rounded-lg border bg-muted p-0.5 w-fit">
        {([
          { key: "overview",  label: "Overview" },
          { key: "insights",  label: `Insights${insights.length > 0 ? ` (${insights.length})` : ""}` },
          { key: "manager",   label: "Manager View" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "rounded-md px-4 py-1.5 text-xs font-medium transition-colors",
              activeTab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <>
          <WinRateTrend records={filtered} />
          <div className="grid gap-4 lg:grid-cols-2">
            <LossReasonsChart  records={filtered} />
            <PriceDeltaChart   records={filtered} />
          </div>
          <CompetitorHeatmap records={filtered} />
          <QuoteTable records={filtered} onSelect={setSelected} />
        </>
      )}

      {/* Tab: Insights */}
      {activeTab === "insights" && (
        <InsightCards
          insights={insights}
          onViewQuotes={(ids) => {
            // Switch to overview + pre-filter would require state; just switch tab
            setActiveTab("overview");
            // ids available if we later wire a highlight mechanism
            void ids;
          }}
        />
      )}

      {/* Tab: Manager View */}
      {activeTab === "manager" && (
        <ManagerView records={filtered} />
      )}

      <p className="text-center text-[10px] text-muted-foreground">
        PROTOTYPE ONLY — Data is simulated. No ERP writes. Not for operational use.
      </p>

      {/* Detail drawer */}
      <QuoteDetailDrawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        record={selected}
      />
    </div>
  );
}
