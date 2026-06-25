import type { CatalogProduct, ProductCategory, ProductSpec, BranchStock, DCStock, ExternalSource } from "@/features/product-finder/types";
import { CATEGORIES, TAXONOMY, type SubcategoryTemplate } from "@/lib/catalog/taxonomy";
import { makeRng, pick, randInt, round2 } from "@/lib/catalog/prng";
import { lifecycleStatusForId } from "@/lib/catalog/lifecycle";
import { CATALOG_PRODUCTS } from "@/data/mock/catalog-products";
import { REAL_PRODUCTS } from "@/lib/catalog/real";
import { EXTERNAL_PRODUCTS } from "@/lib/catalog/external-products";

export const CATALOG_SIZE = 200000;
const FIXED_SEED = 1337;

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
const EXTERNAL = ["Grainger", "Graybar", "Platt Electric Supply", "Rexel USA"] as const;

// Per-category target weights (sum normalized to the requested size).
const WEIGHTS: Record<ProductCategory, number> = {
  electrical: 46000, datacom: 3500, "oem-electrical": 3000, av: 2500, security: 2500, safety: 2500,
};

function makeStock(rng: () => number): { branchStock: BranchStock[]; dcStock: DCStock[] } {
  const branchStock = BRANCHES
    .map((b) => ({ ...b, quantity: rng() < 0.55 ? randInt(rng, 1, 120) : 0 }))
    .filter((b) => b.quantity > 0);
  const dcStock = DCS
    .map((d) => ({ ...d, quantity: rng() < 0.7 ? randInt(rng, 0, 400) : 0 }))
    .filter((d) => d.quantity > 0);
  return { branchStock, dcStock };
}

// Real distributor search URLs (the destinations exist; for simulated SKUs the
// search simply returns no results — no fake example.com links in the data).
const DISTRIBUTOR_SEARCH: Record<(typeof EXTERNAL)[number], (q: string) => string> = {
  "Grainger": (q) => `https://www.grainger.com/search?searchQuery=${encodeURIComponent(q)}`,
  "Graybar": (q) => `https://www.graybar.com/search/?text=${encodeURIComponent(q)}`,
  "Platt Electric Supply": (q) => `https://www.platt.com/search?text=${encodeURIComponent(q)}`,
  "Rexel USA": (q) => `https://www.rexelusa.com/s?q=${encodeURIComponent(q)}`,
};

function makeExternal(rng: () => number, price: number, sku: string): ExternalSource[] {
  const n = randInt(rng, 1, 3);
  return Array.from({ length: n }, (_, i) => {
    const distributor = EXTERNAL[i % EXTERNAL.length];
    return {
      distributor,
      url: DISTRIBUTOR_SEARCH[distributor](sku),
      price: round2(price * (1.05 + rng() * 0.25)),
      quantity: randInt(rng, 1, 50),
      status: "in-stock" as const,
      leadTime: pick(rng, ["1-2 days", "3-5 days", "1 week"]),
    };
  });
}

function genOne(
  rng: () => number,
  category: ProductCategory,
  sub: SubcategoryTemplate,
  seq: number,
): CatalogProduct {
  const brand = pick(rng, sub.brands);
  const specs: ProductSpec[] = sub.specs.map((s) => ({
    name: s.name,
    value: pick(rng, s.values),
    ...(s.isNonNeg ? { isNonNeg: true } : {}),
  }));
  const model = `${sub.skuPrefix}${String(seq).padStart(5, "0")}`;
  const sku = `${sub.skuPrefix}-${brand.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase()}-${seq}`;
  const id = `GEN-${model}`;
  const price = round2(sub.priceRange[0] + rng() * (sub.priceRange[1] - sub.priceRange[0]));
  const { branchStock, dcStock } = makeStock(rng);
  const inStock = branchStock.length > 0 || dcStock.length > 0;
  const keySpec = specs.filter((s) => s.isNonNeg).map((s) => s.value).join(" ");
  return {
    id, sku,
    name: `${brand} ${sub.name.replace(/s$/, "")} ${model}`,
    brand, category, subcategory: sub.name,
    description: `${keySpec} ${sub.name} by ${brand}`.trim(),
    unitPrice: price, uom: sub.uom,
    specs, preferred: rng() < 0.2,
    branchStock, dcStock,
    externalSources: inStock ? [] : makeExternal(rng, price, sku),
    imageIcon: sub.icon,
    dataSource: "simulated",
    // Derived from the id hash (not the shared rng) so existing SKUs/specs/stock
    // stay byte-identical; curated/verified real parts default to Active.
    lifecycleStatus: lifecycleStatusForId(id),
  };
}

export function generateCatalog(size: number = CATALOG_SIZE): CatalogProduct[] {
  const rng = makeRng(FIXED_SEED);
  // Fail fast if any curated product is missing a non-negotiable spec — data gaps must not
  // silently shrink the catalog or break cross-sell/upsell/alternative links.
  for (const p of CATALOG_PRODUCTS) {
    if (!p.specs.some((s) => s.isNonNeg)) {
      throw new Error(
        `Curated product "${p.id}" has no isNonNeg spec. ` +
        `Add isNonNeg: true to at least one spec in data/mock/catalog-products.ts.`
      );
    }
  }
  // Curated demo entries (real part numbers, unverified) + web-researched
  // verified real products fold in ahead of the synthetic remainder. When a
  // researched product shares a part number with a curated entry, the curated
  // entry is UPGRADED in place (verified spec link + provenance) rather than
  // duplicated — curated ids are referenced by alternative/cross-sell links.
  const normSku = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const curated = CATALOG_PRODUCTS.map((p) => ({ ...p, dataSource: p.dataSource ?? ("curated" as const) }));
  const curatedBySku = new Map(curated.map((p) => [normSku(p.sku), p]));
  const realUnique: CatalogProduct[] = [];
  for (const rp of REAL_PRODUCTS) {
    const existing = curatedBySku.get(normSku(rp.sku));
    if (existing) {
      existing.dataSource = "verified";
      existing.specSheetUrl = rp.specSheetUrl;
      existing.priceNote = rp.priceNote;
    } else {
      realUnique.push(rp);
    }
  }
  // Bulk external-source products (openly-licensed public datasets, e.g. ENERGY STAR /
  // EPA public domain) fold in too — unique SKUs only, behind curated + verified records.
  const realSkus = new Set(realUnique.map((p) => normSku(p.sku)));
  const externalUnique: CatalogProduct[] = [];
  for (const xp of EXTERNAL_PRODUCTS) {
    const k = normSku(xp.sku);
    if (curatedBySku.has(k) || realSkus.has(k)) continue;
    realSkus.add(k);
    externalUnique.push(xp);
  }
  const folded = [...curated, ...realUnique, ...externalUnique];
  const featured = folded.slice(0, Math.min(folded.length, size));
  const out: CatalogProduct[] = [...featured];
  const usedIds = new Set(out.map((p) => p.id));
  const remaining = size - out.length;
  if (remaining <= 0) return out.slice(0, size);

  const totalWeight = CATEGORIES.reduce((s, c) => s + WEIGHTS[c], 0);
  let seq = 1;
  for (const category of CATEGORIES) {
    const count = Math.round((WEIGHTS[category] / totalWeight) * remaining);
    const subs = TAXONOMY[category];
    // Weighted subcategory distribution (deterministic): each subcategory gets a
    // share proportional to its weight (default 1). The pad/trim loop below
    // squares up any rounding drift to hit the exact requested size.
    const totalSubWeight = subs.reduce((s, sub) => s + (sub.weight ?? 1), 0);
    for (const sub of subs) {
      const subCount = Math.round(((sub.weight ?? 1) / totalSubWeight) * count);
      for (let i = 0; i < subCount; i++) {
        let product = genOne(rng, category, sub, seq++);
        while (usedIds.has(product.id)) product = genOne(rng, category, sub, seq++);
        usedIds.add(product.id);
        out.push(product);
      }
    }
  }
  // Pad/trim to exact size deterministically.
  while (out.length < size) {
    const sub = TAXONOMY.electrical[0];
    let product = genOne(rng, "electrical", sub, seq++);
    while (usedIds.has(product.id)) product = genOne(rng, "electrical", sub, seq++);
    usedIds.add(product.id);
    out.push(product);
  }
  return out.slice(0, size);
}
