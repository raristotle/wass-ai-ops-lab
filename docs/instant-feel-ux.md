# Instant-feel UX (v3 Sprint 1)

Four $0, client-side polish features over already-shipped surfaces — the highest
value/cost items from the third top-20 ([docs/roadmap-next20-v3.md](roadmap-next20-v3.md)).
No new external calls, no new bundle weight (First Load JS held at 103 kB).

## #1 — Intent-prefetch (instant detail open)

`lib/product-finder-prefetch.ts` keeps a small module promise-cache. On
hover / keyboard-focus / touchstart of a result card or table row,
`prefetchProductDetail(id, branchId)` warms the **already-free** `/api/products/[id]`
route; `ProductDetailModal` then reads `fetchProductDetailCached(...)`, so a
prefetched click opens with no spinner.

- Dedupes repeat intents (one request per product+branch).
- Concurrency cap (`MAX_INFLIGHT = 6`) — over the cap, prefetch is skipped and
  the eventual click just fetches normally; the counter is released in `.finally`.
- Bounded cache (`MAX_CACHE = 80`, oldest-evicted). Fail-soft (null on error).
- `features/product-finder/useIntentPrefetch.ts` returns memoized
  `{onMouseEnter, onFocus, onTouchStart}` handlers; spread on the card/row.

## #2 — Applied-filters overview bar

`features/product-finder/AppliedFiltersBar.tsx` shows every active **sidebar
facet** (category, subcategory, brand, stock toggles, preferred, active-only,
price range, spec values, spec ranges) as a removable chip above the results,
plus **Clear all**. Hidden when no facets are active.

The pure `lib/product-finder-applied-filters.ts` `buildAppliedChips(filters, nl)`
derives the chips and **omits anything a natural-language chip already shows**
(NL chips keep their place under the search box), so a filter is never displayed
twice. Each chip's remove descriptor maps back to the matching store action;
Clear all resets via `clearFilters()`.

## #3 — Add-to-cart from results (known-item fast path)

Grid/list cards already had a qty stepper + Add. This adds the same fast path to
the **dense Table view** (`RowAddToCart` in `ResultsTable.tsx`: a compact
stepper + Add per row) and an **inline volume-tier hint** on result cards driven
by the pure `volumeTierHint(product, qty)` in `lib/product-finder-pricing.ts` —
as qty crosses a break (10/50/100) it shows the applied tier price, % saved, and
"+N more → $X ea at the next break". The table's Add button surfaces the same in
its tooltip.

## #5 — Smarter compare: differences only

`SpecCompareModal` gains a **"Show differences only"** toggle that collapses spec
rows shared by all products (with a "N shared specs hidden" hint), **highlights
the specific cells that differ**, and a **sticky product header** that stays
pinned while scrolling. The pure `lib/product-finder-compare-diff.ts`
(`rowIsShared`, `diffFlags`, `countSharedRows`) backs it. The four fixed
metadata rows (price/stock/lifecycle/crosses) always show; the print/PDF path is
unaffected (`print:static` on the sticky cells).

## Tests

Pure cores are unit-tested (`product-finder-prefetch`, `-pricing` volumeTierHint,
`-applied-filters`, `-compare-diff`); `AppliedFiltersBar` has an RTL component
test. Full suite green at 1664 tests.
