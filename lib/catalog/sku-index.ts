import { getCatalog } from "@/lib/catalog/index";
import { identifierKey } from "@/lib/catalog/identifiers";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * SKU → product resolver, backed by a normalized index built once and cached on
 * globalThis (like the catalog itself), so each lookup is O(1) instead of a full
 * catalog scan. Normalization goes through `identifierKey`, so equivalent SKU
 * spellings (case/separators) resolve the same. Shared by the server routes that
 * resolve part numbers (orders, BOM analyze).
 */
const g = globalThis as unknown as { __skuIndex?: Map<string, CatalogProduct> };

function skuIndex(): Map<string, CatalogProduct> {
  if (g.__skuIndex) return g.__skuIndex;
  const m = new Map<string, CatalogProduct>();
  const add = (id: string | undefined, p: CatalogProduct) => {
    if (!id) return;
    const k = identifierKey(id);
    if (k && !m.has(k)) m.set(k, p);
  };
  const products = getCatalog().products;
  // Pass 1: manufacturer SKUs first, so a real mfr part never loses a collision to
  // another product's secondary identifier.
  for (const p of products) add(p.sku, p);
  // Pass 2: the other part-number identities reps quote by — Wesco stock #, catalog #, GTIN.
  for (const p of products) {
    add(p.wescoSku, p);
    add(p.catalogNumber, p);
    add(p.gtin, p);
  }
  g.__skuIndex = m;
  return m;
}

/** Resolve a SKU/part number to a catalog product, or null if not carried. */
export function resolveBySku(sku: string): CatalogProduct | null {
  return skuIndex().get(identifierKey(sku)) ?? null;
}
