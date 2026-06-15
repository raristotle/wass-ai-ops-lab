/**
 * Second-source / multi-sourcing coverage score — reframes the cross-reference
 * engine the app already has as a SINGLE-SOURCE RISK metric. SiliconExpert,
 * Z2Data, and Arrow all sell "how many sources can fulfill this part"; here a
 * part's distinct STOCKED interchangeable sources (true functional equivalents +
 * documented verified crosses we stock, plus the part itself) grade it 1–5.
 *
 * `gradeSourcing` is pure (count → grade) and fully unit-tested; the
 * catalog-backed `sourcingForProduct` reuses the built equivalence + verified-
 * cross engines, and `bomSourcing` rolls a basket up to a single risk summary.
 */

import type { CatalogProduct } from "@/features/product-finder/types";
import { functionalEquivalents } from "@/lib/catalog/equivalence";
import { verifiedCrossesFor } from "@/lib/catalog/verified-crosses";
import { resolvedCrossEntries, resolveStocked } from "@/lib/catalog/cross-runtime";

export type SourcingRisk = "high" | "moderate" | "low";

export interface SourcingGrade {
  /** Distinct stocked sources that can fulfill the part (incl. the part itself). */
  sources: number;
  /** 1 (single-source) … 5 (broadly sourced). */
  score: 1 | 2 | 3 | 4 | 5;
  label: string;
  risk: SourcingRisk;
  blurb: string;
}

/** Pure: map a distinct-stocked-source count to a 1–5 grade. */
export function gradeSourcing(sources: number): SourcingGrade {
  const n = Math.max(0, Math.floor(sources));
  let score: SourcingGrade["score"];
  let label: string;
  let risk: SourcingRisk;
  if (n <= 1) {
    score = 1;
    label = "Single-source";
    risk = "high";
  } else if (n === 2) {
    score = 2;
    label = "Dual-source";
    risk = "moderate";
  } else if (n === 3) {
    score = 3;
    label = "Multi-source";
    risk = "low";
  } else if (n === 4) {
    score = 4;
    label = "Well-sourced";
    risk = "low";
  } else {
    score = 5;
    label = "Broadly sourced";
    risk = "low";
  }
  const blurb =
    n <= 1
      ? "Only one stocked source — single-source risk; no interchangeable backup if it goes short."
      : `${n} interchangeable stocked sources — ${risk === "low" ? "low" : "moderate"} single-source risk.`;
  return { sources: n, score, label, risk, blurb };
}

function isStocked(p: CatalogProduct): boolean {
  return p.branchStock.some((b) => b.quantity > 0) || p.dcStock.some((d) => d.quantity > 0);
}

/**
 * Coverage grade for one product: counts the distinct STOCKED sources that can
 * fulfill it — the part itself (if stocked), true functional equivalents, and
 * production-grade documented verified crosses we stock — deduped by id.
 */
export function sourcingForProduct(product: CatalogProduct, branchId?: string): SourcingGrade {
  const ids = new Set<string>();
  if (isStocked(product)) ids.add(product.id);

  for (const e of functionalEquivalents(product, 50, branchId)) {
    if (isStocked(e)) ids.add(e.id);
  }

  for (const c of verifiedCrossesFor(product, resolvedCrossEntries(), resolveStocked)) {
    if (c.substituteProduct && isStocked(c.substituteProduct)) ids.add(c.substituteProduct.id);
  }

  return gradeSourcing(ids.size);
}

export interface BomSourcing {
  lines: number;
  singleSourced: number;
  worst: SourcingRisk;
  averageScore: number;
}

/** Roll a set of per-line grades up into a BOM-level sourcing summary. */
export function bomSourcing(grades: SourcingGrade[]): BomSourcing {
  if (grades.length === 0) {
    return { lines: 0, singleSourced: 0, worst: "low", averageScore: 0 };
  }
  const singleSourced = grades.filter((g) => g.score <= 1).length;
  const worst: SourcingRisk = grades.some((g) => g.risk === "high")
    ? "high"
    : grades.some((g) => g.risk === "moderate")
      ? "moderate"
      : "low";
  const averageScore =
    Math.round((grades.reduce((s, g) => s + g.score, 0) / grades.length) * 10) / 10;
  return { lines: grades.length, singleSourced, worst, averageScore };
}
