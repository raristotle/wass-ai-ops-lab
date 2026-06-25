import type { BranchStock, CatalogProduct, DCStock, ProductCategory, ProductSpec } from "@/features/product-finder/types";
import { TAXONOMY } from "@/lib/catalog/taxonomy";
import { makeRng, randInt } from "@/lib/catalog/prng";
import { ENERGY_STAR_LIGHTING, ENERGY_STAR_SOURCE_NAME, ENERGY_STAR_SOURCE_URL } from "@/data/real/energy-star-lighting";

/**
 * External bulk-source product tier — real products ingested from large,
 * openly-licensed public datasets (e.g. ENERGY STAR / EPA public domain).
 *
 * Unlike `data/real/real-products.ts` (hand-curated, with researched list price +
 * per-record datasheet), these come from bulk tables that carry factual identity +
 * specs but NO list price or per-unit spec sheet. They are real and source-cited, so
 * they fold into the searchable catalog deduped by SKU — but are honestly labelled:
 * unitPrice 0 ("price on request"), a shared source citation instead of a datasheet,
 * and a lower data-quality score (no datasheet) that the quality report reflects.
 *
 * This is the ingestion target the renewable adapter framework feeds; the same
 * mapper scales to other openly-licensed bulk sources (Open Icecat, DOE CCMS, …).
 */
export interface ExternalProductEntry {
  mpn: string;
  brand: string;
  name: string;
  category: ProductCategory;
  subcategory: string;
  description: string;
  specs: ProductSpec[];
  verifiedAt: string; // YYYY-MM-DD the source snapshot was pulled
}

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
];
const DCS: Omit<DCStock, "quantity">[] = [{ dcId: "DC-TEX-01", dcName: "Texas DC – Katy", location: "Katy, TX" }];

function iconFor(category: ProductCategory, subcategory: string): string {
  const sub = TAXONOMY[category]?.find((s) => s.name === subcategory);
  return sub?.icon ?? "💡";
}

function externalToCatalog(e: ExternalProductEntry, sourceName: string, sourceUrl: string): CatalogProduct {
  const rng = makeRng(hash32(`${e.brand}|${e.mpn}|ext`));
  const branchStock = BRANCHES.map((b) => ({ ...b, quantity: rng() < 0.7 ? randInt(rng, 2, 120) : 0 })).filter((b) => b.quantity > 0);
  const dcStock = DCS.map((d) => ({ ...d, quantity: randInt(rng, 10, 400) })).filter((d) => d.quantity > 0);
  const idSafe = e.mpn.replace(/[^A-Za-z0-9.-]/g, "_");
  return {
    id: `EXT-${e.brand.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase()}-${idSafe}`,
    sku: e.mpn,
    name: e.name,
    brand: e.brand,
    category: e.category,
    subcategory: e.subcategory,
    description: e.description,
    unitPrice: 0, // no published list price in the bulk source — UI shows "price on request"
    uom: "EA",
    specs: e.specs,
    preferred: false,
    branchStock,
    dcStock,
    externalSources: [], // no distributor stock offers for bulk-source records
    imageIcon: iconFor(e.category, e.subcategory),
    dataSource: "verified",
    specSheetUrl: sourceUrl,
    priceNote: `${sourceName} — factual public-domain data; no list price (price on request).`,
  };
}

function build(): CatalogProduct[] {
  const out: CatalogProduct[] = [];
  const seenSku = new Set<string>();
  for (const e of ENERGY_STAR_LIGHTING) {
    if (!e.specs.some((s) => s.isNonNeg)) continue; // mirror the catalog isNonNeg invariant
    const p = externalToCatalog(e, ENERGY_STAR_SOURCE_NAME, ENERGY_STAR_SOURCE_URL);
    const skuKey = p.sku.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (seenSku.has(skuKey)) continue;
    seenSku.add(skuKey);
    out.push(p);
  }
  return out;
}

/** Catalog products from openly-licensed bulk sources (deduped by SKU). */
export const EXTERNAL_PRODUCTS: CatalogProduct[] = build();
