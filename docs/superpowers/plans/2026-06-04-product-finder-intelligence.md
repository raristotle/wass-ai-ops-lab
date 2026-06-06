# Product Finder Intelligence Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Product Finder live up to its "AI Recommender" branding with a deterministic, explainable recommendation engine, natural-language search, and saved lists/history — plus a UX polish pass.

**Architecture:** All business logic lives in pure, unit-tested modules under `lib/` (matching the codebase's existing pattern — vitest runs `lib/**/*.test.ts` in a node env, no DOM). React components in `features/product-finder/` stay thin and consume those modules. State extends the single Zustand store. No backend, no LLM, mock data only.

**Tech Stack:** Next.js 15 / React 19, TypeScript (strict), Zustand, Tailwind 3, Vitest. Aliases resolve from repo root (`@/lib`, `@/features`, `@/data`, `@/components`).

---

## Conventions for every task

- **Tests live in `lib/`** and import via aliases (`@/lib/...`, `@/data/...`, `@/features/...`). Components are **not** render-tested (no DOM env); verify them with `npm run typecheck`, `npm run lint`, `npm run build`, and a manual dev-server check.
- Commands run from the **repo root** (`C:\Users\raris\wass-ai-ops-lab`).
- Test runner: `npm test` runs all; target one file with `npx vitest run lib/<file>.test.ts`.
- Conventional Commits. Commit after each task's tests are green.

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `features/product-finder/types.ts` | Add score + query types | Modify |
| `lib/product-finder-scoring.ts` | Pure recommendation scoring engine | Create |
| `lib/product-finder-scoring.test.ts` | Scoring tests | Create |
| `lib/product-finder-nl-search.ts` | Pure NL query parser | Create |
| `lib/product-finder-nl-search.test.ts` | Parser tests | Create |
| `lib/product-finder-store.ts` | NL filters, favorites, recent, persistence | Modify |
| `lib/product-finder-store.test.ts` | Extend store tests | Modify |
| `features/product-finder/RecommendationExplanation.tsx` | Ring + tier + chips + disclosure | Create |
| `features/product-finder/ProductCard.tsx` | Consume scoring module; star toggle | Modify |
| `features/product-finder/SearchBar.tsx` | NL parse + removable filter chips | Modify |
| `features/product-finder/SavedAndRecentPanel.tsx` | Landing saved/recent surface | Create |
| `features/product-finder/EmptyState.tsx` | Landing + no-results states | Create |
| `apps/web/app/product-finder/page.tsx` | Wire empty/landing state | Modify |
| `apps/web/app/product-finder/layout.tsx` | Hydrate saved state | Modify (verify) |

---

## Phase 1 — Explainable Recommendations

### Task 1: Recommendation scoring engine

**Files:**
- Modify: `features/product-finder/types.ts`
- Create: `lib/product-finder-scoring.ts`
- Test: `lib/product-finder-scoring.test.ts`

- [ ] **Step 1: Add types**

In `features/product-finder/types.ts`, append:

```ts
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
```

- [ ] **Step 2: Write the failing test**

Create `lib/product-finder-scoring.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { scoreProduct, tierForScore, topReasons, SCORE_WEIGHTS } from "@/lib/product-finder-scoring";
import type { CatalogProduct, ProductSpec } from "@/features/product-finder/types";

function makeProduct(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "p", sku: "P", name: "Prod", brand: "BrandA",
    category: "electrical", subcategory: "Circuit Breakers",
    description: "", unitPrice: 10, uom: "EA",
    specs: [], preferred: false,
    branchStock: [], dcStock: [],
    alternativeIds: [], crossSellIds: [], upsellIds: [],
    externalSources: [], imageIcon: "x",
    ...overrides,
  };
}

const nonNeg = (name: string, value: string): ProductSpec => ({ name, value, isNonNeg: true });

const reference = makeProduct({
  id: "ref", unitPrice: 10, subcategory: "Circuit Breakers",
  specs: [nonNeg("Amperage", "15A"), nonNeg("Voltage", "120/240V")],
});

describe("tierForScore", () => {
  it("maps thresholds: 85+ excellent, 70-84 good, <70 partial", () => {
    expect(tierForScore(85)).toBe("excellent");
    expect(tierForScore(84)).toBe("good");
    expect(tierForScore(70)).toBe("good");
    expect(tierForScore(69)).toBe("partial");
  });
});

describe("scoreProduct", () => {
  it("a fully-matching, preferred, in-branch, same-subcat product scores excellent", () => {
    const cand = makeProduct({
      preferred: true, unitPrice: 10, subcategory: "Circuit Breakers",
      specs: [nonNeg("Amperage", "15A"), nonNeg("Voltage", "120/240V")],
      branchStock: [{ branchId: "B-HOU-01", branchName: "Houston", city: "Houston", state: "TX", quantity: 5 }],
    });
    const s = scoreProduct(cand, reference, "B-HOU-01");
    // specs 45 + branch 25 + preferred 15 + subcat 7 = 92
    expect(s.total).toBe(SCORE_WEIGHTS.spec + SCORE_WEIGHTS.branchStock + SCORE_WEIGHTS.preferred + SCORE_WEIGHTS.subcategory);
    expect(s.tier).toBe("excellent");
  });

  it("partial spec match scales proportionally and adds a mismatch note", () => {
    const cand = makeProduct({
      specs: [nonNeg("Amperage", "15A"), nonNeg("Voltage", "240V")], // 1 of 2
    });
    const s = scoreProduct(cand, reference);
    const specFactor = s.factors.find((f) => f.label.includes("non-negotiable"));
    expect(specFactor?.points).toBe(Math.round((1 / 2) * SCORE_WEIGHTS.spec)); // 23
    expect(s.factors.some((f) => !f.positive && f.label.includes("Voltage"))).toBe(true);
  });

  it("awards DC points when not in the user's branch but in a DC", () => {
    const cand = makeProduct({
      dcStock: [{ dcId: "DC-TEX-01", dcName: "Texas DC", location: "Katy", quantity: 9 }],
    });
    const s = scoreProduct(cand, reference, "B-HOU-01");
    expect(s.factors.some((f) => f.label.includes("distribution center") && f.points === SCORE_WEIGHTS.dcStock)).toBe(true);
  });

  it("gives full spec points when reference has no non-negotiable specs", () => {
    const ref = makeProduct({ specs: [] });
    const cand = makeProduct({});
    const s = scoreProduct(cand, ref);
    expect(s.factors.find((f) => f.label.includes("No spec constraints"))?.points).toBe(SCORE_WEIGHTS.spec);
  });

  it("scores 20% cheaper as +4 and labels it", () => {
    const cand = makeProduct({ unitPrice: 8 }); // 20% cheaper than 10
    const s = scoreProduct(cand, reference);
    const f = s.factors.find((x) => x.label.includes("cheaper"));
    expect(f?.points).toBe(4); // round(0.20 * 20)
  });

  it("clamps total to 0–100 and orders positive factors before notes", () => {
    const cand = makeProduct({
      preferred: true, unitPrice: 1, subcategory: "Circuit Breakers",
      specs: [nonNeg("Amperage", "15A"), nonNeg("Voltage", "120/240V")],
      branchStock: [{ branchId: "B-HOU-01", branchName: "H", city: "H", state: "TX", quantity: 5 }],
    });
    const s = scoreProduct(cand, reference, "B-HOU-01");
    expect(s.total).toBeLessThanOrEqual(100);
    const firstNoteIdx = s.factors.findIndex((f) => !f.positive);
    const lastPosIdx = s.factors.map((f) => f.positive).lastIndexOf(true);
    if (firstNoteIdx >= 0) expect(lastPosIdx).toBeLessThan(firstNoteIdx);
  });

  it("topReasons returns the highest-point positive factors only", () => {
    const cand = makeProduct({
      preferred: true,
      specs: [nonNeg("Amperage", "15A"), nonNeg("Voltage", "120/240V")],
      branchStock: [{ branchId: "B-HOU-01", branchName: "H", city: "H", state: "TX", quantity: 5 }],
    });
    const s = scoreProduct(cand, reference, "B-HOU-01");
    const top = topReasons(s, 2);
    expect(top).toHaveLength(2);
    expect(top.every((f) => f.positive && f.points > 0)).toBe(true);
    expect(top[0].points).toBeGreaterThanOrEqual(top[1].points);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/product-finder-scoring.test.ts`
Expected: FAIL — `Cannot find module '@/lib/product-finder-scoring'`.

- [ ] **Step 4: Write the implementation**

Create `lib/product-finder-scoring.ts`:

```ts
import type {
  CatalogProduct,
  RecommendationScore,
  RecommendationTier,
  ScoreFactor,
} from "@/features/product-finder/types";
import { getTotalDCStock } from "@/data/mock/catalog-products";

export const SCORE_WEIGHTS = {
  spec: 45,
  branchStock: 25,
  dcStock: 12,
  preferred: 15,
  cheaper: 8,
  subcategory: 7,
} as const;

export function tierForScore(total: number): RecommendationTier {
  if (total >= 85) return "excellent";
  if (total >= 70) return "good";
  return "partial";
}

function branchQtyFor(product: CatalogProduct, branchId?: string): number {
  if (!branchId) return 0;
  return product.branchStock.find((s) => s.branchId === branchId)?.quantity ?? 0;
}

export function scoreProduct(
  candidate: CatalogProduct,
  reference: CatalogProduct,
  userBranchId?: string,
): RecommendationScore {
  const factors: ScoreFactor[] = [];

  // 1. Non-negotiable spec match
  const refNonNeg = reference.specs.filter((s) => s.isNonNeg);
  let specPoints: number;
  if (refNonNeg.length === 0) {
    specPoints = SCORE_WEIGHTS.spec;
    factors.push({ label: "No spec constraints to meet", points: specPoints, positive: true });
  } else {
    const matched = refNonNeg.filter((rs) => {
      const cs = candidate.specs.find((s) => s.name === rs.name);
      return cs?.value === rs.value;
    });
    specPoints = Math.round((matched.length / refNonNeg.length) * SCORE_WEIGHTS.spec);
    factors.push({
      label:
        matched.length === refNonNeg.length
          ? `Matches all ${refNonNeg.length} non-negotiable specs`
          : `Matches ${matched.length} of ${refNonNeg.length} non-negotiable specs`,
      points: specPoints,
      positive: true,
    });
    const missing = refNonNeg.find((rs) => {
      const cs = candidate.specs.find((s) => s.name === rs.name);
      return cs?.value !== rs.value;
    });
    if (missing) {
      factors.push({ label: `Differs on ${missing.name} (needs ${missing.value})`, points: 0, positive: false });
    }
  }

  // 2. Stock (branch beats DC)
  const branchQty = branchQtyFor(candidate, userBranchId);
  const dcQty = getTotalDCStock(candidate);
  let stockPoints = 0;
  if (branchQty > 0) {
    stockPoints = SCORE_WEIGHTS.branchStock;
    factors.push({ label: "In stock at your branch", points: stockPoints, positive: true });
  } else if (dcQty > 0) {
    stockPoints = SCORE_WEIGHTS.dcStock;
    factors.push({ label: "Available from distribution center", points: stockPoints, positive: true });
  } else {
    factors.push({ label: "Not in Meridian stock", points: 0, positive: false });
  }

  // 3. Preferred line
  let preferredPoints = 0;
  if (candidate.preferred) {
    preferredPoints = SCORE_WEIGHTS.preferred;
    factors.push({ label: "Meridian Preferred line", points: preferredPoints, positive: true });
  }

  // 4. Price vs reference
  let pricePoints = 0;
  if (candidate.unitPrice < reference.unitPrice && reference.unitPrice > 0) {
    const pctCheaper = (reference.unitPrice - candidate.unitPrice) / reference.unitPrice;
    pricePoints = Math.min(SCORE_WEIGHTS.cheaper, Math.round(pctCheaper * 20));
    if (pricePoints > 0) {
      factors.push({ label: `${Math.round(pctCheaper * 100)}% cheaper than your reference`, points: pricePoints, positive: true });
    }
  } else if (candidate.unitPrice > reference.unitPrice && reference.unitPrice > 0) {
    const pct = Math.round(((candidate.unitPrice - reference.unitPrice) / reference.unitPrice) * 100);
    factors.push({ label: `${pct}% more expensive than your reference`, points: 0, positive: false });
  }

  // 5. Same subcategory
  let subPoints = 0;
  if (candidate.subcategory === reference.subcategory) {
    subPoints = SCORE_WEIGHTS.subcategory;
    factors.push({ label: "Same product subcategory", points: subPoints, positive: true });
  }

  const total = Math.max(
    0,
    Math.min(100, specPoints + stockPoints + preferredPoints + pricePoints + subPoints),
  );

  factors.sort((a, b) => {
    if (a.positive !== b.positive) return a.positive ? -1 : 1;
    return b.points - a.points;
  });

  return { total, tier: tierForScore(total), factors };
}

export function topReasons(score: RecommendationScore, n = 2): ScoreFactor[] {
  return score.factors.filter((f) => f.positive && f.points > 0).slice(0, n);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/product-finder-scoring.test.ts`
Expected: PASS (all cases).

- [ ] **Step 6: Commit**

```bash
git add features/product-finder/types.ts lib/product-finder-scoring.ts lib/product-finder-scoring.test.ts
git commit -m "feat(product-finder): add explainable recommendation scoring engine"
```

---

### Task 2: RecommendationExplanation component + ProductCard integration

**Files:**
- Create: `features/product-finder/RecommendationExplanation.tsx`
- Modify: `features/product-finder/ProductCard.tsx` (remove inline `computeCompatScore` + compat bar; render the new component)

- [ ] **Step 1: Create the component**

Create `features/product-finder/RecommendationExplanation.tsx`:

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { scoreProduct, topReasons } from "@/lib/product-finder-scoring";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct, RecommendationTier } from "@/features/product-finder/types";

const TIER_LABEL: Record<RecommendationTier, string> = {
  excellent: "Excellent match",
  good: "Good match",
  partial: "Partial match",
};

// WCAG: text colors chosen to pass on white / light tints
const TIER_TEXT: Record<RecommendationTier, string> = {
  excellent: "text-[#00573F]",
  good: "text-[#8a6500]",
  partial: "text-[#4F758B]",
};

const TIER_RING: Record<RecommendationTier, string> = {
  excellent: "#00AA13",
  good: "#EAAA00",
  partial: "#B7C9D3",
};

interface Props {
  product: CatalogProduct;
  reference: CatalogProduct;
}

export function RecommendationExplanation({ product, reference }: Props) {
  const [open, setOpen] = useState(false);
  const userBranchId = useProductFinder((s) => s.user?.branchId);
  const score = scoreProduct(product, reference, userBranchId);
  const chips = topReasons(score, 2);

  return (
    <div className="mt-2">
      {/* Score ring + tier label */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(${TIER_RING[score.tier]} ${score.total}%, #e2e8ec ${score.total}% 100%)` }}
          role="progressbar"
          aria-valuenow={score.total}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Match score: ${score.total} percent, ${TIER_LABEL[score.tier]}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#1D252D]">
            {score.total}%
          </span>
        </div>
        <span className={cn("text-sm font-bold", TIER_TEXT[score.tier])}>{TIER_LABEL[score.tier]}</span>
      </div>

      {/* Top-2 reason chips */}
      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((f) => (
            <span
              key={f.label}
              className="rounded-full border border-[#00AA13]/30 bg-[#00AA13]/10 px-2 py-0.5 text-[11px] font-semibold text-[#00573F]"
            >
              ✓ {f.label}
            </span>
          ))}
        </div>
      )}

      {/* Why disclosure */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-[#004986] hover:underline"
      >
        <span className={cn("text-[9px] transition-transform", open ? "rotate-90" : "rotate-0")}>▶</span>
        Why recommended?
      </button>

      {open && (
        <ul className="mt-2 space-y-1.5 border-t border-dashed border-[#cfd9e0] pt-2">
          {score.factors.map((f) => (
            <li key={f.label} className="flex items-start gap-1.5 text-[11px] text-[#1D252D]">
              <span className={f.positive ? "font-bold text-[#00AA13]" : "font-bold text-[#EAAA00]"}>
                {f.positive ? "✓" : "⚠"}
              </span>
              <span className="flex-1">{f.label}</span>
              {f.points > 0 && <span className="tabular-nums text-[#4F758B]">+{f.points}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Integrate into ProductCard**

In `features/product-finder/ProductCard.tsx`:

1. Delete the `computeCompatScore` function (lines ~19–30) and the `compatScore` const + the entire "Compat bar" JSX block (the `{compatScore !== null && (...)}` block).
2. Add the import near the other imports:

```tsx
import { RecommendationExplanation } from "@/features/product-finder/RecommendationExplanation";
```

3. Where the compat bar used to render (inside the header `<div className="flex-1 min-w-0">`, after the description `<p>`), render:

```tsx
{referenceProduct != null && referenceProduct.id !== product.id && (
  <RecommendationExplanation product={product} reference={referenceProduct} />
)}
```

- [ ] **Step 3: Verify typecheck + lint + build**

Run: `npm run typecheck && npm run lint`
Expected: no errors (no unused `computeCompatScore`, no missing imports).

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manual check**

Run `npm run dev`, log in (`sales@meridiansupply.com` / `meridian2024`), search "circuit breaker", click a result to set an active product. Confirm each alternative card shows the ring + tier + chips, and "Why recommended?" expands the factor list. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add features/product-finder/RecommendationExplanation.tsx features/product-finder/ProductCard.tsx
git commit -m "feat(product-finder): render explainable recommendation on product cards"
```

---

## Phase 2 — Natural-Language Search

### Task 3: NL query parser

**Files:**
- Modify: `features/product-finder/types.ts`
- Create: `lib/product-finder-nl-search.ts`
- Test: `lib/product-finder-nl-search.test.ts`

- [ ] **Step 1: Add types**

Append to `features/product-finder/types.ts`:

```ts
export type ParsedFilterKind =
  | "priceMax" | "priceMin" | "branchStock" | "preferred" | "category" | "brand";

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
```

- [ ] **Step 2: Write the failing test**

Create `lib/product-finder-nl-search.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseQuery } from "@/lib/product-finder-nl-search";

describe("parseQuery", () => {
  it("returns raw text and no filters when nothing matches", () => {
    const r = parseQuery("circuit breaker");
    expect(r.text).toBe("circuit breaker");
    expect(r.filters).toHaveLength(0);
  });

  it("parses 'under $50' into a priceMax filter", () => {
    const r = parseQuery("breaker under $50");
    expect(r.text).toBe("breaker");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "priceMax", value: 50 }));
  });

  it("parses 'over 20' into a priceMin filter", () => {
    const r = parseQuery("cable over 20");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "priceMin", value: 20 }));
    expect(r.text).toBe("cable");
  });

  it("parses a '$10-$30' range into both bounds", () => {
    const r = parseQuery("wire $10-$30");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "priceMin", value: 10 }));
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "priceMax", value: 30 }));
  });

  it("parses 'in stock' into a branchStock filter", () => {
    const r = parseQuery("breaker in stock");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "branchStock", value: true }));
    expect(r.text).toBe("breaker");
  });

  it("parses 'preferred'", () => {
    const r = parseQuery("preferred breaker");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "preferred", value: true }));
  });

  it("parses a known brand keyword", () => {
    const r = parseQuery("square d breaker");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "brand", value: "Square D" }));
  });

  it("parses a combined query", () => {
    const r = parseQuery("20A breaker in stock under $50 preferred");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "branchStock" }));
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "priceMax", value: 50 }));
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "preferred" }));
    expect(r.text).toContain("20a");
    expect(r.text).toContain("breaker");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/product-finder-nl-search.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Write the implementation**

Create `lib/product-finder-nl-search.ts`:

```ts
import { ALL_BRANDS } from "@/data/mock/catalog-products";
import type { ParsedFilter, ParsedFilterKind, ParsedQuery, ProductCategory } from "@/features/product-finder/types";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const CATEGORIES: ProductCategory[] = ["electrical", "datacom"];

export function parseQuery(raw: string): ParsedQuery {
  let working = ` ${raw.toLowerCase()} `;
  const filters: ParsedFilter[] = [];
  const push = (kind: ParsedFilterKind, label: string, value: string | number | boolean) =>
    filters.push({ id: `${kind}:${value}`, kind, label, value });

  // Price range first ($10-$30 / 10 to 30)
  const range = working.match(/\$?(\d+(?:\.\d+)?)\s*(?:-|to)\s*\$?(\d+(?:\.\d+)?)/);
  if (range) {
    const lo = Number(range[1]);
    const hi = Number(range[2]);
    push("priceMin", `Over $${lo}`, lo);
    push("priceMax", `Under $${hi}`, hi);
    working = working.replace(range[0], " ");
  } else {
    const under = working.match(/(?:under|below|less than|<)\s*\$?(\d+(?:\.\d+)?)/);
    if (under) {
      push("priceMax", `Under $${Number(under[1])}`, Number(under[1]));
      working = working.replace(under[0], " ");
    }
    const over = working.match(/(?:over|above|more than|>)\s*\$?(\d+(?:\.\d+)?)/);
    if (over) {
      push("priceMin", `Over $${Number(over[1])}`, Number(over[1]));
      working = working.replace(over[0], " ");
    }
  }

  // Stock
  if (/\b(in[ -]?stock|at my branch)\b/.test(working)) {
    push("branchStock", "In stock", true);
    working = working.replace(/\b(in[ -]?stock|at my branch)\b/g, " ");
  }

  // Preferred
  if (/\bpreferred\b/.test(working)) {
    push("preferred", "Preferred", true);
    working = working.replace(/\bpreferred\b/g, " ");
  }

  // Category
  for (const cat of CATEGORIES) {
    const re = new RegExp(`\\b${cat}\\b`);
    if (re.test(working)) {
      push("category", cat.charAt(0).toUpperCase() + cat.slice(1), cat);
      working = working.replace(re, " ");
    }
  }

  // Brand (longest first so multi-word brands win)
  for (const brand of [...ALL_BRANDS].sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${escapeRe(brand.toLowerCase())}\\b`);
    if (re.test(working)) {
      push("brand", brand, brand);
      working = working.replace(re, " ");
    }
  }

  const text = working.replace(/\s+/g, " ").trim();
  return { text, filters };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/product-finder-nl-search.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add features/product-finder/types.ts lib/product-finder-nl-search.ts lib/product-finder-nl-search.test.ts
git commit -m "feat(product-finder): add natural-language query parser"
```

---

### Task 4: Store wiring for NL search

**Files:**
- Modify: `lib/product-finder-store.ts`
- Test: `lib/product-finder-store.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `lib/product-finder-store.test.ts` (also add `appliedNlFilters: []`, `favorites: []`, `recentlyViewed: []` to the `resetStore()` object now so future tasks share it):

```ts
describe("natural-language search", () => {
  beforeEach(resetStore);

  it("runNlSearch applies parsed filters to FilterState and stores chips", () => {
    useProductFinder.getState().runNlSearch("preferred breaker under $50");
    const { filters, appliedNlFilters, results } = useProductFinder.getState();
    expect(filters.onlyPreferred).toBe(true);
    expect(filters.priceMax).toBe(50);
    expect(appliedNlFilters.length).toBeGreaterThanOrEqual(2);
    expect(results.every((p) => p.preferred && p.unitPrice <= 50)).toBe(true);
  });

  it("removeNlFilter clears that filter's effect and re-runs search", () => {
    useProductFinder.getState().runNlSearch("preferred under $50");
    const pref = useProductFinder.getState().appliedNlFilters.find((f) => f.kind === "preferred");
    expect(pref).toBeDefined();
    useProductFinder.getState().removeNlFilter(pref!.id);
    const { filters, appliedNlFilters } = useProductFinder.getState();
    expect(filters.onlyPreferred).toBe(false);
    expect(appliedNlFilters.some((f) => f.kind === "preferred")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/product-finder-store.test.ts`
Expected: FAIL — `runNlSearch is not a function`.

- [ ] **Step 3: Implement the store additions**

In `lib/product-finder-store.ts`:

1. Add to imports:

```ts
import { parseQuery } from "@/lib/product-finder-nl-search";
import type { ParsedFilter } from "@/features/product-finder/types";
```

2. Add to the `ProductFinderState` interface (in the Search section):

```ts
  appliedNlFilters: ParsedFilter[];
  runNlSearch: (raw: string) => void;
  removeNlFilter: (id: string) => void;
```

3. Add a helper above `useProductFinder` that maps one parsed filter onto a `FilterState` (returns a new FilterState):

```ts
function applyParsedFilter(filters: FilterState, f: ParsedFilter, on: boolean): FilterState {
  const next: FilterState = {
    ...filters,
    categories: new Set(filters.categories),
    brands: new Set(filters.brands),
    subcategories: new Set(filters.subcategories),
  };
  switch (f.kind) {
    case "priceMax": next.priceMax = on ? (f.value as number) : null; break;
    case "priceMin": next.priceMin = on ? (f.value as number) : null; break;
    case "branchStock": next.onlyBranchStock = on; break;
    case "preferred": next.onlyPreferred = on; break;
    case "category": on ? next.categories.add(f.value as ProductCategory) : next.categories.delete(f.value as ProductCategory); break;
    case "brand": on ? next.brands.add(f.value as string) : next.brands.delete(f.value as string); break;
  }
  return next;
}
```

4. Add the state implementation inside the store (in the Search section, near `setQuery`):

```ts
  appliedNlFilters: [],

  runNlSearch(raw) {
    const parsed = parseQuery(raw);
    set((s) => {
      let filters = { ...s.filters, query: parsed.text };
      for (const f of parsed.filters) filters = applyParsedFilter(filters, f, true);
      return { filters, appliedNlFilters: parsed.filters, query: raw };
    });
    get().runSearch();
  },

  removeNlFilter(id) {
    set((s) => {
      const target = s.appliedNlFilters.find((f) => f.id === id);
      if (!target) return s;
      return {
        filters: applyParsedFilter(s.filters, target, false),
        appliedNlFilters: s.appliedNlFilters.filter((f) => f.id !== id),
      };
    });
    get().runSearch();
  },
```

5. Ensure `ProductCategory` is imported (it already is in the existing import line).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/product-finder-store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/product-finder-store.ts lib/product-finder-store.test.ts
git commit -m "feat(product-finder): wire natural-language search into the store"
```

---

### Task 5: SearchBar — parse on search + removable filter chips

**Files:**
- Modify: `features/product-finder/SearchBar.tsx`

- [ ] **Step 1: Use runNlSearch and render chips**

In `features/product-finder/SearchBar.tsx`:

1. Pull the new store actions in the `useProductFinder()` destructure at the top of `SearchBar`:

```tsx
    runNlSearch,
    removeNlFilter,
    appliedNlFilters,
```

2. Change `handleSearch` and `handleQuickPick` to route through NL parsing:

```tsx
  const handleSearch = () => {
    setShowSuggestions(false);
    runNlSearch(query);
  };
```
```tsx
  const handleQuickPick = (chip: string) => {
    setQuery(chip);
    setShowSuggestions(false);
    runNlSearch(chip);
  };
```

3. Inside `SingleSearchPanel`, add a chips row directly under the quick-pick chips block. First extend `SingleSearchPanelProps` with:

```tsx
  appliedNlFilters: ParsedFilter[];
  onRemoveFilter: (id: string) => void;
```

and pass them from `SearchBar`'s render:

```tsx
            appliedNlFilters={appliedNlFilters}
            onRemoveFilter={removeNlFilter}
```

4. Add the import to SearchBar:

```tsx
import type { CatalogProduct, BomLine, ParsedFilter } from "@/features/product-finder/types";
```
(replace the existing `CatalogProduct, BomLine` type import line).

5. Render the chips at the bottom of `SingleSearchPanel`'s returned JSX, after the quick-pick `</div>`:

```tsx
      {appliedNlFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-[#4F758B]">Filters:</span>
          {appliedNlFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onRemoveFilter(f.id)}
              aria-label={`Remove filter ${f.label}`}
              className="inline-flex items-center gap-1 rounded-full border border-[#00AA13]/40 bg-[#00AA13]/10 px-2.5 py-0.5 text-xs font-medium text-[#00573F] hover:bg-[#00AA13]/20"
            >
              {f.label}
              <span aria-hidden="true" className="text-[#4F758B]">✕</span>
            </button>
          ))}
        </div>
      )}
```

- [ ] **Step 2: Verify typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: success.

- [ ] **Step 3: Manual check**

`npm run dev`, log in, type `preferred breaker under $50`, press Enter. Confirm chips "Preferred" and "Under $50" appear and results respect them; clicking a chip's ✕ removes it and updates results. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add features/product-finder/SearchBar.tsx
git commit -m "feat(product-finder): natural-language search chips in the search bar"
```

---

## Phase 3 — Saved Lists & History

### Task 6: Favorites + recently-viewed store + persistence

**Files:**
- Modify: `lib/product-finder-store.ts`
- Test: `lib/product-finder-store.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `lib/product-finder-store.test.ts`:

```ts
describe("favorites & recently viewed", () => {
  beforeEach(resetStore);

  it("toggleFavorite adds then removes an id", () => {
    const id = CATALOG_PRODUCTS[0].id;
    useProductFinder.getState().toggleFavorite(id);
    expect(useProductFinder.getState().isFavorite(id)).toBe(true);
    useProductFinder.getState().toggleFavorite(id);
    expect(useProductFinder.getState().isFavorite(id)).toBe(false);
  });

  it("setActiveProduct records recently viewed, most-recent-first, deduped", () => {
    const [a, b] = CATALOG_PRODUCTS;
    useProductFinder.getState().setActiveProduct(a);
    useProductFinder.getState().setActiveProduct(b);
    useProductFinder.getState().setActiveProduct(a);
    expect(useProductFinder.getState().recentlyViewed).toEqual([a.id, b.id]);
  });

  it("recentlyViewed caps at 12 entries", () => {
    for (let i = 0; i < CATALOG_PRODUCTS.length && i < 15; i++) {
      useProductFinder.getState().setActiveProduct(CATALOG_PRODUCTS[i]);
    }
    expect(useProductFinder.getState().recentlyViewed.length).toBeLessThanOrEqual(12);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/product-finder-store.test.ts`
Expected: FAIL — `toggleFavorite is not a function`.

- [ ] **Step 3: Implement the store additions**

In `lib/product-finder-store.ts`:

1. Add to `ProductFinderState` interface:

```ts
  // Saved & history
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  recentlyViewed: string[];
```

2. Add a constant near the top:

```ts
const MAX_RECENT = 12;
```

3. Add the implementation in the store body:

```ts
  favorites: [],
  recentlyViewed: [],

  toggleFavorite(id) {
    set((s) => {
      const next = s.favorites.includes(id)
        ? s.favorites.filter((f) => f !== id)
        : [...s.favorites, id];
      if (typeof window !== "undefined") localStorage.setItem("pf_favorites", JSON.stringify(next));
      return { favorites: next };
    });
  },

  isFavorite(id) {
    return get().favorites.includes(id);
  },
```

4. Modify the existing `setActiveProduct` to record history:

```ts
  setActiveProduct(p) {
    set((s) => {
      if (!p) return { activeProduct: null };
      const recentlyViewed = [p.id, ...s.recentlyViewed.filter((id) => id !== p.id)].slice(0, MAX_RECENT);
      if (typeof window !== "undefined") localStorage.setItem("pf_recent", JSON.stringify(recentlyViewed));
      return { activeProduct: p, recentlyViewed };
    });
    if (p) get().runSearch();
  },
```

5. Extend `hydrateAuth` (or add a new exported `hydrateSavedState`) — add a new function below `hydrateAuth`:

```ts
export function hydrateSavedState() {
  if (typeof window === "undefined") return;
  try {
    const fav = localStorage.getItem("pf_favorites");
    const rec = localStorage.getItem("pf_recent");
    useProductFinder.setState({
      favorites: fav ? (JSON.parse(fav) as string[]) : [],
      recentlyViewed: rec ? (JSON.parse(rec) as string[]) : [],
    });
  } catch {
    /* ignore corrupt storage */
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/product-finder-store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/product-finder-store.ts lib/product-finder-store.test.ts
git commit -m "feat(product-finder): favorites and recently-viewed with persistence"
```

---

### Task 7: Star toggle on ProductCard + SavedAndRecentPanel + hydration

**Files:**
- Modify: `features/product-finder/ProductCard.tsx`
- Create: `features/product-finder/SavedAndRecentPanel.tsx`
- Modify: `apps/web/app/product-finder/layout.tsx` (call hydration)

- [ ] **Step 1: Add a star toggle to ProductCard header**

In `features/product-finder/ProductCard.tsx`, read favorite state near the other store hooks:

```tsx
  const isFavorite = useProductFinder((s) => s.favorites.includes(product.id));
  const toggleFavorite = useProductFinder((s) => s.toggleFavorite);
```

In the header, make the icon container a relative wrapper and add a star button in the top-right of the card. Add this just inside the outer card `<div ...>` (right after the opening tag), so it overlays:

```tsx
      <button
        type="button"
        onClick={() => toggleFavorite(product.id)}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
        className={cn(
          "absolute right-2 top-2 z-10 text-lg leading-none transition-colors",
          isFavorite ? "text-[#EAAA00]" : "text-[#B7C9D3] hover:text-[#EAAA00]",
        )}
      >
        {isFavorite ? "★" : "☆"}
      </button>
```

(The card root already has `relative` — confirm; it does.)

- [ ] **Step 2: Create the SavedAndRecentPanel**

Create `features/product-finder/SavedAndRecentPanel.tsx`:

```tsx
"use client";

import { useProductFinder } from "@/lib/product-finder-store";
import { PRODUCT_MAP } from "@/data/mock/catalog-products";
import type { CatalogProduct } from "@/features/product-finder/types";

function MiniRow({ product }: { product: CatalogProduct }) {
  const setActiveProduct = useProductFinder((s) => s.setActiveProduct);
  return (
    <button
      type="button"
      onClick={() => setActiveProduct(product)}
      className="flex w-full items-center gap-2 rounded-lg border border-[#B7C9D3] bg-white px-3 py-2 text-left hover:border-[#00AA13]"
    >
      <span className="text-xl" aria-hidden="true">{product.imageIcon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[#1D252D]">{product.name}</span>
        <span className="block truncate text-xs text-[#4F758B]">{product.brand} · ${product.unitPrice.toFixed(2)}</span>
      </span>
    </button>
  );
}

export function SavedAndRecentPanel() {
  const favorites = useProductFinder((s) => s.favorites);
  const recentlyViewed = useProductFinder((s) => s.recentlyViewed);

  const favProducts = favorites.map((id) => PRODUCT_MAP.get(id)).filter((p): p is CatalogProduct => !!p);
  const recentProducts = recentlyViewed.map((id) => PRODUCT_MAP.get(id)).filter((p): p is CatalogProduct => !!p);

  if (favProducts.length === 0 && recentProducts.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {recentProducts.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#4F758B]">Recently viewed</h3>
          <div className="space-y-2">
            {recentProducts.slice(0, 6).map((p) => <MiniRow key={p.id} product={p} />)}
          </div>
        </section>
      )}
      {favProducts.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#4F758B]">★ Favorites</h3>
          <div className="space-y-2">
            {favProducts.map((p) => <MiniRow key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Hydrate saved state on mount**

Open `apps/web/app/product-finder/layout.tsx`. Find where `hydrateAuth()` is called (in a `useEffect`). Add `hydrateSavedState()` next to it and import it:

```tsx
import { hydrateAuth, hydrateSavedState } from "@/lib/product-finder-store";
```
```tsx
  useEffect(() => {
    hydrateAuth();
    hydrateSavedState();
  }, []);
```

If `layout.tsx` does not currently call `hydrateAuth`, instead add the hydration call to the existing client effect there. (Verify by reading the file first.)

- [ ] **Step 4: Verify typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: success.

- [ ] **Step 5: Manual check**

`npm run dev`, log in, star a couple products, view several. Reload the page — favorites and recently-viewed persist. Stop the dev server. (The panel is wired into the empty state in Task 8.)

- [ ] **Step 6: Commit**

```bash
git add features/product-finder/ProductCard.tsx features/product-finder/SavedAndRecentPanel.tsx apps/web/app/product-finder/layout.tsx
git commit -m "feat(product-finder): favorite stars, saved & recent panel, hydration"
```

---

## Phase 4 — Polish: empty & no-results states

### Task 8: EmptyState + page wiring

**Files:**
- Create: `features/product-finder/EmptyState.tsx`
- Modify: `apps/web/app/product-finder/page.tsx`

- [ ] **Step 1: Create EmptyState**

Create `features/product-finder/EmptyState.tsx`:

```tsx
"use client";

import { SavedAndRecentPanel } from "@/features/product-finder/SavedAndRecentPanel";

export function LandingState() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#B7C9D3] bg-white p-6 text-center">
        <p className="text-3xl" aria-hidden="true">🔎</p>
        <h2 className="mt-2 text-lg font-bold text-[#1D252D]">Find the right product, fast</h2>
        <p className="mt-1 text-sm text-[#4F758B]">
          Search by name, SKU, spec, or plain English — e.g. “20A breaker in stock under $50”.
          Pick a product to see scored, explained alternatives.
        </p>
      </div>
      <SavedAndRecentPanel />
    </div>
  );
}

export function NoResultsState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-xl border border-[#B7C9D3] bg-white p-8 text-center">
      <p className="text-3xl" aria-hidden="true">📭</p>
      <h2 className="mt-2 text-base font-bold text-[#1D252D]">No matching products</h2>
      <p className="mt-1 text-sm text-[#4F758B]">Try removing a filter or broadening your search.</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 rounded-lg bg-[#00AA13] px-4 py-2 text-sm font-semibold text-white hover:bg-[#009911]"
      >
        Clear all filters
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Wire into the page**

In `apps/web/app/product-finder/page.tsx`:

1. Add imports:

```tsx
import { LandingState, NoResultsState } from "@/features/product-finder/EmptyState";
```

2. Add these selectors near the other `useProductFinder` selectors in the page component:

```tsx
const clearFilters = useProductFinder((s) => s.clearFilters);
const filters = useProductFinder((s) => s.filters);
```

3. Compute whether the user has an active search/filter (so we only show "no results" when they actually filtered, not on first load):

```tsx
const hasQueryOrFilters =
  filters.query.length > 0 ||
  filters.categories.size > 0 || filters.brands.size > 0 || filters.subcategories.size > 0 ||
  filters.onlyBranchStock || filters.onlyDCStock || filters.onlyPreferred ||
  filters.priceMin !== null || filters.priceMax !== null;
```

4. Replace the `else` branch (the no-active-product block that currently renders `<ProductGrid products={results} />`) with:

```tsx
          ) : (
            <div className="space-y-4">
              {results.length === 0 && hasQueryOrFilters ? (
                <NoResultsState onClear={() => clearFilters()} />
              ) : results.length === 0 ? (
                <LandingState />
              ) : (
                <>
                  <LandingState />
                  <ProductGrid products={results} />
                </>
              )}
            </div>
          )}
```

- [ ] **Step 3: Verify typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: success.

- [ ] **Step 4: Manual check**

`npm run dev`, log in. On first load (no search), the landing + saved/recent panel shows. Search something with no matches (e.g. `preferred under $1`) → no-results state with working "Clear all filters". Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add features/product-finder/EmptyState.tsx apps/web/app/product-finder/page.tsx
git commit -m "feat(product-finder): landing and no-results states"
```

---

### Task 9: Final verification gate

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: all suites pass (scoring, nl-search, store, existing logic/ui tests).

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: clean.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: succeeds with no type or lint errors.

- [ ] **Step 4: WCAG / mobile spot-check**

`npm run dev` and verify on a narrow viewport (~375px):
- Recommendation chips, ring, and "Why?" disclosure wrap cleanly and are keyboard-operable.
- Filter chips and star are reachable by Tab and have visible focus.
- Score ring announces via `aria-label`; disclosure toggles `aria-expanded`.

Stop the dev server.

- [ ] **Step 5: Final commit (if any polish tweaks were needed)**

```bash
git add -A
git commit -m "chore(product-finder): final polish and verification"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** Feature 1 → Tasks 1–2. Feature 2 → Tasks 3–5. Feature 3 → Tasks 6–7. Polish → Tasks 8–9. All spec sections map to tasks.
- **Type consistency:** `RecommendationScore`/`ScoreFactor`/`RecommendationTier` defined in Task 1, consumed in Task 2. `ParsedFilter`/`ParsedQuery` defined in Task 3, consumed in Tasks 4–5. `runNlSearch`/`removeNlFilter`/`appliedNlFilters` named consistently across Tasks 4–5. `toggleFavorite`/`isFavorite`/`favorites`/`recentlyViewed`/`hydrateSavedState` consistent across Tasks 6–7. `SCORE_WEIGHTS` used in both implementation and tests.
- **Stock semantics:** scoring uses branch-specific quantity via `branchStock.find(...)`, not the all-branches `getTotalBranchStock`.
- **Placeholders:** none — every code step contains complete code; the one ambiguous JSX token in Task 8 Step 2 is explicitly corrected in the same step.
```
