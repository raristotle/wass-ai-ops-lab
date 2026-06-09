import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Quantity-aware stock check: when the ordered qty exceeds what's available,
 * report the shortfall and a backorder ETA. Pure & deterministic — the
 * backorder bucket is derived from the product id hash (independent of current
 * stock, so a partially-stocked item still gets a realistic backorder window).
 */

const LEAD_BUCKETS = [
  { label: "3–5 business days", days: 5 },
  { label: "1–2 weeks", days: 14 },
  { label: "2–3 weeks", days: 21 },
  { label: "4–6 weeks", days: 42 },
] as const;

function stableHash(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) ^ s.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash;
}

export interface StockWarning {
  /** Total on-hand across branch + DC. */
  available: number;
  ordered: number;
  /** ordered − available (always > 0 when a warning exists). */
  shortfall: number;
  backorderEtaLabel: string;
  backorderEtaDays: number;
}

/**
 * Returns a warning when `qty` exceeds total available stock, else null.
 * `userBranchId` (optional) restricts "available" to the rep's own branch + DC.
 */
export function stockWarning(
  product: CatalogProduct,
  qty: number,
  userBranchId?: string,
): StockWarning | null {
  const branchAvail = userBranchId
    ? product.branchStock.find((b) => b.branchId === userBranchId)?.quantity ?? 0
    : product.branchStock.reduce((sum, b) => sum + b.quantity, 0);
  const dcAvail = product.dcStock.reduce((sum, d) => sum + d.quantity, 0);
  const available = branchAvail + dcAvail;

  if (qty <= available) return null;

  const bucket = LEAD_BUCKETS[stableHash(product.id) % LEAD_BUCKETS.length];
  return {
    available,
    ordered: qty,
    shortfall: qty - available,
    backorderEtaLabel: bucket.label,
    backorderEtaDays: bucket.days,
  };
}
