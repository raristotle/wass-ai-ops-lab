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

// ─── Pricing ─────────────────────────────────────────────────────────────────

export interface ProductPricing {
  /** The published list price (= product.unitPrice). */
  listPrice: number;
  /**
   * The customer's negotiated base unit price before volume breaks.
   * null when no contract applies (standard customer or no customer).
   */
  contractPrice: number | null;
  /** What the customer actually pays per unit at this qty, after all discounts. */
  effectiveUnitPrice: number;
  /**
   * Percentage saved vs listPrice at the current qty.
   * 0 when there are no savings or listPrice is 0.
   */
  savingsPct: number;
  /** Which discount(s) drove the effectiveUnitPrice. */
  source: "list" | "contract" | "volume" | "contract+volume";
}

export interface PricingProvider {
  getPricing(
    product: CatalogProduct,
    ctx: { customer: CustomerAccount | null; qty: number }
  ): ProductPricing;
}

// ─── Inventory / ATP ─────────────────────────────────────────────────────────

export interface BranchAvailability {
  branchId: string;
  name: string;
  qty: number;
}

export interface Availability {
  inStock: boolean;
  /** Total qty across all branchStock entries (including zeros). */
  branchQty: number;
  /** Total qty across all dcStock entries. */
  dcQty: number;
  /**
   * null when in stock; else ISO yyyy-mm-dd date = today + lead-time bucket days.
   * Deterministic: derived from product.id hash + injected today.
   */
  atpDate: string | null;
  /** null when in stock; else one of the 4 lead-time bucket strings. */
  leadTime: string | null;
  /** Branches (from branchStock) that have qty > 0. */
  otherBranches: BranchAvailability[];
  /**
   * null when in stock at the rep's branch or no branchId ctx given.
   * Small positive int (days) when the rep's branch has 0 but others do.
   */
  transferEtaDays: number | null;
}

export interface InventoryProvider {
  getAvailability(
    product: CatalogProduct,
    ctx: { branchId?: string; today: Date }
  ): Availability;
}

// ─── Catalog / PIM source ─────────────────────────────────────────────────────

/** Metadata returned by the PIM catalog source adapter. */
export interface CatalogSource {
  /** Human-readable source label, e.g. "PIM (simulated)". */
  source: string;
  /** Total number of products in the catalog. */
  productCount: number;
  /**
   * ISO 8601 timestamp of the last sync.
   * Injected by the caller (no Date.now inside the module).
   */
  lastSyncedAt: string;
  /**
   * Percentage (0–100) of products that have at least one isNonNeg spec.
   * Deterministic over the generated catalog.
   */
  attributeCompleteness: number;
  /** Number of distinct top-level categories in the catalog. */
  categories: number;
  /** Number of distinct subcategories in the catalog. */
  subcategories: number;
}

export interface CatalogProvider {
  /**
   * Returns catalog source metadata.
   * @param now  Injected timestamp — callers pass `new Date()`; tests pass a fixed date.
   */
  getSource(now: Date): CatalogSource;
}

// ─── Reserved interfaces for later tasks ──────────────────────────────────────
// These are stub-reserved so later tasks can extend this file without
// disrupting the foundation types above.

// OrderProvider — task I-5b (per-customer order history)
// export interface OrderProvider { ... }

// Re-export CatalogProduct for convenience of integration modules
export type { CatalogProduct, ProductCategory };
