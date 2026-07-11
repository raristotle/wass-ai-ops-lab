# Performance audit — client bundle (2026-07-10)

## Finding (CRITICAL for load performance)

An **18.3 MB eager client chunk** (`5935-*.js`) ships on five routes — `/product-finder`,
`/dashboard`, `/customer`, `/quote`, **and `/login`** (verified in
`.next/app-build-manifest.json`). Reported First-Load JS: 2.29 MB on `/product-finder`,
2.11 MB on `/login`; the `/crosses` and `/supplier` pages prove ~118 kB is the achievable
baseline.

Fingerprint of the chunk: contains the xref-crosses pairs, Hubbell catalog, ENERGY STAR
lighting, Atkore products, enriched cross targets — i.e. **the server datasets are being
bundled into the browser**.

## Root cause (traced — CORRECTED after the fix work)

The initial suspicion (SearchBar + ExternalSourcesCard) was **partly wrong**; the chunk's
"hubbell/energy" fingerprint hits are brand strings inside the *enriched cross-target
data*. The verified chains (the client-reference manifest maps login's client-module
group to the 18 MB chunk) were:

| Client importer | Chain | Why it hurt |
|---|---|---|
| `lib/product-finder-store.ts` (imported by EVERY page incl. login) → `lib/integration/index` **barrel** | barrel eagerly imported `catalog-source` + `cross-reference`, both of which call `getCatalog()` → `generate` → `external-products` → the generated/external catalogs (~20 MB src) | one barrel tidy-up put the whole catalog graph in the client store's graph |
| `features/product-finder/FilterSidebar.tsx` → `getCatalogProvider().getSource()` | computed catalog counts client-side | the only *direct* client use of the catalog graph |
| `features/product-finder/ProductDetailModal.tsx` → `getCrossReferenceProvider().referencesFor()` | computed competitor refs client-side | second direct client use |
| `features/product-finder/SearchBar.tsx` → `crossRelationMeta` from `lib/catalog/xref-index` | one 5-line UI helper co-located with the packed xref dataset | value-import of a data module for a pure display fn |

Lesson for future tracing: barrel imports come in two spellings (`@/lib/catalog` and
`@/lib/catalog/index`) — grep both.

## Fix (SHIPPED, this commit)

1. **Barrel split**: `getCatalogProvider` + `getCrossReferenceProvider` moved to
   `lib/integration/catalog-index.ts` (server-only); `lib/integration/index.ts` keeps only
   the light providers (customers/pricing/inventory) + a do-not-retidy comment.
2. **`GET /api/catalog/source`** (new): serves the PIM source descriptor;
   `FilterSidebar`'s `CatalogSourceStrip` fetches it (renders nothing until loaded).
3. **`GET /api/products/competitor-refs?id=`** (new): serves the competitor-ref chips;
   `ProductDetailModal` fetches per product (same lifecycle as its goes-with fetch).
4. **`lib/catalog/xref-meta.ts`** (new, data-free): `crossRelationMeta` + `XrefRelation`
   moved out of `xref-index` (which re-exports them for server callers); SearchBar
   imports the meta module.
5. **Regression guard**: `@typescript-eslint/no-restricted-imports` (error) for
   `features/**`, `components/**`, `lib/product-finder-*`, `lib/store.ts` (tests exempt)
   banning value-imports of `@/data/real/*`, `xref-index`, `external-products`,
   `generate`, `@/lib/catalog/index`, `@/lib/integration/catalog-index`, and
   `@/lib/integration/cross-reference` (type imports allowed).

## 2026-07-11 hardening

Extended `eslint.config.mjs` with `patterns` in the `@typescript-eslint/no-restricted-imports` block to close alternate-spelling bypasses: the barrel import ban now catches `@/lib/catalog` + `@/lib/catalog/index` (in all spellings incl. relative `**/lib/catalog/*`), and the heavy-module ban catches relative forms (`**/lib/catalog/xref-index.*`, `**/lib/integration/catalog-index*`, etc.). A review probe had proven the original `paths`-only configuration was bypassable by alternate import spellings (e.g., `import { getCatalog } from "../../lib/catalog/index"` vs. the banned `@/lib/catalog`); patterns close that gap.

## Measured result (clean build, gate green: 0 lint errors / typecheck / 3,698 tests)

| Route | Before | After | Δ |
|---|---|---|---|
| `/product-finder` | 2.29 MB (+18.3 MB eager chunk) | **356 kB** | **−84%** |
| `/product-finder/customer` | 2.27 MB (+chunk) | **335 kB** | **−85%** |
| `/product-finder/dashboard` | 2.39 MB (+chunk) | **451 kB** | **−81%** |
| `/product-finder/login` | 2.11 MB (+chunk) | **174 kB** | **−92%** |
| `/product-finder/quote` | 2.12 MB (+chunk) | **186 kB** | **−91%** |

Manifest check: **no eager chunk > 1 MB on any main route** (the 18 MB dataset chunk no
longer exists in the client graph). Remaining known-small client data (deliberate):
`brand-entities`, `etim-classes` (48 kB src), `substances` (12 kB src).

Tracing tooling that found the chains (reusable): a value-import graph walker from each
page (skips `import type`), the per-route `page_client-reference-manifest.js` chunk maps,
and content fingerprinting of big chunks with dataset-unique string snippets. Gotchas
burned: grep BOTH `@/lib/catalog` and `@/lib/catalog/index` spellings; module-level
imports poison a module for ALL importers (don't rely on tree-shaking without
`sideEffects: false`); the shell cwd resets between tool calls — cd explicitly in every
command or a repo-wide test run can silently sweep the wrong directory.

## Baseline (before)

```
/product-finder            24.1 kB   First Load 2.29 MB   (+ eager 18.3 MB chunk)
/product-finder/dashboard  12.8 kB   First Load 2.39 MB   (+ eager 18.3 MB chunk)
/product-finder/customer    2.81 kB  First Load 2.27 MB   (+ eager 18.3 MB chunk)
/product-finder/login       2.82 kB  First Load 2.11 MB   (+ eager 18.3 MB chunk)
/product-finder/quote       4.96 kB  First Load 2.12 MB   (+ eager 18.3 MB chunk)
/product-finder/crosses     4.49 kB  First Load  118 kB   ← proves the achievable floor
/product-finder/supplier    2.72 kB  First Load  116 kB
```
