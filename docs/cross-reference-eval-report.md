# Cross-reference / substitute ranking — offline evaluation (DI-12)

A **measured** quality number for the $0 spec-similarity engine that powers "Find
Alternatives," graded against our **source-cited ground truth**. No fabricated data,
no external dataset, no cost. Lives in [cross-eval.ts](../lib/catalog/cross-eval.ts);
regenerate any time with:

```
npx vitest run lib/catalog/cross-eval.test.ts
```

(The catalog generator is seeded, so the numbers are deterministic.)

## What is measured

- **Engine under test:** `functionalEquivalents` — the simulated spec-similarity
  ranker (same subcategory + identical canonical key specs → sorted by preferred /
  stock / price). This is the **$0 heuristic** a rep sees when there is no documented
  cross.
- **Ground truth:** the **200 verified cross pairs** in
  [verified-crosses.ts](../data/real/verified-crosses.ts), each citing a
  manufacturer / distributor / industry cross document (link-verified at research
  time). These are real, electrical, **product-to-product** substitutes.
- **The question:** hide the documented answer; when a rep asks for alternatives to
  part A, does the heuristic independently surface the documented substitute B — and
  how highly does it rank it?

### Why not Amazon ESCI
The backlog suggested the Amazon ESCI dataset as ground truth. After verifying it:
ESCI labels **(query, product)** relevance (Exact / **Substitute** / Complement /
Irrelevant), not **(product, product)** substitutability, and it is general
e-commerce, not electrical parts. That is the wrong shape for a product-to-product
substitute eval, so using it would be misleading. Our verified-cross dataset is the
honest fit, and it is already cited and electrical.

## Measured result (2026-06-19)

| Metric | Value | Meaning |
|---|---|---|
| Documented pairs | 200 | total cited crosses |
| **Evaluable pairs** | **28** (14.0% coverage) | both sides stocked, same subcategory, distinct |
| **recall@10** | **39.3%** | documented substitute appears in the engine's top-10 |
| **precision@1** | **25.0%** | documented substitute is ranked #1 among alternatives |
| **MRR** | **0.321** | mean reciprocal rank (depth 50) |

**Coverage accounting** (honest denominator): of the 200 pairs, 117 had the A-side
not stocked, 53 had the B-side not stocked, and 2 crossed subcategories — those are
out of scope for a same-subcategory spec engine, leaving **28 genuinely evaluable**.
Low coverage is expected: the cited crosses reference real manufacturer MPNs, and we
only stock a subset of them on both sides.

### By subcategory (where the engine agrees vs. needs work)

| Subcategory | Found / evaluable | recall@10 |
|---|---|---|
| Industrial Plugs & Receptacles | 2 / 2 | 100% |
| Circuit Breakers | 1 / 1 | 100% |
| Fuses | 7 / 11 | 64% |
| Enclosures | 1 / 5 | 20% |
| Cord Plugs & Connectors | 0 / 5 | 0% |
| Contactors | 0 / 2 | 0% |
| Ethernet Cable | 0 / 1 | 0% |
| Grounding & Bonding | 0 / 1 | 0% |

## How to read this — and what to do with it

This is **not** the number a rep experiences end-to-end: production "Find
Alternatives" surfaces the **documented** cross first (exact, cited) and only falls
back to this heuristic when no cited cross exists. The eval deliberately grades the
**fallback heuristic alone** against the gold standard.

A **miss** almost always means the two stocked records disagree on a *canonical key
spec* (e.g. a plug's NEMA configuration, an enclosure's NEMA type), so
`isFunctionalEquivalent` filters the true substitute out. That is precisely the
**enrichment to-do**: the 0%–20% subcategories above (Cord Plugs, Enclosures,
Contactors) are where the catalog-data team should normalize specs — the same lever
the [data-quality score](data-quality.md) (#11) exposes. Re-running the eval after an
enrichment pass turns the recall delta into a measured win.

## Regression guard

[cross-eval.test.ts](../lib/catalog/cross-eval.test.ts) asserts the metrics are valid
fractions, that per-subcategory counts reconcile with the totals, and a conservative
**recall floor (≥ 0.30)** below the measured 0.393 — so an engine change or spec-data
rot that drops recall trips the suite, while routine catalog tweaks don't flake it.
