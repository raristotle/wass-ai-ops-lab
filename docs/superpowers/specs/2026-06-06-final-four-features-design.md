# Product Recommender — Final Four Features — Design

**Date:** 2026-06-06
**Status:** Approved (design); building incrementally (deploy per feature)
**Area:** `features/product-finder/`, `lib/product-finder-*`, `lib/catalog/`, `apps/web/app/api/products/`

Completes the original top-10 list. Build order = cheapest-reuse first. Each
feature: build → adversarial review → fix → live verify → deploy.

Shared context: 60k synthetic catalog; brand = Meridian Supply Co.; Zustand store
`lib/product-finder-store.ts` with cart `Record<string,{product,qty}>`, saved
baskets (`savedBaskets`, localStorage `pf_saved_baskets`), quote helpers; product
type `CatalogProduct`; data in `data/mock/catalog-products.ts`; server search at
`/api/products/search` via `lib/catalog/search.ts` (+ `index.ts` haystack). All
deterministic where unit-tested (no `Date.now`/`Math.random` in tested modules —
inject). localStorage guarded on `typeof localStorage`.

---

## G1 — Stock alerts & lead-time  *(cheapest)*
- `lib/product-finder-leadtime.ts` (pure, tested): `leadTimeFor(product)` →
  deterministic lead-time string for an out-of-Meridian-stock product (derive from
  a stable hash of `product.id` → buckets like "3–5 business days", "1–2 weeks",
  "2–3 weeks"). In-stock products return null (available now).
- Store: `watches: string[]` (product ids) + `toggleWatch(id)`, persisted
  `pf_watches`; `hydrateSavedState` loads it. Small unit test (toggle/persist).
- UI: in `ProductCard` and `ProductDetailModal`, for OOS products show the
  lead-time and a **"Notify when available"** button (toggles a watch; shows
  "✓ We'll notify you" state when watched). Mock only — a small toast/inline
  confirmation; no real email. Keep Wesco-free, Meridian palette.

## G2 — Reorder / order history  *(reuses saved-baskets shape)*
- Store: `orders: Order[]` where `Order = { id, placedAt, lines:
  {product,qty}[], total }`, persisted `pf_orders`. Actions:
  `placeOrder(now)` (snapshots cart → new order, then clears cart),
  `reorder(id)` (loads an order's lines into the cart). Seed 1–2 demo orders ON
  FIRST LOAD ONLY if `pf_orders` is absent (so history isn't empty in the demo),
  using deterministic ids/products (pick known catalog/curated ids).
- Wire the existing cart **"Add to Order"** button to `placeOrder`.
- UI: an **Order History** section (in the cart drawer or a small panel) listing
  past orders (date, item count, total) with a **Reorder** button. Unit-test
  placeOrder/reorder/seed + persistence.

## G3 — Share basket / quote via URL  *(encode/decode)*
- `lib/product-finder-share.ts` (pure, tested): `encodeCart(lines, meta?)` →
  compact URL-safe string (base64 of minimal JSON `{l:[[id,qty]...],c?,p?}` where
  c=customer, p=project); `decodeCart(str)` → `{ items:[{id,qty}], customer?,
  project? }` (tolerant: returns null on malformed input). Round-trip + malformed
  tests.
- UI: a **Share** button in the cart that builds `…/product-finder?cart=<encoded>`
  and copies it to the clipboard (with confirmation). On app load, if a `cart`
  param is present, decode it, fetch those product ids (reuse `apiGetProduct` or a
  small batch), populate the cart, and strip the param from the URL. Cap items to
  a sane max; ignore ids that no longer resolve.

## G4 — Spec-level facet filters  *(largest)*
- `lib/catalog/facets.ts` (pure, tested): `computeFacets(matchedProducts, max=8)`
  → `[{ name, values: [{ value, count }] }]` — aggregates spec name→value counts
  across the matched set, sorted by frequency, capped (skip facets with only one
  value). Deterministic.
- Search: extend `searchCatalog` params with `specFilters?: Record<string,
  string[]>` (spec name → selected values; a product matches if, for each chosen
  spec name, one of its spec values is selected). Extend
  `/api/products/search` to (a) accept `spec.<Name>=v1,v2` query params and
  (b) return a `facets` array computed over the matched-before-spec-narrowing set
  (standard faceted-search behavior so counts stay useful). Update
  `lib/catalog/schemas.ts` parser + `lib/product-finder-api.ts` + the store's
  `FilterState` (`specFilters`) and `filtersToQuery`.
- UI: in `FilterSidebar`, render the returned facets as collapsible multi-select
  checkbox groups (value + count); toggling re-runs search. Clear-all resets spec
  filters too. Unit-test computeFacets + the spec-filter matching in searchCatalog.

---

## Cross-cutting
- No secrets / no real notifications or network beyond the app's own API.
- Meridian branding + palette throughout; nothing reintroduces "Wesco".
- Each feature commits its own code + tests; docs updated per feature or batched
  at the end.

## Out of scope
Real notifications/email, server-side persistence, multi-user order sharing,
faceting via a precomputed inverted index (compute over matched set is fine at 60k).
