# Recommendation engine — also-bought + substitution optimizer

Pure, count-based collaborative filtering + a margin/availability-protecting
substitution optimizer over the order history the store already holds — **no vendor,
no model, no network**. Lives in `lib/product-finder-recommendations.ts` and is fully
unit-tested.

## `alsoBought(orders, productId, { excludeIds, k })`

"Customers who ordered X also ordered…" — for every order containing the seed product,
tallies the OTHER distinct products in that order and ranks by co-occurrence (each
product counted at most once per order). Surfaced in the **For-You rail** as
"Frequently ordered together" (data-driven), which now takes precedence over the curated
"Goes well with your orders" cross-sell and falls back to it when the order history
doesn't yet support a co-occurrence result.

## `optimizeSubstitution(candidates, branchStockOf, k)`

Ranks substitute candidates (alternatives / source-backed crosses) to protect
availability and margin: **in-stock first, then preferred-line** (better terms/margin),
then lower price — each with best-first `reasons`. Complements the price-based
"substitute & save" flow with an availability + margin lens.

Both functions are pure and covered by `lib/product-finder-recommendations.test.ts`.
