import type { WescoProduct, ProductCategory, ProductSpec, BranchStock, DCStock, ExternalSource } from "@/features/product-finder/types";
import { CATEGORIES, TAXONOMY, type SubcategoryTemplate } from "@/lib/catalog/taxonomy";
import { makeRng, pick, randInt, round2 } from "@/lib/catalog/prng";
import { WESCO_PRODUCTS } from "@/data/mock/wesco-products";

export const CATALOG_SIZE = 50000;
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
  electrical: 36000, datacom: 3500, "oem-electrical": 3000, av: 2500, security: 2500, safety: 2500,
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

function makeExternal(rng: () => number, price: number): ExternalSource[] {
  const n = randInt(rng, 1, 3);
  return Array.from({ length: n }, (_, i) => ({
    distributor: EXTERNAL[i % EXTERNAL.length],
    url: `https://example.com/p/${randInt(rng, 1000, 9999)}`,
    price: round2(price * (1.05 + rng() * 0.25)),
    quantity: randInt(rng, 1, 50),
    status: "in-stock" as const,
    leadTime: pick(rng, ["1-2 days", "3-5 days", "1 week"]),
  }));
}

function genOne(
  rng: () => number,
  category: ProductCategory,
  sub: SubcategoryTemplate,
  seq: number,
): WescoProduct {
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
    externalSources: inStock ? [] : makeExternal(rng, price),
    imageIcon: sub.icon,
  };
}

export function generateCatalog(size: number = CATALOG_SIZE): WescoProduct[] {
  const rng = makeRng(FIXED_SEED);
  // Fail fast if any curated product is missing a non-negotiable spec — data gaps must not
  // silently shrink the catalog or break cross-sell/upsell/alternative links.
  for (const p of WESCO_PRODUCTS) {
    if (!p.specs.some((s) => s.isNonNeg)) {
      throw new Error(
        `Curated product "${p.id}" has no isNonNeg spec. ` +
        `Add isNonNeg: true to at least one spec in data/mock/wesco-products.ts.`
      );
    }
  }
  const featured = WESCO_PRODUCTS.slice(0, Math.min(WESCO_PRODUCTS.length, size));
  const out: WescoProduct[] = [...featured];
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
