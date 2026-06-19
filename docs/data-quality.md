# Catalog data-quality score — v4-S3 #11

A deterministic **0-100 completeness score per product**, so the catalog team
knows what to enrich and reps know how complete a record is. Pure, $0, in
`lib/catalog/data-quality-score.ts`. It also feeds **#4 semantic search**: richer
spec text → better embeddings → better recall.

## The score

`computeProductQualityScore(product)` weighs six completeness signals (total 100):

| Signal | Max | Notes |
|---|---|---|
| Specifications | 30 | 5+ specs → full marks (6 pts each) |
| Datasheet link | 30 | `specSheetUrl` present |
| Provenance | 20 | verified 20 / curated 12 / simulated 4 |
| Active lifecycle | 10 | obsolescent (EOL/discontinued) → 0 |
| Brand + SKU + name | 10 | core identifiers present |

Tiers: **Excellent** ≥85, **Good** ≥70, **Partial** ≥50, **Incomplete** <50. Each
score carries an explainable `factors[]` and a `missing[]` list of gaps.

`summarizeQuality(products)` rolls the catalog up into an average, a tier
distribution, and the biggest gaps (share of products missing each signal).

## Where it shows

- **Product detail header** — a `⬡ Data {score}` badge (tier-colored); hover for
  the tier and the specific gaps.
- **Manager dashboard** — the `QualityMetricsCard`: average score, tier mix bar,
  and top gaps. Served by `GET /api/catalog/quality-summary` (auth-gated,
  rate-limited; the summary is computed once and cached on the process).

## Notes
- Pure function of immutable `CatalogProduct` fields — no RNG, no external call.
- Mirrors the `coverage-score.ts` grading pattern.
- No 3rd-party account or env var required.
