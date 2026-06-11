# Tier 2 — Six-Feature Update (items 9–14) — Design

**Date:** 2026-06-11
**Status:** Approved (user directed: "complete development into production of Items 9, 10, 11, 12, 13, 14")
**Area:** `features/product-finder/`, `lib/`, `apps/web/app/product-finder/`

Build order = dependency-first: **F13 → F9 → F14 → F10 → F11 → F12**, because the
quote-acceptance payload (F9) bakes per-line prices that the override feature (F13)
introduces, and the mobile pass (F12) must cover all new UI. Each feature: pure
modules TDD → UI → gate (`npm test`, `typecheck`, `build`, lint) → live browser
verify → docs at the end → single deploy.

Shared rules: no `Date.now`/`Math.random` in unit-tested modules (inject `now`);
Meridian palette; store stays flat; localStorage guarded on `typeof localStorage`;
no new $-cost services.

---

## F13 — Per-line price override with margin guardrails

- `lib/product-finder-override.ts` (pure, tested):
  - `OVERRIDE_MIN_MARGIN = 0.05` — a rep may not price below 5% margin over
    `estimatedUnitCost`.
  - `overrideBounds(product)` → `{ min, max }`: `min = round2(cost / (1 − 0.05))`,
    `max = listPrice` (never override above list).
  - `clampOverride(product, requested)` → bounded, 2-dp price.
- Store: `priceOverrides: Record<string, number>` (productId → unit price);
  `setPriceOverride(id, price | null)`. Cleared by `clearCart`, `loadBasket`,
  `reorder`, `loadQuoteToCart`; `removeFromCart` drops its key. Cart is in-memory,
  so overrides are not persisted.
- Override-aware effective price everywhere the cart prices lines:
  `selectCartTotal`, cart line display + per-line margin, basket margin, quote
  sheet table, `saveQuote` (lines/total/margin), `placeOrder`, CSV export.
- `SavedQuote.lines` gains optional `unitPrice?: number` captured at save time
  (backward compatible — old quotes recompute via the pricing provider).
- UI (CartDrawer line): "✎ price" toggle → inline number input showing the
  allowed range; overridden lines show an "overridden" badge, a reset link, and
  the recomputed margin %. Below-floor basket margin still routes through the
  existing approval flow at `saveQuote` (no new approval logic).

## F9 — Customer-facing quote acceptance page

- `lib/product-finder-quote-share.ts` (pure, tested): versioned payload
  `{ v:1, id, number, customer, project, lines:[{id, sku, name, qty, unitPrice}],
  total, createdAt, validUntil, rep?, branch?, approvalPending? }` encoded
  base64url (reuse exported b64u helpers from `product-finder-share.ts`).
  Defensive `decodeQuoteShare` → null on garbage; line cap 200.
- Route `apps/web/app/product-finder/quote/page.tsx` — **public** (no AuthGuard;
  customer-facing): branded quote document (Meridian header, number, dates,
  prepared-by, line table, total) + **Accept Quote** / **Decline** + demo note.
  - Expired (`now > validUntil`) → banner, Accept disabled.
  - `approvalPending` → Accept disabled ("awaiting Meridian approval").
  - Accept, same browser (quote id found in `pf_quotes` after
    `hydrateSavedState()`): `convertQuoteToOrder` → quote Won + "✓ ordered",
    confirmation with order id.
  - Accept, different browser: record in `pf_quote_acceptances`
    (localStorage) and confirm with a demo-limitation note.
  - Decline: local quote → status Lost; else recorded.
- CartDrawer saved-quote row: **Customer Link** button → builds payload (line
  `unitPrice` from stored value, else pricing provider), copies
  `/product-finder/quote?q=…`, and auto-advances Draft → Sent.

## F14 — In-app notification center

- Watches upgrade: `watches: string[]` → `WatchEntry { id, name, addedAt }[]`.
  `toggleWatch(product, now?)` stores name + timestamp. Hydration migrates the
  legacy string[] shape in place (name falls back to snapshot or id).
- `lib/product-finder-leadtime.ts`: add `leadTimeDaysForId(id)` — max days of
  the deterministic bucket (7 / 14 / 21 / 42).
- `lib/product-finder-notifications.ts` (pure, tested):
  `buildNotifications({ quotes, watches, isManager }, now)` → sorted desc by `at`:
  - `approval:<quoteId>` — pending below-margin quotes (manager/admin only).
  - `stale:<quoteId>` — sent quotes past 14 days (reuses `isStale`).
  - `restock-due:<productId>` — watch where `now ≥ addedAt + leadTimeDays`.
  - `restock-eta:<productId>` — younger watch ("estimated restock by <date>").
- Store: `notifReads: Record<string, number>` persisted `pf_notif_reads`;
  `markNotificationsRead(ids, now)`.
- `NotificationBell.tsx` in the shell header: badge = unread count; dropdown
  panel (right-aligned, full-width sheet on mobile); click-through — approval →
  `openCartAt("quotes")`, stale → same with status filter, restock → product
  detail via `apiGetProduct`; "Mark all read"; empty state.

## F10 — Personalized "For you" rail

- `lib/product-finder-foryou.ts` (pure, tested):
  - `REORDER_DUE_DAYS = 30`.
  - `reorderSuggestions(orders, cartIds, now, k)` → `{ product, lastOrderedAt,
    timesOrdered, lastQty, due }[]` — ranked due-first, then frequency, then
    recency; excludes in-cart products; dedupes across orders.
  - `favoritePicks(favorites, excludeIds, k)` → favorite snapshots not already
    in cart/suggestions.
- `ForYouRail.tsx` on the default browse view (above `SavedAndRecentPanel`):
  - **Time to reorder** — product cards with "ordered N× · last 35d ago",
    due badge, qty-prefilled **Add** (full product objects from order lines).
  - **From your favorites** — quick-add cards (fetch via `apiGetProduct` on add).
  - **Goes well with your orders** — `apiGoesWith` of the top reorder suggestion.
  - Customer scoping mirrors the drawer: active customer → their orders;
    walk-in → all orders (demo-friendly), suggestion shows customer chip.

## F11 — Fuzzy BOM/RFQ matching with confidence

- `lib/product-finder-match-confidence.ts` (pure, tested):
  - `matchConfidence(query, product)` → 0..1 token-coverage score over
    name/SKU/brand/subcategory; exact SKU hit → 1.0; numeric tokens must match
    exactly (a "20A" query token doesn't match "200A").
  - `confidenceTier(c)` → high ≥ 0.8 / medium ≥ 0.5 / low.
- `lib/product-finder-bom.ts`: add `matchBomScored(parsed, searchTopK)` →
  `ScoredBomLine { …, match, confidence, tier, alternates[], correctedQuery? }`
  (top hit + up to 2 alternates from one top-3 search). Existing `matchBom`
  untouched.
- BomImportModal: searchTopK = `apiSearch(pageSize 3)`; zero hits → try
  `suggestCorrection(query)` once and re-search (ties into Tier 1 typo engine,
  line shows "corrected to …"). Each row: colored confidence badge
  (high `#00AA13` / medium `#EAAA00` / low `#DB6B30`) + % , and for low/no-match
  lines an alternates picker ("Use" swaps the match). Summary adds a
  "review n low-confidence" hint. Add-all unchanged.

## F12 — Mobile / field-rep responsive pass (390 px)

- CartDrawer: `w-80 sm:w-96` → `w-full max-w-[26rem] sm:w-96` (full-width sheet
  on phones).
- Shell header: hide ⌘K trigger below `sm` (touch devices); bell stays visible;
  verify wrap at 390 px.
- ProductDetailModal / BOM / Bulk modals: full-height usable sheets on mobile
  (`max-h` + internal scroll already present — verify, fix paddings/widths).
- For-you rail + notification panel: single-column / full-width variants.
- Quote acceptance page: mobile-first layout (customers open links on phones).
- Verify each at 390×844 in the preview browser; fix what breaks.

## Out of scope

Server-side persistence (acceptance stays localStorage demo); real emails;
LLM assistant (item 8 — deferred pending $ approval); cross-browser quote-state
sync; offline/PWA.

## Testing & rigor

TDD pure modules (`override`, `quote-share`, `notifications`, `foryou`,
`match-confidence`, bom scoring, leadtime days). Full gate per feature; live
browser verify (incl. fresh-profile localStorage migration for watches); single
production deploy at the end + smoke test; docs/help/tour/demo script updated
(features doc, help content lib, user guide, demo script).
