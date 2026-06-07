// INTEGRATION SEAM — lib/integration/catalog-source.ts
//
// Mock PIM catalog source adapter.
// Replace this implementation with a real PIM API client in index.ts;
// the CatalogProvider interface in lib/integration/types.ts is the contract.

import type { CatalogProvider, CatalogSource } from "@/lib/integration/types";
import { getCatalog } from "@/lib/catalog/index";

/**
 * Builds a CatalogSource snapshot from the generated catalog.
 * `now` is injected — no Date.now() here — so the result is fully deterministic.
 */
function buildCatalogSource(now: Date): CatalogSource {
  const { products } = getCatalog();

  const productCount = products.length;

  // Distinct categories and subcategories
  const categorySet = new Set<string>();
  const subcategorySet = new Set<string>();
  let withAttrCount = 0;

  for (const p of products) {
    categorySet.add(p.category);
    subcategorySet.add(p.subcategory);
    if (p.specs.some((s) => s.isNonNeg)) {
      withAttrCount++;
    }
  }

  const attributeCompleteness =
    productCount === 0 ? 0 : Math.round((withAttrCount / productCount) * 100);

  return {
    source: "PIM (simulated)",
    productCount,
    lastSyncedAt: now.toISOString(),
    attributeCompleteness,
    categories: categorySet.size,
    subcategories: subcategorySet.size,
  };
}

// INTEGRATION SEAM — replace with real PIM client;
// interface CatalogProvider in lib/integration/types.ts is the contract.
export const mockCatalogProvider: CatalogProvider = {
  getSource(now: Date): CatalogSource {
    return buildCatalogSource(now);
  },
};
