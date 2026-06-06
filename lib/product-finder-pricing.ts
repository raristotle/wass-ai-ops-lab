import type { CatalogProduct } from "@/features/product-finder/types";

// ─── Tier definitions ─────────────────────────────────────────────────────────
// Breaks at qty 1, 10, 50, 100 with discounts 0%, 5%, 10%, 15%.

const TIER_BREAKS: { minQty: number; discount: number }[] = [
  { minQty: 1, discount: 0 },
  { minQty: 10, discount: 0.05 },
  { minQty: 50, discount: 0.10 },
  { minQty: 100, discount: 0.15 },
];

// ─── priceTiers ───────────────────────────────────────────────────────────────

/**
 * Returns 4 volume price tiers for a product.
 * Tiers break at qty 1, 10, 50, 100 with discounts 0%, 5%, 10%, 15% off
 * `product.unitPrice`, each rounded to 2 decimal places (cents).
 *
 * The returned array is always exactly 4 elements with ascending minQty
 * and monotonically non-increasing unitPrice.
 */
export function priceTiers(
  product: CatalogProduct
): { minQty: number; unitPrice: number }[] {
  return TIER_BREAKS.map(({ minQty, discount }) => ({
    minQty,
    unitPrice: Math.round(product.unitPrice * (1 - discount) * 100) / 100,
  }));
}

// ─── tierUnitPrice ────────────────────────────────────────────────────────────

/**
 * Returns the effective unit price for a given quantity of a product,
 * using the highest tier whose minQty is <= qty.
 * Quantities below 1 are treated as 1 (tier 1 applies).
 */
export function tierUnitPrice(product: CatalogProduct, qty: number): number {
  const effectiveQty = Math.max(1, qty);
  const tiers = priceTiers(product);

  // Walk from the highest break down to find the best qualifying tier
  let result = tiers[0].unitPrice;
  for (const tier of tiers) {
    if (effectiveQty >= tier.minQty) {
      result = tier.unitPrice;
    }
  }
  return result;
}
