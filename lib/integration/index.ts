// INTEGRATION SEAM — lib/integration/index.ts
//
// Registry: components and the store call providers through these functions.
// Replace the mock return values with real CRM/ERP API clients when connectivity
// is available; the interfaces in types.ts are the contracts.

import type { CustomerProvider } from "@/lib/integration/types";
import { mockCustomerProvider } from "@/lib/integration/customers";

/**
 * Returns the customer account provider.
 * INTEGRATION SEAM — replace with real CRM client;
 * interface in lib/integration/types.ts is the contract.
 */
export function getCustomerProvider(): CustomerProvider {
  return mockCustomerProvider;
}

// Future registry functions (added by later tasks):
// export function getPricingProvider(): PricingProvider { ... }   // task I-1
// export function getInventoryProvider(): InventoryProvider { ... } // task I-3
// export function getCatalogSource(): CatalogSource { ... }       // task I-2
// export function getOrderProvider(): OrderProvider { ... }       // task I-5b
