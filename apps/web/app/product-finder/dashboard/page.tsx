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
import {
  salesKpis,
  topCategories,
  topProducts,
  ordersOverTime,
  customerMix,
  contractSavings,
} from "@/lib/analytics";

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
}

function KpiCard({ label, value, sub, accent = "#00AA13" }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-[#B7C9D3]/40 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#4F758B]">{label}</p>
      <p
        className="mt-1 text-2xl font-bold"
        style={{ color: accent }}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-[#4F758B]">{sub}</p>}
    </div>
  );
}

// ─── Dashboard content (for manager/admin only) ───────────────────────────────

function DashboardContent() {
  // Stable selectors — these return the same reference unless the store value
  // actually changes (Zustand shallow-compares primitives and array identity).
  const orders = useProductFinder((s) => s.orders);
  const user = useProductFinder((s) => s.user);

  // Compute all analytics once per `orders` change — never on re-render.
  const catalog = useMemo(() => getCatalog(), []);
  const now = useMemo(() => Date.now(), []);

  const kpis = useMemo(() => salesKpis(orders), [orders]);
  const categories = useMemo(() => topCategories(orders, catalog, 6), [orders, catalog]);
  const products = useMemo(() => topProducts(orders, 8), [orders]);
  const overTime = useMemo(() => ordersOverTime(orders, now, 6), [orders, now]);
  const mix = useMemo(() => customerMix(orders), [orders]);
  const savings = useMemo(() => contractSavings(orders), [orders]);

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
          <KpiCard label="Total Orders" value={String(kpis.orderCount)} />
          <KpiCard label="Total Value" value={fmt$(kpis.totalValue)} />
          <KpiCard
            label="Avg Order Value"
            value={fmt$(kpis.avgOrderValue)}
            accent="#004986"
          />
          <KpiCard
            label="Active Customers"
            value={String(kpis.activeCustomers)}
            accent="#64CCC9"
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
                <Bar dataKey="value" name="Value ($)" fill={SERIES_COLORS[0]} radius={[4, 4, 0, 0]} />
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
                <li key={p.id} className="flex items-center gap-3">
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
                  <li key={entry.customerName} className="flex items-center gap-3">
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
