# Product Recommender — Six-Feature Update — Design

**Date:** 2026-06-06
**Status:** Approved (design); building incrementally (deploy per feature)
**Area:** `features/product-finder/`, `lib/product-finder-*`, `lib/catalog/`

User selected 6 features (Tier C deferred). Build order = cheapest-reuse first so
production stays green throughout. Each feature: build → adversarial review → fix
→ live browser verify → deploy, then docs.

Shared context: 60k synthetic catalog; Zustand store `lib/product-finder-store.ts`;
print-to-PDF pattern already proven in `ProductDetailModal` (scoped `print:`
variants + `window.print()`); cart slice with `addToCart`, `cart` lines, totals;
`SpecCompareModal`, `CartDrawer`, `ProductDetailModal` components.

---

## F1 — Compare → PDF export  *(cheapest; reuse print pattern)*
Add a **Download Comparison (PDF)** button to `SpecCompareModal`. Reuse the
detail-modal print approach: scope `print:` so only the comparison table prints
(hide app chrome + shell). Print-only header line (title + date + rep/branch).
No store changes. Tests: none new (UI); verify via print-media emulation.

## F2 — Volume / tiered pricing  *(deterministic data + display)*
New `lib/product-finder-pricing.ts`: pure `priceTiers(product)` →
`[{ minQty, unitPrice }]` for breaks **1, 10, 50, 100** with deterministic
discounts (e.g. 0%, ~5%, ~10%, ~15% off `unitPrice`, rounded to cents). Show a
small tier table in `ProductDetailModal`; in the cart, the effective unit price
for a line uses the highest tier its quantity qualifies for, and the line shows
the applied break. Unit-test the tier math (monotonic non-increasing, correct
break selection, rounding). Wire cart total to use tiered unit price.

## F3 — Quote / Proposal PDF export  *(cart + print + fields)*
In `CartDrawer`, add **Generate Quote (PDF)**. Opens a quote view (or expands a
printable block) with: editable **Customer** and **Project** text inputs, an
auto **Quote #** (deterministic from a timestamp passed in — NOT Date.now in any
testable module; generate in the component), today's date, **30-day validity**
line, rep name + branch (from auth user), line-item table (SKU, name, qty, unit,
tier price, ext price), subtotal/total. Print via the proven pattern. Customer/
project persisted to localStorage so they survive reopen. No server.

## F4 — Goes-with cross-sell  *(affinity map + panel)*
New `lib/product-finder-goeswith.ts`: a curated electrical **subcategory →
[complementary subcategories]** affinity map (Circuit Breakers→Load Centers/
Panelboards/Lugs & Wire Connectors; Wire & Cable→Lugs & Wire Connectors/Conduit/
Conduit Fittings; Receptacles & Outlets→Wall Plates & Covers/Boxes & Covers;
Switches→Wall Plates & Covers/Dimmers & Lighting Controls; LED Troffers→Drivers &
Ballasts; etc.), with same-category fallback. `goesWith(product, catalog, k)`
returns up to k preferred/in-branch-stock products from complementary
subcategories (excluding self/same subcategory). A new `/api/products/goeswith/[id]`
route (thin, mirrors detail route) OR fold into the existing detail route's
response (`goesWith: CatalogProduct[]`) — prefer extending the detail route to
avoid a new endpoint. Render a **"Goes well with"** panel in `ProductDetailModal`
and a compact strip in `CartDrawer` (suggest accessories for cart items).
Unit-test the affinity resolution + exclusions.

## F5 — Named / saved baskets  *(store + switcher)*
Store slice: `savedBaskets: { id, name, lines, savedAt }[]` (lines = current cart
line shape), persisted `pf_saved_baskets`. Actions: `saveCurrentBasket(name)`,
`loadBasket(id)` (replaces cart), `deleteBasket(id)`, `renameBasket(id, name)`.
UI in `CartDrawer`: a "Saved baskets" section — save-current-as (name input),
list with load/delete, active indicator. localStorage-guarded on
`typeof localStorage`. Unit-test save/load/delete/dedupe-name + persistence.

## F6 — BOM / List import (revive)  *(parser + live-search match)*
Revive as a modal or a tab in the search area. `lib/product-finder-bom.ts`:
pure `parseBomLines(text)` → `[{ raw, qty, query }]` (supports `12x name`,
`12 name`, `12, name`, plain `name`; default qty 1). Matching uses the live
search API (`apiSearch` with the line's query, take top hit) — async, per line,
with a matched/unmatched summary and **Add all matched to cart** (respecting
parsed qty). Accept paste textarea + `.csv`/`.txt` upload (read client-side).
Unit-test the parser thoroughly (qty syntaxes, blank lines, junk). Match wiring
verified live.

---

## Cross-cutting
- No secrets, no real network beyond the app's own API + (existing) outbound
  distributor links. All deterministic where testable (no `Date.now`/`Math.random`
  in unit-tested modules — inject timestamps).
- Meridian brand styling throughout; print layouts are clean cut sheets.
- Each feature commits its own code + tests; docs updated per feature or batched.

## Out of scope (this update)
Spec-level facet filters, share-via-URL (Tier C), reorder/order-history, stock
alerts, real PDFs/emails, server persistence.
