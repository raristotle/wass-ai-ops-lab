/**
 * INTEGRATION SEAM — lib/integration/types.ts
 *
 * Adapter interfaces and data-transfer objects for all external enterprise
 * system integrations. This file is the single contract point:
 *
 *   - Components and the store consume providers through the registry
 *     (lib/integration/index.ts) — never the mock implementations directly.
 *   - When a real system becomes available, swap the mock in index.ts for a
 *     real client that satisfies the same interface here. Nothing else changes.
 *
 * Interfaces defined here (stub reservations for later tasks are noted):
 *   CustomerProvider   — #5  customer accounts (implemented)
 *   PricingProvider    — #1  contract pricing  (reserved, task I-1)
 *   InventoryProvider  — #3  live ATP          (reserved, task I-3)
 *   CatalogSource      — #2  PIM integration   (reserved, task I-2)
 *   OrderProvider      — #5b order history     (reserved, task I-5b)
 */

import type { CatalogProduct, ProductCategory } from "@/features/product-finder/types";

// ─── Customer accounts ────────────────────────────────────────────────────────

export interface CustomerAccount {
  /** Stable, opaque identifier (e.g. "CUST-001"). */
  id: string;
  name: string;
  /** "contract" = negotiated pricing applies; "standard" = list price only. */
  tier: "contract" | "standard";
  /**
   * Fractional discount off the list price by category.
   * e.g. `{ electrical: 0.15 }` means 15% off list for electrical products.
   * Missing categories → no discount.
   */
  discountByCategory: Partial<Record<ProductCategory, number>>;
  /**
   * Optional per-product special net unit prices that override category
   * discounts. Key = CatalogProduct.id, value = net unit price.
   */
  netPrices?: Record<string, number>;
  shipToCity: string;
  /** Payment terms string, e.g. "Net 30", "Prepaid". */
  terms: string;
}

export interface CustomerProvider {
  /** Return all customer accounts. */
  list(): CustomerAccount[];
  /** Return a single account by id, or null if not found. */
  get(id: string): CustomerAccount | null;
}

// ─── Reserved interfaces for later tasks ──────────────────────────────────────
// These are stub-reserved so later tasks can extend this file without
// disrupting the foundation types above.

// PricingProvider — task I-1 (contract / customer pricing)
// export interface PricingProvider { ... }

// InventoryProvider — task I-3 (live inventory / ATP)
// export interface InventoryProvider { ... }

// CatalogSource — task I-2 (catalog / PIM integration framing)
// export interface CatalogSource { ... }

// OrderProvider — task I-5b (per-customer order history)
// export interface OrderProvider { ... }

// Re-export CatalogProduct for convenience of integration modules
export type { CatalogProduct, ProductCategory };
