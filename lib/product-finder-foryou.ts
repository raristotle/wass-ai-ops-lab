import type { CatalogProduct, ProductSnapshot } from "@/features/product-finder/types";
import type { Order } from "@/lib/product-finder-store";

/**
 * "For you" landing rail — pure ranking over data the store already holds.
 * No network, no clock reads (`now` injected).
 */

const DAY_MS = 86_400_000;

/** A product last ordered this many days ago (or more) is flagged "due". */
export const REORDER_DUE_DAYS = 30;

export interface ReorderSuggestion {
  product: CatalogProduct;
  /** Number of orders containing this product. */
  timesOrdered: number;
  lastOrderedAt: number;
  /** Quantity on the most recent order — pre-fills the Add button. */
  lastQty: number;
  due: boolean;
  /** Customer on the most recent order (walk-in → null). */
  customerName: string | null;
}

/**
 * Rank reorder candidates from order history.
 * Sort: due first, then order frequency, then recency. In-cart products are
 * excluded — suggesting something already in the basket is noise.
 */
export function reorderSuggestions(
  orders: Order[],
  cartIds: ReadonlySet<string>,
  now: number,
  k = 4
): ReorderSuggestion[] {
  const byProduct = new Map<string, ReorderSuggestion>();

  for (const order of orders) {
    for (const line of order.lines) {
      if (cartIds.has(line.product.id)) continue;
      const existing = byProduct.get(line.product.id);
      if (!existing) {
        byProduct.set(line.product.id, {
          product: line.product,
          timesOrdered: 1,
          lastOrderedAt: order.placedAt,
          lastQty: line.qty,
          due: false,
          customerName: order.customerName,
        });
      } else {
        existing.timesOrdered += 1;
        if (order.placedAt > existing.lastOrderedAt) {
          existing.lastOrderedAt = order.placedAt;
          existing.lastQty = line.qty;
          existing.customerName = order.customerName;
          existing.product = line.product;
        }
      }
    }
  }

  const all = [...byProduct.values()];
  for (const s of all) s.due = now - s.lastOrderedAt >= REORDER_DUE_DAYS * DAY_MS;

  return all
    .sort((a, b) => {
      if (a.due !== b.due) return a.due ? -1 : 1;
      if (a.timesOrdered !== b.timesOrdered) return b.timesOrdered - a.timesOrdered;
      return b.lastOrderedAt - a.lastOrderedAt;
    })
    .slice(0, k);
}

/**
 * Favorite products worth surfacing: not already in the cart and not already
 * suggested for reorder. Preserves the favorites list order.
 */
export function favoritePicks(
  favorites: ProductSnapshot[],
  excludeIds: ReadonlySet<string>,
  k = 4
): ProductSnapshot[] {
  return favorites.filter((f) => !excludeIds.has(f.id)).slice(0, k);
}
