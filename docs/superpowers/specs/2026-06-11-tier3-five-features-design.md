# Tier 3 — Five-Feature Update (next-20 items 1, 2, 3, 4, 8) — Design

**Date:** 2026-06-11
**Status:** Approved (user directed: "Add 1, 2, 3, 4, and 8 to production")
**Area:** `features/product-finder/`, `lib/`, `apps/web/app/product-finder/`

Build order: commodity index → win/loss insights → customer health →
counter-offer → demo quote seeds → Job Wizard → dashboard cards → tour/help/
docs/demo script → gate → live verify → deploy. All pure modules TDD'd with
injected `now`; no new runtime $ (everything deterministic/simulated; the LLM
variant of Ask Meridian stays deferred pending key approval).

---

## F1 — Win/loss pricing insights

- `lib/product-finder-winloss.ts` (pure, tested):
  - `MARGIN_BANDS` — <15%, 15–20%, 20–25%, 25–30%, 30%+.
  - `bandFor(marginPct)` → band label.
  - `winLossByBand(quotes)` → per-band { won, lost, decided, winRate } over
    decided quotes that captured `marginPct`.
  - `marginGuidance(quotes, currentMarginPct)` → message comparing the current
    basket's band win rate vs overall (null when < MIN_DECIDED samples).
- Cart: a one-line guidance note under the internal basket-margin row
  ("Quotes in this 15–20% band historically win 75% (n=4) — simulated history").
- Insights: "Pricing Win/Loss" card — band table (won/lost/win rate) + avg
  margin of won vs lost + the guidance line.

## F2 — Counter-offer ("Request changes")

- `SavedQuote.counterOffer?: { note: string; at: number }` (status stays
  `sent` — still in play; no QuoteStatus change).
- Store action `counterQuote(id, note, now?)`; persists to `pf_quotes`.
- Acceptance page: third action **Request changes** → note textarea → submit.
  Same browser → store action; foreign browser → recorded in
  `pf_quote_acceptances` as `{ status: "countered", note }`. Banner state.
- CartDrawer quote row: amber **COUNTERED** badge + the note inline.
- Notifications: new kind `counter` (all roles) — "Counter-offer on Q-X" with
  note excerpt; `at = counterOffer.at`.
- Pipeline lib: `countered: SavedQuote[]` + dashboard alert row (mirrors stale).

## F3 — Customer health scores

- `lib/product-finder-customer-health.ts` (pure, tested):
  - `customerHealth(orders, customerId, now)` → { orderCount, lastOrderAt,
    avgIntervalDays, daysSinceLast, status, message }.
  - Status rules: no orders → `new`; 1 order → baseline 45 days (≤ healthy,
    ≤ 2× watch, > 2× at-risk); 2+ orders → avg interval between orders
    (≤ 1.25× healthy, ≤ 2× watch, > 2× at-risk).
  - `allCustomerHealth(orders, customers, now)` — at-risk first.
- UI: status dot + label beside the "Quoting for" selector for the active
  customer (tooltip = message); Insights "Customer Health" panel (status,
  message, last order, one-click select+orders drill-through); notifications
  kind `customer-risk` for at-risk customers.
- Seeded demo orders already produce a healthy (CUST-001, last 5d, interval
  ~30d) and an at-risk (CUST-002, single order 70d ago) example.

## F4 — Commodity index strip

- `lib/product-finder-commodity.ts` (pure, tested): deterministic simulated
  daily index — seeded random walk from a stable hash of the epoch-day, no
  Date.now inside. `commodityIndex(now)` → entries for **Copper** ($/lb,
  base ~4.20) and **Aluminum** ($/lb, base ~1.30): { price, change30d,
  trend up/down/flat }. Same value for the whole day, every browser.
- `CommodityStrip.tsx` on the landing view (above the For-you rail): compact
  strip with per-metal price + 30-day arrow, a wire-&-cable nudge when copper
  trends up ("quote now to lock 30-day validity"), and a "simulated index"
  label.
- Quote sheet + acceptance page footer line: "Pricing as of <date> commodity
  index." (advisory only — product pricing itself stays deterministic).

## F8 — Ask Meridian Job Wizard (deterministic)

- `lib/product-finder-jobs.ts` (pure, tested): `JOB_DEFS` — 5 curated job
  templates (200A service upgrade, office network drop, warehouse LED
  retrofit, security camera install, EV charger install). Each step:
  { id, label, subcategory, searchQuery, defaultQty, optional?, note? }.
  Test validates every `subcategory` against `ALL_SUBCATEGORIES` and unique
  ids.
- `JobWizardModal.tsx`: job picker → step list; each step resolves its pick
  via `apiSearch` (query + subcategory filter + branch-stock sort, top-3 —
  alternates swappable like the BOM modal), qty stepper, include/skip
  toggle, running total, **Add N items to basket**. Branded "Ask Meridian —
  Job Wizard" with the AI badge + "deterministic picks from your catalog"
  honesty note.
- Entry points: button beside Import List / BOM (landing toolbar), command
  palette ("Start a job — Ask Meridian wizard"), tour step.
- Store: `jobWizardOpen` / `setJobWizardOpen`.

## Demo quote seeds (enables F1/F2 demos on fresh browsers)

- `buildDemoQuotes(now)` in the store (exported, tested), seeded at hydrate
  ONLY when `pf_quotes` is absent (mirror of `buildDemoOrders`): ~10 quotes
  spread across margin bands and ages — won/lost mix shaping a credible
  win-rate gradient (low bands win more), one stale sent (>14d), one
  below-margin pending approval, scoped across CUST-001/CUST-002/walk-in.
  Lines reference stable curated SKUs with captured `unitPrice`.

## Tour, help, docs

- Tour: new step "Ask Meridian — Job Wizard" (with open action) + extend the
  insights step (win/loss + customer health) and more-tools step (bell,
  For-you, commodity strip). New `TourAction { kind: "openJobWizard" }`.
- Help topics: `job-wizard`, `win-loss-insights`, `customer-health`,
  `commodity-index`, `counter-offer` (+ test ids).
- features.md (+5 rows), help.md sections, demo-script.md beats.

## Out of scope

LLM conversational assistant (💲 — deferred pending key approval); real
commodity/weather feeds (free-key FRED/NWS variants deferred); server
persistence; pricing actually indexed to commodities (strip is advisory).

## Rigor

TDD pure modules; full gate (`npm test`, `typecheck`, `build`, lint); live
browser verify (fresh-profile seed paths, store/selector render-loop guard,
desktop + 390px); single deploy + smoke test.
