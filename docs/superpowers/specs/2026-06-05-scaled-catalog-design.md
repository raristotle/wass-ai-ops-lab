# Scaled Synthetic Catalog (20k) + Server-Side Search — Design

> **Superseded (2026-06-05):** executed as written at 20,000 products, then scaled
> the same day to **50,000 products** (+30k electrical, construction-commodity-weighted,
> 49 new subcategories) in commits `573ea33` and `4d55a37`. Figures below are the
> original 20k design.

**Date:** 2026-06-05
**Status:** Approved (design)
**Area:** `lib/catalog/` (new), `apps/web/app/api/products/` (new), `lib/product-finder-store.ts`, `features/product-finder/`, `features/product-finder/types.ts`

## Summary

The Product Finder catalog is 46 hand-authored products in 2 categories, held in a
client-side array (`data/mock/catalog-products.ts`) and searched in-memory. This
initiative scales it to **20,000 deterministically-generated synthetic products
across all 6 Meridian categories** (electrical, datacom, OEM electrical, AV, security,
safety), moves search **server-side**, and computes **functional-equivalent
alternatives** at scale using the existing explainable scoring engine.

A 20k catalog cannot ship in the browser bundle, so search becomes a set of thin
**Next.js Route Handlers** backed by an **in-memory generated index** (no database
server, no external service, no secrets — chosen for maximum robustness and
identical behavior locally and on Vercel). The product-finder pages move from
fully-static to server-backed; the rest of the site stays static.

## Decisions (from brainstorming)

- **Realism:** realistic *synthetic* data — no web/AI, no licensed catalog. Fully
  deterministic and offline.
- **Runtime store:** **Option C — in-memory generated index** inside the Next.js
  server, cached per process. No Prisma/DB changes; Prisma stays untouched.
- **Deferred to a future update (out of scope here):** BOM/List upload, and
  goes-with / cross-sell / upsell. Both UI areas are **hidden** in v1 and re-enabled
  later. Autocomplete suggestions and load-more pagination **are in scope**.

## Non-Goals / Out of Scope

- No real database, ORM, or external service for the catalog (in-memory only).
- No network/LLM calls; everything is generated deterministically.
- BOM resolution endpoint and UI (deferred).
- Goes-with / cross-sell / upsell computation and `GoesWithPanel` (deferred — hidden).
- Per-product external sources are **kept** (generated, part of product detail).

## Architecture & Data Flow

```
Browser — Zustand store (now async) + parseQuery (NL chips stay client-side)
   │  fetch (structured params)
   ▼
apps/web/app/api/products/{search, suggest, [id]}/route.ts   ← thin, Zod-validated
   │
   ▼
lib/catalog/
   generate.ts    deterministic 20k generator (seeded PRNG)
   index.ts       in-memory singleton: products[], byId, buckets, search haystack
   search.ts      searchCatalog({text, filters, sort, page, pageSize})
   equivalents.ts findEquivalents(product, k) — ranks by lib/product-finder-scoring
   schemas.ts     Zod schemas for query params + DTOs
```

All heavy logic lives in pure `lib/catalog/*` modules (unit-tested in the node-only
vitest setup, `include: ["lib/**/*.test.ts"]`). Route handlers are thin wrappers that
parse/validate input and call the lib functions.

---

## Component 1 — Catalog generator (`lib/catalog/generate.ts`)

- **Seeded PRNG** (e.g. `mulberry32` with a fixed constant seed) so the same 20,000
  products — and stable `id`/`sku` values — are produced on every process start.
  Stable IDs make favorites/recently-viewed snapshots and shared links consistent.
- **`generateCatalog(size = 20000): CatalogProduct[]`** (size param so tests run on a
  small set quickly).
- **6 categories**, each defined by a template: subcategories, brand pool, name
  patterns, spec templates (with `isNonNeg` flags), price range, UOM, icon. Target
  distribution (approx, all well-represented):

  | Category | ~Count |
  |---|---|
  | `electrical` | 6,000 |
  | `datacom` | 3,500 |
  | `oem-electrical` | 3,000 |
  | `av` | 2,500 |
  | `security` | 2,500 |
  | `safety` | 2,500 |

- Each product: `id`, unique `sku`, `name`, `brand`, `category`, `subcategory`,
  `description`, `unitPrice`, `uom`, `specs[]`, `preferred` (~20%),
  `branchStock[]`/`dcStock[]` across the existing Texas branches/DCs (reusing the
  current `BRANCHES`/`DCS` helpers), and `externalSources[]` when out of Meridian stock.
- **The existing 46 curated products are folded in first** (as "featured" seed) so
  the hand-built breaker/Cat6 examples remain; the generator produces the remaining
  ~19,950. IDs/SKUs are de-duplicated against the seed.
- `alternativeIds` / `crossSellIds` / `upsellIds` are **no longer populated**
  (equivalents are computed). These fields become optional on the type (default `[]`).

## Component 2 — In-memory index (`lib/catalog/index.ts`)

- A lazy singleton cached on `globalThis` (survives warm invocations and HMR):
  `{ products, byId: Map, byCategory, bySubcategory, byBrand, haystack: string[] }`,
  where `haystack[i]` is a precomputed lowercased blob of name/sku/brand/subcategory/
  spec values for product `i`.
- `getCatalog()` builds it once on first call (<~200 ms for 20k) and returns the
  cached instance thereafter.

## Component 3 — Search (`lib/catalog/search.ts`)

- `searchCatalog({ text, filters, sort, page = 0, pageSize = 24 })
   → { items: CatalogProduct[], total: number, page: number, pageSize: number }`.
- Filters (reusing current semantics, scaled): category, subcategory, brand,
  onlyBranchStock, onlyDCStock, onlyPreferred, priceMin, priceMax.
- Sort keys reuse the current set: relevance, preferred, branchStock, priceLow,
  priceHigh, brand.
- Text match: linear scan over `haystack` with `includes` (single-digit ms at 20k).
  An inverted token index is explicitly **not** built now (YAGNI); a comment notes
  it as the upgrade path if needed.
- **Pagination:** default 24/page; the client appends pages via "Load more".

## Component 4 — Equivalents (`lib/catalog/equivalents.ts`)

- `findEquivalents(product, k = 8): CatalogProduct[]`: candidate pool = same
  `subcategory` (widen to same `category` if too few), excluding the product itself,
  ranked by `scoreProduct(candidate, product, userBranchId?)` from the existing
  `lib/product-finder-scoring.ts`. Returns the top `k`. The explainable
  "Why recommended?" UI is unchanged — it re-scores client-side on the same product
  objects returned by the API.

## Component 5 — API routes (`apps/web/app/api/products/…`)

Thin handlers; input validated with Zod (`lib/catalog/schemas.ts`):

- **`GET /api/products/search`** — query: `q, category, subcategory, brand,
  onlyBranchStock, onlyDCStock, onlyPreferred, priceMin, priceMax, sort, page,
  pageSize` → `{ items, total, page, pageSize }`.
- **`GET /api/products/suggest`** — `q` → up to 6 lightweight `{ id, name, sku,
  brand, imageIcon }` matches for the autocomplete dropdown.
- **`GET /api/products/[id]`** — `{ product, equivalents }` (full product +
  computed equivalents; external sources are on the product).

## Component 6 — Client async rewrite (the largest slice)

A new thin client module **`lib/product-finder-api.ts`** wraps the fetch calls
(`searchProducts`, `suggest`, `getProduct`) and returns typed results.

`lib/product-finder-store.ts` becomes **async**:
- New state: `loading`, `error`, `page`, `total`, `hasMore`.
- `runSearch` / `runNlSearch` call the search API and replace `results`;
  `loadMore()` fetches the next page and **appends**.
- **`parseQuery` (NL chips) stays client-side** — the store sends the parsed
  *structured* filters + residual text to the API. The chip behavior built earlier is
  preserved unchanged.
- Autocomplete: SearchBar calls `/suggest` (debounced ~150 ms) instead of the
  in-memory array.
- `setActiveProduct(productOrId)` fetches `/[id]` for detail + equivalents.
- **Favorites & Recently-viewed store snapshots**, not IDs alone: a
  `ProductSnapshot = { id, name, brand, unitPrice, imageIcon, category }` is captured
  when a product is starred/viewed. `SavedAndRecentPanel` renders from snapshots
  (replacing the removed client-side `PRODUCT_MAP` lookup). Still localStorage-
  persisted; hydration unchanged in shape.
- **Loading/skeleton states** on the results grid, the suggestions dropdown, and the
  active-product load.

The pure `parseQuery`, `scoreProduct`, and the explainable `RecommendationExplanation`
component are unchanged — they operate on `CatalogProduct` objects regardless of source.

## Component 7 — Category expansion (UI)

`ProductCategory` grows to
`"electrical" | "datacom" | "oem-electrical" | "av" | "security" | "safety"`.
Update the FilterSidebar category list, the search quick-picks, and any category
labels to include the four new categories. Card/banner shapes are unchanged.

## Component 8 — Deferred areas (hidden in v1)

- **BOM / List:** the BOM tab is removed from the SearchBar UI (the search box shows
  only single search). The store's `bomMode`/`parseBom`/`bomLines` and the BOM
  components remain in the repo, dormant, for the future update.
- **Goes-with / cross-sell:** `GoesWithPanel` is not rendered; `selectCrossSells`/
  `selectUpsells` are left unused. (Per-product **external sources are kept**.)

## Data Model Changes (`features/product-finder/types.ts`)

- `ProductCategory` → 6 values (above).
- `CatalogProduct.alternativeIds` / `crossSellIds` / `upsellIds` become optional.
- **Response shapes:** `/search` and `/[id]` return full `CatalogProduct` objects
  (≈1–2 KB each; 24/page is fine). `/suggest` returns the lightweight
  `{ id, name, sku, brand, imageIcon }`. New type `ProductSnapshot` (favorites/recent).
- `/[id]` and `findEquivalents` accept an **optional `branchId`** so equivalents can
  be ranked with branch-stock awareness; default is branch-agnostic ranking.

## Testing (node-only `lib/**`)

- **generate.test.ts:** determinism (same seed ⇒ identical catalog by id/sku),
  exact count for a given size, all 6 categories present, unique ids & skus, the 46
  curated seed products are present, Zod-valid shape on a sample.
- **search.test.ts:** text match, each filter, sort orders, pagination
  (page/pageSize/total, append correctness) — run against a small generated set.
- **equivalents.test.ts:** excludes self, prefers same subcategory, ranks by
  `scoreProduct` (highest first), respects `k`, widens to category when sparse.
- Route handlers stay thin and are verified by `npm run build` + manual checks
  (consistent with the repo's node-only test setup — components/routes aren't
  unit-tested).

## Performance & Deployment

- Cold-start generation <~200 ms, cached per process; search single-digit ms;
  resident memory ~20–40 MB — within Vercel function limits.
- Product-finder pages become client-fetch + serverless API routes; the rest of the
  site stays static. Verified via `npm run build`.

## Verification Gate

`npm run typecheck` · `npm run lint` · `npm test` · `npm run build` — all green.
Then deploy and confirm `/product-finder` is live and searching at scale.

## Suggested Implementation Phasing

1. Generator + types/category expansion (tested).
2. In-memory index + search + equivalents (tested).
3. API routes (search / suggest / [id]).
4. Client async rewrite: API module, store, grid, pagination/load-more, suggestions,
   active-product + equivalents, loading states.
5. Favorites/recent snapshots + category UI + hide BOM & goes-with.
6. Verification (tests, build) + deploy.

Each phase ships with its tests green.
