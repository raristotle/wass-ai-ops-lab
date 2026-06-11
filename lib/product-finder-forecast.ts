import type { Order } from "@/lib/product-finder-store";
import type { SavedQuote } from "@/lib/product-finder-quotes";
import type { ProductCategory } from "@/features/product-finder/types";

/**
 * Branch demand forecast — pure aggregation over the demand signals the app
 * already records: order lines plus WON quote lines (a won quote is sold
 * demand even before fulfillment). Simple, explainable math: trailing-90-day
 * volume per subcategory, half-window trend, 30-day projection.
 * Deterministic — `now` injected.
 */

const DAY_MS = 86_400_000;

/** Trailing demand window. */
export const WINDOW_DAYS = 90;
const HALF_DAYS = WINDOW_DAYS / 2;

/** Second-half vs first-half volume beyond these ratios reads as a trend. */
export const TREND_UP_RATIO = 1.25;
export const TREND_DOWN_RATIO = 0.75;

export type DemandTrend = "up" | "down" | "flat";

export interface SubcategoryDemand {
  subcategory: string;
  category: ProductCategory;
  /** Units across orders + won quotes in the trailing window. */
  qty90d: number;
  /** Distinct demand events (order/quote lines) behind the number. */
  events: number;
  /** qty90d expressed per 30 days. */
  monthlyRate: number;
  trend: DemandTrend;
  /** Suggested stocking for the next 30 days (trend-adjusted). */
  projected30d: number;
  /** Highest-volume product in the subcategory, for the drill-through. */
  topProduct: { id: string; name: string; qty: number } | null;
}

interface DemandEvent {
  at: number;
  qty: number;
  productId: string;
  productName: string;
  subcategory: string;
  category: ProductCategory;
}

function collectEvents(orders: Order[], quotes: SavedQuote[], now: number): DemandEvent[] {
  const cutoff = now - WINDOW_DAYS * DAY_MS;
  const events: DemandEvent[] = [];
  for (const o of orders) {
    if (o.placedAt < cutoff || o.placedAt > now) continue;
    for (const l of o.lines) {
      events.push({
        at: o.placedAt,
        qty: l.qty,
        productId: l.product.id,
        productName: l.product.name,
        subcategory: l.product.subcategory,
        category: l.product.category,
      });
    }
  }
  for (const q of quotes) {
    if (q.status !== "won") continue;
    // A converted quote's demand already shows up as an order — don't double-count.
    if (q.convertedOrderId) continue;
    const at = q.createdAt;
    if (at < cutoff || at > now) continue;
    for (const l of q.lines) {
      events.push({
        at,
        qty: l.qty,
        productId: l.product.id,
        productName: l.product.name,
        subcategory: l.product.subcategory,
        category: l.product.category,
      });
    }
  }
  return events;
}

/**
 * Demand by subcategory over the trailing window, highest volume first.
 * `k` caps the list (pass Infinity for everything).
 */
export function demandForecast(
  orders: Order[],
  quotes: SavedQuote[],
  now: number,
  k = 6
): SubcategoryDemand[] {
  const events = collectEvents(orders, quotes, now);
  const halfCutoff = now - HALF_DAYS * DAY_MS;

  const bySub = new Map<
    string,
    { category: ProductCategory; qty: number; events: number; firstHalf: number; secondHalf: number; byProduct: Map<string, { name: string; qty: number }> }
  >();

  for (const e of events) {
    let agg = bySub.get(e.subcategory);
    if (!agg) {
      agg = { category: e.category, qty: 0, events: 0, firstHalf: 0, secondHalf: 0, byProduct: new Map() };
      bySub.set(e.subcategory, agg);
    }
    agg.qty += e.qty;
    agg.events += 1;
    if (e.at >= halfCutoff) agg.secondHalf += e.qty;
    else agg.firstHalf += e.qty;
    const p = agg.byProduct.get(e.productId);
    if (p) p.qty += e.qty;
    else agg.byProduct.set(e.productId, { name: e.productName, qty: e.qty });
  }

  const out: SubcategoryDemand[] = [];
  for (const [subcategory, agg] of bySub) {
    let trend: DemandTrend = "flat";
    if (agg.firstHalf === 0 && agg.secondHalf > 0) trend = "up";
    else if (agg.firstHalf > 0 && agg.secondHalf >= agg.firstHalf * TREND_UP_RATIO) trend = "up";
    else if (agg.firstHalf > 0 && agg.secondHalf <= agg.firstHalf * TREND_DOWN_RATIO) trend = "down";

    const monthlyRate = (agg.qty / WINDOW_DAYS) * 30;
    const factor = trend === "up" ? 1.25 : trend === "down" ? 0.75 : 1;
    const projected30d = Math.max(trend === "down" ? 0 : 1, Math.round(monthlyRate * factor));

    let topProduct: SubcategoryDemand["topProduct"] = null;
    for (const [id, p] of agg.byProduct) {
      if (!topProduct || p.qty > topProduct.qty) topProduct = { id, name: p.name, qty: p.qty };
    }

    out.push({
      subcategory,
      category: agg.category,
      qty90d: agg.qty,
      events: agg.events,
      monthlyRate: Math.round(monthlyRate * 10) / 10,
      trend,
      projected30d,
      topProduct,
    });
  }

  return out.sort((a, b) => b.qty90d - a.qty90d || a.subcategory.localeCompare(b.subcategory)).slice(0, k);
}
