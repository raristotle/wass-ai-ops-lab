/**
 * Order-history → dated `Order` persistence (B20) — the bridge that wakes the
 * date-windowed engines (`demandForecast`, next-best-actions "stock-up", the
 * Account 360 whitespace panel) from a real order-history import.
 *
 * Today's import route (`/api/order-history/import`) mines the parsed CSV into
 * cross-sell association rules and stops there — the dated engines never see
 * anything. This module takes the SAME resolved lines the route already builds
 * and additionally persists them as `Order[]` (the store's existing shape —
 * `lib/product-finder-store.ts` — reused rather than inventing a third/fourth
 * order concept), keyed per customer, `forTenant`-scoped, idempotent on a content
 * hash so re-uploading the same file never double-counts.
 *
 * Fails closed: any store error degrades to "no persisted orders" (the deterministic
 * rail / demo forecast), never a 500 on the import path.
 */

import type { KvStore } from "@/lib/server/persistence";
import type { Order } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";
import { fnv1aHex } from "@/lib/stable-id";

export const ORDER_HISTORY_ORDERS_NS = "order-history-orders";
const MANIFEST_KEY = "manifest";
const ORDERS_KEY = "orders";

/** One resolved order line ready to persist (mirrors the store's `Order.lines[number]`). */
export interface ResolvedOrderLine {
  product: CatalogProduct;
  qty: number;
}

/** One resolved order (post SKU-resolution), the input to `buildDatedOrders`. */
export interface ResolvedOrder {
  orderId: string;
  /** Epoch-ms from the parsed CSV date column; undefined when unparseable/absent. */
  date?: number;
  lines: ResolvedOrderLine[];
}

export interface DatedOrdersManifest {
  /** Bumped on every successful persist. */
  version: number;
  /**
   * Content hash of (customer + each order's id AND date) — re-importing the
   * identical set is a no-op. Dates are part of the identity (not just the
   * order-id set) so a corrected re-import — same order ids, fixed/added
   * dates — is recognized as new content and fully re-applied instead of
   * silently short-circuiting on a stale hash (see `contentHashFor` below).
   */
  contentHash: string;
  customer: string | null;
  ordersPersisted: number;
  /** Orders that carried a real parsed date vs. were synthesized (see below). */
  datedOrders: number;
  synthesizedOrders: number;
  /** [earliest, latest] epoch-ms across persisted orders, or null if none. */
  dateRangeStart: number | null;
  dateRangeEnd: number | null;
  /**
   * true only when EVERY persisted order carries a real parsed date (never a
   * synthesized placeholder) — the honest signal for whether the forecast/NBA/
   * whitespace surfaces should show as live or demo-labeled.
   */
  allDatesReal: boolean;
  persistedAtIso: string;
}

function round2(n: number): number {
  return Math.round(Number((n * 100).toFixed(4))) / 100;
}

function lineTotal(product: CatalogProduct, qty: number): number {
  return round2(product.unitPrice * qty);
}

/**
 * Build dated `Order[]` from resolved order-history lines. When NONE of the
 * orders have a real parsed date, synthesize a deterministic spread across the
 * trailing 90 days from `now` (labeled via the manifest's `allDatesReal:false`,
 * never silently presented as real) — matching the blueprint's "only if the file
 * has no dates at all" rule. When SOME orders are dated and others are not, the
 * undated ones are dropped from the dated-order set (they still fed market-basket
 * mining upstream; they just can't contribute to date-windowed demand without
 * fabricating a date for a partially-dated file).
 */
export function buildDatedOrders(resolved: ResolvedOrder[], now: number): { orders: Order[]; allDatesReal: boolean } {
  const anyDated = resolved.some((o) => o.date !== undefined);
  const withDate = anyDated ? resolved.filter((o) => o.date !== undefined) : resolved;
  const spreadDays = 90;
  const dayMs = 86_400_000;

  const orders: Order[] = withDate.map((o, i) => {
    const placedAt = anyDated
      ? (o.date as number)
      : now - Math.floor((spreadDays * (i + 1)) / (withDate.length + 1)) * dayMs;
    const lines = o.lines.map((l) => ({ product: l.product, qty: l.qty }));
    return {
      id: `oh-${o.orderId}`,
      placedAt,
      lines,
      total: round2(lines.reduce((s, l) => s + lineTotal(l.product, l.qty), 0)),
      customerId: null,
      customerName: null,
    };
  });

  return { orders, allDatesReal: anyDated };
}

/**
 * B20 fix (2026-07-10): the hash MUST include each order's date, not just its
 * id. `saveDatedOrders` short-circuits when the hash matches the prior
 * import, so hashing the order-id set alone made a corrected re-import (same
 * order ids, a repaired date column re-uploaded) indistinguishable from a
 * byte-identical duplicate: the co-purchase rules store
 * (`order-history-rules.ts`) updates unconditionally on every import while
 * this store silently kept the stale/synthesized dates — the forecast stayed
 * demo-labeled with no error, half-applying the correction. Folding the date
 * into each order's key makes a date correction a genuine content change.
 */
function contentHashFor(customer: string | null, resolved: ResolvedOrder[]): string {
  const sorted = [...resolved].map((o) => `${o.orderId}@${o.date ?? ""}`).sort();
  return fnv1aHex(`${customer ?? ""}::${sorted.join(",")}`);
}

/**
 * Persist the dated orders for this scope (idempotent by content hash of the
 * customer + order-id+date set). Replaces the prior persisted set for the
 * customer — matches the app-global-for-pilot design (one distributor → one
 * behavioral model) used by the sibling `order-history-rules.ts`. Returns the
 * manifest; returns the PRIOR manifest unchanged (no write) when the content
 * hash matches, so a byte-identical re-upload never double-counts — but a
 * corrected re-import (same order ids, different dates) always re-applies.
 */
export async function saveDatedOrders(
  store: KvStore,
  resolved: ResolvedOrder[],
  customer: string | null,
  now: number,
): Promise<DatedOrdersManifest> {
  const contentHash = contentHashFor(customer, resolved);

  const prev = await getDatedOrdersManifest(store);
  if (prev && prev.contentHash === contentHash) return prev; // idempotent re-import: no-op

  const { orders, allDatesReal } = buildDatedOrders(resolved, now);
  const dated = resolved.filter((o) => o.date !== undefined).length;

  const dateRange = orders.length > 0
    ? orders.reduce(
        (acc, o) => [Math.min(acc[0], o.placedAt), Math.max(acc[1], o.placedAt)] as [number, number],
        [orders[0].placedAt, orders[0].placedAt] as [number, number],
      )
    : null;

  const manifest: DatedOrdersManifest = {
    version: (prev?.version ?? 0) + 1,
    contentHash,
    customer,
    ordersPersisted: orders.length,
    datedOrders: allDatesReal ? dated : 0,
    synthesizedOrders: allDatesReal ? 0 : orders.length,
    dateRangeStart: dateRange ? dateRange[0] : null,
    dateRangeEnd: dateRange ? dateRange[1] : null,
    allDatesReal,
    persistedAtIso: new Date(now).toISOString(),
  };

  await store.put<Order[]>(ORDER_HISTORY_ORDERS_NS, ORDERS_KEY, orders);
  await store.put<DatedOrdersManifest>(ORDER_HISTORY_ORDERS_NS, MANIFEST_KEY, manifest);
  return manifest;
}

/** The persisted dated orders for this (already tenant-scoped) store, or [] on any error/absence. */
export async function getDatedOrders(store: KvStore): Promise<Order[]> {
  try {
    return (await store.get<Order[]>(ORDER_HISTORY_ORDERS_NS, ORDERS_KEY)) ?? [];
  } catch {
    return [];
  }
}

/** The dated-orders manifest for this scope, or null if nothing has been persisted. */
export async function getDatedOrdersManifest(store: KvStore): Promise<DatedOrdersManifest | null> {
  try {
    return await store.get<DatedOrdersManifest>(ORDER_HISTORY_ORDERS_NS, MANIFEST_KEY);
  } catch {
    return null;
  }
}

/**
 * B20 fix (2026-07-10): the reference "now" the date-windowed engines
 * (`demandForecast` today; next-best-actions/whitespace when they start
 * consuming this store) should window against. A real order-history export
 * is virtually always months/years old by the time it's uploaded — anchoring
 * the trailing-90-day window on wall-clock `Date.now()` filtered out every
 * order and silently produced an empty forecast for exactly the historical
 * imports this feature exists to wake up. Anchoring on the import's own
 * latest order date (`manifest.dateRangeEnd`) makes "trailing 90 days" mean
 * "the last 90 days the import actually covers." Falls back to
 * `fallbackNow` (normally `Date.now()`) when there's no manifest yet.
 */
export function forecastReferenceNow(manifest: DatedOrdersManifest | null, fallbackNow: number): number {
  return manifest?.dateRangeEnd ?? fallbackNow;
}

/** Clear the persisted dated orders for this scope (mirrors `clearOrderHistory`). */
export async function clearDatedOrders(store: KvStore): Promise<void> {
  await store.delete(ORDER_HISTORY_ORDERS_NS, ORDERS_KEY);
  await store.delete(ORDER_HISTORY_ORDERS_NS, MANIFEST_KEY);
}
