import type { CatalogProduct } from "@/features/product-finder/types";
import { resolveCrossConflicts, type VerifiedCrossEntry } from "@/lib/catalog/verified-crosses";
import { VERIFIED_CROSS_ENTRIES } from "@/data/real/verified-crosses";
import { BOM_CROSS_ENTRIES } from "@/data/real/bom-crosses";
import { APPLETON_TOOL_CROSS_ENTRIES } from "@/data/real/appleton-tool-crosses";
import { qualityScoreForUrl } from "@/lib/catalog/cross-sources";
import { CROSS_SOURCE_ENTRIES } from "@/data/real/cross-source-registry";
import { identifierKey } from "@/lib/catalog/identifiers";
import { getCatalog } from "@/lib/catalog/index";

/**
 * Server-side cross-reference runtime — one set of per-process caches shared
 * by every API route that touches the verified cross dataset:
 *   - the conflict-resolved entry list (the documented chosen-record rule),
 *   - the verified/curated product index by identifier key,
 *   - per-SKU cross counts for search-result badges.
 */

const g = globalThis as unknown as {
  __resolvedCrosses?: VerifiedCrossEntry[];
  __provenancedIndex?: Map<string, CatalogProduct[]>;
  __crossCounts?: Map<string, number>;
};

/** Conflict-resolved cross entries (cached once per process). */
export function resolvedCrossEntries(): VerifiedCrossEntry[] {
  if (!g.__resolvedCrosses) {
    // Real verified crosses + the rep-supplied Crouse-Hinds↔Appleton interchange crosses
    // (bom-crosses) + real catalog products crossed via Appleton's authoritative tool
    // (appleton-tool-crosses). All source-cited, none generated/scraped.
    g.__resolvedCrosses = resolveCrossConflicts(
      [...VERIFIED_CROSS_ENTRIES, ...BOM_CROSS_ENTRIES, ...APPLETON_TOOL_CROSS_ENTRIES],
      { qualityScoreFor: (url) => qualityScoreForUrl(url, CROSS_SOURCE_ENTRIES) },
    ).resolved;
  }
  return g.__resolvedCrosses;
}

/** Verified/curated products indexed by identifier key. */
export function provenancedIndex(): Map<string, CatalogProduct[]> {
  if (!g.__provenancedIndex) {
    const m = new Map<string, CatalogProduct[]>();
    for (const p of getCatalog().products) {
      if (p.dataSource !== "verified" && p.dataSource !== "curated") continue;
      const key = identifierKey(p.sku);
      const list = m.get(key);
      if (list) list.push(p);
      else m.set(key, [p]);
    }
    g.__provenancedIndex = m;
  }
  return g.__provenancedIndex;
}

/** Look a (brand, mpn) pair up among stocked verified/curated products. */
export function resolveStocked(brand: string, mpn: string): CatalogProduct | null {
  const candidates = provenancedIndex().get(identifierKey(mpn)) ?? [];
  return candidates.find((p) => p.brand.toLowerCase() === brand.toLowerCase()) ?? null;
}

/** Number of resolved cross pairs touching this SKU (for result-card badges). */
export function crossCountForSku(sku: string): number {
  if (!g.__crossCounts) {
    const m = new Map<string, number>();
    for (const e of resolvedCrossEntries()) {
      for (const k of [identifierKey(e.aMpn), identifierKey(e.bMpn)]) {
        m.set(k, (m.get(k) ?? 0) + 1);
      }
    }
    g.__crossCounts = m;
  }
  return g.__crossCounts.get(identifierKey(sku)) ?? 0;
}
