import type { CatalogProduct, ProductCategory, ProductSpec } from "@/features/product-finder/types";
import { ENERGY_STAR_LIGHTING, ENERGY_STAR_SOURCE_NAME, ENERGY_STAR_SOURCE_URL } from "@/data/real/energy-star-lighting";
import { HUBBELL_CATALOG_PACKED } from "@/data/real/hubbell-catalog";
import { BOM_PRODUCTS } from "@/data/real/bom-products";
import { SECURITY_BRAND_PRODUCTS } from "@/data/real/security-brand-products";
import { ATKORE_PRODUCTS } from "@/data/real/atkore-products";
import { ENRICHED_CROSS_TARGETS } from "@/data/real/enriched-cross-targets";

/**
 * External bulk-source product tier — REAL products ingested from large, openly-
 * accessible sources, deduped by SKU and folded into the searchable catalog.
 *
 * Two grades, both honestly labelled (no fabrication):
 *  1. SPEC-RICH (ENERGY STAR / EPA public domain): brand + model + full photometric
 *     specs. Public-domain factual data.
 *  2. IDENTITY-ONLY (manufacturer product sitemaps, e.g. Hubbell): brand + catalog
 *     number + product name + source URL, extracted from the manufacturer's own
 *     public, crawlable sitemap. Factual identity only — NO proprietary specs,
 *     descriptions, or images are copied. These carry empty specs, unitPrice 0
 *     ("price/specs on request"), and a low data-quality score the report reflects.
 *     They are the "bring in the SKU now, enrich later" tier.
 */
export interface ExternalProductEntry {
  mpn: string;
  brand: string;
  name: string;
  category: ProductCategory;
  subcategory: string;
  description: string;
  specs: ProductSpec[];
  verifiedAt: string;
  /** Wesco stock number when known — makes the part searchable by the Wesco SKU too. */
  wescoSku?: string;
  catalogNumber?: string;
  gtin?: string;
  /** Source datasheet / spec page when the record was web-verified. */
  specSheetUrl?: string;
}

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

// ── Spec-rich tier (ENERGY STAR) ──
function energyStarToCatalog(e: ExternalProductEntry): CatalogProduct {
  return {
    id: `EXT-ES-${e.mpn.replace(/[^A-Za-z0-9.-]/g, "_")}`,
    sku: e.mpn,
    name: e.name,
    brand: e.brand,
    category: e.category,
    subcategory: e.subcategory,
    description: e.description,
    unitPrice: 0,
    uom: "EA",
    specs: e.specs,
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "💡",
    dataSource: "verified",
    specSheetUrl: ENERGY_STAR_SOURCE_URL,
    priceNote: `${ENERGY_STAR_SOURCE_NAME} — factual public-domain data; no list price (price on request).`,
  };
}

// ── Identity-only tier (Hubbell public sitemap) ──
const HUBBELL_BRAND: Record<string, string> = {
  hubbellpowersystems: "Hubbell Power Systems",
  "wiringdevice-kellems": "Hubbell Wiring Device-Kellems",
  burndy: "Burndy",
  killark: "Killark",
  hubbellpremisewiring: "Hubbell Premise Wiring",
  bryant: "Bryant",
  wiegmann: "Wiegmann",
  acmeelectric: "Acme Electric",
  hubbellindustrialcontrols: "Hubbell Industrial Controls",
  powerohm: "Powerohm",
  taymac: "TayMac",
  acceltex: "AccelTex",
  bell: "Bell",
  rigpower: "RIG Power",
  hawke: "Hawke",
  chalmit: "Chalmit",
  hipotronics: "Hipotronics",
  beckwithelectric: "Beckwith Electric",
  aclara: "Aclara",
};

function brandLabel(path: string): string {
  return HUBBELL_BRAND[path] ?? path.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function subcatFor(slug: string): string {
  const s = slug;
  if (/receptacle|outlet/.test(s)) return "Receptacles & Outlets";
  if (/switch/.test(s)) return "Switches";
  if (/connector|splice|terminal|\blug/.test(s)) return "Connectors & Lugs";
  if (/enclosure|junction-box|\bbox\b|cover/.test(s)) return "Boxes & Enclosures";
  if (/breaker/.test(s)) return "Circuit Breakers";
  if (/transformer/.test(s)) return "Transformers";
  if (/\bplug\b/.test(s)) return "Plugs & Receptacles";
  if (/fitting|coupling|conduit/.test(s)) return "Conduit Fittings";
  if (/ground|bond/.test(s)) return "Grounding & Bonding";
  if (/cable|wire/.test(s)) return "Wire & Cable";
  return "Catalog Items";
}

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

function buildHubbell(): CatalogProduct[] {
  const out: CatalogProduct[] = [];
  const seen = new Set<string>();
  for (const line of HUBBELL_CATALOG_PACKED.split("\n")) {
    if (!line) continue;
    const i1 = line.indexOf("\t");
    const i2 = line.indexOf("\t", i1 + 1);
    if (i1 < 0 || i2 < 0) continue;
    const path = line.slice(0, i1);
    const sku = line.slice(i1 + 1, i2);
    const slug = line.slice(i2 + 1);
    if (!sku || seen.has(sku)) continue;
    seen.add(sku);
    const brand = brandLabel(path);
    const subcategory = subcatFor(slug);
    const nameWords = titleCase(slug.replace(/-/g, " ")).slice(0, 90);
    out.push({
      id: `EXT-HUB-${sku}`,
      sku,
      name: `${brand} ${nameWords}`.trim(),
      brand,
      category: "electrical",
      subcategory,
      description: `${nameWords}. ${brand} — Hubbell product catalog identity record (specs on request).`,
      unitPrice: 0,
      uom: "EA",
      // Only the factual attributes the sitemap gives us — the real manufacturer and the
      // product type derived from the listing name. NOT fabricated engineering specs; the
      // detailed specs are flagged "on request" for later enrichment.
      specs: [
        { name: "Manufacturer", value: brand, isNonNeg: true },
        { name: "Product Type", value: subcategory },
      ],
      preferred: false,
      branchStock: [],
      dcStock: [],
      externalSources: [],
      imageIcon: "📦",
      dataSource: "verified",
      specSheetUrl: `https://www.hubbell.com/${path}/en/products/${slug}/p/${sku}`,
      priceNote: "Hubbell public product catalog — identity record; specs/price on request.",
    });
  }
  return out;
}

// ── Wesco-carried real parts (Prime Controls BOM) — searchable by mfr part OR Wesco SKU ──
function bomToCatalog(e: ExternalProductEntry): CatalogProduct {
  return {
    id: `EXT-BOM-${e.mpn.replace(/[^A-Za-z0-9.-]/g, "_")}`,
    sku: e.mpn,
    name: e.name,
    brand: e.brand,
    category: e.category,
    subcategory: e.subcategory,
    description: e.description,
    unitPrice: 0,
    uom: "EA",
    specs: e.specs,
    preferred: true, // Wesco line items
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "🔩",
    dataSource: "verified",
    wescoSku: e.wescoSku,
    catalogNumber: e.catalogNumber,
    gtin: e.gtin,
    specSheetUrl: "https://edt.youritdept.com/crossref/AppletonCrossRef.jsp",
    priceNote: "Prime Controls BOM — Crouse-Hinds↔Appleton interchange; Wesco stock # carried. Price on request.",
  };
}

// Rep-supplied top-selling SKU lists (security/surveillance brands) — identity products.
function securityToCatalog(e: ExternalProductEntry): CatalogProduct {
  return {
    id: `EXT-SEC-${e.mpn.replace(/[^A-Za-z0-9.-]/g, "_")}`,
    sku: e.mpn,
    name: e.name,
    brand: e.brand,
    category: e.category,
    subcategory: e.subcategory,
    description: e.description,
    unitPrice: 0,
    uom: "EA",
    specs: e.specs,
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "📹",
    dataSource: "verified",
    specSheetUrl: e.specSheetUrl,
    priceNote: e.specSheetUrl
      ? "Top-selling SKU — specs web-verified from manufacturer datasheet; price on request."
      : "Rep-supplied top-selling SKU list — identity record; price on request.",
  };
}

// Atkore conduit/fittings — REAL products with specs straight from Atkore catalog data.
function atkoreToCatalog(e: ExternalProductEntry): CatalogProduct {
  return {
    id: `EXT-ATK-${e.mpn.replace(/[^A-Za-z0-9.-]/g, "_")}`,
    sku: e.mpn,
    name: e.name,
    brand: e.brand,
    category: e.category,
    subcategory: e.subcategory,
    description: e.description,
    unitPrice: 0,
    uom: "EA",
    specs: e.specs,
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "🔧",
    dataSource: "verified",
    gtin: e.gtin,
    priceNote: "Atkore catalog data — specs from manufacturer file; price on request.",
  };
}

// Web-enriched cross-target SKUs — real products with verified specs from manufacturer sources.
function enrichedToCatalog(e: ExternalProductEntry): CatalogProduct {
  return {
    id: `EXT-ENR-${e.mpn.replace(/[^A-Za-z0-9.-]/g, "_")}`,
    sku: e.mpn,
    name: e.name,
    brand: e.brand,
    category: e.category,
    subcategory: e.subcategory,
    description: e.description,
    unitPrice: 0,
    uom: "EA",
    specs: e.specs,
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: e.category === "datacom" ? "🔌" : "⚡",
    dataSource: "verified",
    specSheetUrl: e.specSheetUrl,
    priceNote: "Specs web-verified from manufacturer datasheet; price on request.",
  };
}

function build(): CatalogProduct[] {
  const out: CatalogProduct[] = [];
  const seenSku = new Set<string>();
  const push = (p: CatalogProduct) => {
    const k = norm(p.sku);
    if (!k || seenSku.has(k)) return;
    seenSku.add(k);
    out.push(p);
  };
  // Wesco-carried real parts first (they take SKU precedence over bulk identity records).
  for (const e of BOM_PRODUCTS) {
    if (!e.specs.some((s) => s.isNonNeg)) continue;
    push(bomToCatalog(e));
  }
  for (const e of SECURITY_BRAND_PRODUCTS) {
    if (!e.specs.some((s) => s.isNonNeg)) continue;
    push(securityToCatalog(e));
  }
  for (const e of ATKORE_PRODUCTS) {
    if (!e.specs.some((s) => s.isNonNeg)) continue;
    push(atkoreToCatalog(e));
  }
  for (const e of ENRICHED_CROSS_TARGETS) {
    if (!e.specs.some((s) => s.isNonNeg)) continue;
    push(enrichedToCatalog(e));
  }
  for (const e of ENERGY_STAR_LIGHTING) {
    if (!e.specs.some((s) => s.isNonNeg)) continue;
    push(energyStarToCatalog(e));
  }
  for (const p of buildHubbell()) push(p);
  return out;
}

/** Real products from openly-accessible bulk sources (ENERGY STAR + Hubbell sitemap), deduped by SKU. */
export const EXTERNAL_PRODUCTS: CatalogProduct[] = build();
