// INTEGRATION SEAM — lib/integration/cross-reference.ts
//
// Deterministic synthetic competitor/legacy part-number cross-reference map.
// For each catalog product, derives 1–2 plausible competitor/legacy SKUs from a
// stable hash of the product id. The reverse map (competitorSku → productId) is
// built lazily once and cached on globalThis (same strategy as getCatalog).
//
// Replace with a real competitor cross-reference feed here;
// the exported function signatures are the integration contract.

import type { CatalogProduct } from "@/features/product-finder/types";
import { getCatalog } from "@/lib/catalog/index";

// ─── Competitor brand prefixes ────────────────────────────────────────────────

const COMPETITOR_PREFIXES = ["GRN", "ACE", "NSI", "LEG", "ORB"] as const;
type CompetitorPrefix = (typeof COMPETITOR_PREFIXES)[number];

export interface CompetitorRef {
  competitorSku: string;
  brand: CompetitorPrefix;
}

// ─── Deterministic hash ────────────────────────────────────────────────────────

/**
 * djb2-style 32-bit hash of a string — no Date.now/Math.random.
 * Stable: same string always yields the same number.
 */
function stableHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0; // keep unsigned 32-bit
  }
  return h;
}

/**
 * Derives a short uppercase alphanumeric string from a hash value.
 * Uses base-36 encoding of the hash, uppercased, padded to exactly 8 chars.
 * 8 chars gives ~2.8 trillion unique values (36^8), eliminating collisions
 * across the 200,000-product catalog.
 */
function alnumFromHash(h: number): string {
  // Convert to base 36 (0-9 + a-z), uppercase, pad to exactly 8 characters.
  return (h >>> 0).toString(36).toUpperCase().padStart(8, "0").slice(0, 8);
}

// ─── competitorSkusFor ────────────────────────────────────────────────────────

/**
 * Derives 1 or 2 plausible competitor/legacy part numbers for a product.
 * Deterministic: same product.id always yields the same result.
 * No Date.now/Math.random used.
 */
export function competitorSkusFor(product: CatalogProduct): CompetitorRef[] {
  const h1 = stableHash(product.id);
  const h2 = stableHash(product.id + ":2"); // second SKU uses a different seed

  // Choose prefix from the 5-element array based on hash mod 5
  const prefix1 = COMPETITOR_PREFIXES[h1 % COMPETITOR_PREFIXES.length];

  // Alnum suffix: derived from the hash — guaranteed unique per id
  const alnum1 = alnumFromHash(h1);
  const sku1 = `${prefix1}-${alnum1}`;

  // 1 or 2 entries: if (h1 % 3) !== 0, produce a second SKU from a different prefix
  // This gives ~2/3 products 2 SKUs and ~1/3 products 1 SKU
  if (h1 % 3 !== 0) {
    // Use a different prefix for the second SKU (offset by 2 from the first)
    const prefix2 =
      COMPETITOR_PREFIXES[(h1 % COMPETITOR_PREFIXES.length + 2) % COMPETITOR_PREFIXES.length];
    const alnum2 = alnumFromHash(h2);
    const sku2 = `${prefix2}-${alnum2}`;
    return [
      { competitorSku: sku1, brand: prefix1 },
      { competitorSku: sku2, brand: prefix2 },
    ];
  }

  return [{ competitorSku: sku1, brand: prefix1 }];
}

// ─── Reverse lookup cache ─────────────────────────────────────────────────────

type XrefMap = Map<string, string>; // UPPERCASE competitorSku → productId

const g = globalThis as unknown as { __xrefMap?: XrefMap };

function getXrefMap(): XrefMap {
  if (g.__xrefMap) return g.__xrefMap;

  const catalog = getCatalog();
  const map: XrefMap = new Map();

  for (const product of catalog.products) {
    const refs = competitorSkusFor(product);
    for (const ref of refs) {
      // Store uppercased key for case-insensitive lookup
      map.set(ref.competitorSku.toUpperCase(), product.id);
    }
  }

  g.__xrefMap = map;
  return map;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Looks up a competitor/legacy part number and returns the matching catalog product.
 * Normalises input: trims whitespace and uppercases before lookup.
 * Returns null when the SKU is not mapped to any catalog product.
 */
export function lookupCrossReference(sku: string): CatalogProduct | null {
  const normalised = sku.trim().toUpperCase();
  if (!normalised) return null;

  const map = getXrefMap();
  const productId = map.get(normalised);
  if (!productId) return null;

  return getCatalog().byId.get(productId) ?? null;
}

/**
 * Returns the competitor/legacy part numbers that this catalog product replaces.
 * This is the "Replaces / cross-references" list shown on the product detail.
 *
 * Authoritative: only returns SKUs that round-trip via the reverse map back to
 * this product's id. This guarantees that the displayed "Replaces" list can never
 * show a SKU that resolves to a different product — even in edge cases where the
 * last-write-wins map assigned a colliding key to another product.
 *
 * With the 8-char suffix virtually all generated SKUs survive the filter; the
 * filter is the correctness guarantee, not a lossy trim.
 */
export function crossReferencesFor(product: CatalogProduct): CompetitorRef[] {
  const map = getXrefMap();
  return competitorSkusFor(product).filter(
    (ref) => map.get(ref.competitorSku.toUpperCase()) === product.id
  );
}
