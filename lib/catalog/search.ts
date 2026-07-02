import type { CatalogProduct, ProductCategory, SortKey, SearchResponse, EnumFacet } from "@/features/product-finder/types";
import { getCatalog } from "@/lib/catalog/index";
import { computeFacets } from "@/lib/catalog/facets";
import { parseAttribute } from "@/lib/catalog/attributes";
import { isActiveLifecycle } from "@/lib/catalog/lifecycle";
import { crossCountForSku } from "@/lib/catalog/cross-runtime";
import { reciprocalRankFusion } from "@/lib/catalog/rrf";
import { matchConfidence } from "@/lib/product-finder-match-confidence";
import { identifierKey } from "@/lib/catalog/identifiers";

export interface SearchFilters {
  categories?: ProductCategory[];
  subcategories?: string[];
  brands?: string[];
  onlyBranchStock?: boolean;
  onlyDCStock?: boolean;
  onlyPreferred?: boolean;
  /** "Design out the obsolete" — keep only Active-lifecycle parts. */
  onlyActive?: boolean;
  /** Keep only parts that carry source-backed cross-references (v3-S2 #6). */
  onlyWithCrosses?: boolean;
  priceMin?: number | null;
  priceMax?: number | null;
  /** spec name → selected values (OR within a name, AND across names) */
  specFilters?: Record<string, string[]>;
  /** Numeric range filters: spec name → { min?, max? } — applied AFTER facets are computed */
  specRanges?: Record<string, { min?: number; max?: number }>;
}

export interface SearchParams {
  text?: string;
  filters?: SearchFilters;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
}

function totalBranch(p: CatalogProduct): number {
  return p.branchStock.reduce((s, b) => s + b.quantity, 0);
}

function totalDc(p: CatalogProduct): number {
  return p.dcStock.reduce((s, d) => s + d.quantity, 0);
}

function sortItems(items: CatalogProduct[], sort: SortKey): CatalogProduct[] {
  const arr = [...items];
  switch (sort) {
    case "preferred": return arr.sort((a, b) => (b.preferred ? 1 : 0) - (a.preferred ? 1 : 0));
    case "branchStock": return arr.sort((a, b) => totalBranch(b) - totalBranch(a));
    case "priceLow": return arr.sort((a, b) => a.unitPrice - b.unitPrice);
    case "priceHigh": return arr.sort((a, b) => b.unitPrice - a.unitPrice);
    case "brand": return arr.sort((a, b) => a.brand.localeCompare(b.brand));
    // v3-S2 #6 — one sort per Table column so any header is clickable.
    case "nameAsc": return arr.sort((a, b) => a.name.localeCompare(b.name));
    case "skuAsc": return arr.sort((a, b) => a.sku.localeCompare(b.sku));
    case "dcStock": return arr.sort((a, b) => totalDc(b) - totalDc(a));
    case "crosses": return arr.sort((a, b) => crossCountForSku(b.sku) - crossCountForSku(a.sku));
    case "subcatAsc": return arr.sort((a, b) => a.subcategory.localeCompare(b.subcategory));
    case "uomAsc": return arr.sort((a, b) => a.uom.localeCompare(b.uom));
    case "lifecycleActive":
      return arr.sort(
        (a, b) => (isActiveLifecycle(b.lifecycleStatus) ? 1 : 0) - (isActiveLifecycle(a.lifecycleStatus) ? 1 : 0),
      );
    default: return arr.sort((a, b) => (b.preferred ? 1 : 0) - (a.preferred ? 1 : 0));
  }
}

// Keyword lane score: weighted term hits across the strongest fields.
function keywordScore(p: CatalogProduct, terms: string[]): number {
  const name = p.name.toLowerCase();
  const sku = p.sku.toLowerCase();
  const brand = p.brand.toLowerCase();
  const sub = p.subcategory.toLowerCase();
  const wesco = (p.wescoSku ?? "").toLowerCase();
  const catn = (p.catalogNumber ?? "").toLowerCase();
  const gtin = (p.gtin ?? "").toLowerCase();
  // Normalized part-number identities — an EXACT hit dominates (reps type the whole
  // part number and expect that exact item first, mfr OR Wesco).
  const idKeys = [p.sku, p.wescoSku, p.catalogNumber, p.gtin]
    .filter((x): x is string => Boolean(x))
    .map((x) => identifierKey(x));
  let s = 0;
  for (const t of terms) {
    const tk = identifierKey(t);
    if (tk && idKeys.includes(tk)) s += 1000; // exact part-number match wins outright
    if (sku.includes(t)) s += 3;
    if (wesco.includes(t) || catn.includes(t) || gtin.includes(t)) s += 3; // Wesco/catalog/GTIN like the SKU
    if (name.includes(t)) s += 2;
    if (brand.includes(t)) s += 1;
    if (sub.includes(t)) s += 1;
  }
  return s;
}

// Hybrid relevance (v3-S3 #18): fuse the keyword lane with a fuzzy token-coverage
// lane via Reciprocal Rank Fusion — $0, deterministic, no score calibration. The
// fuzzy lane is bounded (skipped for very broad matches to keep search snappy).
const HYBRID_FUZZY_CAP = 3000;

// B3 (provenance-aware ranking): real, spec-verified data ranks above real-but-unverified, above
// synthetic/simulated demo data. Used only as a tie-breaker so keyword relevance still leads — but a
// simulated padding SKU never sorts above a genuine equivalent that matched the query just as well.
function provenanceRank(p: CatalogProduct): number {
  return p.dataSource === "verified" ? 2 : p.dataSource === "curated" ? 1 : 0;
}

function hybridRelevance(matched: CatalogProduct[], text: string, terms: string[]): CatalogProduct[] {
  const keyword = [...matched].sort(
    (a, b) =>
      keywordScore(b, terms) - keywordScore(a, terms) ||
      (b.preferred ? 1 : 0) - (a.preferred ? 1 : 0) ||
      provenanceRank(b) - provenanceRank(a),
  );
  if (matched.length > HYBRID_FUZZY_CAP) return keyword;
  const fuzzy = [...matched].sort((a, b) => matchConfidence(text, b) - matchConfidence(text, a));
  return reciprocalRankFusion([keyword, fuzzy], { key: (p) => p.id });
}

/**
 * Non-spec enum facets (Brand, Subcategory) over the matched set with full-set
 * counts (v3-S2 #4). Kept out of computeFacets so the sidebar stays unchanged;
 * the refine-by-filter bar consumes these alongside the spec facets.
 */
function computeRefineFacets(products: CatalogProduct[], maxValues = 8): EnumFacet[] {
  const brand = new Map<string, number>();
  const subcat = new Map<string, number>();
  for (const p of products) {
    brand.set(p.brand, (brand.get(p.brand) ?? 0) + 1);
    subcat.set(p.subcategory, (subcat.get(p.subcategory) ?? 0) + 1);
  }
  const toFacet = (name: string, counts: Map<string, number>): EnumFacet | null => {
    const values = [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
      .slice(0, maxValues);
    return values.length >= 2 ? { type: "enum", name, values } : null;
  };
  return [toFacet("Brand", brand), toFacet("Subcategory", subcat)].filter((f): f is EnumFacet => f !== null);
}

export function searchCatalog(params: SearchParams = {}): SearchResponse {
  const { products, haystack } = getCatalog();
  const f = params.filters ?? {};
  const text = (params.text ?? "").trim().toLowerCase();
  const page = Math.max(0, params.page ?? 0);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));

  const catSet = f.categories && f.categories.length ? new Set(f.categories) : null;
  const subSet = f.subcategories && f.subcategories.length ? new Set(f.subcategories) : null;
  const brandSet = f.brands && f.brands.length ? new Set(f.brands) : null;

  // Normalize specFilters: only keep entries with at least one value
  const specEntries: [string, Set<string>][] = Object.entries(f.specFilters ?? {})
    .filter(([, vals]) => vals.length > 0)
    .map(([name, vals]) => [name, new Set(vals)]);

  // Normalize specRanges: only keep entries with at least one bound
  const rangeEntries: [string, { min?: number; max?: number }][] = Object.entries(f.specRanges ?? {})
    .filter(([, range]) => range.min !== undefined || range.max !== undefined);

  const terms = text.split(/\s+/).filter(Boolean);

  // Phase 1: match text + structural filters (category/subcat/brand/stock/price)
  // This set is used to compute facets BEFORE specFilters/specRanges are applied.
  const baseMatched: CatalogProduct[] = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (terms.length > 0 && !terms.every((t) => haystack[i].includes(t))) continue;
    if (catSet && !catSet.has(p.category)) continue;
    if (subSet && !subSet.has(p.subcategory)) continue;
    if (brandSet && !brandSet.has(p.brand)) continue;
    if (f.onlyPreferred && !p.preferred) continue;
    if (f.onlyActive && !isActiveLifecycle(p.lifecycleStatus)) continue;
    if (f.onlyBranchStock && totalBranch(p) === 0) continue;
    if (f.onlyDCStock && p.dcStock.every((d) => d.quantity === 0)) continue;
    if (f.onlyWithCrosses && crossCountForSku(p.sku) === 0) continue;
    if (f.priceMin != null && p.unitPrice < f.priceMin) continue;
    if (f.priceMax != null && p.unitPrice > f.priceMax) continue;
    baseMatched.push(p);
  }

  // Compute facets over the base matched set (before spec narrowing — standard faceted search)
  const facets = computeFacets(baseMatched);
  const refineFacets = computeRefineFacets(baseMatched);

  // Phase 2: apply specFilters (AND across names, OR within a name's values)
  const afterSpecFilters: CatalogProduct[] =
    specEntries.length === 0
      ? baseMatched
      : baseMatched.filter((p) =>
          specEntries.every(([name, valueSet]) =>
            p.specs.some((s) => s.name === name && valueSet.has(s.value))
          )
        );

  // Phase 3: apply specRanges (AND across names)
  // A product matches a range entry if parseAttribute(name, its spec value) is
  // non-null and within [min ?? -Inf, max ?? +Inf] (inclusive).
  const matched: CatalogProduct[] =
    rangeEntries.length === 0
      ? afterSpecFilters
      : afterSpecFilters.filter((p) =>
          rangeEntries.every(([name, range]) => {
            // Find the spec value for this name on this product
            const spec = p.specs.find((s) => s.name === name);
            if (!spec) return false;
            const parsed = parseAttribute(name, spec.value);
            if (parsed === null) return false;
            const { numeric } = parsed;
            const low = range.min ?? -Infinity;
            const high = range.max ?? Infinity;
            return numeric >= low && numeric <= high;
          })
        );

  const sortKey = params.sort ?? "relevance";
  const sorted =
    sortKey === "relevance" && terms.length > 0
      ? hybridRelevance(matched, text, terms)
      : sortItems(matched, sortKey);
  const start = page * pageSize;
  return { items: sorted.slice(start, start + pageSize), total: matched.length, page, pageSize, facets, refineFacets };
}
