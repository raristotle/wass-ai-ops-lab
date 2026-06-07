// INTEGRATION SEAM — lib/integration/pricing.ts
//
// Mock PricingProvider implementation.
// Replace with a real pricing API client in lib/integration/index.ts;
// the PricingProvider interface in types.ts is the contract.
//
// Pricing logic:
//   1. listPrice = product.unitPrice (always)
//   2. contractPrice:
//        - null for standard-tier customers or no customer
//        - For contract customers: netPrices[product.id] if present; else
//          listPrice * (1 - discountByCategory[category] ?? 0)
//        - null when the contract customer has no applicable discount/net price
//   3. Volume multiplier: derived from the existing tier breaks in
//      lib/product-finder-pricing.ts — tierUnitPrice(product, qty) /
//      product.unitPrice gives the multiplier (0–1). Applied to the chosen base.
//   4. effectiveUnitPrice = round2(base * volumeMultiplier)
//        where base = contractPrice ?? listPrice
//   5. savingsPct = Math.round((listPrice - effectiveUnitPrice) / listPrice * 100)
//        clamped to 0 when listPrice is 0 or no savings.

import type { CatalogProduct } from "@/features/product-finder/types";
import type { CustomerAccount, PricingProvider, ProductPricing } from "@/lib/integration/types";
import { tierUnitPrice } from "@/lib/product-finder-pricing";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Returns the volume multiplier for a given qty relative to list price.
 * Uses the existing tier logic: tierUnitPrice / unitPrice.
 * At qty < 10 this is 1.0 (no volume discount).
 */
function volumeMultiplier(product: CatalogProduct, qty: number): number {
  if (product.unitPrice === 0) return 1;
  return tierUnitPrice(product, qty) / product.unitPrice;
}

// ─── Mock implementation ──────────────────────────────────────────────────────

export const mockPricingProvider: PricingProvider = {
  getPricing(
    product: CatalogProduct,
    ctx: { customer: CustomerAccount | null; qty: number }
  ): ProductPricing {
    const { customer, qty } = ctx;
    const listPrice = product.unitPrice;

    // ── Determine contractPrice (base unit price before volume) ──────────────
    let contractPrice: number | null = null;

    if (customer !== null && customer.tier === "contract") {
      // Check net price override first
      const net = customer.netPrices?.[product.id];
      if (net !== undefined) {
        contractPrice = round2(net);
      } else {
        // Category discount
        const disc = customer.discountByCategory[product.category] ?? 0;
        if (disc > 0) {
          contractPrice = round2(listPrice * (1 - disc));
        }
        // disc === 0 → no contract applies for this category → contractPrice stays null
      }
    }

    // ── Apply volume multiplier to the chosen base ────────────────────────────
    const base = contractPrice !== null ? contractPrice : listPrice;
    const volMult = volumeMultiplier(product, qty);
    const effectiveUnitPrice = round2(base * volMult);

    // ── savingsPct ─────────────────────────────────────────────────────────────
    const savingsPct =
      listPrice > 0 && effectiveUnitPrice < listPrice
        ? Math.round(((listPrice - effectiveUnitPrice) / listPrice) * 100)
        : 0;

    // ── source ─────────────────────────────────────────────────────────────────
    const hasContract = contractPrice !== null;
    const hasVolume = volMult < 1;

    let source: ProductPricing["source"];
    if (hasContract && hasVolume) {
      source = "contract+volume";
    } else if (hasContract) {
      source = "contract";
    } else if (hasVolume) {
      source = "volume";
    } else {
      source = "list";
    }

    return { listPrice, contractPrice, effectiveUnitPrice, savingsPct, source };
  },
};
