# Deterministic engines (v3 Sprint 3)

Four deterministic, **$0** engines over shipped pricing / compliance / search /
BOM surfaces. Sprint 3 of the third top-20 ([docs/roadmap-next20-v3.md](roadmap-next20-v3.md)).
No new external calls in the default path; no new bundle weight (First Load JS
held at 103 kB).

## #9 — SPA / rebate claim-back (margin leakage)

`lib/product-finder-spa.ts` is a pure rule engine over the standard distributor
cost model. Each manufacturer SPA carries a rebate %; a won-quote line's
**claim-back = standard cost (`estimatedUnitCost`) × rebatePct × qty**.
`spaClaimbacks(wonQuotes)` aggregates the unclaimed total + a per-manufacturer
breakdown. A customer-scoped SPA beats the brand rule for that customer.

`SpaClaimbackCard` (manager dashboard, role-gated) surfaces the total unclaimed
dollars with a per-manufacturer list and a **claim-file CSV export**. Hidden when
nothing is claimable. Internal cost never appears on a customer artifact.

## #14 — Tariff-aware landed cost

`lib/catalog/tariff.ts` is a static USTR **Section-301** rate table keyed off the
HTS code + country-of-origin that compliance already enriches. Duty applies only
to **Section-301-exposed (China-origin)** lines; `tariffForLine` returns
`dutyPerUnit = unitPrice × rate`. `/api/bom/analyze` now returns a `tariff` block
per row (rate, program, duty/unit, **tariff-adjusted landed unit** = current
landed + duty) plus an exposure rollup, rendered in the BOM Intelligence modal.
(Section 232 isn't modeled — the synthetic HTS codes are all chapters 84/85/65.)

## #18 — Hybrid search + RRF fusion

`lib/catalog/rrf.ts` `reciprocalRankFusion(lists, {k})` blends ranked lists by
Σ 1/(k + rank) — rank-only, deterministic, **$0**. For a relevance + text query,
`searchCatalog` fuses a **keyword lane** (weighted term hits) with a **fuzzy lane**
(`matchConfidence` token coverage) → better relevance for paraphrase/partial
queries (bounded by `HYBRID_FUZZY_CAP` for very broad matches).

The standalone `/api/rerank` Cohere seam finally gets a caller: the search route
optionally reranks the shown page **when `COHERE_API_KEY` is set** — **dormant /
$0 by default** (no key ⇒ no network, the RRF order stands), capped to the page,
fail-soft. Per the cost guardrail, the metered rerank only runs when you provision
the key.

## #15 — Plan-takeoff import → BOM

`lib/product-finder-takeoff.ts` ingests an estimating / Bluebeam "Quantity Link"
**CSV** (Description + Count columns, optional CSI code), quoted-comma-safe with
flexible header detection, and maps each row to the shipped fuzzy-match +
confidence pipeline (`matchBomScored`) + BOM Health. No PDF parsing — it meets
contractors at the CSV they already export. The BOM import modal **auto-detects**
a takeoff CSV (`isLikelyTakeoffCsv`) and routes it through the takeoff parser;
plain pastes use the line parser.

## Tests

Pure cores unit-tested (`product-finder-spa`, `catalog/tariff`, `catalog/rrf`,
`product-finder-takeoff`); existing search/URL suites still green. Full suite at
1720 tests.
