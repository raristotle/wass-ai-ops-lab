import { Badge } from "@/components/ui/badge";
import { ConfidenceCell } from "@/features/governance/GovernanceChips";
import { mockAccounts } from "@/data/mock/accounts";
import { mockQuotes } from "@/data/mock/quotes";
import { mockOrders } from "@/data/mock/orders";
import { mockInventory } from "@/data/mock/inventory";
import { mockSuppliers } from "@/data/mock/suppliers";
import { mockRebates } from "@/data/mock/rebates";
import { mockProjects } from "@/data/mock/projects";
import { mockShipments } from "@/data/mock/shipments";
import { mockInvoices } from "@/data/mock/invoices";
import { mockAiUseCases } from "@/data/mock/ai-use-cases";
import { formatCurrency, formatTokens, formatNumber } from "@/lib/utils";
import type { Kpi } from "./KpiStrip";
import type { Column } from "./ShellTable";
import type { ChartType, ChartKey } from "./ChartArea";
import type { Section } from "@/lib/store";

type Row = Record<string, unknown>;

export interface SectionConfig {
  title: string;
  getData: () => Row[];
  computeKpis: (data: Row[]) => Kpi[];
  computeChartData: (data: Row[]) => {
    title: string;
    data: Row[];
    keys: ChartKey[];
    type: ChartType;
    xKey?: string;
  };
  columns: Column[];
}

// ── helpers ──────────────────────────────────────────────────────────────────

function lastNMonths(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (n - 1 - i));
    return d.toISOString().substring(0, 7);
  });
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("default", { month: "short", year: "2-digit" });
}

function groupByMonth<T extends Row>(data: T[], dateKey: string) {
  const map = new Map<string, T[]>();
  for (const row of data) {
    const val = row[dateKey];
    if (!val) continue;
    const ym = String(val).substring(0, 7);
    if (!map.has(ym)) map.set(ym, []);
    map.get(ym)!.push(row);
  }
  return map;
}

function statusBadge(val: unknown): React.ReactNode {
  const s = String(val ?? "");
  const v: Record<string, Parameters<typeof Badge>[0]["variant"]> = {
    Active: "success", Deployed: "success", Paid: "success", Delivered: "success", Completed: "success", Approved: "success",
    Pending: "secondary", Draft: "secondary", Planning: "secondary", Ideation: "secondary", Queued: "secondary",
    Submitted: "default", "In Transit": "default", Processing: "default", Confirmed: "default", Accruing: "default", Pilot: "default",
    "On Hold": "warning", "Under Review": "warning", Mitigated: "warning", Scaling: "warning", Onboarding: "warning",
    Overdue: "destructive", Failed: "destructive", Exception: "destructive", Critical: "destructive", Investigating: "destructive",
    Cancelled: "outline", Deprecated: "outline", Inactive: "outline", Void: "outline", Expired: "outline", Suspended: "outline",
  };
  return <Badge variant={v[s] ?? "secondary"}>{s}</Badge>;
}

const fmtDate = (val: unknown) => val ? new Date(String(val)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—";
const fmtMoney = (val: unknown) => formatCurrency(Number(val ?? 0));
const fmtPct = (val: unknown) => `${(Number(val ?? 0) * 100).toFixed(1)}%`;

// ── section configs ───────────────────────────────────────────────────────────

const CONFIGS: Record<Exclude<Section, "imt-risk">, SectionConfig> = {

  dashboard: {
    title: "Dashboard",
    getData: () => mockOrders as unknown as Row[],
    computeKpis: (_data) => {
      const openOrders = mockOrders.filter((o) => !["Delivered", "Cancelled"].includes(o.status)).length;
      const totalInvoiced = mockInvoices.reduce((s, i) => s + i.total, 0);
      const activeProjects = mockProjects.filter((p) => p.status === "Active").length;
      return [
        { label: "Accounts",       value: String(mockAccounts.length),      delta: "25 total",             trend: "up",   accent: "blue"   },
        { label: "Open Orders",    value: String(openOrders),                delta: `of ${mockOrders.length} orders`, trend: "flat", accent: "yellow" },
        { label: "Total Invoiced", value: formatTokens(totalInvoiced),       delta: "across all periods",   trend: "up",   accent: "green"  },
        { label: "Active Projects",value: String(activeProjects),            delta: `of ${mockProjects.length} projects`, trend: "up", accent: "purple" },
      ];
    },
    computeChartData: (_data) => {
      const months = lastNMonths(12);
      const ordersByMonth = groupByMonth(mockOrders as unknown as Row[], "orderDate");
      const invoicesByMonth = groupByMonth(mockInvoices as unknown as Row[], "issuedDate");
      return {
        title: "Orders & Invoices — Last 12 Months",
        data: months.map((m) => ({
          month: monthLabel(m),
          orders: ordersByMonth.get(m)?.length ?? 0,
          invoiced: Math.round((invoicesByMonth.get(m)?.reduce((s, i) => s + Number(i.total), 0) ?? 0) / 1000),
        })),
        keys: [
          { dataKey: "orders",   name: "Orders",        color: "#6366f1" },
          { dataKey: "invoiced", name: "Invoiced ($K)", color: "#10b981" },
        ],
        type: "area",
      };
    },
    columns: [
      { key: "id",          label: "Order ID",  className: "font-mono" },
      { key: "accountName", label: "Account" },
      { key: "value",       label: "Value",    render: (v) => fmtMoney(v) },
      { key: "status",      label: "Status",   render: statusBadge, sortable: false },
      { key: "orderDate",   label: "Date",     render: fmtDate },
    ],
  },

  accounts: {
    title: "Accounts",
    getData: () => mockAccounts as unknown as Row[],
    computeKpis: (data) => {
      const active = data.filter((r) => r.status === "Active").length;
      const gold = data.filter((r) => r.tier === "Gold").length;
      const revenue = data.reduce((s, r) => s + Number(r.annualRevenue ?? 0), 0);
      return [
        { label: "Total Accounts", value: String(data.length),        delta: "all SBUs",       trend: "up",   accent: "blue"   },
        { label: "Active",         value: String(active),             delta: `${((active/Math.max(data.length,1))*100).toFixed(0)}% rate`, trend: "up", accent: "green" },
        { label: "Gold Tier",      value: String(gold),               delta: "top customers",  trend: "flat", accent: "yellow" },
        { label: "Annual Revenue", value: `$${(revenue/1e6).toFixed(0)}M`, delta: "+12% YoY",  trend: "up",   accent: "green"  },
      ];
    },
    computeChartData: (data) => {
      const months = lastNMonths(12);
      const byMonth = groupByMonth(data, "createdAt");
      return {
        title: "New Accounts — Last 12 Months",
        data: months.map((m) => ({ month: monthLabel(m), accounts: byMonth.get(m)?.length ?? 0 })),
        keys: [{ dataKey: "accounts", name: "New Accounts", color: "#6366f1" }],
        type: "bar",
      };
    },
    columns: [
      { key: "id",             label: "ID",       className: "font-mono text-muted-foreground" },
      { key: "name",           label: "Name",     className: "font-medium" },
      { key: "sbu",            label: "SBU" },
      { key: "tier",           label: "Tier",     render: (v) => <Badge variant={v === "Gold" ? "warning" : v === "Silver" ? "secondary" : "outline"}>{String(v)}</Badge> },
      { key: "status",         label: "Status",   render: statusBadge, sortable: false },
      { key: "annualRevenue",  label: "Revenue",  render: fmtMoney },
      { key: "accountManager", label: "Manager" },
      { key: "region",         label: "Region" },
    ],
  },

  quotes: {
    title: "Quotes",
    getData: () => mockQuotes as unknown as Row[],
    computeKpis: (data) => {
      const open = data.filter((r) => ["Draft","Submitted","Under Review"].includes(String(r.status))).length;
      const won = data.filter((r) => r.status === "Approved").length;
      const lost = data.filter((r) => r.status === "Rejected").length;
      const winRate = won + lost > 0 ? (won / (won + lost)) * 100 : 0;
      const total = data.reduce((s, r) => s + Number(r.value ?? 0), 0);
      return [
        { label: "Total Quotes", value: String(data.length),         delta: "all statuses",         trend: "up",   accent: "blue"   },
        { label: "Open",         value: String(open),                delta: "awaiting decision",     trend: "flat", accent: "yellow" },
        { label: "Win Rate",     value: `${winRate.toFixed(0)}%`,    delta: `${won}W / ${lost}L`,   trend: winRate >= 60 ? "up" : "down", accent: winRate >= 60 ? "green" : "red" },
        { label: "Total Value",  value: `$${(total/1e6).toFixed(1)}M`, delta: "pipeline",           trend: "up",   accent: "green"  },
      ];
    },
    computeChartData: (data) => {
      const months = lastNMonths(12);
      const byMonth = groupByMonth(data, "createdAt");
      return {
        title: "Quote Volume — Last 12 Months",
        data: months.map((m) => {
          const rows = byMonth.get(m) ?? [];
          return {
            month: monthLabel(m),
            submitted: rows.filter((r) => r.status !== "Draft").length,
            approved: rows.filter((r) => r.status === "Approved").length,
          };
        }),
        keys: [
          { dataKey: "submitted", name: "Submitted", color: "#6366f1" },
          { dataKey: "approved",  name: "Approved",  color: "#10b981" },
        ],
        type: "bar",
      };
    },
    columns: [
      { key: "id",          label: "ID",       className: "font-mono text-muted-foreground" },
      { key: "accountName", label: "Account",  className: "font-medium" },
      { key: "title",       label: "Title",    className: "max-w-[200px] truncate" },
      { key: "value",       label: "Value",    render: fmtMoney },
      { key: "margin",      label: "Margin",   render: fmtPct },
      { key: "status",      label: "Status",   render: statusBadge, sortable: false },
      { key: "validUntil",  label: "Valid Until", render: fmtDate },
    ],
  },

  orders: {
    title: "Orders",
    getData: () => mockOrders as unknown as Row[],
    computeKpis: (data) => {
      const open = data.filter((r) => ["Pending","Confirmed","Processing"].includes(String(r.status))).length;
      const inTransit = data.filter((r) => r.status === "Shipped").length;
      const total = data.reduce((s, r) => s + Number(r.value ?? 0), 0);
      return [
        { label: "Total Orders",  value: String(data.length),           delta: "all time",       trend: "up",   accent: "blue"   },
        { label: "Open",          value: String(open),                  delta: "pending → processing", trend: "flat", accent: "yellow" },
        { label: "In Transit",    value: String(inTransit),             delta: "shipped",        trend: "flat", accent: "blue"   },
        { label: "Order Value",   value: `$${(total/1e6).toFixed(1)}M`, delta: "total",          trend: "up",   accent: "green"  },
      ];
    },
    computeChartData: (data) => {
      const months = lastNMonths(12);
      const byMonth = groupByMonth(data, "orderDate");
      return {
        title: "Order Volume & Value — Last 12 Months",
        data: months.map((m) => {
          const rows = byMonth.get(m) ?? [];
          return {
            month: monthLabel(m),
            count: rows.length,
            value: Math.round(rows.reduce((s, r) => s + Number(r.value ?? 0), 0) / 1000),
          };
        }),
        keys: [
          { dataKey: "count", name: "Orders",    color: "#6366f1" },
          { dataKey: "value", name: "Value ($K)", color: "#10b981" },
        ],
        type: "area",
      };
    },
    columns: [
      { key: "id",              label: "ID",       className: "font-mono text-muted-foreground" },
      { key: "accountName",     label: "Account",  className: "font-medium" },
      { key: "value",           label: "Value",    render: fmtMoney },
      { key: "status",          label: "Status",   render: statusBadge, sortable: false },
      { key: "orderDate",       label: "Order Date", render: fmtDate },
      { key: "expectedDelivery",label: "ETA",      render: fmtDate },
      { key: "lineItems",       label: "Lines" },
    ],
  },

  inventory: {
    title: "Inventory",
    getData: () => mockInventory as unknown as Row[],
    computeKpis: (data) => {
      const low = data.filter((r) => r.status === "Low Stock").length;
      const oos = data.filter((r) => r.status === "Out of Stock").length;
      const value = data.reduce((s, r) => s + Number(r.totalValue ?? 0), 0);
      return [
        { label: "Total SKUs",    value: String(data.length),           delta: "active items",   trend: "flat", accent: "blue"   },
        { label: "Low Stock",     value: String(low),                   delta: "below reorder",  trend: low > 3 ? "down" : "flat", accent: low > 3 ? "yellow" : "green" },
        { label: "Out of Stock",  value: String(oos),                   delta: "needs restocking", trend: oos > 0 ? "down" : "flat", accent: oos > 0 ? "red" : "green" },
        { label: "Stock Value",   value: `$${(value/1000).toFixed(0)}K`, delta: "on-hand",       trend: "up",   accent: "green"  },
      ];
    },
    computeChartData: (data) => {
      const byCategory = new Map<string, number>();
      for (const row of data) {
        const cat = String(row.category ?? "Other");
        byCategory.set(cat, (byCategory.get(cat) ?? 0) + Number(row.totalValue ?? 0));
      }
      return {
        title: "Stock Value by Category",
        data: Array.from(byCategory.entries()).map(([category, value]) => ({
          month: category.length > 14 ? category.substring(0, 14) + "…" : category,
          value: Math.round(value / 1000),
        })),
        keys: [{ dataKey: "value", name: "Value ($K)", color: "#6366f1" }],
        type: "bar",
        xKey: "month",
      };
    },
    columns: [
      { key: "sku",          label: "SKU",        className: "font-mono text-muted-foreground" },
      { key: "name",         label: "Name",       className: "font-medium" },
      { key: "category",     label: "Category" },
      { key: "quantity",     label: "Qty",        render: (v) => formatNumber(Number(v)) },
      { key: "reorderPoint", label: "Reorder" },
      { key: "status",       label: "Status",     render: statusBadge, sortable: false },
      { key: "totalValue",   label: "Value",      render: fmtMoney },
      { key: "location",     label: "Location" },
    ],
  },

  suppliers: {
    title: "Suppliers",
    getData: () => mockSuppliers as unknown as Row[],
    computeKpis: (data) => {
      const active = data.filter((r) => r.status === "Active").length;
      const strategic = data.filter((r) => r.tier === "Strategic").length;
      const spend = data.reduce((s, r) => s + Number(r.annualSpend ?? 0), 0);
      const avgQuality = data.length > 0 ? data.reduce((s, r) => s + Number(r.qualityScore ?? 0), 0) / data.length : 0;
      return [
        { label: "Total Suppliers", value: String(data.length),            delta: "all tiers",       trend: "up",   accent: "blue"   },
        { label: "Active",          value: String(active),                 delta: "approved & active", trend: "up",  accent: "green"  },
        { label: "Strategic",       value: String(strategic),              delta: "top-tier",         trend: "flat", accent: "yellow" },
        { label: "Annual Spend",    value: `$${(spend/1e6).toFixed(0)}M`,  delta: "total contracted", trend: "up",   accent: "green"  },
      ];
    },
    computeChartData: (data) => {
      const top10 = [...data].sort((a, b) => Number(b.annualSpend) - Number(a.annualSpend)).slice(0, 10);
      return {
        title: "Top 10 Suppliers by Annual Spend",
        data: top10.map((r) => ({
          month: String(r.name ?? "").split(" ").slice(0, 2).join(" "),
          spend: Math.round(Number(r.annualSpend ?? 0) / 1e6 * 10) / 10,
        })),
        keys: [{ dataKey: "spend", name: "Spend ($M)", color: "#10b981" }],
        type: "bar",
        xKey: "month",
      };
    },
    columns: [
      { key: "id",           label: "ID",       className: "font-mono text-muted-foreground" },
      { key: "name",         label: "Name",     className: "font-medium" },
      { key: "category",     label: "Category" },
      { key: "tier",         label: "Tier",     render: (v) => <Badge variant={v === "Strategic" ? "warning" : v === "Preferred" ? "default" : "secondary"}>{String(v)}</Badge> },
      { key: "status",       label: "Status",   render: statusBadge, sortable: false },
      { key: "annualSpend",  label: "Spend",    render: fmtMoney },
      { key: "qualityScore", label: "Quality",  render: (v) => `${Number(v).toFixed(1)}/10` },
      { key: "country",      label: "Country" },
    ],
  },

  rebates: {
    title: "Rebates",
    getData: () => mockRebates as unknown as Row[],
    computeKpis: (data) => {
      const receivable = data.filter((r) => r.direction === "Receivable");
      const payable = data.filter((r) => r.direction === "Payable");
      const totalReceivable = receivable.reduce((s, r) => s + Number(r.rebateAmount ?? 0), 0);
      const totalPayable = payable.reduce((s, r) => s + Number(r.rebateAmount ?? 0), 0);
      const pending = data.filter((r) => ["Accruing","Pending Approval"].includes(String(r.status))).length;
      const achieved = data.length > 0
        ? data.reduce((s, r) => s + (Number(r.achievedValue) / Math.max(Number(r.targetValue), 1)), 0) / data.length * 100 : 0;
      return [
        { label: "Total Rebates",    value: String(data.length),              delta: "active programmes", trend: "up",   accent: "blue"   },
        { label: "Receivable",       value: `$${(totalReceivable/1e6).toFixed(1)}M`, delta: "from customers", trend: "up", accent: "green" },
        { label: "Payable",          value: `$${(totalPayable/1e6).toFixed(1)}M`,    delta: "to suppliers",   trend: "down", accent: "yellow" },
        { label: "Avg Achievement",  value: `${achieved.toFixed(0)}%`,        delta: "vs target",        trend: achieved >= 85 ? "up" : "flat", accent: achieved >= 85 ? "green" : "yellow" },
      ];
    },
    computeChartData: (data) => {
      const byType = new Map<string, { target: number; achieved: number }>();
      for (const r of data) {
        const t = String(r.type ?? "Other");
        const cur = byType.get(t) ?? { target: 0, achieved: 0 };
        byType.set(t, { target: cur.target + Number(r.targetValue ?? 0), achieved: cur.achieved + Number(r.achievedValue ?? 0) });
      }
      return {
        title: "Target vs Achieved by Rebate Type ($M)",
        data: Array.from(byType.entries()).map(([type, v]) => ({
          month: type,
          target:   Math.round(v.target / 1e6 * 10) / 10,
          achieved: Math.round(v.achieved / 1e6 * 10) / 10,
        })),
        keys: [
          { dataKey: "target",   name: "Target ($M)",   color: "#e5e7eb" },
          { dataKey: "achieved", name: "Achieved ($M)",  color: "#10b981" },
        ],
        type: "bar",
        xKey: "month",
      };
    },
    columns: [
      { key: "id",              label: "ID",         className: "font-mono text-muted-foreground" },
      { key: "counterpartyName",label: "Counterparty", className: "font-medium" },
      { key: "direction",       label: "Direction",  render: (v) => <Badge variant={v === "Receivable" ? "success" : "secondary"}>{String(v)}</Badge> },
      { key: "type",            label: "Type" },
      { key: "targetValue",     label: "Target",     render: fmtMoney },
      { key: "achievedValue",   label: "Achieved",   render: fmtMoney },
      { key: "status",          label: "Status",     render: statusBadge, sortable: false },
      { key: "period",          label: "Period" },
    ],
  },

  projects: {
    title: "Projects",
    getData: () => mockProjects as unknown as Row[],
    computeKpis: (data) => {
      const active = data.filter((r) => r.status === "Active").length;
      const budget = data.reduce((s, r) => s + Number(r.budget ?? 0), 0);
      const spent = data.reduce((s, r) => s + Number(r.spent ?? 0), 0);
      const utilisation = budget > 0 ? (spent / budget) * 100 : 0;
      return [
        { label: "Total Projects",  value: String(data.length),              delta: "all statuses",   trend: "up",   accent: "blue"   },
        { label: "Active",          value: String(active),                   delta: "in flight",      trend: "up",   accent: "green"  },
        { label: "Total Budget",    value: `$${(budget/1e6).toFixed(1)}M`,  delta: "approved",       trend: "flat", accent: "yellow" },
        { label: "Budget Utilised", value: `${utilisation.toFixed(0)}%`,    delta: `$${(spent/1e6).toFixed(1)}M spent`, trend: utilisation > 90 ? "down" : "flat", accent: utilisation > 90 ? "red" : "green" },
      ];
    },
    computeChartData: (data) => {
      const top12 = [...data].sort((a, b) => Number(b.budget) - Number(a.budget)).slice(0, 12);
      return {
        title: "Budget vs Spent by Project ($K)",
        data: top12.map((r) => ({
          month: String(r.name ?? "").substring(0, 20),
          budget: Math.round(Number(r.budget ?? 0) / 1000),
          spent:  Math.round(Number(r.spent  ?? 0) / 1000),
        })),
        keys: [
          { dataKey: "budget", name: "Budget ($K)", color: "#e5e7eb" },
          { dataKey: "spent",  name: "Spent ($K)",  color: "#6366f1" },
        ],
        type: "bar",
        xKey: "month",
      };
    },
    columns: [
      { key: "id",            label: "ID",       className: "font-mono text-muted-foreground" },
      { key: "name",          label: "Name",     className: "font-medium" },
      { key: "sbu",           label: "SBU" },
      { key: "status",        label: "Status",   render: statusBadge, sortable: false },
      { key: "completionPct", label: "Progress", render: (v) => (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 rounded bg-muted overflow-hidden">
              <div className="h-full rounded bg-primary" style={{ width: `${Number(v)}%` }} />
            </div>
            <span>{Number(v)}%</span>
          </div>
        )},
      { key: "budget",        label: "Budget",   render: fmtMoney },
      { key: "spent",         label: "Spent",    render: fmtMoney },
      { key: "endDate",       label: "End Date", render: fmtDate },
    ],
  },

  shipments: {
    title: "Shipments",
    getData: () => mockShipments as unknown as Row[],
    computeKpis: (data) => {
      const inTransit = data.filter((r) => ["In Transit","Out for Delivery","Preparing"].includes(String(r.status))).length;
      const exceptions = data.filter((r) => r.status === "Exception").length;
      const delivered = data.filter((r) => r.status === "Delivered").length;
      const onTime = data.filter((r) => {
        if (r.status !== "Delivered" || !r.actualDelivery || !r.estimatedDelivery) return false;
        return String(r.actualDelivery) <= String(r.estimatedDelivery);
      }).length;
      const onTimeRate = delivered > 0 ? (onTime / delivered) * 100 : 0;
      return [
        { label: "Total Shipments", value: String(data.length),            delta: "all time",       trend: "up",   accent: "blue"   },
        { label: "In Transit",      value: String(inTransit),              delta: "active",         trend: "flat", accent: "yellow" },
        { label: "On-Time Rate",    value: `${onTimeRate.toFixed(0)}%`,    delta: `${onTime}/${delivered} delivered`, trend: onTimeRate >= 90 ? "up" : "down", accent: onTimeRate >= 90 ? "green" : "red" },
        { label: "Exceptions",      value: String(exceptions),             delta: "need attention", trend: exceptions > 0 ? "down" : "flat", accent: exceptions > 0 ? "red" : "green" },
      ];
    },
    computeChartData: (data) => {
      const months = lastNMonths(12);
      const byMonth = groupByMonth(data, "dispatchDate");
      return {
        title: "Shipments Dispatched — Last 12 Months",
        data: months.map((m) => {
          const rows = byMonth.get(m) ?? [];
          return {
            month: monthLabel(m),
            total:     rows.length,
            delivered: rows.filter((r) => r.status === "Delivered").length,
          };
        }),
        keys: [
          { dataKey: "total",     name: "Dispatched", color: "#6366f1" },
          { dataKey: "delivered", name: "Delivered",  color: "#10b981" },
        ],
        type: "area",
      };
    },
    columns: [
      { key: "id",               label: "ID",         className: "font-mono text-muted-foreground" },
      { key: "accountName",      label: "Account",    className: "font-medium" },
      { key: "carrier",          label: "Carrier" },
      { key: "mode",             label: "Mode" },
      { key: "status",           label: "Status",     render: statusBadge, sortable: false },
      { key: "origin",           label: "Origin" },
      { key: "destination",      label: "Destination" },
      { key: "estimatedDelivery",label: "ETA",        render: fmtDate },
    ],
  },

  invoices: {
    title: "Invoices",
    getData: () => mockInvoices as unknown as Row[],
    computeKpis: (data) => {
      const paid = data.filter((r) => r.status === "Paid").reduce((s, r) => s + Number(r.total ?? 0), 0);
      const outstanding = data.filter((r) => !["Paid","Void"].includes(String(r.status))).reduce((s, r) => s + Number(r.total ?? 0), 0);
      const overdue = data.filter((r) => r.status === "Overdue").length;
      const total = data.reduce((s, r) => s + Number(r.total ?? 0), 0);
      return [
        { label: "Total Invoiced",  value: `$${(total/1e6).toFixed(1)}M`,       delta: "all invoices",   trend: "up",   accent: "blue"   },
        { label: "Collected",       value: `$${(paid/1e6).toFixed(1)}M`,         delta: `${total > 0 ? ((paid/total)*100).toFixed(0) : 0}% collection rate`, trend: "up", accent: "green" },
        { label: "Outstanding",     value: `$${(outstanding/1e6).toFixed(1)}M`,  delta: "unpaid",         trend: "flat", accent: "yellow" },
        { label: "Overdue",         value: String(overdue),                       delta: "past due date",  trend: overdue > 0 ? "down" : "flat", accent: overdue > 0 ? "red" : "green" },
      ];
    },
    computeChartData: (data) => {
      const months = lastNMonths(12);
      const byMonth = groupByMonth(data, "issuedDate");
      return {
        title: "Invoice Amounts — Last 12 Months ($K)",
        data: months.map((m) => {
          const rows = byMonth.get(m) ?? [];
          return {
            month: monthLabel(m),
            issued:  Math.round(rows.reduce((s, r) => s + Number(r.total ?? 0), 0) / 1000),
            paid:    Math.round(rows.filter((r) => r.status === "Paid").reduce((s, r) => s + Number(r.total ?? 0), 0) / 1000),
            overdue: Math.round(rows.filter((r) => r.status === "Overdue").reduce((s, r) => s + Number(r.total ?? 0), 0) / 1000),
          };
        }),
        keys: [
          { dataKey: "issued",  name: "Issued ($K)",  color: "#6366f1" },
          { dataKey: "paid",    name: "Paid ($K)",    color: "#10b981" },
          { dataKey: "overdue", name: "Overdue ($K)", color: "#ef4444" },
        ],
        type: "area",
      };
    },
    columns: [
      { key: "id",          label: "ID",        className: "font-mono text-muted-foreground" },
      { key: "accountName", label: "Account",   className: "font-medium" },
      { key: "total",       label: "Total",     render: fmtMoney },
      { key: "status",      label: "Status",    render: statusBadge, sortable: false },
      { key: "issuedDate",  label: "Issued",    render: fmtDate },
      { key: "dueDate",     label: "Due",       render: fmtDate },
      { key: "paymentTerms",label: "Terms" },
    ],
  },

  "ai-use-cases": {
    title: "AI Use Cases",
    getData: () => mockAiUseCases as unknown as Row[],
    computeKpis: (data) => {
      const deployed = data.filter((r) => r.status === "Deployed").length;
      const totalRoi = data.reduce((s, r) => s + Number(r.actualValueUsd ?? 0), 0);
      const totalCost = data.reduce((s, r) => s + Number(r.monthlyCostUsd ?? 0), 0) * 12;
      const avgRoi = data.length > 0 ? data.filter((r) => Number(r.roiMultiple) > 0).reduce((s, r) => s + Number(r.roiMultiple ?? 0), 0) / Math.max(data.filter((r) => Number(r.roiMultiple) > 0).length, 1) : 0;
      return [
        { label: "Use Cases",      value: String(data.length),              delta: "tracked",        trend: "up",   accent: "purple" },
        { label: "Deployed",       value: String(deployed),                 delta: "in production",  trend: "up",   accent: "green"  },
        { label: "Total Value",    value: `$${(totalRoi/1e6).toFixed(1)}M`, delta: "actual realised", trend: "up",  accent: "blue"   },
        { label: "Avg ROI",        value: `${avgRoi.toFixed(0)}×`,          delta: "value / cost",   trend: "up",   accent: "green"  },
      ];
    },
    computeChartData: (data) => {
      const active = data.filter((r) => Number(r.roiMultiple) > 0);
      return {
        title: "ROI Multiple by Use Case",
        data: [...active].sort((a, b) => Number(b.roiMultiple) - Number(a.roiMultiple)).map((r) => ({
          month: String(r.name ?? "").substring(0, 22),
          roi: Number(r.roiMultiple ?? 0),
        })),
        keys: [{ dataKey: "roi", name: "ROI Multiple", color: "#8b5cf6" }],
        type: "bar",
        xKey: "month",
      };
    },
    columns: [
      { key: "id",              label: "ID",         className: "font-mono text-muted-foreground" },
      { key: "name",            label: "Name",       className: "font-medium" },
      { key: "domain",          label: "Domain" },
      { key: "model",           label: "Model",      render: (v) => <span className="font-mono text-xs text-muted-foreground">{String(v)}</span> },
      { key: "status",          label: "Status",     render: statusBadge, sortable: false },
      { key: "confidenceScore", label: "Confidence", render: (v) => <ConfidenceCell score={Number(v)} />, sortable: true },
      { key: "humanReviewRequired", label: "Review", render: (v) => v === true
          ? <Badge variant="warning" className="text-[10px]">Human Review</Badge>
          : <span className="text-muted-foreground text-xs">—</span>,
        sortable: false },
      { key: "roiMultiple",     label: "ROI",        render: (v) => Number(v) > 0 ? `${Number(v).toFixed(0)}×` : "—" },
      { key: "actualValueUsd",  label: "Value",      render: fmtMoney },
    ],
  },
};

export { CONFIGS as SECTION_CONFIGS };

// ── filter helper (exported for ShellDemo) ────────────────────────────────────

export function applyFilters(
  data: Row[],
  sbus: string[],
  functions: string[],
  dateFrom: string,
  dateTo: string
): Row[] {
  return data.filter((row) => {
    if (sbus.length > 0 && row.sbu && !sbus.includes(String(row.sbu))) return false;
    if (functions.length > 0 && row.function && !functions.includes(String(row.function))) return false;
    // Date check using the first date field found
    const dateField = ["createdAt", "orderDate", "issuedDate", "startDate", "dispatchDate", "launchDate"]
      .find((f) => row[f]);
    if (dateField && row[dateField]) {
      const rowDate = String(row[dateField]).substring(0, 10);
      if (rowDate < dateFrom || rowDate > dateTo) return false;
    }
    return true;
  });
}
