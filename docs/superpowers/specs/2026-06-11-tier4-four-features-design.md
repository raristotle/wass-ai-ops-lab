# Tier 4 — Four-Feature Update (next-20 items 5, 6, 7, 9) — Design

**Date:** 2026-06-11
**Status:** Approved (user directed: "Continue development" — next ranked items)
**Area:** `features/product-finder/`, `lib/`, `apps/web/app/product-finder/`

Build order: F6 terms/notes → F5 audit trail → F9 revisions (logs into the
trail; completes the counter-offer loop) → F7 seasonal rail → docs → gate →
live verify → single deploy. Pure modules TDD'd, injected `now`, no new $.

---

## F6 — Quote notes & terms blocks

- `lib/product-finder-terms.ts` (pure, tested): `TERMS_BLOCKS` — selectable
  boilerplate (freight, returns, payment, escalation) with id/label/text;
  `resolveTerms(ids)` → texts (unknown ids dropped, stable order).
- CartDrawer quote sheet: a **note** textarea (persisted `pf_quote_note`,
  like customer/project) + terms checkboxes (persisted `pf_quote_terms`).
  Both print on the quote sheet.
- `SavedQuote` gains `note?: string; termsIds?: string[]` captured at save.
- Quote share payload (v1, optional fields): `note?`, `terms?: string[]`
  (resolved texts baked in) — rendered on the acceptance page.

## F5 — Quote audit trail

- `lib/product-finder-quote-events.ts` (pure, tested): `QuoteEvent
  { at, kind, detail, actor? }`, kinds: created · status · approval ·
  counter · converted · link-copied · revised; icon/label maps;
  `appendEvent(events, event)` (cap 50).
- `SavedQuote.events?: QuoteEvent[]`. Store actions append with the active
  user as actor: saveQuote (created, + approval-pending), setQuoteStatus,
  setQuoteApproval, convertQuoteToOrder, counterQuote ("Customer"),
  reviseQuote chain; CartDrawer's Customer Link copy logs link-copied via
  `logQuoteLink(id)`.
- UI: expandable **History** `<details>` per saved-quote row (icon + label +
  detail + date). Seeded demo quotes carry created/decided events.

## F9 — Quote revisions

- `SavedQuote` gains `revision?: number` (absent = v1), `revisionOf?: string`,
  `supersededBy?: string`.
- Store: `revisingQuoteId: string | null`; `startReviseQuote(id)` — loads the
  quote's lines into the basket (clearing overrides), pre-fills customer/
  project, flags the revising banner; replace-cart actions and `clearCart`
  cancel it. `saveQuote` consumes the flag: new quote gets `revision: n+1`,
  `revisionOf`; the old quote gets `supersededBy` + a "superseded" event.
  Refused for converted/won quotes.
- Pipeline & alerts: superseded quotes drop out of open value, byStatus
  counts, stale and countered lists (a decided superseded quote still counts
  for win/loss history). `isSuperseded(q)` helper in the quotes lib.
- Acceptance page: a superseded local quote shows "this quote has been
  revised — ask for the latest link"; all actions disabled.
- UI: **Revise** button per row (hidden for converted/superseded); **v2**
  badge on revisions, "superseded by vN" note on old versions; basket banner
  "Revising Q-X — Save Quote creates v(n+1)" with cancel.

## F7 — Seasonal merchandising rail

- `lib/product-finder-seasonal.ts` (pure, tested): 4 curated events (storm
  prep, summer heat/PPE, construction kickoff, datacom refresh), each with
  icon/title/blurb + 3 quick-search picks; `seasonalEvent(now)` rotates
  deterministically by epoch-week. Pick queries live-verified non-zero
  against the catalog (job-wizard lesson).
- `SeasonalRail.tsx` under the commodity strip on the landing view: compact
  banner, pick chips run `runNlSearch`; "simulated signal" label.

## Docs

Help topics: quote-revisions, audit-trail, quote-terms, seasonal (+ test
ids). features.md rows. Demo-script beats appended to the Tier 3 sidecar
(main script still Word-locked). Tour unchanged (refreshed in Tier 3).

## Out of scope

Real weather/NWS feed (simulated rotation only); editing past revisions;
event log for orders/baskets; server persistence.
