// INTEGRATION SEAM — lib/integration/index.ts
//
// Registry: components and the store call providers through these functions.
// Replace the mock return values with real CRM/ERP API clients when connectivity
// is available; the interfaces in types.ts are the contracts.

import type { CustomerProvider, PricingProvider, InventoryProvider, CatalogProvider } from "@/lib/integration/types";
import { mockCustomerProvider } from "@/lib/integration/customers";
import { mockPricingProvider } from "@/lib/integration/pricing";
import { mockInventoryProvider } from "@/lib/integration/inventory";
import { mockCatalogProvider } from "@/lib/integration/catalog-source";

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

/**
 * Returns the inventory / ATP provider.
 * INTEGRATION SEAM — replace with real ERP/WMS inventory API client here;
 * interface in lib/integration/types.ts is the contract.
 */
export function getInventoryProvider(): InventoryProvider {
  return mockInventoryProvider;
}

/**
 * Returns the catalog / PIM source provider.
 * INTEGRATION SEAM — replace with real PIM API client here;
 * interface in lib/integration/types.ts is the contract.
 */
export function getCatalogProvider(): CatalogProvider {
  return mockCatalogProvider;
}

// Future registry functions (added by later tasks):
// export function getOrderProvider(): OrderProvider { ... }       // task I-5b
