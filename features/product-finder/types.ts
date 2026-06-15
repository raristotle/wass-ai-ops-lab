import type { LifecycleStatus } from "@/lib/catalog/lifecycle";
export type { LifecycleStatus };

export type ProductCategory =
  | "electrical"
  | "datacom"
  | "oem-electrical"
  | "av"
  | "security"
  | "safety";

export type StockLevel = "in-stock" | "low-stock" | "out-of-stock";

export type ExternalDistributor =
  | "Grainger"
  | "Graybar"
  | "Home Depot Pro"
  | "Amazon Business"
  | "Platt Electric Supply"
  | "Elliott Electric Supply"
  | "SupplyHouse"
  | "AutomationDirect"
  | "Mouser Electronics"
  | "Rexel USA"
  | "Sonepar USA"
  | "ADI Global"
  | "CED"
  | "Manufacturer Direct";

export interface BranchStock {
  branchId: string;
  branchName: string;
  city: string;
  state: string;
  quantity: number;
}

export interface DCStock {
  dcId: string;
  dcName: string;
  location: string;
  quantity: number;
}

export interface ExternalSource {
  distributor: ExternalDistributor;
  url: string;
  price: number;
  quantity: number;
  status: StockLevel;
  leadTime?: string;
}

export interface ProductSpec {
  name: string;
  value: string;
  isNonNeg?: boolean;
}

/**
 * Data provenance for a catalog entry:
 *  - "verified"  — real manufacturer part number; specs and spec-sheet URL
 *                  researched against public manufacturer/distributor sources
 *                  and the URL verified live at dataset-build time.
 *  - "curated"   — hand-written demo entry built around a real part number,
 *                  but not link-verified.
 *  - "simulated" — output of the deterministic catalog generator; SKU, price,
 *                  and inventory are synthetic demo data.
 */
export type ProductDataSource = "verified" | "curated" | "simulated";

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: ProductCategory;
  subcategory: string;
  description: string;
  unitPrice: number;
  uom: string;
  specs: ProductSpec[];
  preferred: boolean;
  branchStock: BranchStock[];
  dcStock: DCStock[];
  alternativeIds?: string[];
  crossSellIds?: string[];
  upsellIds?: string[];
  externalSources: ExternalSource[];
  compatScore?: number;
  imageIcon: string;
  dataSource?: ProductDataSource;
  /** Manufacturer lifecycle status (Active/NRND/LTB/EOL/Discontinued). Absent = Active. */
  lifecycleStatus?: LifecycleStatus;
  /** SKU of the documented active successor, when one is known (curated data may set it). */
  replacedBySku?: string;
  /** Number of source-backed cross-reference pairs touching this SKU (search API attaches it for verified/curated results). */
  verifiedCrossCount?: number;
  /** Manufacturer spec sheet / datasheet URL (live-verified at build time for "verified" entries). */
  specSheetUrl?: string;
  /** Provenance of unitPrice, e.g. "Est. list price, researched 2026-06 (grainger.com)". */
  priceNote?: string;
}

export interface BomLine {
  id: string;
  rawText: string;
  quantity: number;
  description: string;
  resolved: CatalogProduct | null;
  alternatives: CatalogProduct[];
}

export interface SearchResult {
  product: CatalogProduct;
  alternatives: CatalogProduct[];
  crossSells: CatalogProduct[];
  upsells: CatalogProduct[];
}

export type ViewMode = "list" | "grid";
export type SortKey = "relevance" | "preferred" | "branchStock" | "priceLow" | "priceHigh" | "brand";

export interface FilterState {
  query: string;
  categories: Set<ProductCategory>;
  subcategories: Set<string>;
  brands: Set<string>;
  onlyBranchStock: boolean;
  onlyDCStock: boolean;
  onlyPreferred: boolean;
  onlyActive: boolean;
  priceMin: number | null;
  priceMax: number | null;
  sortKey: SortKey;
  viewMode: ViewMode;
  specFilters: Record<string, string[]>;
  /** Numeric range filters: spec name → { min?, max? } */
  specRanges: Record<string, { min?: number; max?: number }>;
}

export type AuthUser = {
  name: string;
  email: string;
  role: "sales" | "manager" | "admin";
  branch: string;
  branchId: string;
};

export type RecommendationTier = "excellent" | "good" | "partial";

export interface ScoreFactor {
  label: string;
  points: number;
  positive: boolean; // true = contributed points; false = neutral/warning note
}

export interface RecommendationScore {
  total: number; // 0–100
  tier: RecommendationTier;
  factors: ScoreFactor[]; // positive contributors first (points desc), notes last
}

export type ParsedFilterKind =
  | "priceMax"
  | "priceMin"
  | "branchStock"
  | "preferred"
  | "category"
  | "subcategory"
  | "brand";

export interface ParsedFilter {
  id: string;
  kind: ParsedFilterKind;
  label: string;
  value: string | number | boolean;
}

export interface ParsedQuery {
  text: string;
  filters: ParsedFilter[];
}

export interface ProductSnapshot {
  id: string;
  name: string;
  brand: string;
  unitPrice: number;
  imageIcon: string;
  category: ProductCategory;
}

/** A categorical (enum) facet — checkboxes for each distinct value. */
export interface EnumFacet {
  type: "enum";
  name: string;
  values: { value: string; count: number }[];
}

/** A numeric range facet — slider / min-max inputs. */
export interface RangeFacet {
  type: "range";
  name: string;
  unit: string;
  min: number;
  max: number;
}

export type Facet = EnumFacet | RangeFacet;

export interface SearchResponse {
  items: CatalogProduct[];
  total: number;
  page: number;
  pageSize: number;
  facets: Facet[];
  /** Best in-stock substitute per out-of-stock item id (attached by the search route). */
  substitutes?: Record<string, CatalogProduct>;
}

export interface SuggestItem {
  id: string;
  name: string;
  sku: string;
  brand: string;
  imageIcon: string;
}

export interface ProductDetail {
  product: CatalogProduct;
  equivalents: CatalogProduct[];
  /** Source-backed crosses (≥95 confidence only) — verified/curated products. */
  verifiedCrosses?: import("@/lib/catalog/verified-crosses").VerifiedCrossResult[];
  /** Researched brand→parent hierarchy for this product's brand, when modeled. */
  brandHierarchy?: import("@/lib/catalog/brand-hierarchy").BrandNode | null;
}
