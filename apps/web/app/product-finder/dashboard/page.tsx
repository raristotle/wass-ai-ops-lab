"use client";

/**
 * Manager / Admin analytics dashboard.
 *
 * Role-gating: renders an "Insights are available to managers" message for
 * sales users; shows the full dashboard for manager/admin.
 *
 * Render-loop guard: we subscribe to raw `orders` and `customers` via
 * individual Zustand selectors (stable references for primitives/arrays).
 * All derived metrics are computed with useMemo so they only recalculate when
 * `orders` actually changes — avoids the React #185 infinite-loop pattern
 * triggered by subscribing to selectors that return a new array each render.
 */

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { useProductFinder } from "@/lib/product-finder-store";
import { AuthGuard } from "@/features/product-finder/AuthGuard";
import { ProductFinderShell } from "@/features/product-finder/ProductFinderShell";
import { getCatalog } from "@/lib/catalog/index";
import { CATEGORIES } from "@/lib/catalog/taxonomy";
import {
  salesKpis,
  topCategories,
  topProducts,
  ordersOverTime,
  customerMix,
  contractSavings,
  type CategoryStat,
  type TimeBucket,
} from "@/lib/analytics";
import { quotePipeline } from "@/lib/product-finder-quote-pipeline";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_COLOR } from "@/lib/product-finder-quotes";
import { winLossByBand, winLossSummary } from "@/lib/product-finder-winloss";
import { allCustomerHealth, HEALTH_COLOR, HEALTH_LABEL } from "@/lib/product-finder-customer-health";
import { demandForecast, WINDOW_DAYS } from "@/lib/product-finder-forecast";
import { CrossCoveragePanel } from "@/features/product-finder/CrossCoveragePanel";
import { subcategoryShareQuery } from "@/lib/product-finder-url";
import { categoryShareQuery } from "@/lib/product-finder-url";
import { apiGetProduct } from "@/lib/product-finder-api";
import type { ProductCategory } from "@/features/product-finder/types";

// ─── Brand tertiary palette for chart series ──────────────────────────────────
const SERIES_COLORS = ["#EAAA00", "#64CCC9", "#DB6B30", "#004986", "#00573F"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt$(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  /** When set, the card renders as a drill-through button. */
  onClick?: () => void;
  ariaLabel?: string;
}

function KpiCard({ label, value, sub, accent = "#00AA13", onClick, ariaLabel }: KpiCardProps) {
  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-widest text-[#4F758B]">{label}</p>
      <p
        className="mt-1 text-2xl font-bold"
        style={{ color: accent }}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-[#4F758B]">{sub}</p>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? label}
        className="rounded-xl border border-[#B7C9D3]/40 bg-white p-5 text-left shadow-sm transition-colors hover:border-[#4F758B]"
      >
        {inner}
      </button>
    );
  }
  return <div className="rounded-xl border border-[#B7C9D3]/40 bg-white p-5 shadow-sm">{inner}</div>;
}

// ─── Drill-through helpers ────────────────────────────────────────────────────

function isProductCategory(value: string): value is ProductCategory {
  return (CATEGORIES as string[]).includes(value);
}

/** Minimal shape of the recharts categorical-chart click state we read. */
type ChartClickState = {
  activePayload?: { payload?: unknown }[];
} | null;

// ─── Dashboard content (for manager/admin only) ───────────────────────────────

function DashboardContent() {
  // Stable selectors — these return the same reference unless the store value
  // actually changes (Zustand shallow-compares primitives and array identity).
  const orders = useProductFinder((s) => s.orders);
  const quotes = useProductFinder((s) => s.quotes);
  const customers = useProductFinder((s) => s.customers);
  const user = useProductFinder((s) => s.user);
  const openCartAt = useProductFinder((s) => s.openCartAt);
  const setActiveCustomer = useProductFinder((s) => s.setActiveCustomer);
  const setDetailModalProduct = useProductFinder((s) => s.setDetailModalProduct);
  const router = useRouter();

  // Compute all analytics once per `orders` change — never on re-render.
  const catalog = useMemo(() => getCatalog(), []);
  const now = useMemo(() => Date.now(), []);

  const kpis = useMemo(() => salesKpis(orders), [orders]);
  const categories = useMemo(() => topCategories(orders, catalog, 6), [orders, catalog]);
  const products = useMemo(() => topProducts(orders, 8), [orders]);
  const overTime = useMemo(() => ordersOverTime(orders, now, 6), [orders, now]);
  const mix = useMemo(() => customerMix(orders), [orders]);
  const savings = useMemo(() => contractSavings(orders), [orders]);
  const pipeline = useMemo(() => quotePipeline(quotes, now), [quotes, now]);
  const winLossBands = useMemo(() => winLossByBand(quotes), [quotes]);
  const wlSummary = useMemo(() => winLossSummary(quotes), [quotes]);
  const customerHealthList = useMemo(
    () => allCustomerHealth(orders, customers, now),
    [orders, customers, now]
  );
  const forecast = useMemo(() => demandForecast(orders, quotes, now, 6), [orders, quotes, now]);

  // ── Drill-through handlers ──────────────────────────────────────────────────
  // Bar click payload carries the original CategoryStat datum.
  const handleCategoryClick = (entry: { payload?: CategoryStat }) => {
    const category = entry.payload?.category;
    if (category && isProductCategory(category)) {
      router.push("/product-finder?" + categoryShareQuery(category));
    }
  };

  // Chart-level click: read the hovered point's TimeBucket (year/month).
  const handleOverTimeClick = (state: ChartClickState) => {
    const payload = state?.activePayload?.[0]?.payload;
    if (
      payload !== null &&
      typeof payload === "object" &&
      payload !== undefined &&
      "year" in payload &&
      "month" in payload
    ) {
      const bucket = payload as TimeBucket;
      openCartAt("orders", { orderMonth: { year: bucket.year, month: bucket.month } });
    }
  };

  // Open the same detail modal ProductCard uses — full product via the API.
  const handleProductClick = async (id: string) => {
    try {
      const detail = await apiGetProduct(id, user?.branchId);
      setDetailModalProduct(detail.product);
    } catch {
      // Fetch failure → no-op (the row simply doesn't open).
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1D252D]">Analytics Dashboard</h1>
          <p className="mt-0.5 text-sm text-[#4F758B]">
            {user?.name} &middot; {user?.branch}
          </p>
        </div>
        <Link
          href="/product-finder"
          className="shrink-0 rounded-lg border border-[#4F758B] px-3 py-1.5 text-xs font-semibold text-[#4F758B] hover:border-[#1D252D] hover:text-[#1D252D] transition-colors"
        >
          &larr; Back to Finder
        </Link>
      </div>

      {/* ── Demo disclaimer ───────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-[#EAAA00]/50 bg-[#EAAA00]/10 px-4 py-2">
        <p className="text-xs text-[#1D252D]">
          <span className="font-semibold">Demo analytics</span> — derived from sample data.
          Figures reflect seeded demo orders, not real transaction history.
        </p>
      </div>

      {/* ── KPI cards ─────────────────────────────────────────────────────────── */}
      <section aria-label="Key performance indicators">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#4F758B]">
          Key Metrics
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="Total Orders"
            value={String(kpis.orderCount)}
            onClick={() => openCartAt("orders")}
            ariaLabel="View order history — total orders"
          />
          <KpiCard
            label="Total Value"
            value={fmt$(kpis.totalValue)}
            onClick={() => openCartAt("orders")}
            ariaLabel="View order history — total value"
          />
          <KpiCard
            label="Avg Order Value"
            value={fmt$(kpis.avgOrderValue)}
            accent="#004986"
            onClick={() => openCartAt("orders")}
            ariaLabel="View order history — average order value"
          />
          <KpiCard
            label="Active Customers"
            value={String(kpis.activeCustomers)}
            accent="#64CCC9"
            onClick={() => openCartAt("orders")}
            ariaLabel="View order history — active customers"
          />
        </div>
      </section>

      {/* ── Contract savings ──────────────────────────────────────────────────── */}
      <section
        aria-label="Contract savings"
        className="rounded-xl border border-[#00573F]/30 bg-[#00573F]/5 p-4"
      >
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#00573F]">
          Contract Savings Delivered
        </h2>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-[#4F758B]">List Total</p>
            <p className="text-lg font-bold text-[#1D252D]">{fmt$(savings.listTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-[#4F758B]">Effective (Contract)</p>
            <p className="text-lg font-bold text-[#1D252D]">{fmt$(savings.effectiveTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-[#4F758B]">Savings</p>
            <p className="text-lg font-bold text-[#00573F]">{fmt$(savings.savings)}</p>
          </div>
          <div>
            <p className="text-xs text-[#4F758B]">Savings %</p>
            <p className="text-lg font-bold text-[#00573F]">
              {savings.savingsPct.toFixed(1)}%
            </p>
          </div>
        </div>
      </section>

      {/* ── Quote pipeline ────────────────────────────────────────────────────── */}
      <section
        aria-label="Quote pipeline"
        className="rounded-xl border border-[#004986]/30 bg-[#004986]/5 p-4"
      >
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#004986]">
            Quote Pipeline
          </h2>
          <span className="text-xs text-[#4F758B]">
            {pipeline.totalCount} quote{pipeline.totalCount !== 1 ? "s" : ""} ·{" "}
            win rate <span className="font-semibold text-[#1D252D]">{(pipeline.winRate * 100).toFixed(0)}%</span>
          </span>
        </div>

        {pipeline.totalCount === 0 ? (
          <p className="py-4 text-center text-xs text-[#4F758B]">
            No saved quotes yet. Quotes saved from the cart appear here.
          </p>
        ) : (
          <>
            {/* Status breakdown */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {pipeline.byStatus.map((s) => {
                const c = QUOTE_STATUS_COLOR[s.status];
                return (
                  <button
                    key={s.status}
                    type="button"
                    onClick={() => openCartAt("quotes", { quoteStatus: s.status })}
                    aria-label={`View ${QUOTE_STATUS_LABEL[s.status]} quotes`}
                    className="rounded-lg border border-[#B7C9D3]/40 bg-white p-3 text-left transition-colors hover:border-[#4F758B]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{ backgroundColor: c.bg, color: c.text }}
                      >
                        {QUOTE_STATUS_LABEL[s.status]}
                      </span>
                      <span className="text-xs text-[#4F758B]">×{s.count}</span>
                    </div>
                    <p className="mt-1 text-lg font-bold text-[#1D252D]">{fmt$(s.value)}</p>
                  </button>
                );
              })}
            </div>

            {/* Open vs won summary */}
            <div className="mt-3 flex flex-wrap gap-6">
              <button
                type="button"
                onClick={() => openCartAt("quotes")}
                aria-label="View saved quotes — open value"
                className="text-left"
              >
                <p className="text-xs text-[#4F758B]">Open (draft + sent)</p>
                <p className="text-lg font-bold text-[#004986]">{fmt$(pipeline.openValue)}</p>
              </button>
              <button
                type="button"
                onClick={() => openCartAt("quotes")}
                aria-label="View saved quotes — won value"
                className="text-left"
              >
                <p className="text-xs text-[#4F758B]">Won</p>
                <p className="text-lg font-bold text-[#00AA13]">{fmt$(pipeline.wonValue)}</p>
              </button>
              <button
                type="button"
                onClick={() => openCartAt("quotes")}
                aria-label="View saved quotes — lost value"
                className="text-left"
              >
                <p className="text-xs text-[#4F758B]">Lost</p>
                <p className="text-lg font-bold text-[#DB6B30]">{fmt$(pipeline.lostValue)}</p>
              </button>
              <button
                type="button"
                onClick={() => openCartAt("quotes")}
                aria-label="View saved quotes — converted to orders"
                className="text-left"
              >
                <p className="text-xs text-[#4F758B]">
                  Converted to orders
                  <span className="ml-1 text-[#B7C9D3]">
                    ({(pipeline.conversionRate * 100).toFixed(0)}% of won)
                  </span>
                </p>
                <p className="text-lg font-bold text-[#00573F]">
                  {fmt$(pipeline.convertedValue)}{" "}
                  <span className="text-xs font-normal text-[#4F758B]">×{pipeline.convertedCount}</span>
                </p>
              </button>
            </div>

            {/* Below-margin quotes awaiting approval */}
            {pipeline.needsApproval.length > 0 && (
              <div className="mt-3 rounded-lg border border-[#DB6B30]/50 bg-[#DB6B30]/10 px-3 py-2">
                <p className="text-xs font-semibold text-[#1D252D]">
                  🔏 {pipeline.needsApproval.length} below-margin quote{pipeline.needsApproval.length !== 1 ? "s" : ""} awaiting approval
                </p>
                <ul className="mt-1 space-y-0.5">
                  {pipeline.needsApproval.slice(0, 5).map((q) => (
                    <li key={q.id} className="truncate text-[11px] text-[#4F758B]">
                      {q.number} · {q.customer || "—"} · {fmt$(q.total)}
                      {q.marginPct !== undefined && ` · margin ${(q.marginPct * 100).toFixed(0)}%`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Stale / needs-follow-up */}
            {pipeline.stale.length > 0 && (
              <div className="mt-3 rounded-lg border border-[#EAAA00]/50 bg-[#EAAA00]/10 px-3 py-2">
                <p className="text-xs font-semibold text-[#1D252D]">
                  ⚠ {pipeline.stale.length} sent quote{pipeline.stale.length !== 1 ? "s" : ""} need
                  {pipeline.stale.length === 1 ? "s" : ""} follow-up (sent &gt; 14 days ago)
                </p>
                <ul className="mt-1 space-y-0.5">
                  {pipeline.stale.slice(0, 5).map((q) => (
                    <li key={q.id} className="truncate text-[11px] text-[#4F758B]">
                      {q.number} · {q.customer || "—"} · {fmt$(q.total)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Customer counter-offers awaiting a response */}
            {pipeline.countered.length > 0 && (
              <div className="mt-3 rounded-lg border border-[#004986]/50 bg-[#004986]/10 px-3 py-2">
                <p className="text-xs font-semibold text-[#1D252D]">
                  ↩️ {pipeline.countered.length} counter-offer{pipeline.countered.length !== 1 ? "s" : ""} awaiting a response
                </p>
                <ul className="mt-1 space-y-0.5">
                  {pipeline.countered.slice(0, 5).map((q) => (
                    <li key={q.id} className="truncate text-[11px] text-[#4F758B]">
                      {q.number} · {q.customer || "—"} · {fmt$(q.total)} · “{q.counterOffer?.note}”
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Pricing win/loss + Customer health ─────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Win/loss by margin band */}
        <section
          aria-label="Pricing win/loss by margin band"
          className="rounded-xl border border-[#B7C9D3]/40 bg-white p-4 shadow-sm"
        >
          <h2 className="mb-1 text-sm font-semibold text-[#1D252D]">
            Pricing Win/Loss
            <span className="ml-1 text-xs font-normal text-[#4F758B]">(by margin band)</span>
          </h2>
          {wlSummary.decided === 0 ? (
            <p className="py-8 text-center text-xs text-[#4F758B]">
              No decided quotes yet — win/loss insights appear once quotes are marked Won or Lost.
            </p>
          ) : (
            <>
              <p className="mb-3 text-xs text-[#4F758B]">
                {wlSummary.decided} decided quotes · won avg margin{" "}
                <span className="font-semibold text-[#00AA13]">
                  {wlSummary.avgMarginWon !== null ? `${(wlSummary.avgMarginWon * 100).toFixed(0)}%` : "—"}
                </span>{" "}
                vs lost{" "}
                <span className="font-semibold text-[#DB6B30]">
                  {wlSummary.avgMarginLost !== null ? `${(wlSummary.avgMarginLost * 100).toFixed(0)}%` : "—"}
                </span>
              </p>
              <ul className="space-y-1.5">
                {winLossBands.map((b) => (
                  <li key={b.band} className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-xs font-semibold text-[#1D252D]">{b.band}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded bg-[#B7C9D3]/30">
                      {b.decided > 0 && (
                        <div
                          className="h-full rounded bg-[#004986]"
                          style={{ width: `${Math.round(b.winRate * 100)}%` }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <span className="w-24 shrink-0 text-right text-xs text-[#4F758B]">
                      {b.decided === 0 ? (
                        "—"
                      ) : (
                        <>
                          <span className="font-semibold text-[#1D252D]">{Math.round(b.winRate * 100)}%</span>{" "}
                          ({b.won}W/{b.lost}L)
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10px] italic text-[#4F758B]">
                The same guidance appears in the basket while a rep is pricing — simulated history.
              </p>
            </>
          )}
        </section>

        {/* Customer health */}
        <section
          aria-label="Customer health"
          className="rounded-xl border border-[#B7C9D3]/40 bg-white p-4 shadow-sm"
        >
          <h2 className="mb-3 text-sm font-semibold text-[#1D252D]">
            Customer Health
            <span className="ml-1 text-xs font-normal text-[#4F758B]">(order cadence)</span>
          </h2>
          {customerHealthList.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#4F758B]">No customer accounts.</p>
          ) : (
            <ul className="space-y-2">
              {customerHealthList.map((h) => (
                <li key={h.customerId}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCustomer(h.customerId);
                      openCartAt("orders");
                    }}
                    aria-label={`View orders for ${h.customerName}`}
                    className="flex w-full items-center gap-3 rounded text-left transition-colors hover:bg-[#B7C9D3]/20"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: HEALTH_COLOR[h.status] }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-[#1D252D]">{h.customerName}</span>
                      <span className="block truncate text-[11px] text-[#4F758B]">{h.message}</span>
                    </span>
                    <span
                      className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                      style={{
                        backgroundColor: HEALTH_COLOR[h.status],
                        color: h.status === "watch" || h.status === "new" ? "#1D252D" : "#FFFFFF",
                      }}
                    >
                      {HEALTH_LABEL[h.status]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── Branch demand forecast ─────────────────────────────────────────────── */}
      <section
        aria-label="Branch demand forecast"
        className="rounded-xl border border-[#00573F]/30 bg-[#00573F]/5 p-4"
      >
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#00573F]">
            Branch Demand Forecast
          </h2>
          <span className="text-xs text-[#4F758B]">
            trailing {WINDOW_DAYS} days of orders + won quotes → next 30 days
          </span>
        </div>
        {forecast.length === 0 ? (
          <p className="py-4 text-center text-xs text-[#4F758B]">
            No demand history yet — forecasts appear as orders and won quotes accumulate.
          </p>
        ) : (
          <ul className="grid gap-2 lg:grid-cols-2">
            {forecast.map((f) => (
              <li key={f.subcategory}>
                <button
                  type="button"
                  onClick={() => router.push("/product-finder?" + subcategoryShareQuery(f.subcategory))}
                  aria-label={`Browse ${f.subcategory}`}
                  className="flex w-full items-center gap-3 rounded-lg border border-[#B7C9D3]/40 bg-white px-3 py-2 text-left transition-colors hover:border-[#00573F]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-[#1D252D]">{f.subcategory}</span>
                      <span
                        aria-label={`trend ${f.trend}`}
                        className="text-xs"
                        style={{ color: f.trend === "up" ? "#00AA13" : f.trend === "down" ? "#DB6B30" : "#4F758B" }}
                      >
                        {f.trend === "up" ? "▲" : f.trend === "down" ? "▼" : "→"}
                      </span>
                    </span>
                    <span className="block truncate text-[11px] text-[#4F758B]">
                      {f.qty90d} units / {WINDOW_DAYS}d ({f.monthlyRate}/mo)
                      {f.topProduct ? ` · top: ${f.topProduct.name}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-lg font-bold text-[#00573F]">~{f.projected30d}</span>
                    <span className="block text-[9px] uppercase tracking-wide text-[#4F758B]">
                      stock next 30d
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[10px] italic text-[#4F758B]">
          Simple moving-average projection with a trend adjustment — demo data; a real
          forecasting model plugs into the same panel.
        </p>
      </section>

      {/* ── Cross-reference coverage ───────────────────────────────────────────── */}
      <CrossCoveragePanel />

      {/* ── Charts row: Top categories + Orders over time ──────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top categories bar chart */}
        <section
          aria-label="Top categories by order value"
          className="rounded-xl border border-[#B7C9D3]/40 bg-white p-4 shadow-sm"
        >
          <h2 className="mb-3 text-sm font-semibold text-[#1D252D]">
            Top Categories
            <span className="ml-1 text-xs font-normal text-[#4F758B]">(list value)</span>
          </h2>
          {categories.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#4F758B]">No order data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={categories}
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} width={55} />
                <Tooltip formatter={(v: number) => [fmt$(v), "Value"]} />
                <Bar
                  dataKey="value"
                  name="Value ($)"
                  fill={SERIES_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={handleCategoryClick}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* Orders over time line chart */}
        <section
          aria-label="Orders over time"
          className="rounded-xl border border-[#B7C9D3]/40 bg-white p-4 shadow-sm"
        >
          <h2 className="mb-3 text-sm font-semibold text-[#1D252D]">
            Orders Over Time
            <span className="ml-1 text-xs font-normal text-[#4F758B]">(last 6 months)</span>
          </h2>
          {overTime.every((b) => b.count === 0) ? (
            <p className="py-8 text-center text-xs text-[#4F758B]">No order data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={overTime}
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                onClick={handleOverTimeClick}
                className="cursor-pointer"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="val"
                  orientation="left"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `$${v}`}
                  width={55}
                />
                <YAxis
                  yAxisId="cnt"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  width={30}
                />
                <Tooltip
                  formatter={(v: number, name: string) =>
                    name === "Value ($)" ? [fmt$(v), name] : [v, name]
                  }
                />
                <Legend />
                <Line
                  yAxisId="val"
                  type="monotone"
                  dataKey="value"
                  name="Value ($)"
                  stroke={SERIES_COLORS[1]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="cnt"
                  type="monotone"
                  dataKey="count"
                  name="Orders"
                  stroke={SERIES_COLORS[2]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      {/* ── Top products + Customer mix ────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top products list */}
        <section
          aria-label="Top products"
          className="rounded-xl border border-[#B7C9D3]/40 bg-white p-4 shadow-sm"
        >
          <h2 className="mb-3 text-sm font-semibold text-[#1D252D]">
            Top Products
            <span className="ml-1 text-xs font-normal text-[#4F758B]">(by list value)</span>
          </h2>
          {products.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#4F758B]">No order data yet.</p>
          ) : (
            <ol className="space-y-2">
              {products.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => handleProductClick(p.id)}
                    aria-label={`View product details for ${p.name}`}
                    className="flex w-full items-center gap-3 rounded text-left transition-colors hover:bg-[#B7C9D3]/20"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1D252D] text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-[#1D252D]">
                      {p.name}
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-[#4F758B]">
                      {fmt$(p.value)}
                    </span>
                    <span className="shrink-0 text-xs text-[#B7C9D3]">
                      ×{p.qty}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Customer mix */}
        <section
          aria-label="Customer mix"
          className="rounded-xl border border-[#B7C9D3]/40 bg-white p-4 shadow-sm"
        >
          <h2 className="mb-3 text-sm font-semibold text-[#1D252D]">
            Customer Mix
            <span className="ml-1 text-xs font-normal text-[#4F758B]">(by total spend)</span>
          </h2>
          {mix.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#4F758B]">No order data yet.</p>
          ) : (
            <ul className="space-y-2">
              {mix.map((entry, i) => {
                const totalEffective = kpis.totalValue;
                const pct =
                  totalEffective > 0
                    ? ((entry.value / totalEffective) * 100).toFixed(0)
                    : "0";
                return (
                  <li key={entry.customerName}>
                    <button
                      type="button"
                      onClick={() => {
                        // null customerId = walk-in — a valid selection.
                        setActiveCustomer(entry.customerId);
                        openCartAt("orders");
                      }}
                      aria-label={`View orders for ${entry.customerName}`}
                      className="flex w-full items-center gap-3 rounded text-left transition-colors hover:bg-[#B7C9D3]/20"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-[#1D252D]">
                        {entry.customerName}
                      </span>
                      <span className="shrink-0 text-xs text-[#4F758B]">
                        {entry.count} order{entry.count !== 1 ? "s" : ""}
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-[#1D252D]">
                        {fmt$(entry.value)}
                      </span>
                      <span className="shrink-0 text-xs text-[#B7C9D3]">{pct}%</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

// ─── Role gate ────────────────────────────────────────────────────────────────

function RoleGate() {
  const user = useProductFinder((s) => s.user);
  const canViewDashboard =
    user?.role === "manager" || user?.role === "admin";

  if (!canViewDashboard) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="text-4xl" role="img" aria-label="Chart">
          📊
        </span>
        <h1 className="text-lg font-semibold text-[#1D252D]">
          Insights are available to managers
        </h1>
        <p className="max-w-sm text-sm text-[#4F758B]">
          The analytics dashboard is only accessible to manager and admin
          roles. Contact your branch manager to request access.
        </p>
        <Link
          href="/product-finder"
          className="mt-2 rounded-lg bg-[#1D252D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4F758B] transition-colors"
        >
          Back to Product Finder
        </Link>
      </div>
    );
  }

  return <DashboardContent />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <AuthGuard>
      <ProductFinderShell>
        <RoleGate />
      </ProductFinderShell>
    </AuthGuard>
  );
}
