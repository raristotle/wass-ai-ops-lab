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
  priceMin: number | null;
  priceMax: number | null;
  sortKey: SortKey;
  viewMode: ViewMode;
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

export interface SearchResponse {
  items: CatalogProduct[];
  total: number;
  page: number;
  pageSize: number;
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
}
