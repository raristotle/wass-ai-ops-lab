import type {
  BranchStock,
  CatalogProduct,
  DCStock,
  ProductCategory,
  ProductSpec,
} from "@/features/product-finder/types";
import { TAXONOMY } from "@/lib/catalog/taxonomy";
import { makeRng, randInt } from "@/lib/catalog/prng";
import { REAL_PRODUCT_ENTRIES } from "@/data/real/real-products";
import { assessCatalog, type CatalogAssessment } from "@/lib/catalog/provenance";

/**
 * A web-researched, link-verified real product as emitted by
 * scripts/build-real-products.mjs. Facts (part number, specs, spec-sheet URL,
 * price observation) come from public manufacturer/distributor sources; the
 * spec-sheet URL is verified live at build time. Branch/DC inventory does NOT
 * exist publicly and is assigned deterministically here — the UI labels it
 * as simulated.
 */
export interface RealProductEntry {
  mpn: string;
  brand: string;
  name: string;
  category: ProductCategory;
  subcategory: string;
  description: string;
  uom: string;
  estListPrice: number;
  priceSource: string;
  specs: ProductSpec[];
  specSheetUrl: string;
  upc?: string;
  verifiedAt: string; // YYYY-MM-DD the spec link was last verified
  // ── SKU-level identity & provenance (optional — researched per record) ──
  /** Wesco stock number when known (from a wesco.com/buy.wesco.com page). */
  wescoSku?: string;
  /** Manufacturer catalog number when it differs from the MPN. */
  catalogNumber?: string;
  /** Validated GTIN/UPC digits (lib/catalog/identifiers normalizeGtin). */
  gtin?: string;
  /** Brand hierarchy overrides — usually resolved via lib/catalog/brand-hierarchy. */
  subBrand?: string;
  division?: string;
  parentCompany?: string;
  /** Manufacturer/Wesco product page for this exact SKU. */
  productUrl?: string;
  /** Page the record's facts were taken from, when distinct from the above. */
  sourceUrl?: string;
}

// Deterministic 32-bit hash so each real product gets stable simulated stock.
function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const BRANCHES: Omit<BranchStock, "quantity">[] = [
  { branchId: "B-HOU-01", branchName: "Houston Downtown", city: "Houston", state: "TX" },
  { branchId: "B-DAL-01", branchName: "Dallas North", city: "Dallas", state: "TX" },
  { branchId: "B-AUS-01", branchName: "Austin Central", city: "Austin", state: "TX" },
  { branchId: "B-SAT-01", branchName: "San Antonio TX", city: "San Antonio", state: "TX" },
];
const DCS: Omit<DCStock, "quantity">[] = [
  { dcId: "DC-TEX-01", dcName: "Texas DC – Katy", location: "Katy, TX" },
  { dcId: "DC-GULF-01", dcName: "Gulf Coast DC", location: "Houston, TX" },
];

function iconFor(category: ProductCategory, subcategory: string): string {
  const sub = TAXONOMY[category]?.find((s) => s.name === subcategory);
  return sub?.icon ?? "📦";
}

function toCatalogProduct(e: RealProductEntry): CatalogProduct {
  const rng = makeRng(hash32(`${e.brand}|${e.mpn}`));
  // Popular commodity items: stocked broadly (simulated quantities, labeled in UI).
  const branchStock = BRANCHES.map((b) => ({ ...b, quantity: rng() < 0.8 ? randInt(rng, 4, 200) : 0 })).filter(
    (b) => b.quantity > 0,
  );
  const dcStock = DCS.map((d) => ({ ...d, quantity: randInt(rng, 20, 600) })).filter((d) => d.quantity > 0);
  const idSafe = e.mpn.replace(/[^A-Za-z0-9.-]/g, "_");
  return {
    id: `REAL-${e.brand.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase()}-${idSafe}`,
    sku: e.mpn,
    name: e.name,
    brand: e.brand,
    category: e.category,
    subcategory: e.subcategory,
    description: e.description,
    unitPrice: e.estListPrice,
    uom: e.uom,
    specs: e.specs,
    preferred: true,
    branchStock,
    dcStock,
    externalSources: [],
    imageIcon: iconFor(e.category, e.subcategory),
    dataSource: "verified",
    specSheetUrl: e.specSheetUrl,
    priceNote: `Est. list price, researched ${e.verifiedAt} (${e.priceSource}) — not a quote`,
  };
}

/**
 * Provenance gate: every entry is confidence-assessed; only production-ready
 * (verified, ≥95) records enter the catalog. The rest are quarantined here
 * and surfaced by the data-quality report — never silently included.
 */
export const REAL_CATALOG_ASSESSMENT: CatalogAssessment = assessCatalog(REAL_PRODUCT_ENTRIES);

function buildRealProducts(): CatalogProduct[] {
  const out: CatalogProduct[] = [];
  const seen = new Set<string>();
  const seenSku = new Set<string>();
  for (const e of REAL_CATALOG_ASSESSMENT.productionReady) {
    if (!e.specs.some((s) => s.isNonNeg)) {
      throw new Error(`Real product "${e.brand} ${e.mpn}" has no isNonNeg spec — fix the dataset build.`);
    }
    const p = toCatalogProduct(e);
    // Catalog-wide invariant: skus are unique. Distinct manufacturers can
    // share a part number (e.g. Moldex 6800 earplugs vs 3M 6800 respirator);
    // first entry in deterministic sort order wins, later ones are skipped.
    const skuKey = p.sku.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (seen.has(p.id) || seenSku.has(skuKey)) continue;
    seen.add(p.id);
    seenSku.add(skuKey);
    out.push(p);
  }
  return out;
}

export const REAL_PRODUCTS: CatalogProduct[] = buildRealProducts();
