# Rep scorecard dashboard — #18

A manager-facing table that turns the quotes already in the workspace into per-rep
performance metrics. **Pure, deterministic, $0** — no external calls, no model.

## `lib/product-finder-rep-scorecard.ts`

```ts
repScorecard(quotes: ScorecardQuote[]): RepStat[]
```

Groups quotes by `rep` and computes, per rep:

| Metric | Definition | Empty-case |
|---|---|---|
| `volume` | count of quotes | — |
| `won` | quotes with status `won` | — |
| `winRate` | won ÷ **decided** (won + lost) | `null` when none decided |
| `avgMarginPct` | mean margin of quotes that carry a margin | `null` when none |
| `crossSellAttachPct` | share of quotes spanning **>1 product category** | — |
| `avgCycleDays` | mean days from `createdAt`→`convertedAt` for won quotes | `null` when no won |

Undecided quotes are excluded from `winRate` (not counted as losses). Metrics that
can't be computed return **`null`, never `NaN`**. Sorted by `volume` desc, then
`winRate` desc.

## UI

`features/product-finder/RepScorecardCard.tsx` reads `quotes` from the store, maps
each to a `ScorecardQuote` (rep = first audit-event actor, line categories from
the product), and renders the table on the dashboard after the coverage-gaps card.
It is **hidden when there are no quotes**, so a fresh workspace shows nothing
rather than an empty shell.

## Tests

`lib/product-finder-rep-scorecard.test.ts` covers per-rep metric math, the
`null`-not-`NaN` guarantee, and sort order.
