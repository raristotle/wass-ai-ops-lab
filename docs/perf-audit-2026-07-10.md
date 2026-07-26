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
   **Open + 30/min rate-limit** (auth removed 2026-07-11 so sessions-OFF pilot
   still shows the provenance strip; metadata-only payload).
3. **`GET /api/products/competitor-refs?id=`** (new): serves the competitor-ref chips;
   `ProductDetailModal` fetches per product (same lifecycle as its goes-with fetch).
   **Open + 30/min rate-limit** (same public-read posture as suggest; synthetic).
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

## 2026-07-24 → 2026-07-26: the standing budget guard

The ESLint import ban above stops the *known* offenders by name. `lib/perf-budget.test.ts`
(added 2026-07-24, made rebuild-proof 2026-07-26) catches the ones nobody has thought of
yet: it reads `apps/web/.next/app-build-manifest.json`, sums the raw JS bytes each main
`/product-finder` route must download, and fails when a route exceeds a fixed kB ceiling.

**Run it:** `npm run verify:perf` (builds, then runs exactly that test). Nothing runs it
automatically — this repo has no CI by design.

Three fragilities in the original version were fixed on 2026-07-26:

| Was | Now |
|---|---|
| `readFileSync` on the manifest with no existence check → confusing `ENOENT` from `npm test` on a never-built checkout | Detects the missing build and **skips** via `it.skipIf`, printing a warning that names `npm run verify:perf`. Visible as *skipped* in the run output, never silently green. |
| `sharedChunks` was a hardcoded set of content-hashed filenames — the hashes change on every build, after which those bytes silently began counting against per-route budgets | Shared chunks are **derived from the manifest** each run: any `.js` asset referenced by ≥90% of route entries. In the 2026-07-26 build the four real infrastructure chunks hit 98/98 while the next-most-shared hits 8/98, so the threshold has an order of magnitude of margin. Survives a rebuild with entirely different hashes. |
| Nothing ever ran it | `npm run verify:perf` — one documented command. (Still human-triggered; adding CI was explicitly out of scope.) |

A fourth, unlisted bug was found and fixed in the process: chunks were resolved by
`path.basename()` against a **non-recursive** `readdirSync` of `.next/static/chunks`, so
every route's own entry chunk — which lives in the `static/chunks/app/**` subdirectory —
was never found and was counted as **0 kB**. (Basename is doubly wrong here: Next.js also
gives every trivial API route handler the identical basename `route-<hash>.js` in a
different directory.) Chunks are now resolved by full manifest-relative path, and a file
that cannot be stat'd is a **failure**, not a silent zero.

That fix is why the 2026-07-26 budgets are numerically higher than the 2026-07-24 ones.
**The app did not get bigger** — the guard simply started counting each route's own code:
+94 kB on `/product-finder`, +52 kB on `/dashboard`, +16 kB on `/quote`, +8 kB on
`/login`, +7 kB on `/customer`.

Re-measured 2026-07-26, budget = `ceil(measured × 1.15)`:

| Route | Measured (raw, shared excluded) | Budget |
|---|---|---|
| `/product-finder` | 931 kB | 1071 kB |
| `/product-finder/customer` | 844 kB | 971 kB |
| `/product-finder/dashboard` | 1266 kB | 1456 kB |
| `/product-finder/quote` | 307 kB | 354 kB |
| `/product-finder/login` | 268 kB | 309 kB |
| shared infrastructure (new) | 344 kB | 396 kB |

The shared-infrastructure budget is new: because shared chunks are excluded from every
per-route budget, without it a regression in the framework/runtime/app-shell layer — the
bytes every single route pays — would have been watched by nobody.

**Raw vs gzipped:** these are uncompressed bytes on disk, so they do *not* match the "First
Load JS" figures in the `next build` output or in the tables above, which are gzipped and
~3.5x smaller (`/product-finder` 2026-07-26: 1275 kB raw incl. shared = 349 kB gzipped).
Compare each series only with itself.

⚠️ **When the guard goes red, do not reflexively raise the budget.** Read the per-chunk
breakdown in the failure, identify what newly entered the client graph, and fix the import.
Re-baselining is legitimate when the weight is genuinely intended, a dependency upgrade
moved the floor, or the measurement method changed — and then the `measured:` comment and
date move with the number.

Known gap: `/product-finder/crosses` (43 kB) and `/product-finder/supplier` (36 kB) are
built but not budgeted — they are the two lightest routes and still prove the achievable
floor.

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
