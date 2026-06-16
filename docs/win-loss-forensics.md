# Win/loss forensics (#15)

Upgrades the dashboard's win/loss card into **deal forensics**. Pure analytics in
`lib/product-finder-forensics.ts` over saved quotes (complements
`product-finder-winloss.ts`, which slices win-rate by margin band).

## Lib (pure, unit-tested)

- `LOST_REASONS` taxonomy + `lostReasonBreakdown(quotes)` — lost quotes by captured reason,
  descending; lost quotes with no/unknown reason bucket into **"Other"** so the mix always sums.
- `cohortWinLoss(quotes, keyOf, minDecided)` — win/loss by an arbitrary cohort key, ranked by
  win-rate (head = where you win, tail = where you lose); `winLossByCustomer()` convenience.

## Surface

A **Deal Forensics** card on the product-finder dashboard (manager/admin Insights):
win-rate by **customer cohort** + the **lost-reason mix**. The customer cohort works immediately
from existing won/lost quotes; the lost-reason mix fills in as reasons are captured.

## Capture

`SavedQuote` gains an optional `lostReason`; the store action `setQuoteLostReason(id, reason)`
records it. (A lost-reason picker on the "mark lost" control is the thin follow-up — the analytics,
taxonomy, capture API, and dashboard surface all ship here.)
