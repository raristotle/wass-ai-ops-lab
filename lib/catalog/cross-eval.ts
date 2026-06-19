/**
 * Cross-reference / substitute ranking evaluation (DI-12) — an OFFLINE quality
 * harness, $0 and no fabricated data.
 *
 * Goal: put a measured number on how well the SIMULATED spec-similarity engine
 * (`functionalEquivalents`, the $0 heuristic behind "Find Alternatives") reproduces
 * the SOURCE-BACKED ground truth (the 200 verified cross pairs in
 * data/real/verified-crosses.ts, each citing a manufacturer/distributor cross
 * document). For every documented pair A↔B that we actually stock on both sides,
 * we ask: when a rep looks for alternatives to A, does the engine surface the
 * documented substitute B — and how highly does it rank it?
 *
 * Why our own verified crosses rather than the backlog's suggested "Amazon ESCI"
 * set: ESCI labels (QUERY, product) relevance (Exact/Substitute/Complement/
 * Irrelevant), not (product, product) substitutability, and it is general
 * e-commerce, not electrical parts — the wrong shape for a product-to-product
 * substitute eval. Our verified-cross dataset IS product-to-product, electrical,
 * and citation-backed, so it is the honest ground truth. (See the eval doc.)
 *
 * The metrics (recall@K, precision@1, MRR) and the per-subcategory misses are the
 * actionable output: a miss usually means the stocked records disagree on a
 * canonical spec, which points the catalog-data team at exactly what to enrich —
 * the same lever as the data-quality score (#11).
 *
 * Pure + deterministic (the catalog generator is seeded), so the sibling test can
 * assert a floor as a regression guard.
 */

import { VERIFIED_CROSS_ENTRIES } from "@/data/real/verified-crosses";
import type { CrossRelation } from "@/lib/catalog/verified-crosses";
import { resolveStocked } from "@/lib/catalog/cross-runtime";
import { functionalEquivalents } from "@/lib/catalog/equivalence";
import { getCatalog } from "@/lib/catalog/index";
import type { CatalogProduct } from "@/features/product-finder/types";

/** How deep we read the ranking when locating the documented substitute. */
export const EVAL_DEPTH = 50;
/** The "top-K" recall is measured at this rank. */
export const EVAL_K = 10;

export interface CrossEvalCase {
  aSku: string;
  bSku: string;
  subcategory: string;
  relation: CrossRelation;
}

export type SkipReason = "a-unresolved" | "b-unresolved" | "same-product" | "different-subcategory";

export interface CrossEvalSkip {
  aBrand: string;
  aMpn: string;
  bBrand: string;
  bMpn: string;
  reason: SkipReason;
}

/**
 * Resolve every documented pair to stocked catalog products and keep the ones that
 * are genuinely evaluable: both sides stocked, distinct products, and in the same
 * subcategory (the spec-similarity engine only ever returns same-subcategory
 * candidates, so a cross-subcategory documented pair is out of its scope). Skips
 * are returned with a reason for an honest coverage denominator.
 */
export function buildEvalCases(): { cases: CrossEvalCase[]; skipped: CrossEvalSkip[] } {
  const cases: CrossEvalCase[] = [];
  const skipped: CrossEvalSkip[] = [];
  for (const e of VERIFIED_CROSS_ENTRIES) {
    const a = resolveStocked(e.aBrand, e.aMpn);
    const b = resolveStocked(e.bBrand, e.bMpn);
    const base = { aBrand: e.aBrand, aMpn: e.aMpn, bBrand: e.bBrand, bMpn: e.bMpn };
    if (!a) {
      skipped.push({ ...base, reason: "a-unresolved" });
      continue;
    }
    if (!b) {
      skipped.push({ ...base, reason: "b-unresolved" });
      continue;
    }
    if (a.id === b.id) {
      skipped.push({ ...base, reason: "same-product" });
      continue;
    }
    if (a.subcategory !== b.subcategory) {
      skipped.push({ ...base, reason: "different-subcategory" });
      continue;
    }
    cases.push({ aSku: a.sku, bSku: b.sku, subcategory: a.subcategory, relation: e.relation });
  }
  return { cases, skipped };
}

// Lazy SKU→product index over the (deterministic) catalog; the eval cases store SKUs.
let _bySku: Map<string, CatalogProduct> | null = null;
function productBySku(sku: string): CatalogProduct | null {
  if (!_bySku) _bySku = new Map(getCatalog().products.map((p) => [p.sku, p]));
  return _bySku.get(sku) ?? null;
}

/**
 * Rank of the documented substitute `bSku` in the alternatives the engine returns
 * for `aSku`, excluding the reference product itself. Returns 0 when the engine
 * doesn't surface it within EVAL_DEPTH (a recall miss). 1-based.
 */
function rankOfSubstitute(aSku: string, bSku: string): number {
  const reference = productBySku(aSku);
  if (!reference) return 0;
  const ranked = functionalEquivalents(reference, EVAL_DEPTH).filter((p) => p.id !== reference.id);
  const idx = ranked.findIndex((p) => p.sku === bSku);
  return idx === -1 ? 0 : idx + 1;
}

export interface SubcategoryEval {
  subcategory: string;
  evaluable: number;
  found: number;
  recallAtK: number;
}

export interface CrossEvalReport {
  totalPairs: number;
  evaluablePairs: number;
  /** Coverage = evaluablePairs / totalPairs. */
  coverage: number;
  k: number;
  depth: number;
  /** Documented substitute found within top-K. */
  recallAtK: number;
  /** Documented substitute ranked #1 among alternatives. */
  precisionAt1: number;
  /** Mean reciprocal rank (0 for misses, capped at depth). */
  mrr: number;
  bySubcategory: SubcategoryEval[];
  /** Cases where the documented substitute fell outside top-K — the enrichment to-do. */
  misses: { aSku: string; bSku: string; subcategory: string; rank: number }[];
  skippedByReason: Record<SkipReason, number>;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Run the evaluation. `k` is the recall cutoff (default EVAL_K). Deterministic:
 * same catalog seed + same ground truth → same numbers, so a test can pin a floor.
 */
export function evaluateCrossReference(k = EVAL_K): CrossEvalReport {
  const { cases, skipped } = buildEvalCases();
  const bySub = new Map<string, { evaluable: number; found: number }>();
  const misses: CrossEvalReport["misses"] = [];
  let foundAtK = 0;
  let exactlyFirst = 0;
  let reciprocalSum = 0;

  for (const c of cases) {
    const rank = rankOfSubstitute(c.aSku, c.bSku);
    const sub = bySub.get(c.subcategory) ?? { evaluable: 0, found: 0 };
    sub.evaluable += 1;
    const within = rank > 0 && rank <= k;
    if (within) {
      foundAtK += 1;
      sub.found += 1;
    } else {
      misses.push({ aSku: c.aSku, bSku: c.bSku, subcategory: c.subcategory, rank });
    }
    if (rank === 1) exactlyFirst += 1;
    if (rank > 0) reciprocalSum += 1 / rank;
    bySub.set(c.subcategory, sub);
  }

  const n = cases.length;
  const skippedByReason: Record<SkipReason, number> = {
    "a-unresolved": 0,
    "b-unresolved": 0,
    "same-product": 0,
    "different-subcategory": 0,
  };
  for (const s of skipped) skippedByReason[s.reason] += 1;

  return {
    totalPairs: VERIFIED_CROSS_ENTRIES.length,
    evaluablePairs: n,
    coverage: round3(n / VERIFIED_CROSS_ENTRIES.length),
    k,
    depth: EVAL_DEPTH,
    recallAtK: n ? round3(foundAtK / n) : 0,
    precisionAt1: n ? round3(exactlyFirst / n) : 0,
    mrr: n ? round3(reciprocalSum / n) : 0,
    bySubcategory: [...bySub.entries()]
      .map(([subcategory, v]) => ({
        subcategory,
        evaluable: v.evaluable,
        found: v.found,
        recallAtK: round3(v.found / v.evaluable),
      }))
      .sort((x, y) => y.evaluable - x.evaluable),
    misses,
    skippedByReason,
  };
}

/** A compact human-readable summary (used by the eval test's console report). */
export function formatEvalReport(r: CrossEvalReport): string {
  const lines = [
    `Cross-reference eval — ${r.evaluablePairs}/${r.totalPairs} pairs evaluable (coverage ${(r.coverage * 100).toFixed(1)}%)`,
    `  recall@${r.k}=${(r.recallAtK * 100).toFixed(1)}%  precision@1=${(r.precisionAt1 * 100).toFixed(1)}%  MRR=${r.mrr.toFixed(3)}  (depth ${r.depth})`,
    `  skipped: a-unresolved=${r.skippedByReason["a-unresolved"]} b-unresolved=${r.skippedByReason["b-unresolved"]} same-product=${r.skippedByReason["same-product"]} diff-subcat=${r.skippedByReason["different-subcategory"]}`,
  ];
  for (const s of r.bySubcategory) {
    lines.push(`    ${s.subcategory}: ${s.found}/${s.evaluable} recall@${r.k}=${(s.recallAtK * 100).toFixed(0)}%`);
  }
  return lines.join("\n");
}
