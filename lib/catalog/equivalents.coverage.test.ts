import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import type { CatalogProduct } from "@/features/product-finder/types";

// The backfill branch of findEquivalents (the path taken when fewer than `k`
// TRUE functional equivalents exist) is what the sibling equivalents.test.ts
// never reaches — it uses the real 200k catalog where Circuit Breakers always
// have >= k true equivalents, so line 20 (`if (exact.length >= k) return exact`)
// short-circuits and the backfill at lines 22-46 is dead. Here we mock the
// catalog + scoring so we can drive the backfill deterministically and assert
// its same-subcategory-first ordering and tie-breakers.

// ── Mocks ────────────────────────────────────────────────────────────────
// getCatalog: returns the products array the backfill pool is filtered from.
const catalogProducts: CatalogProduct[] = [];
vi.mock("@/lib/catalog/index", () => ({
  getCatalog: () => ({ products: catalogProducts, byId: new Map(), haystack: [] }),
}));

// scoreProduct: deterministic, driven by a per-product `score` we stash on the
// fixture so we can assert the score tie-breaker without depending on the real
// scoring weights.
vi.mock("@/lib/product-finder-scoring", () => ({
  scoreProduct: (candidate: CatalogProduct) => ({
    total: (candidate as unknown as { __score?: number }).__score ?? 0,
    tier: "partial" as const,
    factors: [],
  }),
}));

import { findEquivalents } from "@/lib/catalog/equivalents";

// ── Fixture builder ──────────────────────────────────────────────────────
// "Circuit Breakers" is a real taxonomy subcategory in "electrical" whose
// non-negotiable canonical keys are Amperage / Voltage / Poles. By varying
// those specs we control isFunctionalEquivalent and sharedNonNegCount.
function breaker(
  id: string,
  opts: {
    amp?: string;
    volt?: string;
    poles?: string;
    score?: number;
    subcategory?: string;
    category?: string;
    unitPrice?: number;
  } = {},
): CatalogProduct {
  const specs = [
    { name: "Amperage", value: opts.amp ?? "15A", isNonNeg: true },
    { name: "Voltage", value: opts.volt ?? "120/240V", isNonNeg: true },
    { name: "Poles", value: opts.poles ?? "1-Pole", isNonNeg: true },
  ];
  const p: CatalogProduct = {
    id,
    sku: id,
    name: `Breaker ${id}`,
    brand: "Square D",
    category: (opts.category as CatalogProduct["category"]) ?? "electrical",
    subcategory: opts.subcategory ?? "Circuit Breakers",
    description: `Breaker ${id}`,
    unitPrice: opts.unitPrice ?? 10,
    uom: "EA",
    specs,
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "⚡",
  };
  (p as unknown as { __score: number }).__score = opts.score ?? 0;
  return p;
}

function setCatalog(...products: CatalogProduct[]) {
  catalogProducts.length = 0;
  catalogProducts.push(...products);
}

beforeEach(() => setCatalog());
afterEach(() => {
  vi.clearAllMocks();
  setCatalog();
});

describe("findEquivalents — backfill branch", () => {
  it("returns exact equivalents only when there are already >= k of them (no backfill)", () => {
    // ref: 15A/120-240V/1-Pole. Two TRUE equivalents (identical canonical keys),
    // k=2 -> exact.length (2) >= k (2) -> early return, backfill untouched.
    const ref = breaker("REF");
    const eqA = breaker("EQ-A");
    const eqB = breaker("EQ-B");
    // A near-match that must NOT appear because we early-return.
    const near = breaker("NEAR", { amp: "20A" });
    setCatalog(ref, eqA, eqB, near);

    const r = findEquivalents(ref, 2);
    expect(r).toHaveLength(2);
    expect(r.map((p) => p.id).sort()).toEqual(["EQ-A", "EQ-B"]);
    expect(r.some((p) => p.id === "NEAR")).toBe(false);
  });

  it("backfills with same-subcategory near-matches when fewer than k true equivalents exist", () => {
    const ref = breaker("REF"); // 15A / 120-240V / 1-Pole
    const eqA = breaker("EQ-A"); // one true equivalent
    // Near matches in the SAME subcategory but differing canonical keys
    // (so isFunctionalEquivalent === false → they land in the backfill pool).
    const near2shared = breaker("NEAR-2", { poles: "2-Pole" }); // shares Amp+Volt = 2
    const near1shared = breaker("NEAR-1", { volt: "277/480V", poles: "2-Pole" }); // shares Amp only = 1
    setCatalog(ref, eqA, near2shared, near1shared);

    const r = findEquivalents(ref, 4);
    // exact (EQ-A) first, then backfill ordered by sharedNonNegCount desc.
    expect(r.map((p) => p.id)).toEqual(["EQ-A", "NEAR-2", "NEAR-1"]);
  });

  it("excludes the reference product and already-chosen equivalents from backfill", () => {
    const ref = breaker("REF");
    const eqA = breaker("EQ-A"); // chosen as exact
    const near = breaker("NEAR", { amp: "30A" });
    setCatalog(ref, eqA, near);

    const r = findEquivalents(ref, 8);
    expect(r.some((p) => p.id === "REF")).toBe(false);
    // EQ-A appears once (as exact), not duplicated into backfill.
    expect(r.filter((p) => p.id === "EQ-A")).toHaveLength(1);
    expect(r.map((p) => p.id)).toEqual(["EQ-A", "NEAR"]);
  });

  it("ranks equal-shared backfill candidates by score, then by id", () => {
    const ref = breaker("REF");
    // No true equivalents — force the whole list through backfill.
    // All three share exactly Amperage (=1 shared) by differing on Volt+Poles.
    const a = breaker("A", { volt: "277/480V", poles: "2-Pole", score: 10 });
    const b = breaker("B", { volt: "277/480V", poles: "2-Pole", score: 90 });
    const c = breaker("C", { volt: "277/480V", poles: "2-Pole", score: 90 });
    setCatalog(ref, a, b, c);

    const r = findEquivalents(ref, 8);
    // shared equal → higher score first (B,C=90 over A=10); B before C by id.
    expect(r.map((p) => p.id)).toEqual(["B", "C", "A"]);
  });

  it("falls back to same-category, different-subcategory candidates after same-subcategory ones", () => {
    const ref = breaker("REF");
    // Same subcategory near-match (shares Amperage = 1).
    const sameSub = breaker("SAMESUB", { volt: "277/480V", poles: "2-Pole" });
    // Same category, DIFFERENT subcategory → sharedNonNegCount uses REF's keys,
    // which this product lacks/derives → 0 shared, so it ranks after sameSub.
    const sameCat = breaker("SAMECAT", {
      subcategory: "Load Centers",
      category: "electrical",
    });
    setCatalog(ref, sameSub, sameCat);

    const r = findEquivalents(ref, 8);
    expect(r.map((p) => p.id)).toEqual(["SAMESUB", "SAMECAT"]);
  });

  it("respects k by truncating the backfill (exact + backfill never exceeds k)", () => {
    const ref = breaker("REF");
    const eqA = breaker("EQ-A"); // 1 exact
    const n1 = breaker("N1", { poles: "2-Pole" });
    const n2 = breaker("N2", { poles: "3-Pole" });
    const n3 = breaker("N3", { amp: "20A" });
    setCatalog(ref, eqA, n1, n2, n3);

    const r = findEquivalents(ref, 2);
    expect(r).toHaveLength(2);
    expect(r[0].id).toBe("EQ-A"); // exact stays first
    expect(r).toHaveLength(2);
  });

  it("returns an empty list when nothing matches the subcategory or category", () => {
    const ref = breaker("REF");
    // Only product is in a completely different category/subcategory.
    const unrelated = breaker("UNREL", {
      subcategory: "Patch Panels",
      category: "datacom",
    });
    setCatalog(ref, unrelated);

    const r = findEquivalents(ref, 8);
    expect(r).toEqual([]);
  });

  it("uses the default k of 8 when none is passed", () => {
    const ref = breaker("REF");
    // 12 same-subcategory near-matches, no true equivalents → backfill caps at 8.
    const pool = Array.from({ length: 12 }, (_, i) =>
      breaker(`N${String(i).padStart(2, "0")}`, {
        poles: "2-Pole",
        score: i, // distinct scores so ordering is deterministic
      }),
    );
    setCatalog(ref, ...pool);

    const r = findEquivalents(ref);
    expect(r).toHaveLength(8);
  });

  it("threads branchId through to the exact + backfill ranking without throwing", () => {
    const ref = breaker("REF");
    const eqA = breaker("EQ-A");
    const near = breaker("NEAR", { poles: "2-Pole", score: 50 });
    setCatalog(ref, eqA, near);

    const r = findEquivalents(ref, 8, "B-HOU-01");
    expect(r.map((p) => p.id)).toEqual(["EQ-A", "NEAR"]);
  });
});
