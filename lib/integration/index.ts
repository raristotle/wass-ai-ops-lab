// INTEGRATION SEAM — lib/integration/index.ts
//
// Registry: components and the store call providers through these functions.
// Replace the mock return values with real CRM/ERP API clients when connectivity
// is available; the interfaces in types.ts are the contracts.

import type { CustomerProvider, PricingProvider } from "@/lib/integration/types";
import { mockCustomerProvider } from "@/lib/integration/customers";
import { mockPricingProvider } from "@/lib/integration/pricing";

/**
 * Returns the customer account provider.
 * INTEGRATION SEAM — replace with real CRM client;
 * interface in lib/integration/types.ts is the contract.
 */
export function getCustomerProvider(): CustomerProvider {
  return mockCustomerProvider;
}

/**
 * Returns the pricing provider.
 * INTEGRATION SEAM — replace with real pricing API client here;
 * interface in lib/integration/types.ts is the contract.
 */
export function getPricingProvider(): PricingProvider {
  return mockPricingProvider;
}

// Future registry functions (added by later tasks):
// export function getInventoryProvider(): InventoryProvider { ... } // task I-3
// export function getCatalogSource(): CatalogSource { ... }       // task I-2
// export function getOrderProvider(): OrderProvider { ... }       // task I-5b
