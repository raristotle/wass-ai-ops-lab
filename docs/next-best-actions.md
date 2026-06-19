# Rep next-best-action / coaching — v4-S2 #8

A single, ranked **"what to do next"** list on the manager dashboard, composed
deterministically from the analytics the app already ships. **$0, no model
calls.** Pure engine in `lib/product-finder-next-best-actions.ts`; surfaced by
`NextBestActionCard`.

## What it surfaces (ranked)

`nextBestActions({ quotes, orders, customers, now })` merges these rules and sorts
by `(priority desc, value desc)`:

| Rank | Action | Source |
|---|---|---|
| 100 | Answer a counter-offer | `quotePipeline().countered` |
| 90 | Approve / escalate a below-margin quote | `quotePipeline().needsApproval` |
| 80 | Follow up on a stale quote (>14 days) | `quotePipeline().stale` |
| 70 | Re-engage an at-risk account | `allCustomerHealth()` (status `at-risk`) |
| 60 | File unclaimed SPA rebates | `spaClaimbacks()` |
| 40 | Stock ahead of rising demand | `demandForecast()` (trend `up`) |
| 30 | Seasonal merchandising push | `seasonalEvent()` |

Because it only composes existing **pure** analytics (with `now` injected, never
reading the clock itself), it can never disagree with the dashboard cards below
it. Each action carries a `target` that the card turns into a deep link — the
quote list filtered by status, the account's orders, or a search.

## UI

`NextBestActionCard` renders at the top of the dashboard (most actionable thing
first). It hides when the only candidate is the always-on seasonal nudge, so it
never shows an empty/low-value card. Per-kind inner caps keep one noisy signal
from crowding out the rest; the overall list is capped at 12.

## Tests

`lib/product-finder-next-best-actions.test.ts` covers each rule independently plus
the cross-kind ranking and the limit.

No 3rd-party account or env var is required.
