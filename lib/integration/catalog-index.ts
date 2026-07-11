// INTEGRATION SEAM — lib/integration/catalog-index.ts
//
// The CATALOG-GRAPH half of the provider registry, split out of index.ts on purpose:
// these providers import getCatalog()/the generated catalog (tens of MB of data), and
// index.ts is imported by the CLIENT store — keeping them together shipped an ~18 MB
// chunk to the browser on every main route (docs/perf-audit-2026-07-10.md).
// SERVER-ONLY: import from API routes, server code, and tests — never from client code
// (enforced by the no-restricted-imports rule in eslint.config.mjs).

import type { CatalogProvider } from "@/lib/integration/types";
import { mockCatalogProvider } from "@/lib/integration/catalog-source";
import { lookupCrossReference, crossReferencesFor } from "@/lib/integration/cross-reference";
import type { CompetitorRef } from "@/lib/integration/cross-reference";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Returns the catalog / PIM source provider.
 * INTEGRATION SEAM — replace with real PIM API client here;
 * interface in lib/integration/types.ts is the contract.
 */
export function getCatalogProvider(): CatalogProvider {
  return mockCatalogProvider;
}

/**
 * Returns a thin cross-reference provider object wrapping the pure functions.
 * INTEGRATION SEAM — replace with a real competitor cross-reference feed here;
 * the function signatures are the contract.
 */
export function getCrossReferenceProvider(): {
  lookup(sku: string): CatalogProduct | null;
  referencesFor(product: CatalogProduct): CompetitorRef[];
} {
  return {
    lookup: lookupCrossReference,
    referencesFor: crossReferencesFor,
  };
}
