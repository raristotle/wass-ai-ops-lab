# Product Detail Modal ("View Details") — Design

**Date:** 2026-06-05
**Status:** Approved (design)
**Area:** `features/product-finder/` (new modal + art components), `lib/product-finder-links.ts` (new), `lib/product-finder-store.ts`, `features/product-finder/ProductCard.tsx`

## Problem

"View Details" on a product card currently opens the **Spec Compare modal** — a
mislabeled action. Users expect a product detail view: full basic information, a
product image, a formal spec sheet, and links to third-party detail pages.

## Decisions (user-approved)

| Question | Decision |
|---|---|
| Surface | **Modal overlay** (consistent with SpecCompareModal; keeps grid context) |
| 3rd-party links | **Real search links** on distributor sites (work in a live demo) |
| Image | **Deterministic generated SVG art** (no external dependencies) |
| Spec sheet | **In-view formal table + "Download Spec Sheet (PDF)"** via print-to-PDF |

## Architecture (no new API calls)

The product card already holds the complete `CatalogProduct` (specs, stock,
pricing, externalSources). The modal renders in-hand data; links and art are
pure functions. No endpoints, no loading states, no fetch failure modes.

### New units

1. **`lib/product-finder-links.ts`** — pure, node-tested.
   - `externalSearchLinks(product): { distributor: string; url: string }[]`
   - Maps catalog distributor names → working search URLs:
     Grainger `https://www.grainger.com/search?searchQuery=`,
     Graybar `https://www.graybar.com/search/?text=`,
     Platt `https://www.platt.com/search?text=`,
     Rexel USA `https://www.rexelusa.com/s?q=`.
   - Query = URL-encoded `"{brand} {name}"`.
   - When the product has externalSources, link each source's distributor to its
     real search URL (keep the synthetic price/qty/lead-time as display data).
   - Always append generic fallback rows — Grainger, Zoro
     (`https://www.zoro.com/search?q=`), Home Depot
     (`https://www.homedepot.com/s/`) — deduped against the sourced rows.

2. **`features/product-finder/ProductArt.tsx`** — presentational SVG.
   - Deterministic per product: category-tinted plate (Meridian tertiary palette:
     electrical `#EAAA00`, datacom `#64CCC9`, oem-electrical `#DB6B30`,
     av `#004986`, security `#00573F`, safety `#EAAA00`-variant), large category
     emoji, brand name, SKU. Props: `{ product, className? }`.

3. **`features/product-finder/ProductDetailModal.tsx`** — the modal.
   - Follows SpecCompareModal patterns: fixed overlay, `role="dialog"`,
     `aria-modal`, ✕ button, Escape to close, body scroll lock if the compare
     modal does it.
   - Layout: header (name, brand · SKU, Preferred badge) → two columns
     (ProductArt | price/UoM + branch/DC stock + qty stepper + **Add to Basket**
     + **Find Alternatives**) → **Spec Sheet** (table: Specification / Value /
     Required-flag for isNonNeg; description row; UoM; category/subcategory) with
     **Download Spec Sheet (PDF)** button → **Where to Buy** (distributor link
     rows; sourced rows show price/qty/lead time; all open in new tab with
     `rel="noopener noreferrer"`).
   - Print: button calls `window.print()`; Tailwind `print:` variants hide all
     app chrome and show only the spec-sheet block (modal root gets
     `print:static print:inset-auto`, sheet block `print:block`, an app-level
     wrapper `print:hidden` is NOT global — scope inside the modal so printing
     only works as spec sheet while modal is open).
   - **Find Alternatives** closes the modal then calls `setActiveProduct(product)`.

### Edits

4. **`lib/product-finder-store.ts`** — add `detailModalProduct: CatalogProduct |
   null` (initial null) + `setDetailModalProduct(p: CatalogProduct | null)`. Same
   slice style as `compareModalOpen`.
5. **`features/product-finder/ProductCard.tsx`** — "View Details" calls
   `setDetailModalProduct(product)` instead of `setCompareModalOpen(true)`.
   Compare retains its own button/flow unchanged.
6. Mount `<ProductDetailModal />` once next to `<SpecCompareModal />` in
   `ProductFinderShell.tsx`.

## Testing

- `lib/product-finder-links.test.ts`: per-distributor URL mapping, URL encoding
  (spaces, `&`, quotes in product names), fallback rows present and deduped,
  sourced display data passthrough.
- Store test additions: `setDetailModalProduct` open/close round-trip.
- Components verified via typecheck + build + live browser check (modal opens
  from View Details, real hrefs, print affordance, Add to Basket works,
  Find Alternatives pivots, Escape closes).

## Out of scope

Real product photos, server-generated PDFs, deep-linkable product URLs,
reviews/Q&A, BOM/goes-with revival.
