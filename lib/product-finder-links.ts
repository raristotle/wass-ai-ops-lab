import type { WescoProduct } from "@/features/product-finder/types";

export type ExternalLink = {
  distributor: string;
  url: string;
  price?: number;
  quantity?: number;
  leadTime?: string;
};

// ─── Known distributor search URL builders ────────────────────────────────────

const DISTRIBUTOR_URL: Record<string, (q: string) => string> = {
  "Grainger": (q) => `https://www.grainger.com/search?searchQuery=${q}`,
  "Graybar": (q) => `https://www.graybar.com/search/?text=${q}`,
  "Platt Electric Supply": (q) => `https://www.platt.com/search?text=${q}`,
  "Rexel USA": (q) => `https://www.rexelusa.com/s?q=${q}`,
  // M2: map "Home Depot Pro" variant to the same Home Depot search URL
  "Home Depot Pro": (q) => `https://www.homedepot.com/s/${q}`,
};

// Generic-only fallback distributors (appended when not already sourced)
const GENERIC_FALLBACKS: { distributor: string; urlFn: (q: string) => string }[] = [
  { distributor: "Grainger", urlFn: DISTRIBUTOR_URL["Grainger"] },
  { distributor: "Zoro", urlFn: (q) => `https://www.zoro.com/search?q=${q}` },
  { distributor: "Home Depot", urlFn: (q) => `https://www.homedepot.com/s/${q}` },
];

/**
 * Returns true when a sourced distributor name "covers" a generic distributor
 * name — i.e. the generic should be suppressed as a duplicate.
 *
 * Examples:
 *   sourcedName = "Home Depot Pro", genericName = "Home Depot"  → true
 *   sourcedName = "Grainger",       genericName = "Grainger"    → true  (exact)
 *   sourcedName = "Rexel USA",      genericName = "Home Depot"  → false
 */
function sourcedCoversGeneric(sourcedName: string, genericName: string): boolean {
  const s = sourcedName.toLowerCase();
  const g = genericName.toLowerCase();
  return s === g || s.startsWith(g) || s.includes(g);
}

/**
 * Returns a list of external distributor search links for a given product.
 *
 * - For each entry in product.externalSources: emits a row with the real mapped
 *   search URL (not the synthetic example.com one stored in the data), preserving
 *   price/quantity/leadTime for display.  Unknown distributor names fall back to a
 *   Google search URL.
 * - Always appends generic fallback rows for Grainger, Zoro, and Home Depot,
 *   deduped by distributor name against any sourced rows.
 */
export function externalSearchLinks(product: WescoProduct): ExternalLink[] {
  // M3: avoid doubled brand in query when product name already starts with brand
  const queryText = product.name.toLowerCase().startsWith(product.brand.toLowerCase())
    ? product.name
    : `${product.brand} ${product.name}`;
  const q = encodeURIComponent(queryText);
  const result: ExternalLink[] = [];
  const sourcedDistributors: string[] = [];

  // Emit a row per external source with a real mapped URL
  for (const src of product.externalSources) {
    sourcedDistributors.push(src.distributor);

    const urlFn = DISTRIBUTOR_URL[src.distributor];
    const url = urlFn
      ? urlFn(q)
      : `https://www.google.com/search?q=${q}+${encodeURIComponent(src.distributor)}`;

    const row: ExternalLink = { distributor: src.distributor, url, price: src.price, quantity: src.quantity };
    if (src.leadTime !== undefined) {
      row.leadTime = src.leadTime;
    }
    result.push(row);
  }

  // M2: Append generic fallback rows, skipping any whose name is covered by a sourced distributor
  for (const fallback of GENERIC_FALLBACKS) {
    const covered = sourcedDistributors.some((s) => sourcedCoversGeneric(s, fallback.distributor));
    if (!covered) {
      result.push({ distributor: fallback.distributor, url: fallback.urlFn(q) });
    }
  }

  return result;
}
