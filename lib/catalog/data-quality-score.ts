/**
 * Per-product catalog data-quality score (v4-S3 #11) — pure, deterministic, $0.
 *
 * Distributors live or die on catalog completeness: a part with no specs, no
 * datasheet, and thin provenance is hard to search, quote, and trust. This grades
 * each product 0-100 from the fields it actually carries, mirroring the
 * coverage-score gradeSourcing pattern (count/flags → grade + explainable
 * factors). It is the data-hygiene layer that ALSO feeds #4 semantic search:
 * richer spec text → better embedding chunks → better recall.
 *
 * No RNG, no external call — a pure function of immutable CatalogProduct fields.
 */

import type { CatalogProduct } from "@/features/product-finder/types";
import { isObsolescent } from "@/lib/catalog/lifecycle";

export type QualityTier = "excellent" | "good" | "partial" | "incomplete";

export interface QualityFactor {
  key: string;
  label: string;
  points: number;
  max: number;
  ok: boolean;
}

export interface ProductQualityScore {
  /** 0-100. */
  score: number;
  tier: QualityTier;
  factors: QualityFactor[];
  /** Human labels of the gaps (factors that didn't earn full points). */
  missing: string[];
}

/** Weights sum to 100. */
const SPEC_MAX = 30;
const DATASHEET_MAX = 30;
const PROVENANCE_MAX = 20;
const LIFECYCLE_MAX = 10;
const IDENTIFIER_MAX = 10;

/** Provenance points: a verified/link-checked part is worth more than a simulated one. */
const PROVENANCE_POINTS: Record<NonNullable<CatalogProduct["dataSource"]> | "unknown", number> = {
  verified: PROVENANCE_MAX,
  curated: 12,
  simulated: 4,
  unknown: 0,
};

export function tierFor(score: number): QualityTier {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "partial";
  return "incomplete";
}

export const TIER_LABEL: Record<QualityTier, string> = {
  excellent: "Excellent",
  good: "Good",
  partial: "Partial",
  incomplete: "Incomplete",
};

export const TIER_COLOR: Record<QualityTier, string> = {
  excellent: "#00AA13",
  good: "#00573F",
  partial: "#EAAA00",
  incomplete: "#DB6B30",
};

/**
 * Compute a product's data-quality score from six completeness signals:
 * spec richness, datasheet link, provenance tier, lifecycle freshness, and
 * identifier presence. Deterministic + explainable.
 */
export function computeProductQualityScore(product: CatalogProduct): ProductQualityScore {
  const specCount = product.specs?.length ?? 0;
  const specPoints = Math.min(SPEC_MAX, specCount * 6); // 5+ specs → full marks

  const hasDatasheet = Boolean(product.specSheetUrl && product.specSheetUrl.trim());
  const datasheetPoints = hasDatasheet ? DATASHEET_MAX : 0;

  // `?? 0` guards against an out-of-enum dataSource ever slipping in (NaN-proof).
  const provenancePoints = PROVENANCE_POINTS[product.dataSource ?? "unknown"] ?? 0;

  const active = !isObsolescent(product.lifecycleStatus);
  const lifecyclePoints = active ? LIFECYCLE_MAX : 0;

  const hasIdentifier = Boolean(product.sku && product.brand && product.name);
  const identifierPoints = hasIdentifier ? IDENTIFIER_MAX : 0;

  const factors: QualityFactor[] = [
    { key: "specs", label: `Specifications (${specCount})`, points: specPoints, max: SPEC_MAX, ok: specPoints >= SPEC_MAX },
    { key: "datasheet", label: "Datasheet link", points: datasheetPoints, max: DATASHEET_MAX, ok: hasDatasheet },
    { key: "provenance", label: `Provenance (${product.dataSource ?? "unknown"})`, points: provenancePoints, max: PROVENANCE_MAX, ok: provenancePoints >= PROVENANCE_MAX },
    { key: "lifecycle", label: "Active lifecycle", points: lifecyclePoints, max: LIFECYCLE_MAX, ok: active },
    { key: "identifier", label: "Brand + SKU + name", points: identifierPoints, max: IDENTIFIER_MAX, ok: hasIdentifier },
  ];

  const score = factors.reduce((s, f) => s + f.points, 0);
  const missing = factors.filter((f) => !f.ok).map((f) => f.label);

  return { score, tier: tierFor(score), factors, missing };
}

export interface CatalogQualitySummary {
  count: number;
  averageScore: number;
  byTier: Record<QualityTier, number>;
  /** Share of products missing each signal (0..1), worst first. */
  topGaps: { key: string; label: string; missingPct: number }[];
}

/** Roll per-product scores into a catalog-level summary (for the dashboard card). */
export function summarizeQuality(products: CatalogProduct[]): CatalogQualitySummary {
  const byTier: Record<QualityTier, number> = { excellent: 0, good: 0, partial: 0, incomplete: 0 };
  const gapCounts = new Map<string, { label: string; n: number }>();
  let total = 0;

  for (const p of products) {
    const q = computeProductQualityScore(p);
    total += q.score;
    byTier[q.tier] += 1;
    for (const f of q.factors) {
      if (f.ok) continue;
      // Strip only a single trailing "(…)" count suffix (non-greedy, no internal parens).
      const cur = gapCounts.get(f.key) ?? { label: f.label.replace(/\s*\([^)]*\)$/, ""), n: 0 };
      cur.n += 1;
      gapCounts.set(f.key, cur);
    }
  }

  const count = products.length;
  const topGaps = [...gapCounts.entries()]
    .map(([key, v]) => ({ key, label: v.label, missingPct: count ? v.n / count : 0 }))
    .sort((a, b) => b.missingPct - a.missingPct);

  return {
    count,
    averageScore: count ? Math.round(total / count) : 0,
    byTier,
    topGaps,
  };
}
