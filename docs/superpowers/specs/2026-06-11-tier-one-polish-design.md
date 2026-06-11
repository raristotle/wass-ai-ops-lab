# Tier 1 Polish — Design

**Date:** 2026-06-11
**Status:** Built
**Area:** `features/product-finder/`, `lib/`, `apps/web/app/product-finder/`

Seven user-selected "Tier 1 polish" items shipped as **one consolidated update**:
distinct subcategory artwork + key-spec callout, demo role quick-switcher, guided
tour, trade-term synonyms + typo tolerance, deep-linkable searches + Copy link,
voice search, and command palette + analytics drill-through. Brand stays Meridian
Supply Co. Deterministic and pure where unit-tested; zero new dependencies; no
runtime $ cost.

---

## T1 — Distinct subcategory artwork + key-spec callout
- Every one of the **79 subcategories** gets its **own distinct stroke glyph** on
  the deterministic SVG product plate (previously 54 glyphs shared across them).
- `lib/product-finder-plate.ts` (pure, tested): `keySpecCallout(specs)` picks the
  single most identifying short spec value for the detail view's plate badge —
  first present-and-short value in `CALLOUT_SPEC_PRIORITY` order (Amperage → Main
  Rating → Output Current → Gauge → kVA → Power Rating → Capacity → Wattage →
  Lumens → Category → Resolution → Ports → Channels → Zones → NRR → Voltage),
  `CALLOUT_MAX_LEN = 8` chars; `null` when nothing qualifies (no badge rendered).

## T2 — Demo role quick-switcher
- Header select ("Demo role:" + a *demo* pill) switches instantly between Sarah
  Chen (sales), Marcus Rivera (manager), and Admin User (admin) — no retyping
  credentials. Insights link and approval powers follow the role.
- `DEMO_ACCOUNTS` is a **password-free projection** of the demo users (no
  credentials in the switcher path) plus a single `DEMO_PASSWORD` const for the
  login form. Cart/orders **persist across switches** — shared demo storage, by
  design (per-role isolation explicitly out of scope).

## T3 — Guided tour
- `TOUR_STEPS` (`lib/product-finder-tour-content.ts`): **7 fixed step ids** —
  welcome → NL search → filters → alternatives → basket & quote → insights
  (manager/admin action) → more tools. Steps carry one-click "try it" actions that
  run the real feature.
- Non-blocking card bottom-right (`TourOverlay`); auto-opens **once per browser**
  (`pf_tour_seen` localStorage flag, guarded on `typeof localStorage`);
  re-launchable from the Help panel footer ("Restart the tour") and the command
  palette.

## T4 — Trade-term synonyms + typo tolerance
- `lib/product-finder-synonyms.ts`: **~36 trade terms** (romex → NM-B, GFI → GFCI,
  cat 6 → Cat6, EMT → Conduit, wire nut, load center, wall pack, PoE, …) applied
  **pre-parse in `parseQuery`** as removable chips/rewrites, with a new
  **"subcategory" chip kind**.
- `lib/product-finder-suggest-correction.ts` (pure, tested): **vocabulary-only**
  correction — vocabulary built from the taxonomy (79 subcategories, 201 brands)
  plus common terms; edit distance ≤ 2, **length-aware** (`maxDistanceFor`);
  numbers/spec tokens never corrected.
- Behavior: `NEAR_ZERO_RESULTS = 3` — at 1–2 results, **suggestion only** (never
  auto); at **zero results with exactly one confident correction**, auto-apply with
  a revertible "Showing results for X — search instead for 'y'" notice; a
  `noCorrect` recursion guard prevents correction loops.

## T5 — Deep-linkable searches + Copy link
- The page URL always reflects the current query/filters/sort using the **same
  param grammar as the search API** (`q`, `category`, `subcategory`, `brand`,
  `onlyBranchStock`/`onlyDCStock`/`onlyPreferred`, `priceMin`/`priceMax`,
  `spec.<Name>`, `specmin.`/`specmax.<Name>`, `sort`).
- URL sync via a **page-level zustand subscribe + `history.replaceState`**;
  hydration is a **run-once ref**. `decodeFiltersFromQuery`
  (`lib/product-finder-url.ts`) **delegates to `parseSearchQuery`** (one parser,
  no drift); `buildShareQuery` **preserves `cart=`** so basket-share links coexist.
- "Copy link" button next to CSV export in the results bar.

## T6 — Voice search
- `VoiceSearchButton` (`features/product-finder/`): mic in the search box,
  **feature-detected** (hidden where the browser lacks speech recognition —
  Chrome/Edge only). Dictation interim results show live in the box.
- `normalizeTranscript` (`lib/product-finder-voice.ts`, **pure**, tested): number
  words → digits ("twenty amp breaker" → "20A breaker"), fillers stripped; the
  final transcript runs the normal NL search. Disclaimer shown that audio uses the
  browser's speech service.

## T7 — Command palette + analytics drill-through
- **Hand-rolled palette, zero deps** (Ctrl+K / ⌘K, plus a header ⌘K button):
  registry, filter, and `moveSelection` are **pure** and unit-tested. Commands:
  jump to Search/Insights (role-gated), open Basket/Help/BOM import/Bulk pricing,
  restart tour, switch demo role, quick-pick searches, free-text search fallback.
- Drill-through: every Insights KPI card, Top Categories bar, top-product row,
  customer-mix row, quote-status tile, and orders-over-time point clicks through
  to the underlying search/product/customer/quotes/orders. Store gains
  `openCartAt(section, {quoteStatus|orderMonth})`, **layered on top of customer
  scoping**; the cart drawer opens scrolled to the section with a clearable
  Status:/Month: chip.
- Analytics types extended **additively**: `TimeBucket` gains `year`/`month`,
  `CustomerMixEntry` gains `customerId`; `isInLocalMonth` is **agreement-tested**
  against the bucketing so a chart point and its drill-through never disagree.

---

## Rigor & cost
Pipeline: researcher → story → spec → backend builder → frontend builder → test
verifier → validator. Full gate green (`npm test`, `typecheck`, `build`, eslint).
Shipped as **one consolidated update** (single deploy), not per-feature. No new
dependencies; no runtime cost added.

## Out of scope
Back/forward URL sync (replaceState only — no popstate handling); NL chip
reconstruction from a pasted URL; fuzzy scan of the full search haystack
(correction is vocabulary-only); per-role storage isolation (cart/orders shared
across demo roles by design); photo imagery (plates stay SVG); Firefox/Safari
voice support.
