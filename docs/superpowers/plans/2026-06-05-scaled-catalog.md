# Scaled Synthetic Catalog (20k) + Server-Side Search — Implementation Plan

> **Superseded (2026-06-05):** this plan was fully executed at 20,000 products, then
> the catalog was scaled the same day to **50,000 products** (+30k electrical,
> construction-commodity-weighted, 49 new subcategories) in commits `573ea33` and
> `4d55a37`. Code snippets below reflect the original 20k implementation.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 46-product client-side catalog with a deterministic 20,000-product synthetic catalog across 6 categories, served by in-memory-backed API routes, with similarity-based equivalents.

**Architecture:** A seeded generator builds 20k products once per server process (cached on `globalThis`); thin Next.js Route Handlers expose search/suggest/detail; the client store becomes async and fetches from them. Heavy logic lives in pure `lib/catalog/*` modules unit-tested in the node-only vitest setup. No database, no network, no secrets.

**Tech Stack:** Next.js 15 App Router (Route Handlers), React 19, TypeScript (strict), Zustand, Zod, Vitest. Path aliases `@/lib`, `@/features`, `@/data`, `@/components` resolve from repo root.

---

## Conventions

- Run commands from repo root `C:\Users\raris\wass-ai-ops-lab`.
- Tests live in `lib/**/*.test.ts` (node env, no DOM). Components/routes verified via `npm run typecheck` + `npm run build` + manual checks.
- `npm test` runs all; target one file with `npx vitest run lib/<file>.test.ts`.
- Do NOT run `npm run lint` interactively-unsafe? It is fixed now (`eslint .`); it's fine to run, but `npm run build` is the comprehensive gate.
- Conventional Commits; commit after each task's tests pass. Do NOT stage `features/win-loss-workbench/CompetitorHeatmap.tsx` (unrelated pre-existing change).

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `features/product-finder/types.ts` | 6 categories, optional alt ids, `ProductSnapshot` | Modify |
| `lib/catalog/taxonomy.ts` | Finite taxonomy: categories, subcategories, brands, spec templates | Create |
| `lib/catalog/prng.ts` | Seeded deterministic PRNG | Create |
| `lib/catalog/generate.ts` | `generateCatalog(size)` → products | Create |
| `lib/catalog/index.ts` | `getCatalog()` in-memory singleton + haystack | Create |
| `lib/catalog/search.ts` | `searchCatalog(params)` | Create |
| `lib/catalog/equivalents.ts` | `findEquivalents(product, k, branchId?)` | Create |
| `lib/catalog/schemas.ts` | Zod schemas for query params | Create |
| `apps/web/app/api/products/search/route.ts` | GET search | Create |
| `apps/web/app/api/products/suggest/route.ts` | GET suggest | Create |
| `apps/web/app/api/products/[id]/route.ts` | GET detail + equivalents | Create |
| `lib/product-finder-api.ts` | Client fetch wrappers | Create |
| `lib/product-finder-store.ts` | Async search, pagination, snapshots | Modify |
| `lib/product-finder-store.test.ts` | Rework result tests to mock fetch | Modify |
| `features/product-finder/FilterSidebar.tsx` | 6 categories, taxonomy lists, drop counts | Modify |
| `features/product-finder/ProductGrid.tsx` | Server-ordered, Load more, loading/skeleton | Modify |
| `features/product-finder/SearchBar.tsx` | Remove BOM tab; suggest via API | Modify |
| `features/product-finder/SavedAndRecentPanel.tsx` | Render from snapshots | Modify |
| `apps/web/app/product-finder/page.tsx` | Hide GoesWithPanel; wire loading/load-more | Modify |

---

## Phase 1 — Types & taxonomy

### Task 1: Expand categories + types

**Files:** Modify `features/product-finder/types.ts`

- [ ] **Step 1: Edit the category union and optional fields**

In `features/product-finder/types.ts`:

Change line 1 from:
```ts
export type ProductCategory = "electrical" | "datacom";
```
to:
```ts
export type ProductCategory =
  | "electrical"
  | "datacom"
  | "oem-electrical"
  | "av"
  | "security"
  | "safety";
```

In `interface CatalogProduct`, change these three lines to optional:
```ts
  alternativeIds: string[];
  crossSellIds: string[];
  upsellIds: string[];
```
to:
```ts
  alternativeIds?: string[];
  crossSellIds?: string[];
  upsellIds?: string[];
```

Append at the end of the file:
```ts
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
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: a few errors where code reads `product.alternativeIds.includes(...)` without a guard (e.g. `ProductGrid.tsx`, `data/mock/catalog-products.ts`'s `getAlternatives`). That is expected — they are fixed in later tasks. If `data/mock/catalog-products.ts` itself errors on `product.alternativeIds.map`, add `?? []`:
in `getAlternatives`/`getCrossSells`/`getUpsells`, change `product.alternativeIds.map` → `(product.alternativeIds ?? []).map` (same for crossSellIds/upsellIds). Re-run typecheck; the only remaining error should be `ProductGrid.tsx:39-40` (fixed in Task 13).

- [ ] **Step 3: Commit**
```bash
git add features/product-finder/types.ts data/mock/catalog-products.ts
git commit -m "feat(catalog): expand ProductCategory to 6 values; add catalog DTO types"
```

---

### Task 2: Taxonomy module

**Files:** Create `lib/catalog/taxonomy.ts`, Test `lib/catalog/taxonomy.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/catalog/taxonomy.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { CATEGORIES, TAXONOMY, ALL_SUBCATEGORIES, ALL_BRANDS, CATEGORY_META } from "@/lib/catalog/taxonomy";

describe("taxonomy", () => {
  it("defines all 6 categories", () => {
    expect(CATEGORIES).toEqual([
      "electrical", "datacom", "oem-electrical", "av", "security", "safety",
    ]);
  });

  it("every category has a label, icon, and at least 2 subcategories", () => {
    for (const cat of CATEGORIES) {
      expect(CATEGORY_META[cat].label.length).toBeGreaterThan(0);
      expect(CATEGORY_META[cat].icon.length).toBeGreaterThan(0);
      expect(TAXONOMY[cat].length).toBeGreaterThanOrEqual(2);
    }
  });

  it("every subcategory has brands and at least one non-negotiable spec", () => {
    for (const cat of CATEGORIES) {
      for (const sub of TAXONOMY[cat]) {
        expect(sub.brands.length).toBeGreaterThan(0);
        expect(sub.specs.some((s) => s.isNonNeg)).toBe(true);
        expect(sub.specs.every((s) => s.values.length > 0)).toBe(true);
      }
    }
  });

  it("ALL_SUBCATEGORIES and ALL_BRANDS are sorted, unique, non-empty", () => {
    expect(ALL_SUBCATEGORIES.length).toBeGreaterThan(10);
    expect(new Set(ALL_SUBCATEGORIES).size).toBe(ALL_SUBCATEGORIES.length);
    expect([...ALL_SUBCATEGORIES]).toEqual([...ALL_SUBCATEGORIES].sort());
    expect(ALL_BRANDS.length).toBeGreaterThan(10);
    expect(new Set(ALL_BRANDS).size).toBe(ALL_BRANDS.length);
  });
});
```

- [ ] **Step 2: Run, confirm FAIL:** `npx vitest run lib/catalog/taxonomy.test.ts` (module not found).

- [ ] **Step 3: Implement.** Create `lib/catalog/taxonomy.ts`:
```ts
import type { ProductCategory } from "@/features/product-finder/types";

export const CATEGORIES: ProductCategory[] = [
  "electrical", "datacom", "oem-electrical", "av", "security", "safety",
];

export interface SpecTemplate {
  name: string;
  values: string[];
  isNonNeg?: boolean;
}

export interface SubcategoryTemplate {
  name: string;
  brands: string[];
  uom: string;
  icon: string;
  priceRange: [number, number];
  skuPrefix: string;
  specs: SpecTemplate[];
}

export const CATEGORY_META: Record<ProductCategory, { label: string; icon: string }> = {
  electrical: { label: "Electrical", icon: "⚡" },
  datacom: { label: "Datacom", icon: "🌐" },
  "oem-electrical": { label: "OEM Electrical", icon: "🔧" },
  av: { label: "AV", icon: "📺" },
  security: { label: "Security", icon: "🎥" },
  safety: { label: "Safety", icon: "🦺" },
};

export const TAXONOMY: Record<ProductCategory, SubcategoryTemplate[]> = {
  electrical: [
    { name: "Circuit Breakers", skuPrefix: "CB", uom: "EA", icon: "⚡", priceRange: [6, 90], brands: ["Square D", "Eaton", "Siemens", "GE", "ABB"], specs: [
      { name: "Amperage", isNonNeg: true, values: ["15A", "20A", "30A", "40A", "50A", "60A"] },
      { name: "Voltage", isNonNeg: true, values: ["120/240V", "277/480V"] },
      { name: "Poles", isNonNeg: true, values: ["1-Pole", "2-Pole", "3-Pole"] },
      { name: "Int. Rating", values: ["10kAIC", "22kAIC", "65kAIC"] } ] },
    { name: "Wire & Cable", skuPrefix: "WC", uom: "FT", icon: "🔌", priceRange: [0.2, 4], brands: ["Southwire", "Encore Wire", "Cerro Wire", "General Cable"], specs: [
      { name: "Gauge", isNonNeg: true, values: ["14 AWG", "12 AWG", "10 AWG", "8 AWG"] },
      { name: "Conductor", isNonNeg: true, values: ["Copper", "Aluminum"] },
      { name: "Insulation", values: ["THHN", "XHHW", "Romex NM-B"] } ] },
    { name: "Conduit", skuPrefix: "CD", uom: "FT", icon: "🧵", priceRange: [0.5, 12], brands: ["Allied Tube", "Wheatland", "Republic Conduit"], specs: [
      { name: "Trade Size", isNonNeg: true, values: ['1/2"', '3/4"', '1"', '2"'] },
      { name: "Type", isNonNeg: true, values: ["EMT", "Rigid", "PVC"] } ] },
    { name: "Wiring Devices", skuPrefix: "WD", uom: "EA", icon: "🔘", priceRange: [1, 35], brands: ["Leviton", "Hubbell", "Pass & Seymour", "Lutron"], specs: [
      { name: "Type", isNonNeg: true, values: ["Receptacle", "Switch", "GFCI", "Dimmer"] },
      { name: "Amperage", isNonNeg: true, values: ["15A", "20A"] },
      { name: "Color", values: ["White", "Ivory", "Black", "Gray"] } ] },
  ],
  datacom: [
    { name: "Ethernet Cable", skuPrefix: "EC", uom: "FT", icon: "🌐", priceRange: [0.1, 2], brands: ["Belden", "CommScope", "Panduit", "Berk-Tek"], specs: [
      { name: "Category", isNonNeg: true, values: ["Cat5e", "Cat6", "Cat6A"] },
      { name: "Shielding", isNonNeg: true, values: ["UTP", "STP", "F/UTP"] },
      { name: "Jacket", values: ["CMR", "CMP Plenum"] } ] },
    { name: "Patch Panels", skuPrefix: "PP", uom: "EA", icon: "🎛️", priceRange: [25, 220], brands: ["Panduit", "Leviton", "CommScope", "Hubbell"], specs: [
      { name: "Ports", isNonNeg: true, values: ["24-Port", "48-Port"] },
      { name: "Category", isNonNeg: true, values: ["Cat6", "Cat6A"] } ] },
    { name: "Network Switches", skuPrefix: "NS", uom: "EA", icon: "🔀", priceRange: [120, 3500], brands: ["Cisco", "Juniper", "Aruba", "Netgear"], specs: [
      { name: "Ports", isNonNeg: true, values: ["8-Port", "24-Port", "48-Port"] },
      { name: "Speed", isNonNeg: true, values: ["1GbE", "10GbE"] },
      { name: "Mgmt", values: ["Managed", "Unmanaged"] } ] },
    { name: "Racks & Cabinets", skuPrefix: "RC", uom: "EA", icon: "🗄️", priceRange: [80, 1800], brands: ["Tripp Lite", "Panduit", "Chatsworth", "APC"], specs: [
      { name: "Height", isNonNeg: true, values: ["12U", "24U", "42U"] },
      { name: "Type", isNonNeg: true, values: ["Open Frame", "Enclosed"] } ] },
  ],
  "oem-electrical": [
    { name: "Relays", skuPrefix: "RL", uom: "EA", icon: "🔧", priceRange: [4, 120], brands: ["Allen-Bradley", "Phoenix Contact", "Omron", "Schneider Electric"], specs: [
      { name: "Coil Voltage", isNonNeg: true, values: ["24VDC", "120VAC", "240VAC"] },
      { name: "Contacts", isNonNeg: true, values: ["SPDT", "DPDT", "3PDT"] } ] },
    { name: "Terminal Blocks", skuPrefix: "TB", uom: "EA", icon: "🔩", priceRange: [0.5, 18], brands: ["Phoenix Contact", "Weidmuller", "Wago", "Allen-Bradley"], specs: [
      { name: "Wire Range", isNonNeg: true, values: ["26-12 AWG", "22-10 AWG"] },
      { name: "Mount", isNonNeg: true, values: ["DIN Rail", "Panel"] } ] },
    { name: "Power Supplies", skuPrefix: "PS", uom: "EA", icon: "🔋", priceRange: [25, 600], brands: ["Mean Well", "Phoenix Contact", "Omron", "Sola"], specs: [
      { name: "Output", isNonNeg: true, values: ["12VDC", "24VDC", "48VDC"] },
      { name: "Wattage", isNonNeg: true, values: ["60W", "120W", "240W", "480W"] } ] },
    { name: "Push Buttons", skuPrefix: "PB", uom: "EA", icon: "🔴", priceRange: [3, 60], brands: ["Allen-Bradley", "Schneider Electric", "Siemens", "Eaton"], specs: [
      { name: "Type", isNonNeg: true, values: ["Momentary", "Maintained", "E-Stop"] },
      { name: "Color", values: ["Red", "Green", "Black", "Yellow"] } ] },
  ],
  av: [
    { name: "Displays", skuPrefix: "DP", uom: "EA", icon: "📺", priceRange: [300, 6000], brands: ["Samsung", "LG", "Sony", "NEC"], specs: [
      { name: "Size", isNonNeg: true, values: ['43"', '55"', '65"', '75"', '86"'] },
      { name: "Resolution", isNonNeg: true, values: ["1080p", "4K UHD"] } ] },
    { name: "Projectors", skuPrefix: "PJ", uom: "EA", icon: "📽️", priceRange: [400, 9000], brands: ["Epson", "Christie", "Barco", "BenQ"], specs: [
      { name: "Brightness", isNonNeg: true, values: ["3000 lm", "5000 lm", "7500 lm"] },
      { name: "Resolution", isNonNeg: true, values: ["1080p", "4K UHD"] } ] },
    { name: "Speakers", skuPrefix: "SP", uom: "EA", icon: "🔊", priceRange: [40, 900], brands: ["JBL", "Bose", "QSC", "Atlas Sound"], specs: [
      { name: "Type", isNonNeg: true, values: ["Ceiling", "Surface", "Pendant"] },
      { name: "Power", isNonNeg: true, values: ["30W", "70W", "100W"] } ] },
    { name: "Signal Extenders", skuPrefix: "SX", uom: "EA", icon: "🧰", priceRange: [60, 1200], brands: ["Extron", "Crestron", "Atlona", "Kramer"], specs: [
      { name: "Signal", isNonNeg: true, values: ["HDMI", "HDBaseT", "SDI"] },
      { name: "Range", isNonNeg: true, values: ["100ft", "230ft", "330ft"] } ] },
  ],
  security: [
    { name: "IP Cameras", skuPrefix: "IC", uom: "EA", icon: "🎥", priceRange: [90, 1400], brands: ["Axis", "Hanwha", "Bosch", "Hikvision"], specs: [
      { name: "Resolution", isNonNeg: true, values: ["2MP", "4MP", "8MP"] },
      { name: "Form", isNonNeg: true, values: ["Dome", "Bullet", "PTZ"] },
      { name: "IR", values: ["IR 30m", "IR 50m"] } ] },
    { name: "Access Control", skuPrefix: "AC", uom: "EA", icon: "🔐", priceRange: [60, 2200], brands: ["HID", "Genetec", "LenelS2", "Honeywell"], specs: [
      { name: "Type", isNonNeg: true, values: ["Reader", "Controller", "Door Lock"] },
      { name: "Credential", isNonNeg: true, values: ["Prox", "Smart Card", "Mobile"] } ] },
    { name: "NVRs", skuPrefix: "NV", uom: "EA", icon: "💽", priceRange: [200, 3500], brands: ["Axis", "Hanwha", "Bosch", "Milestone"], specs: [
      { name: "Channels", isNonNeg: true, values: ["8-Ch", "16-Ch", "32-Ch"] },
      { name: "Storage", isNonNeg: true, values: ["4TB", "8TB", "16TB"] } ] },
    { name: "Intrusion Sensors", skuPrefix: "IS", uom: "EA", icon: "🚨", priceRange: [10, 180], brands: ["Honeywell", "Bosch", "DSC", "Interlogix"], specs: [
      { name: "Type", isNonNeg: true, values: ["PIR Motion", "Door Contact", "Glass Break"] },
      { name: "Range", values: ["12m", "15m"] } ] },
  ],
  safety: [
    { name: "Hard Hats", skuPrefix: "HH", uom: "EA", icon: "⛑️", priceRange: [8, 45], brands: ["MSA", "3M", "Honeywell", "Pyramex"], specs: [
      { name: "Type", isNonNeg: true, values: ["Type I", "Type II"] },
      { name: "Class", isNonNeg: true, values: ["Class E", "Class G", "Class C"] },
      { name: "Color", values: ["White", "Yellow", "Orange", "Blue"] } ] },
    { name: "Safety Glasses", skuPrefix: "SG", uom: "EA", icon: "🥽", priceRange: [2, 24], brands: ["3M", "Honeywell", "Pyramex", "MCR Safety"], specs: [
      { name: "Lens", isNonNeg: true, values: ["Clear", "Gray", "Anti-Fog"] },
      { name: "Rating", isNonNeg: true, values: ["ANSI Z87.1"] } ] },
    { name: "Gloves", skuPrefix: "GL", uom: "PR", icon: "🧤", priceRange: [1, 30], brands: ["Ansell", "MCR Safety", "Mechanix", "Showa"], specs: [
      { name: "Material", isNonNeg: true, values: ["Nitrile", "Leather", "Cut-Resistant"] },
      { name: "Cut Level", isNonNeg: true, values: ["A2", "A4", "A6"] } ] },
    { name: "Hi-Vis Apparel", skuPrefix: "HV", uom: "EA", icon: "🦺", priceRange: [6, 60], brands: ["ML Kishigo", "PIP", "Radians", "Ergodyne"], specs: [
      { name: "Class", isNonNeg: true, values: ["Class 2", "Class 3"] },
      { name: "Type", isNonNeg: true, values: ["Vest", "Jacket", "T-Shirt"] } ] },
  ],
};

export const ALL_SUBCATEGORIES: string[] = [
  ...new Set(CATEGORIES.flatMap((c) => TAXONOMY[c].map((s) => s.name))),
].sort();

export const ALL_BRANDS: string[] = [
  ...new Set(CATEGORIES.flatMap((c) => TAXONOMY[c].flatMap((s) => s.brands))),
].sort();
```

- [ ] **Step 4: Run, confirm PASS:** `npx vitest run lib/catalog/taxonomy.test.ts`. Then `npm run typecheck`.

- [ ] **Step 5: Commit**
```bash
git add lib/catalog/taxonomy.ts lib/catalog/taxonomy.test.ts
git commit -m "feat(catalog): add 6-category product taxonomy"
```

---

## Phase 2 — Generator

### Task 3: Seeded PRNG + catalog generator

**Files:** Create `lib/catalog/prng.ts`, `lib/catalog/generate.ts`, Test `lib/catalog/generate.test.ts`

- [ ] **Step 1: Create the PRNG** `lib/catalog/prng.ts`:
```ts
// Deterministic mulberry32 PRNG — same seed always yields the same sequence.
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
```

- [ ] **Step 2: Write the failing test** `lib/catalog/generate.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { generateCatalog, CATALOG_SIZE } from "@/lib/catalog/generate";
import { CATEGORIES } from "@/lib/catalog/taxonomy";

describe("generateCatalog", () => {
  it("is deterministic — same products on every call", () => {
    const a = generateCatalog(500);
    const b = generateCatalog(500);
    expect(a.map((p) => p.id)).toEqual(b.map((p) => p.id));
    expect(a.map((p) => p.sku)).toEqual(b.map((p) => p.sku));
  });

  it("generates the requested size", () => {
    expect(generateCatalog(500)).toHaveLength(500);
  });

  it("default CATALOG_SIZE is 20000", () => {
    expect(CATALOG_SIZE).toBe(20000);
  });

  it("covers all 6 categories", () => {
    const cats = new Set(generateCatalog(2000).map((p) => p.category));
    for (const c of CATEGORIES) expect(cats.has(c)).toBe(true);
  });

  it("has unique ids and skus", () => {
    const cat = generateCatalog(3000);
    expect(new Set(cat.map((p) => p.id)).size).toBe(cat.length);
    expect(new Set(cat.map((p) => p.sku)).size).toBe(cat.length);
  });

  it("folds in the 46 featured curated products", () => {
    const cat = generateCatalog(2000);
    expect(cat.some((p) => p.id === "CB-SQD-QO115")).toBe(true);
  });

  it("every product has valid shape", () => {
    for (const p of generateCatalog(300)) {
      expect(p.id).toBeTruthy();
      expect(p.sku).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.unitPrice).toBeGreaterThan(0);
      expect(Array.isArray(p.specs)).toBe(true);
      expect(p.specs.length).toBeGreaterThan(0);
      expect(p.specs.some((s) => s.isNonNeg)).toBe(true);
      expect(typeof p.preferred).toBe("boolean");
      expect(p.imageIcon).toBeTruthy();
    }
  });
});
```

- [ ] **Step 3: Run, confirm FAIL:** `npx vitest run lib/catalog/generate.test.ts`.

- [ ] **Step 4: Implement** `lib/catalog/generate.ts`:
```ts
import type { CatalogProduct, ProductCategory, ProductSpec, BranchStock, DCStock, ExternalSource } from "@/features/product-finder/types";
import { CATEGORIES, TAXONOMY, type SubcategoryTemplate } from "@/lib/catalog/taxonomy";
import { makeRng, pick, randInt, round2 } from "@/lib/catalog/prng";
import { CATALOG_PRODUCTS } from "@/data/mock/catalog-products";

export const CATALOG_SIZE = 20000;
const SEED = 0x5w3sc0 || 1337; // fixed
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
  electrical: 6000, datacom: 3500, "oem-electrical": 3000, av: 2500, security: 2500, safety: 2500,
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
    externalSources: inStock ? [] : makeExternal(rng, price),
    imageIcon: sub.icon,
  };
}

export function generateCatalog(size: number = CATALOG_SIZE): CatalogProduct[] {
  const rng = makeRng(FIXED_SEED);
  const featured = CATALOG_PRODUCTS.slice(0, Math.min(CATALOG_PRODUCTS.length, size));
  const out: CatalogProduct[] = [...featured];
  const usedIds = new Set(out.map((p) => p.id));
  const remaining = size - out.length;
  if (remaining <= 0) return out.slice(0, size);

  const totalWeight = CATEGORIES.reduce((s, c) => s + WEIGHTS[c], 0);
  let seq = 1;
  for (const category of CATEGORIES) {
    const count = Math.round((WEIGHTS[category] / totalWeight) * remaining);
    const subs = TAXONOMY[category];
    for (let i = 0; i < count; i++) {
      const sub = subs[i % subs.length];
      let product = genOne(rng, category, sub, seq++);
      while (usedIds.has(product.id)) product = genOne(rng, category, sub, seq++);
      usedIds.add(product.id);
      out.push(product);
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
```

NOTE: delete the stray `const SEED = 0x5w3sc0 || 1337;` line — it is invalid; keep only `const FIXED_SEED = 1337;`. (Included here so you remove it.)

- [ ] **Step 5: Run, confirm PASS:** `npx vitest run lib/catalog/generate.test.ts`. Then `npm run typecheck`.

- [ ] **Step 6: Commit**
```bash
git add lib/catalog/prng.ts lib/catalog/generate.ts lib/catalog/generate.test.ts
git commit -m "feat(catalog): deterministic 20k synthetic product generator"
```

---

## Phase 3 — Index, search, equivalents

### Task 4: In-memory catalog singleton

**Files:** Create `lib/catalog/index.ts`, Test `lib/catalog/index.test.ts`

- [ ] **Step 1: Failing test** `lib/catalog/index.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getCatalog } from "@/lib/catalog/index";

describe("getCatalog", () => {
  it("returns a cached singleton (same reference)", () => {
    expect(getCatalog()).toBe(getCatalog());
  });
  it("indexes 20000 products by id with a haystack", () => {
    const c = getCatalog();
    expect(c.products).toHaveLength(20000);
    expect(c.byId.get(c.products[0].id)).toBe(c.products[0]);
    expect(c.haystack).toHaveLength(20000);
    expect(c.haystack[0]).toBe(c.haystack[0].toLowerCase());
  });
});
```

- [ ] **Step 2: Run, confirm FAIL.**

- [ ] **Step 3: Implement** `lib/catalog/index.ts`:
```ts
import type { CatalogProduct } from "@/features/product-finder/types";
import { generateCatalog } from "@/lib/catalog/generate";

export interface Catalog {
  products: CatalogProduct[];
  byId: Map<string, CatalogProduct>;
  haystack: string[];
}

function build(): Catalog {
  const products = generateCatalog();
  const byId = new Map(products.map((p) => [p.id, p]));
  const haystack = products.map((p) =>
    [p.name, p.sku, p.brand, p.category, p.subcategory, p.description, ...p.specs.map((s) => `${s.name} ${s.value}`)]
      .join(" ")
      .toLowerCase(),
  );
  return { products, byId, haystack };
}

// Cache on globalThis so warm serverless invocations and HMR reuse one instance.
const g = globalThis as unknown as { __catalog?: Catalog };
export function getCatalog(): Catalog {
  if (!g.__catalog) g.__catalog = build();
  return g.__catalog;
}
```

- [ ] **Step 4: Run, confirm PASS** (note: building 20k may take ~200ms — fine). `npx vitest run lib/catalog/index.test.ts`.

- [ ] **Step 5: Commit**
```bash
git add lib/catalog/index.ts lib/catalog/index.test.ts
git commit -m "feat(catalog): in-memory catalog singleton with search haystack"
```

---

### Task 5: searchCatalog

**Files:** Create `lib/catalog/search.ts`, Test `lib/catalog/search.test.ts`

- [ ] **Step 1: Failing test** `lib/catalog/search.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { searchCatalog } from "@/lib/catalog/search";

describe("searchCatalog", () => {
  it("paginates: total reflects all matches, items is one page", () => {
    const r = searchCatalog({ pageSize: 24, page: 0 });
    expect(r.total).toBe(20000);
    expect(r.items).toHaveLength(24);
    expect(r.page).toBe(0);
  });

  it("page 1 returns the next slice, no overlap", () => {
    const a = searchCatalog({ pageSize: 10, page: 0 });
    const b = searchCatalog({ pageSize: 10, page: 1 });
    expect(a.items.map((p) => p.id)).not.toEqual(b.items.map((p) => p.id));
  });

  it("filters by category", () => {
    const r = searchCatalog({ filters: { categories: ["security"] }, pageSize: 50 });
    expect(r.items.every((p) => p.category === "security")).toBe(true);
    expect(r.total).toBeGreaterThan(0);
  });

  it("filters by onlyPreferred and priceMax", () => {
    const r = searchCatalog({ filters: { onlyPreferred: true, priceMax: 20 }, pageSize: 50 });
    expect(r.items.every((p) => p.preferred && p.unitPrice <= 20)).toBe(true);
  });

  it("text search matches the haystack", () => {
    const r = searchCatalog({ text: "circuit breaker", pageSize: 10 });
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.every((p) => /breaker/i.test(p.name + p.subcategory + p.description))).toBe(true);
  });

  it("sorts by priceLow", () => {
    const r = searchCatalog({ sort: "priceLow", pageSize: 20 });
    for (let i = 1; i < r.items.length; i++) {
      expect(r.items[i].unitPrice).toBeGreaterThanOrEqual(r.items[i - 1].unitPrice);
    }
  });
});
```

- [ ] **Step 2: Run, confirm FAIL.**

- [ ] **Step 3: Implement** `lib/catalog/search.ts`:
```ts
import type { CatalogProduct, ProductCategory, SortKey, SearchResponse } from "@/features/product-finder/types";
import { getCatalog } from "@/lib/catalog/index";

export interface SearchFilters {
  categories?: ProductCategory[];
  subcategories?: string[];
  brands?: string[];
  onlyBranchStock?: boolean;
  onlyDCStock?: boolean;
  onlyPreferred?: boolean;
  priceMin?: number | null;
  priceMax?: number | null;
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

function sortItems(items: CatalogProduct[], sort: SortKey): CatalogProduct[] {
  const arr = [...items];
  switch (sort) {
    case "preferred": return arr.sort((a, b) => (b.preferred ? 1 : 0) - (a.preferred ? 1 : 0));
    case "branchStock": return arr.sort((a, b) => totalBranch(b) - totalBranch(a));
    case "priceLow": return arr.sort((a, b) => a.unitPrice - b.unitPrice);
    case "priceHigh": return arr.sort((a, b) => b.unitPrice - a.unitPrice);
    case "brand": return arr.sort((a, b) => a.brand.localeCompare(b.brand));
    default: return arr.sort((a, b) => (b.preferred ? 1 : 0) - (a.preferred ? 1 : 0));
  }
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

  const matched: CatalogProduct[] = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (text && !haystack[i].includes(text)) continue;
    if (catSet && !catSet.has(p.category)) continue;
    if (subSet && !subSet.has(p.subcategory)) continue;
    if (brandSet && !brandSet.has(p.brand)) continue;
    if (f.onlyPreferred && !p.preferred) continue;
    if (f.onlyBranchStock && totalBranch(p) === 0) continue;
    if (f.onlyDCStock && p.dcStock.every((d) => d.quantity === 0)) continue;
    if (f.priceMin != null && p.unitPrice < f.priceMin) continue;
    if (f.priceMax != null && p.unitPrice > f.priceMax) continue;
    matched.push(p);
  }

  const sorted = sortItems(matched, params.sort ?? "relevance");
  const start = page * pageSize;
  return { items: sorted.slice(start, start + pageSize), total: matched.length, page, pageSize };
}
```

- [ ] **Step 4: Run, confirm PASS.** Then `npm run typecheck`.

- [ ] **Step 5: Commit**
```bash
git add lib/catalog/search.ts lib/catalog/search.test.ts
git commit -m "feat(catalog): server-side search with filters, sort, pagination"
```

---

### Task 6: findEquivalents

**Files:** Create `lib/catalog/equivalents.ts`, Test `lib/catalog/equivalents.test.ts`

- [ ] **Step 1: Failing test** `lib/catalog/equivalents.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { findEquivalents } from "@/lib/catalog/equivalents";
import { getCatalog } from "@/lib/catalog/index";

describe("findEquivalents", () => {
  const product = getCatalog().products.find((p) => p.subcategory === "Circuit Breakers")!;

  it("excludes the product itself", () => {
    expect(findEquivalents(product, 8).some((p) => p.id === product.id)).toBe(false);
  });
  it("returns up to k results, all same subcategory when possible", () => {
    const r = findEquivalents(product, 8);
    expect(r.length).toBeGreaterThan(0);
    expect(r.length).toBeLessThanOrEqual(8);
    expect(r.every((p) => p.subcategory === product.subcategory)).toBe(true);
  });
});
```

- [ ] **Step 2: Run, confirm FAIL.**

- [ ] **Step 3: Implement** `lib/catalog/equivalents.ts`:
```ts
import type { CatalogProduct } from "@/features/product-finder/types";
import { getCatalog } from "@/lib/catalog/index";
import { scoreProduct } from "@/lib/product-finder-scoring";

export function findEquivalents(product: CatalogProduct, k = 8, branchId?: string): CatalogProduct[] {
  const { products } = getCatalog();
  let pool = products.filter((p) => p.id !== product.id && p.subcategory === product.subcategory);
  if (pool.length < k) {
    const extra = products.filter(
      (p) => p.id !== product.id && p.category === product.category && p.subcategory !== product.subcategory,
    );
    pool = pool.concat(extra);
  }
  return pool
    .map((p) => ({ p, score: scoreProduct(p, product, branchId).total }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.p);
}
```

- [ ] **Step 4: Run, confirm PASS.**

- [ ] **Step 5: Commit**
```bash
git add lib/catalog/equivalents.ts lib/catalog/equivalents.test.ts
git commit -m "feat(catalog): similarity-based equivalents via scoring engine"
```

---

## Phase 4 — API routes

### Task 7: Zod schemas + three Route Handlers

**Files:** Create `lib/catalog/schemas.ts`, `apps/web/app/api/products/search/route.ts`, `apps/web/app/api/products/suggest/route.ts`, `apps/web/app/api/products/[id]/route.ts`

- [ ] **Step 1: Create `lib/catalog/schemas.ts`:**
```ts
import { z } from "zod";

const csv = (v: string | null): string[] | undefined =>
  v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

export const SortKeySchema = z.enum(["relevance", "preferred", "branchStock", "priceLow", "priceHigh", "brand"]);

export function parseSearchQuery(sp: URLSearchParams) {
  const num = (k: string) => {
    const v = sp.get(k);
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const bool = (k: string) => sp.get(k) === "true";
  return {
    text: sp.get("q") ?? "",
    filters: {
      categories: csv(sp.get("category")) as ("electrical" | "datacom" | "oem-electrical" | "av" | "security" | "safety")[] | undefined,
      subcategories: csv(sp.get("subcategory")),
      brands: csv(sp.get("brand")),
      onlyBranchStock: bool("onlyBranchStock"),
      onlyDCStock: bool("onlyDCStock"),
      onlyPreferred: bool("onlyPreferred"),
      priceMin: num("priceMin"),
      priceMax: num("priceMax"),
    },
    sort: SortKeySchema.catch("relevance").parse(sp.get("sort") ?? "relevance"),
    page: Math.max(0, Number(sp.get("page") ?? 0) || 0),
    pageSize: Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? 24) || 24)),
  };
}
```

- [ ] **Step 2: Create `apps/web/app/api/products/search/route.ts`:**
```ts
import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/catalog/search";
import { parseSearchQuery } from "@/lib/catalog/schemas";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const params = parseSearchQuery(searchParams);
  return NextResponse.json(searchCatalog(params));
}
```

- [ ] **Step 3: Create `apps/web/app/api/products/suggest/route.ts`:**
```ts
import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/index";
import type { SuggestItem } from "@/features/product-finder/types";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q) return NextResponse.json<{ items: SuggestItem[] }>({ items: [] });
  const { products, haystack } = getCatalog();
  const items: SuggestItem[] = [];
  for (let i = 0; i < products.length && items.length < 6; i++) {
    if (haystack[i].includes(q)) {
      const p = products[i];
      items.push({ id: p.id, name: p.name, sku: p.sku, brand: p.brand, imageIcon: p.imageIcon });
    }
  }
  return NextResponse.json({ items });
}
```

- [ ] **Step 4: Create `apps/web/app/api/products/[id]/route.ts`:**
```ts
import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/index";
import { findEquivalents } from "@/lib/catalog/equivalents";

export const dynamic = "force-dynamic";

export function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return ctx.params.then(({ id }) => {
    const product = getCatalog().byId.get(id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") ?? undefined;
    return NextResponse.json({ product, equivalents: findEquivalents(product, 8, branchId) });
  });
}
```

- [ ] **Step 5: Verify** `npm run typecheck && npm run build`. Then start dev (`npm run dev`) in one shell and check:
  - `curl "http://localhost:3000/api/products/search?q=breaker&pageSize=2"` → JSON with `items`/`total`.
  - `curl "http://localhost:3000/api/products/suggest?q=cat6"` → up to 6 items.
  - `curl "http://localhost:3000/api/products/GEN-CB00001"` → `{product, equivalents}` (or pick an id from the search response). Stop dev.

- [ ] **Step 6: Commit**
```bash
git add lib/catalog/schemas.ts apps/web/app/api/products
git commit -m "feat(catalog): search/suggest/detail API routes"
```

---

## Phase 5 — Client async rewrite

### Task 8: Client API module

**Files:** Create `lib/product-finder-api.ts`

- [ ] **Step 1: Implement** `lib/product-finder-api.ts`:
```ts
import type { SearchResponse, SuggestItem, ProductDetail, FilterState } from "@/features/product-finder/types";

function filtersToQuery(filters: FilterState, page: number, pageSize: number): string {
  const sp = new URLSearchParams();
  if (filters.query) sp.set("q", filters.query);
  if (filters.categories.size) sp.set("category", [...filters.categories].join(","));
  if (filters.subcategories.size) sp.set("subcategory", [...filters.subcategories].join(","));
  if (filters.brands.size) sp.set("brand", [...filters.brands].join(","));
  if (filters.onlyBranchStock) sp.set("onlyBranchStock", "true");
  if (filters.onlyDCStock) sp.set("onlyDCStock", "true");
  if (filters.onlyPreferred) sp.set("onlyPreferred", "true");
  if (filters.priceMin != null) sp.set("priceMin", String(filters.priceMin));
  if (filters.priceMax != null) sp.set("priceMax", String(filters.priceMax));
  sp.set("sort", filters.sortKey);
  sp.set("page", String(page));
  sp.set("pageSize", String(pageSize));
  return sp.toString();
}

export async function apiSearch(filters: FilterState, page: number, pageSize = 24): Promise<SearchResponse> {
  const res = await fetch(`/api/products/search?${filtersToQuery(filters, page, pageSize)}`);
  if (!res.ok) throw new Error(`search failed: ${res.status}`);
  return res.json();
}

export async function apiSuggest(q: string): Promise<SuggestItem[]> {
  const res = await fetch(`/api/products/suggest?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return (await res.json()).items as SuggestItem[];
}

export async function apiGetProduct(id: string, branchId?: string): Promise<ProductDetail> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}${branchId ? `?branchId=${branchId}` : ""}`);
  if (!res.ok) throw new Error(`detail failed: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 2: Verify** `npm run typecheck`.

- [ ] **Step 3: Commit**
```bash
git add lib/product-finder-api.ts
git commit -m "feat(catalog): client API wrappers for product search"
```

---

### Task 9: Store async rewrite

**Files:** Modify `lib/product-finder-store.ts`, `lib/product-finder-store.test.ts`

This task converts `results` fetching to the API and adds pagination/loading/snapshots. READ `lib/product-finder-store.ts` fully first.

- [ ] **Step 1: Update the interface + state.** In `ProductFinderState`, in the Search/Results section, add:
```ts
  loading: boolean;
  error: string | null;
  page: number;
  total: number;
  pageSize: number;
  loadMore: () => Promise<void>;
```
Change `runSearch`, `runNlSearch`, `setActiveProduct` signatures to return `Promise<void>` (`runSearch: () => Promise<void>;` etc.). In the Saved & history section change:
```ts
  favorites: string[];
```
to:
```ts
  favorites: string[];
  favoriteSnapshots: Record<string, ProductSnapshot>;
  recentSnapshots: Record<string, ProductSnapshot>;
```
and `toggleFavorite: (id: string) => void;` → `toggleFavorite: (product: CatalogProduct) => void;`.

Add the import:
```ts
import { apiSearch, apiGetProduct } from "@/lib/product-finder-api";
import type { ProductSnapshot } from "@/features/product-finder/types";
```

- [ ] **Step 2: Replace `runSearch` and add `loadMore`.** Replace the existing `runSearch()` implementation with:
```ts
  loading: false,
  error: null,
  page: 0,
  total: 0,
  pageSize: 24,

  async runSearch() {
    set({ loading: true, error: null, page: 0 });
    try {
      const res = await apiSearch(get().filters, 0, get().pageSize);
      set({ results: res.items, total: res.total, page: 0, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "Search failed", results: [], total: 0 });
    }
  },

  async loadMore() {
    const next = get().page + 1;
    set({ loading: true });
    try {
      const res = await apiSearch(get().filters, next, get().pageSize);
      set((s) => ({ results: [...s.results, ...res.items], total: res.total, page: next, loading: false }));
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "Load more failed" });
    }
  },
```
Every existing filter action that calls `get().runSearch()` now calls an async function — that is fine (fire-and-forget); leave those calls as `get().runSearch();` (no await needed). Same for `runNlSearch`/`removeNlFilter`/`clearFilters` — they already call `get().runSearch()`.

- [ ] **Step 3: Update `runNlSearch` to be async-compatible.** It currently does `set(...); get().runSearch();`. Change its declaration to `async runNlSearch(raw) {` and keep the body; change the trailing `get().runSearch();` to `await get().runSearch();`. Do the same for `removeNlFilter` (make it `async` and `await get().runSearch();`).

- [ ] **Step 4: Replace `setActiveProduct`** with an async version that fetches detail + records a recent snapshot:
```ts
  async setActiveProduct(p) {
    if (!p) { set({ activeProduct: null }); return; }
    const snap: ProductSnapshot = { id: p.id, name: p.name, brand: p.brand, unitPrice: p.unitPrice, imageIcon: p.imageIcon, category: p.category };
    set((s) => {
      const recentlyViewed = [p.id, ...s.recentlyViewed.filter((id) => id !== p.id)].slice(0, MAX_RECENT);
      const recentSnapshots = { ...s.recentSnapshots, [p.id]: snap };
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_recent", JSON.stringify(recentlyViewed));
        localStorage.setItem("pf_recent_snap", JSON.stringify(recentSnapshots));
      }
      return { activeProduct: p, recentlyViewed, recentSnapshots };
    });
    try {
      const detail = await apiGetProduct(p.id, get().user?.branchId);
      set({ activeProduct: detail.product, results: detail.equivalents });
    } catch { /* keep the passed product + existing results on failure */ }
  },
```
Note the param type changes to `CatalogProduct | null` (it already is). NOTE: `setActiveProduct` is also called with a full product object from suggestions/cards — that still works (we have the object, then enrich with equivalents).

- [ ] **Step 5: Update favorites to store snapshots.** Replace `toggleFavorite`/`isFavorite` and add snapshot init:
```ts
  favorites: [],
  favoriteSnapshots: {},
  recentSnapshots: {},

  toggleFavorite(product) {
    set((s) => {
      const has = s.favorites.includes(product.id);
      const favorites = has ? s.favorites.filter((f) => f !== product.id) : [...s.favorites, product.id];
      const favoriteSnapshots = { ...s.favoriteSnapshots };
      if (has) delete favoriteSnapshots[product.id];
      else favoriteSnapshots[product.id] = { id: product.id, name: product.name, brand: product.brand, unitPrice: product.unitPrice, imageIcon: product.imageIcon, category: product.category };
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pf_favorites", JSON.stringify(favorites));
        localStorage.setItem("pf_fav_snap", JSON.stringify(favoriteSnapshots));
      }
      return { favorites, favoriteSnapshots };
    });
  },

  isFavorite(id) {
    return get().favorites.includes(id);
  },
```

- [ ] **Step 6: Update `hydrateSavedState`** to also load snapshots. Replace its body's `setState` to include the snapshot maps:
```ts
export function hydrateSavedState() {
  if (typeof localStorage === "undefined") return;
  const readArr = (k: string): string[] => {
    const raw = localStorage.getItem(k);
    if (!raw) return [];
    try { const v = JSON.parse(raw); return Array.isArray(v) ? (v as string[]) : []; }
    catch { localStorage.removeItem(k); return []; }
  };
  const readMap = (k: string): Record<string, ProductSnapshot> => {
    const raw = localStorage.getItem(k);
    if (!raw) return {};
    try { const v = JSON.parse(raw); return v && typeof v === "object" ? (v as Record<string, ProductSnapshot>) : {}; }
    catch { localStorage.removeItem(k); return {}; }
  };
  useProductFinder.setState({
    favorites: readArr("pf_favorites"),
    recentlyViewed: readArr("pf_recent"),
    favoriteSnapshots: readMap("pf_fav_snap"),
    recentSnapshots: readMap("pf_recent_snap"),
  });
}
```

- [ ] **Step 7: Remove the now-unused `searchProducts`-based `runSearch` logic and imports.** Delete the old in-memory `runSearch` body (replaced in Step 2) and remove any now-unused imports from `@/data/mock/catalog-products` in the store (keep only what is still referenced — `getCrossSells`/`getUpsells`/`getTotalBranchStock` may still be imported for the deferred selectors; if `selectCrossSells`/`selectUpsells` remain, keep their imports; otherwise remove). Run `npm run typecheck` and remove whatever it flags as unused.

- [ ] **Step 8: Rework the store tests.** In `lib/product-finder-store.test.ts`:
  - Add a `fetch` mock at the top (after imports):
    ```ts
    import { vi, beforeEach } from "vitest";
    globalThis.fetch = vi.fn(async (url: string | URL) => {
      const u = String(url);
      if (u.includes("/api/products/search")) {
        return { ok: true, json: async () => ({ items: [], total: 0, page: 0, pageSize: 24 }) } as Response;
      }
      return { ok: true, json: async () => ({ product: null, equivalents: [] }) } as Response;
    }) as typeof fetch;
    ```
  - In `resetStore()`, add `favoriteSnapshots: {}`, `recentSnapshots: {}`, `loading: false`, `error: null`, `page: 0`, `total: 0`, `pageSize: 24`.
  - DELETE the `describe("runSearch", ...)` block (it asserted sync filtering over the 46-product array, which no longer applies — search is server-side and covered by `lib/catalog/search.test.ts`).
  - In the `natural-language search` tests, the assertions on `results` are no longer valid (results come from the mocked fetch). Change those two tests to assert on `filters`/`appliedNlFilters` only (drop the `results.every(...)` and `results.some(...)` lines).
  - In `favorites & recently viewed` tests, change `toggleFavorite(id)` calls to `toggleFavorite(CATALOG_PRODUCTS[0])` (pass the product), and `setActiveProduct(a)` still works (pass the product). Keep the dedupe/cap assertions on `recentlyViewed`.
  - Keep all cart, filter-action, and auth tests unchanged.

- [ ] **Step 9: Run tests + typecheck.** `npx vitest run lib/product-finder-store.test.ts` → all pass. `npm run typecheck` → clean.

- [ ] **Step 10: Commit**
```bash
git add lib/product-finder-store.ts lib/product-finder-store.test.ts
git commit -m "feat(catalog): async store — server search, pagination, snapshots"
```

---

### Task 10: SavedAndRecentPanel from snapshots

**Files:** Modify `features/product-finder/SavedAndRecentPanel.tsx`

- [ ] **Step 1: Replace the file** with a snapshot-based version (no `PRODUCT_MAP`):
```tsx
"use client";

import { useProductFinder } from "@/lib/product-finder-store";
import type { ProductSnapshot } from "@/features/product-finder/types";

function MiniRow({ snap }: { snap: ProductSnapshot }) {
  return (
    <div className="flex w-full items-center gap-2 rounded-lg border border-[#B7C9D3] bg-white px-3 py-2 text-left">
      <span className="text-xl" aria-hidden="true">{snap.imageIcon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[#1D252D]">{snap.name}</span>
        <span className="block truncate text-xs text-[#4F758B]">{snap.brand} · ${snap.unitPrice.toFixed(2)}</span>
      </span>
    </div>
  );
}

export function SavedAndRecentPanel() {
  const recentlyViewed = useProductFinder((s) => s.recentlyViewed);
  const recentSnapshots = useProductFinder((s) => s.recentSnapshots);
  const favorites = useProductFinder((s) => s.favorites);
  const favoriteSnapshots = useProductFinder((s) => s.favoriteSnapshots);

  const recent = recentlyViewed.map((id) => recentSnapshots[id]).filter(Boolean) as ProductSnapshot[];
  const favs = favorites.map((id) => favoriteSnapshots[id]).filter(Boolean) as ProductSnapshot[];
  if (recent.length === 0 && favs.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {recent.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#4F758B]">Recently viewed</h3>
          <div className="space-y-2">{recent.slice(0, 6).map((s) => <MiniRow key={s.id} snap={s} />)}</div>
        </section>
      )}
      {favs.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#4F758B]"><span aria-hidden="true">★</span> Favorites</h3>
          <div className="space-y-2">{favs.map((s) => <MiniRow key={s.id} snap={s} />)}</div>
        </section>
      )}
    </div>
  );
}
```
(Clicking to recall is dropped for v1 — snapshots lack full product data; the future BOM/detail work can re-add a fetch-on-click. Keep it simple.)

- [ ] **Step 2: Verify** `npm run typecheck`.

- [ ] **Step 3: Commit**
```bash
git add features/product-finder/SavedAndRecentPanel.tsx
git commit -m "feat(catalog): saved & recent panel renders from snapshots"
```

---

### Task 11: ProductCard favorite star passes the product

**Files:** Modify `features/product-finder/ProductCard.tsx`

- [ ] **Step 1:** The star button currently calls `toggleFavorite(product.id)`. Change it to `toggleFavorite(product)`:
Find `onClick={() => toggleFavorite(product.id)}` and change to `onClick={() => toggleFavorite(product)}`.

- [ ] **Step 2:** Verify `npm run typecheck`.

- [ ] **Step 3: Commit**
```bash
git add features/product-finder/ProductCard.tsx
git commit -m "fix(catalog): favorite toggle passes full product for snapshot"
```

---

### Task 12: SearchBar — remove BOM tab, suggestions via API

**Files:** Modify `features/product-finder/SearchBar.tsx`

- [ ] **Step 1: Remove the BOM tab UI.** In the `SearchBar` return, delete the tabs header `<div className="flex overflow-hidden rounded-t-xl border-b border-[#B7C9D3]">…</div>` and render only the single-search panel. Replace the panel body conditional `{activeTab === "single" ? (<SingleSearchPanel .../>) : (<BomPanel .../>)}` with just `<SingleSearchPanel ... />` (keep all its existing props including the chip props). The `BomPanel`, `BomTableRow`, `BomResultsTable`, and BOM handlers/state can remain in the file unused (dormant) — but to avoid unused-var lint errors, either keep them referenced or delete them. Simplest: delete the BOM-only components (`BomPanel`, `BomResultsTable`, `BomTableRow`) and the BOM handlers (`readFileText`, `handleFileDrop`, `handleDragOver`, `handleDragLeave`, `handleFileInput`, `handleBomTextChange`, `handleBomLineSelect`, `switchTab`), the BOM state (`isDragging`, `fileInputRef`), and the `bomMode/bomText/bomLines/setBomMode/setBomText/parseBom` destructured store values. Run `npm run typecheck` and remove whatever it flags.

- [ ] **Step 2: Wire suggestions to the API.** Replace the suggestion logic. Change `updateSuggestions` to call the API (debounced):
```tsx
import { apiSuggest } from "@/lib/product-finder-api";
import type { SuggestItem } from "@/features/product-finder/types";
```
Replace the `suggestions` state type with `SuggestItem[]` and `updateSuggestions`:
```tsx
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateSuggestions = useCallback((value: string) => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (!value.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
    suggestTimer.current = setTimeout(async () => {
      const items = await apiSuggest(value);
      setSuggestions(items);
      setShowSuggestions(items.length > 0);
    }, 150);
  }, []);
```
`handleSelectSuggestion` receives a `SuggestItem` now; it should set the query and run a search for that text (we don't have the full product). Change it to:
```tsx
  const handleSelectSuggestion = (item: SuggestItem) => {
    setQuery(item.name);
    setSuggestions([]);
    setShowSuggestions(false);
    runNlSearch(item.name);
  };
```
Update `SuggestionRow` to accept a `SuggestItem` (fields `imageIcon`, `name`, `brand`, `sku`) — it already reads those fields; change its prop type from `CatalogProduct` to `SuggestItem` and the `onSelect` param type accordingly. Update `SingleSearchPanelProps.suggestions` to `SuggestItem[]` and `onSelectSuggestion: (item: SuggestItem) => void`.

- [ ] **Step 3: Verify** `npm run typecheck && npm run build`. Manual: `npm run dev`, type in the box → suggestions appear from the API; selecting one searches. Stop dev.

- [ ] **Step 4: Commit**
```bash
git add features/product-finder/SearchBar.tsx
git commit -m "feat(catalog): API-backed autocomplete; remove BOM tab (deferred)"
```

---

### Task 13: ProductGrid — server-ordered, Load more, loading

**Files:** Modify `features/product-finder/ProductGrid.tsx`

- [ ] **Step 1: Remove client-side sorting and the alternativeIds relevance branch.** Delete the `sortProducts` function and the `localSortKey` state. The grid now renders `products` in server order. The sort `<select>` should drive the store:
```tsx
  const sortKey = useProductFinder((s) => s.filters.sortKey);
  const setSortKey = useProductFinder((s) => s.setSortKey);
  const loading = useProductFinder((s) => s.loading);
  const total = useProductFinder((s) => s.total);
  const results = useProductFinder((s) => s.results);
  const loadMore = useProductFinder((s) => s.loadMore);
```
Change `handleSortChange` to:
```tsx
  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSortKey(e.target.value as SortKey);
  }
```
and bind `<select value={sortKey} onChange={handleSortChange}>`.

- [ ] **Step 2: Render server order + count + Load more.** Replace `const sorted = sortProducts(...)` usage with `products` directly in the map. Change the results-count line to use `total`:
```tsx
  {total} product{total !== 1 ? "s" : ""} found
```
Remove the import of `getTotalBranchStock` if no longer used. After the product list `<div>`, add a Load-more control:
```tsx
      {results.length < total && (
        <div className="flex justify-center pt-2">
          <Button type="button" onClick={() => loadMore()} disabled={loading}
            className="bg-[#1D252D] text-white hover:bg-[#2d3740]">
            {loading ? "Loading…" : `Load more (${total - results.length} more)`}
          </Button>
        </div>
      )}
```
(Use `products` for the rendered list so the active-product equivalents view — which passes its own `products` — still works; for the main search view the page passes `results`.)

- [ ] **Step 3: Verify** `npm run typecheck && npm run build`.

- [ ] **Step 4: Commit**
```bash
git add features/product-finder/ProductGrid.tsx
git commit -m "feat(catalog): server-ordered grid with Load more + loading"
```

---

### Task 14: FilterSidebar — 6 categories, taxonomy lists, drop counts

**Files:** Modify `features/product-finder/FilterSidebar.tsx`

- [ ] **Step 1: Swap data source.** Change the import:
```tsx
import { ALL_SUBCATEGORIES, ALL_BRANDS, CATEGORY_META, CATEGORIES } from "@/lib/catalog/taxonomy";
```
(remove the `@/data/mock/catalog-products` import). Delete `countForSubcategory` and `countForBrand` and the `<span className="text-xs text-[#4F758B]">{count...}</span>` count badges in the subcategory and brand rows (drop counts in v1).

- [ ] **Step 2: Render all 6 categories** from `CATEGORIES`/`CATEGORY_META`. Replace the hardcoded 2-item category array with:
```tsx
          {CATEGORIES.map((cat) => {
            const active = filters.categories.has(cat);
            return (
              <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  active ? "border-[#1D252D] bg-[#1D252D] text-white" : "border-[#B7C9D3] bg-white text-[#1D252D] hover:border-[#4F758B]",
                )}>
                {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
              </button>
            );
          })}
```

- [ ] **Step 3: Verify** `npm run typecheck && npm run build`.

- [ ] **Step 4: Commit**
```bash
git add features/product-finder/FilterSidebar.tsx
git commit -m "feat(catalog): 6-category sidebar driven by taxonomy"
```

---

### Task 15: Page — hide GoesWithPanel, initial search, quick-picks

**Files:** Modify `apps/web/app/product-finder/page.tsx`, `features/product-finder/SearchBar.tsx` (quick-picks)

- [ ] **Step 1: Hide GoesWithPanel.** In `page.tsx`, remove the `<GoesWithPanel product={activeProduct} />` render and its import (goes-with is deferred). Keep the `ExternalSourcesCard` block. The right column may now contain only the external-sources card; that is fine.

- [ ] **Step 2: Run an initial search on mount** so the grid isn't empty before the first query. In `page.tsx`'s component, add:
```tsx
  const runSearch = useProductFinder((s) => s.runSearch);
  useEffect(() => { runSearch(); }, [runSearch]);
```
(add `import { useEffect } from "react";`). This populates page-1 results on load.

- [ ] **Step 3: Update quick-picks** in `SearchBar.tsx` to span the new categories. Change `QUICK_PICKS` to:
```tsx
const QUICK_PICKS: readonly string[] = [
  "Circuit Breakers", "Cat6 Cable", "IP Cameras", "Safety Glasses", "Relays", "Displays",
];
```

- [ ] **Step 4: Verify** `npm run typecheck && npm run build`. Manual (`npm run dev`): load `/product-finder` (after login) → grid shows results; search "ip camera" → security results; open a product → equivalents with scores; Load more works; star a product → appears in Saved. Stop dev.

- [ ] **Step 5: Commit**
```bash
git add apps/web/app/product-finder/page.tsx features/product-finder/SearchBar.tsx
git commit -m "feat(catalog): hide goes-with (deferred); initial search; cross-category quick-picks"
```

---

## Phase 6 — Verification

### Task 16: Full gate + deploy

- [ ] **Step 1: Full suite** — `npm test` → all pass (new catalog suites + reworked store tests; the 4 auth tests are green since the earlier fix).
- [ ] **Step 2: Gates** — `npm run typecheck` clean; `npm run lint` 0 errors; `npm run build` green.
- [ ] **Step 3: Manual smoke** (`npm run dev`): search across categories, pagination, equivalents/"Why recommended?", favorites/recent, no-results state. Stop dev.
- [ ] **Step 4: Commit any final polish**, then the branch is ready to finish (merge/PR) via superpowers:finishing-a-development-branch.

---

## Self-Review (by plan author)

- **Spec coverage:** generator (T3) · 6 categories/taxonomy (T1,T2,T14) · in-memory index (T4) · search+pagination (T5,T13) · equivalents (T6) · API routes search/suggest/[id] (T7) · async client/store/snapshots/loading (T8–T11) · autocomplete (T12) · hide BOM (T12) · hide goes-with (T15) · category UI (T14) · verification+deploy (T16). External sources kept (generator + page). All spec sections map to tasks.
- **Deferred per spec:** BOM (T12 removes the tab) and goes-with (T15 hides the panel) — not implemented, consistent with the spec.
- **Type consistency:** `SearchResponse`/`SuggestItem`/`ProductDetail`/`ProductSnapshot` defined in T1, used in T5/T7/T8/T9/T10. `searchCatalog(params)`, `findEquivalents(product,k,branchId)`, `getCatalog()`, `generateCatalog(size)`, `apiSearch/apiSuggest/apiGetProduct` names consistent across tasks. `toggleFavorite(product)` updated everywhere it's called (T9 store, T11 card).
- **Placeholder note:** T3 Step 4 intentionally contains an invalid `const SEED = 0x5w3sc0 || 1337;` line with an explicit instruction to delete it — keep only `FIXED_SEED`. (Flagged so the implementer removes it rather than copies it.)
