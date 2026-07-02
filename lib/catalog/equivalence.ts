import type { CatalogProduct } from "@/features/product-finder/types";
import { getCatalog } from "@/lib/catalog/index";
import { CATEGORIES, TAXONOMY } from "@/lib/catalog/taxonomy";

/**
 * Functional equivalence — the form-fit-function test a distributor uses for a
 * true cross-reference. Two products are interchangeable when they are in the
 * same subcategory AND agree on that subcategory's CANONICAL key specs — the
 * defining electrical/mechanical attributes (amperage, voltage, poles; gauge,
 * conductor; NEMA config; …). Brand, price, stock, and datasheet extras
 * (interrupting rating, standard, mount) may differ; the canonical keys may not.
 *
 * Canonical keys are taken from the taxonomy's non-negotiable specs per
 * subcategory, so a Square D QO115 and an Eaton CH115 — both 15A / 120-240V /
 * 1-Pole — cross-reference even though their full datasheets differ.
 */

// subcategory name → canonical key-spec names (the taxonomy's isNonNeg specs).
const CANONICAL_KEYS: Map<string, string[]> = new Map();
// subcategory name → key name → allowed taxonomy values (longest-first for scanning).
const ALLOWED_VALUES: Map<string, Map<string, string[]>> = new Map();
for (const category of CATEGORIES) {
  for (const sub of TAXONOMY[category]) {
    CANONICAL_KEYS.set(sub.name, sub.specs.filter((s) => s.isNonNeg).map((s) => s.name));
    const valMap = new Map<string, string[]>();
    for (const s of sub.specs) valMap.set(s.name, [...s.values].sort((a, b) => b.length - a.length));
    ALLOWED_VALUES.set(sub.name, valMap);
  }
}

/** The defining interchangeability spec names for a subcategory. */
export function canonicalKeys(subcategory: string): string[] {
  return CANONICAL_KEYS.get(subcategory) ?? [];
}

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const leadingNum = (s: string): string | null => (s.match(/\d+(\.\d+)?/) ?? [null])[0];

/**
 * Resolves a product's value for a canonical key onto the shared taxonomy
 * vocabulary — so a curated hero whose spec reads "30", "Copper, Stranded", or
 * "EMT (Electrical Metallic Tubing)" matches the generated catalog's "30-Space",
 * "Copper", "EMT". Non-mutating: the product's displayed specs are untouched.
 *
 * Resolution order (deterministic):
 *   1. exact spec value already in the taxonomy set  (fast path — generated products)
 *   2. fuzzy: an allowed value and the spec value contain each other, or share a
 *      leading number (24 ↔ 24-Port, 30 ↔ 30-Space)
 *   3. text scan: an allowed value appears in the product's name/description/specs/sku
 *   else undefined.
 */
// Per-product memo of resolved canonical values (the same product is compared
// against thousands of candidates; resolve each key once).
const canonCache = new WeakMap<CatalogProduct, Map<string, string | undefined>>();

export function canonicalValue(product: CatalogProduct, key: string): string | undefined {
  let cache = canonCache.get(product);
  if (cache && cache.has(key)) return cache.get(key);
  if (!cache) { cache = new Map(); canonCache.set(product, cache); }

  const resolved = resolveCanonicalValue(product, key);
  cache.set(key, resolved);
  return resolved;
}

function resolveCanonicalValue(product: CatalogProduct, key: string): string | undefined {
  const allowed = ALLOWED_VALUES.get(product.subcategory)?.get(key);
  if (!allowed || allowed.length === 0) return undefined;

  const raw = product.specs.find((s) => s.name === key)?.value;

  // 1. fast path
  if (raw !== undefined && allowed.includes(raw)) return raw;

  // 2. fuzzy match against the spec's own value
  if (raw !== undefined) {
    const nraw = norm(raw);
    const rawNum = leadingNum(raw);
    for (const v of allowed) {
      const nv = norm(v);
      if (nv.includes(nraw) || nraw.includes(nv)) return v;
      const vNum = leadingNum(v);
      if (rawNum !== null && vNum !== null && rawNum === vNum) return v;
    }
  }

  // 3. scan the product's text for any allowed value (longest first)
  const hay = norm([product.name, product.description, product.sku, ...product.specs.map((s) => s.value)].join(" "));
  for (const v of allowed) {
    if (hay.includes(norm(v))) return v;
  }
  return undefined;
}

/**
 * True when `candidate` is a genuine functional equivalent of `reference`:
 * same subcategory and identical canonical-key values (resolved onto the shared
 * vocabulary; both must resolve each key).
 */
export function isFunctionalEquivalent(reference: CatalogProduct, candidate: CatalogProduct): boolean {
  if (candidate.id === reference.id) return false;
  if (candidate.subcategory !== reference.subcategory) return false;

  const keys = canonicalKeys(reference.subcategory);
  if (keys.length === 0) return false; // no defined interchangeability basis

  for (const key of keys) {
    const rv = canonicalValue(reference, key);
    const cv = canonicalValue(candidate, key);
    if (rv === undefined || cv === undefined || rv !== cv) return false;
  }
  return true;
}

/** Total branch + DC stock, used to rank equivalents by availability. */
function totalStock(p: CatalogProduct): number {
  return (
    p.branchStock.reduce((s, b) => s + b.quantity, 0) +
    p.dcStock.reduce((s, d) => s + d.quantity, 0)
  );
}

/** Stock at a specific branch (0 when absent), for branch-aware ranking. */
function branchStockAt(p: CatalogProduct, branchId?: string): number {
  if (!branchId) return 0;
  return p.branchStock.find((b) => b.branchId === branchId)?.quantity ?? 0;
}

/**
 * All true functional equivalents of `product` in the catalog, ranked for a rep:
 * preferred line first, then stock at the rep's branch, then total stock, then
 * lowest price, then id (stable).
 */
export function functionalEquivalents(
  product: CatalogProduct,
  k = 8,
  branchId?: string,
): CatalogProduct[] {
  const { products } = getCatalog();
  return products
    .filter((p) => isFunctionalEquivalent(product, p))
    .sort(
      (a, b) =>
        Number(b.preferred) - Number(a.preferred) ||
        branchStockAt(b, branchId) - branchStockAt(a, branchId) ||
        totalStock(b) - totalStock(a) ||
        a.unitPrice - b.unitPrice ||
        a.id.localeCompare(b.id),
    )
    .slice(0, k);
}

/** Count of canonical key specs a candidate shares with the reference (for near-match ranking). */
export function sharedNonNegCount(reference: CatalogProduct, candidate: CatalogProduct): number {
  let shared = 0;
  for (const key of canonicalKeys(reference.subcategory)) {
    const rv = canonicalValue(reference, key);
    if (rv !== undefined && canonicalValue(candidate, key) === rv) shared++;
  }
  return shared;
}

// B12: canonical (interchangeability) attribute matches are worth far more than incidental
// datasheet extras, so they dominate; incidental matches only break ties among candidates that
// already agree on the same number of canonical keys.
const CANONICAL_SPEC_WEIGHT = 3;
const INCIDENTAL_SPEC_WEIGHT = 1;

/**
 * B12 — Spec-aware Find Alternatives. A weighted VERIFIED-ATTRIBUTE overlap between two products,
 * leveraging the enriched spec sets (avg ~9 specs on real parts): canonical key specs
 * (amperage/voltage/poles/gauge/…) count heavily, every other shared enriched spec (name+value both
 * matching, resolved onto the taxonomy vocabulary for canonical keys) counts lightly. Deterministic,
 * $0, non-mutating. Used to rank near-matches by real attribute agreement rather than name/keyword
 * similarity — so a genuinely closer part outranks a lexical near-miss.
 */
export function specOverlapScore(reference: CatalogProduct, candidate: CatalogProduct): number {
  const canonical = new Set(canonicalKeys(reference.subcategory));
  let score = 0;

  // Canonical keys — resolved onto the shared vocabulary (heavy weight).
  for (const key of canonical) {
    const rv = canonicalValue(reference, key);
    if (rv !== undefined && canonicalValue(candidate, key) === rv) score += CANONICAL_SPEC_WEIGHT;
  }

  // Incidental enriched specs — exact name+value agreement (light weight). Skip canonical names
  // (already scored above) so they aren't double-counted.
  const candByName = new Map(candidate.specs.map((s) => [norm(s.name), norm(s.value)]));
  for (const s of reference.specs) {
    if (canonical.has(s.name)) continue;
    const cv = candByName.get(norm(s.name));
    if (cv !== undefined && cv === norm(s.value)) score += INCIDENTAL_SPEC_WEIGHT;
  }
  return score;
}
