import type { CatalogProduct } from "@/features/product-finder/types";
import { leadTimeFor } from "@/lib/product-finder-leadtime";

/**
 * Estimated delivery (ETA) for basket lines.
 *
 * Pure & deterministic: `today` is injected, never read from the clock.
 * Three fulfillment tiers, plus lead-time buckets for out-of-stock items:
 *   - in stock at your branch        → ships fastest
 *   - in stock elsewhere (branch/DC) → short transfer/ship time
 *   - out of stock                   → the product's lead-time bucket
 */

const BRANCH_SHIP_DAYS = 2;
const TRANSFER_SHIP_DAYS = 5;

const LEAD_BUCKET_DAYS: Record<string, number> = {
  "3–5 business days": 5,
  "1–2 weeks": 14,
  "2–3 weeks": 21,
  "4–6 weeks": 42,
};

/** Calendar-day ETA for a single product, given the rep's home branch. */
export function lineEtaDays(product: CatalogProduct, userBranchId?: string): number {
  const myBranchQty = userBranchId
    ? product.branchStock.find((b) => b.branchId === userBranchId)?.quantity ?? 0
    : product.branchStock.reduce((sum, b) => sum + b.quantity, 0);
  if (myBranchQty > 0) return BRANCH_SHIP_DAYS;

  const anyBranchQty = product.branchStock.reduce((sum, b) => sum + b.quantity, 0);
  const dcQty = product.dcStock.reduce((sum, d) => sum + d.quantity, 0);
  if (anyBranchQty > 0 || dcQty > 0) return TRANSFER_SHIP_DAYS;

  const lead = leadTimeFor(product);
  return lead ? LEAD_BUCKET_DAYS[lead] ?? 14 : TRANSFER_SHIP_DAYS;
}

/** Whole-order ETA = the slowest line ("ships complete" semantics). 0 when empty. */
export function orderEtaDays(
  lines: { product: CatalogProduct }[],
  userBranchId?: string,
): number {
  return lines.reduce((max, l) => Math.max(max, lineEtaDays(l.product, userBranchId)), 0);
}

/** A new Date `days` calendar days after `today` (does not mutate input). */
export function addDays(today: Date, days: number): Date {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d;
}

/** Short human ETA label, e.g. "~2 days" / "~1 day". */
export function etaLabel(days: number): string {
  return `~${days} ${days === 1 ? "day" : "days"}`;
}
