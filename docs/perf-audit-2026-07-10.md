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

## Root cause (traced)

Two client components value-import modules whose graphs include `data/real/*`:

| Client importer | Chain | Data dragged in |
|---|---|---|
| `features/product-finder/SearchBar.tsx` | → `lib/catalog/xref-index` | `data/real/xref-crosses.ts` (35 MB src) + `enriched-cross-targets.ts` (8.9 MB) |
| `features/product-finder/ExternalSourcesCard.tsx` (via `lib/catalog/external-products`) | → `lib/catalog/external-products` | `hubbell-catalog.ts` (8.4 MB) + `enriched-hubbell.ts` (2.3 MB) + `atkore-products.ts` + `energy-star-lighting.ts` |

Everything else that touches these datasets is already server-side (API routes:
`/api/crosses/match`, `/api/crosses/coverage`, `/api/bom/analyze`, `sku-index` consumers).
The type-only `import("...")` annotations in `lib/product-finder-api.ts` are erased at
compile time — not a cause.

## Fix plan (next loop iteration)

1. **SearchBar**: replace the direct `xref-index` calls with a debounced fetch to the
   existing server API (`/api/crosses/match` — verify its request/response shape covers
   the suggest-dropdown usage; if not, add a thin `/api/crosses/suggest`). Update the
   SearchBar render tests to mock the fetch.
2. **ExternalSourcesCard**: same treatment — move the `external-products` read behind a
   small API route (reuse the lib server-side), fetch on mount/expand.
3. **Regression guard**: ESLint `no-restricted-imports` (or a dedicated rule block) so
   `features/**` and client `lib/product-finder-*` may not import `@/data/real/*`,
   `@/lib/catalog/xref-index`, or `@/lib/catalog/external-products`. The build-manifest
   check (`node -e` script or a small test asserting no chunk > ~1 MB in
   app-build-manifest for `/product-finder/login`) pins it quantitatively.
4. **Measure**: record before/after First-Load JS per route here. Target: `/login` ≈
   120 kB (−94%), `/product-finder` ≤ 400 kB eager (search data arrives via API instead).

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
