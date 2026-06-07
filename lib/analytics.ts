/**
 * lib/analytics.ts — Pure aggregation functions over Order data.
 *
 * Design choices:
 * - All functions take data as parameters; none call Date.now() or Math.random().
 *   The caller injects `now` for time-based bucketing so results are deterministic.
 * - Category value uses `line.product.unitPrice * qty` (list price), not the
 *   order's stored contract total. This is the simplest, fully deterministic
 *   approach and matches the contractSavings baseline. Documented here.
 * - topProducts also uses list price (unitPrice*qty) for consistency.
 * - contractSavings compares listTotal (unitPrice*qty) vs sum(order.total)
 *   which represents the contract-priced amount actually charged.
 */

import type { Order } from "@/lib/product-finder-store";
import type { Catalog } from "@/lib/catalog/index";

// ─── Return types ─────────────────────────────────────────────────────────────

export interface SalesKpis {
  orderCount: number;
  totalValue: number;
  avgOrderValue: number;
  activeCustomers: number;
}

export interface CategoryStat {
  category: string;
  value: number;
  qty: number;
}

export interface ProductStat {
  id: string;
  name: string;
  value: number;
  qty: number;
}

export interface TimeBucket {
  label: string;
  value: number;
  count: number;
}

export interface CustomerMixEntry {
  customerName: string;
  value: number;
  count: number;
}

export interface ContractSavings {
  listTotal: number;
  effectiveTotal: number;
  savings: number;
  savingsPct: number;
}

// ─── salesKpis ────────────────────────────────────────────────────────────────

/**
 * High-level KPI cards for the analytics dashboard.
 *
 * activeCustomers: count of distinct non-null customerIds.
 * Walk-in orders (customerId === null) are counted in order/value totals but
 * do not increment activeCustomers.
 */
export function salesKpis(orders: Order[]): SalesKpis {
  if (orders.length === 0) {
    return { orderCount: 0, totalValue: 0, avgOrderValue: 0, activeCustomers: 0 };
  }
  const totalValue = orders.reduce((sum, o) => sum + o.total, 0);
  const uniqueCustomers = new Set(
    orders.map((o) => o.customerId).filter((id): id is string => id !== null)
  );
  return {
    orderCount: orders.length,
    totalValue,
    avgOrderValue: totalValue / orders.length,
    activeCustomers: uniqueCustomers.size,
  };
}

// ─── topCategories ────────────────────────────────────────────────────────────

/**
 * Returns the top-k product categories ranked by total list value
 * (sum of line.product.unitPrice * qty across all orders).
 *
 * Uses list price, not contract price, so the breakdown is independent of
 * customer-specific discounts and is fully deterministic from catalog data.
 *
 * @param orders - all orders to aggregate
 * @param catalog - used for category lookups; falls back to product.category
 * @param k - max entries to return (default 6)
 */
export function topCategories(orders: Order[], catalog: Catalog, k = 6): CategoryStat[] {
  const byCategory = new Map<string, { value: number; qty: number }>();

  for (const order of orders) {
    for (const line of order.lines) {
      // Use catalog for authoritative category; fall back to embedded product.category
      const product = catalog.byId.get(line.product.id) ?? line.product;
      const category = product.category;
      const lineValue = product.unitPrice * line.qty;
      const existing = byCategory.get(category) ?? { value: 0, qty: 0 };
      byCategory.set(category, {
        value: existing.value + lineValue,
        qty: existing.qty + line.qty,
      });
    }
  }

  return Array.from(byCategory.entries())
    .map(([category, { value, qty }]) => ({ category, value, qty }))
    .sort((a, b) => b.value - a.value)
    .slice(0, k);
}

// ─── topProducts ──────────────────────────────────────────────────────────────

/**
 * Returns the top-k products ranked by total list value (unitPrice * qty).
 * Product name is taken from the order line (embedded snapshot).
 *
 * @param orders - all orders to aggregate
 * @param k - max entries to return (default 8)
 */
export function topProducts(orders: Order[], k = 8): ProductStat[] {
  const byProduct = new Map<string, { name: string; value: number; qty: number }>();

  for (const order of orders) {
    for (const line of order.lines) {
      const { id, name, unitPrice } = line.product;
      const lineValue = unitPrice * line.qty;
      const existing = byProduct.get(id) ?? { name, value: 0, qty: 0 };
      byProduct.set(id, {
        name,
        value: existing.value + lineValue,
        qty: existing.qty + line.qty,
      });
    }
  }

  return Array.from(byProduct.entries())
    .map(([id, { name, value, qty }]) => ({ id, name, value, qty }))
    .sort((a, b) => b.value - a.value)
    .slice(0, k);
}

// ─── ordersOverTime ───────────────────────────────────────────────────────────

/**
 * Buckets orders into the last N calendar months (ending with the month of `now`).
 *
 * Each bucket label is formatted as "Mon YY" (e.g. "Jan 26").
 * `value` = sum of order.total for orders whose placedAt falls in that month.
 * `count` = number of orders in that month.
 *
 * Orders outside the N-month window are silently excluded (older data).
 *
 * @param orders - all orders to aggregate
 * @param now - reference timestamp (injected; deterministic)
 * @param buckets - number of month buckets (default 6)
 */
export function ordersOverTime(
  orders: Order[],
  now: number,
  buckets = 6
): TimeBucket[] {
  const nowDate = new Date(now);
  // Build bucket boundaries: each bucket is identified by (year, month 0-indexed)
  const bucketKeys: { year: number; month: number; label: string }[] = [];
  for (let i = buckets - 1; i >= 0; i--) {
    // Go back i months from current month
    const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    bucketKeys.push({ year: d.getFullYear(), month: d.getMonth(), label });
  }

  // Aggregate orders into buckets
  const acc = new Map<string, { value: number; count: number }>(
    bucketKeys.map((b) => [`${b.year}-${b.month}`, { value: 0, count: 0 }])
  );

  for (const order of orders) {
    const d = new Date(order.placedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = acc.get(key);
    if (!bucket) continue; // outside the window
    bucket.value += order.total;
    bucket.count += 1;
  }

  return bucketKeys.map((b) => {
    const data = acc.get(`${b.year}-${b.month}`) ?? { value: 0, count: 0 };
    return { label: b.label, value: data.value, count: data.count };
  });
}

// ─── customerMix ─────────────────────────────────────────────────────────────

/**
 * Returns a per-customer breakdown of total order value and order count,
 * sorted by value descending.
 *
 * Walk-in orders (customerName === null) are grouped under the label "Walk-in".
 */
export function customerMix(orders: Order[]): CustomerMixEntry[] {
  const byCustomer = new Map<string, { value: number; count: number }>();

  for (const order of orders) {
    const name = order.customerName ?? "Walk-in";
    const existing = byCustomer.get(name) ?? { value: 0, count: 0 };
    byCustomer.set(name, {
      value: existing.value + order.total,
      count: existing.count + 1,
    });
  }

  return Array.from(byCustomer.entries())
    .map(([customerName, { value, count }]) => ({ customerName, value, count }))
    .sort((a, b) => b.value - a.value);
}

// ─── contractSavings ──────────────────────────────────────────────────────────

/**
 * Compares catalog list price vs the contract-priced totals stored on orders.
 *
 * listTotal    = sum of (line.product.unitPrice * qty) across all order lines.
 *                This is the standard retail / list price.
 * effectiveTotal = sum of order.total — these are already contract-priced
 *                  (set by placeOrder using getPricing().effectiveUnitPrice).
 * savings        = listTotal - effectiveTotal
 * savingsPct     = savings / listTotal * 100  (0 when listTotal === 0)
 */
export function contractSavings(orders: Order[]): ContractSavings {
  let listTotal = 0;
  let effectiveTotal = 0;

  for (const order of orders) {
    for (const line of order.lines) {
      listTotal += line.product.unitPrice * line.qty;
    }
    effectiveTotal += order.total;
  }

  const savings = listTotal - effectiveTotal;
  const savingsPct = listTotal === 0 ? 0 : (savings / listTotal) * 100;

  return { listTotal, effectiveTotal, savings, savingsPct };
}
