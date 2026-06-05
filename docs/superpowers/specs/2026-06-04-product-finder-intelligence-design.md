# Product Finder Intelligence Upgrade — Design

**Date:** 2026-06-04
**Status:** Approved (design)
**Area:** `features/product-finder/`, `lib/`, `apps/web/app/product-finder/`

## Summary

The Product Finder is branded "AI Product Recommender" but has no actual
intelligence — recommendations are static ID lists, ranked only by keyword
search. This initiative delivers on that promise with three cohesive features
plus a UX polish pass:

1. **Explainable recommendations** — a deterministic, transparent scoring engine
   that ranks alternatives and shows *why* each is recommended.
2. **Natural-language search** — parse queries like `20A breaker in stock under
   $50` into structured, removable filter chips.
3. **Saved lists & history** — favorite products and recall recently-viewed
   items, persisted across sessions.

## Guiding Constraints

- **No LLM, no backend, no real API calls.** Per `CLAUDE.md`, all data comes
  from `data/mock/` and there are no secrets in code. Every "AI" behavior here
  is deterministic and unit-tested — which is precisely what lets the
  explanations show their math.
- **Business logic lives in pure `lib/` modules**; components stay thin. Matches
  the existing architecture (`runSearch` and friends live in the store; pure
  helpers live in `lib/` and `data/mock/`).
- **Single Zustand store.** Extend `lib/product-finder-store.ts`; no nested
  slice patterns.
- **Strict TypeScript** (no `any`), **Wesco brand + WCAG** compliance, and
  **Vitest** coverage for every new logic module.

## Architecture Overview

```
lib/
  product-finder-scoring.ts        (new)  pure scoring engine
  product-finder-nl-search.ts      (new)  pure query parser
  product-finder-store.ts          (edit) favorites, recent, NL filters, hydration
features/product-finder/
  RecommendationExplanation.tsx    (new)  ring + tier + chips + disclosure
  SavedAndRecentPanel.tsx          (new)  landing-state saved/recent surface
  ProductCard.tsx                  (edit) consume scoring module; star toggle
  SearchBar.tsx                    (edit) NL parse + removable filter chips
  EmptyState.tsx / NoResults       (new)  landing + over-filtered states
  types.ts                         (edit) new score/query types
apps/web/app/product-finder/
  page.tsx                         (edit) wire empty/landing state
```

All three logic modules are pure functions with no React or store dependency, so
they are tested in isolation and reused by components.

---

## Feature 1 — Explainable Recommendations

### Scoring module — `lib/product-finder-scoring.ts`

```ts
scoreProduct(
  candidate: WescoProduct,
  reference: WescoProduct,
  userBranchId?: string,
): RecommendationScore
```

Returns:

```ts
type ScoreFactor = { label: string; points: number; positive: boolean };
type RecommendationTier = "excellent" | "good" | "partial";
type RecommendationScore = {
  total: number;            // 0–100, clamped
  tier: RecommendationTier;
  factors: ScoreFactor[];   // ordered: highest positive contribution first
};
```

### Scoring model

| Factor | Points | Rule |
|---|---|---|
| Non-negotiable spec match | up to **+45** | `45 * (matchedNonNeg / totalNonNeg)`; if reference has no non-neg specs, award full 45 |
| Stock at user's branch | **+25** | branch stock > 0 at `userBranchId` |
| Stock at DC only | **+12** | no branch stock, but DC stock > 0 |
| Wesco Preferred line | **+15** | `candidate.preferred` |
| Cheaper than reference | up to **+8** | scaled by % cheaper, capped at 8; equal/more = 0 |
| Same subcategory | **+7** | `candidate.subcategory === reference.subcategory` |

Mismatches are surfaced as **neutral ⚠ notes** (0 points) so reps see trade-offs:
e.g. "Different brand than reference", "Missing spec: Voltage Rating".

Tiers: **≥85 Excellent** · **70–84 Good** · **<70 Partial**.

### Component — `RecommendationExplanation.tsx`

The approved blend:
- **Score ring + tier label** — `92%` ring next to `Excellent match`.
- **Top-2 reason chips** — strongest positive factors, always visible.
- **"Why recommended?" disclosure** — expands to the full factor list with
  per-factor points (`+45`, `+25`, …) and ⚠ notes.

Rendered inside `ProductCard` whenever a `referenceProduct` is present (i.e. an
active product is selected). Replaces the inline `computeCompatScore` and
compatibility bar currently in `ProductCard.tsx`.

### Tests — `lib/product-finder-scoring.test.ts`

- Full-match preferred in-branch product scores ≥ 85 → "excellent".
- Partial spec match scales correctly (e.g. 3/5 → +27).
- Out-of-stock candidate loses stock points; DC-only gets +12.
- Reference with no non-neg specs awards full spec points.
- Factor list ordering (highest positive first) and ⚠ notes present.
- `total` clamped to 0–100; tier thresholds at boundaries (84/85, 69/70).

---

## Feature 2 — Natural-Language Search

### Parser module — `lib/product-finder-nl-search.ts`

```ts
parseQuery(raw: string): ParsedQuery
```

```ts
type ParsedFilterKind = "priceMax" | "priceMin" | "branchStock" | "preferred"
                      | "category" | "brand";
type ParsedFilter = { id: string; kind: ParsedFilterKind; label: string; value: unknown };
type ParsedQuery = { text: string; filters: ParsedFilter[] };
```

Recognized patterns (case-insensitive):

| Input fragment | Filter |
|---|---|
| `under $50`, `below 50`, `< $50` | `priceMax = 50` |
| `over $20`, `above 20`, `> $20` | `priceMin = 20` |
| `$10-$30`, `$10 to 30` | `priceMin = 10, priceMax = 30` |
| `in stock`, `at my branch` | `branchStock = true` |
| `preferred` | `preferred = true` |
| `electrical`, `datacom` | `category` |
| known brand keyword | `brand` |
| leftover words | `text` (free-text query) |

Pure and order-independent; leftover tokens become `text`. Plain queries with no
recognized patterns return `{ text: raw, filters: [] }` — identical to today's
behavior.

### Store wiring — `lib/product-finder-store.ts`

- `appliedNlFilters: ParsedFilter[]`
- `runNlSearch(raw: string)` — parses, maps filters onto `FilterState`, sets
  `filters.query = parsed.text`, runs search, stores `appliedNlFilters`.
- `removeNlFilter(id: string)` — clears that filter from both `appliedNlFilters`
  and `FilterState`, re-runs search.

### UI — `SearchBar.tsx`

On search (Enter / Search button), call `runNlSearch`. Render the applied
filters as **removable chips** below the input (`Under $50 ✕`, `In stock ✕`).
Quick-pick chips and autocomplete are unchanged.

### Tests — `lib/product-finder-nl-search.test.ts`

- Each pattern individually maps to the right filter + residual text.
- Combined query (`20A breaker in stock under $50`) → text `20A breaker` +
  `branchStock` + `priceMax=50`.
- Range parsing (`$10-$30`).
- No-match query returns untouched text, no filters.

---

## Feature 3 — Saved Lists & History

**Model:** simple — **Favorites** (starred product IDs) + **Recently viewed**
(last 12 active products, deduped, most-recent-first). *Not* named lists.

### Store — `lib/product-finder-store.ts`

- `favorites: string[]` + `toggleFavorite(id)`, `isFavorite(id)`.
- `recentlyViewed: string[]` — pushed in `setActiveProduct` (dedupe, cap 12).
- Persistence: `localStorage` keys `pf_favorites`, `pf_recent`, written on change
  and hydrated in a `hydrateSavedState()` helper called alongside the existing
  `hydrateAuth()`.

### UI

- **Star toggle** on each `ProductCard` header (`aria-pressed`, accessible label).
- **`SavedAndRecentPanel.tsx`** on the landing/empty state: recently-viewed as a
  horizontal strip, favorites as a list. Clicking an item calls
  `setActiveProduct` to recall it.

### Tests — extend `lib/product-finder-store.test.ts`

- `toggleFavorite` adds/removes; `isFavorite` reflects state.
- `recentlyViewed` dedupes and caps at 12, most-recent-first.
- Persistence round-trips through a mocked `localStorage`.

---

## Polish Pass

- **Empty / landing state** (`EmptyState.tsx`): currently the no-active-product
  view is a bare grid. Replace with a guided landing that hosts the Saved &
  Recent panel and quick picks.
- **No-results state**: over-filtered searches currently render an empty grid;
  add an explicit "no matches — adjust filters" state with a clear-filters action.
- **Mobile + WCAG** review of every new component:
  - Chips: `#00573F` text on light-green tint; amber text uses `#8a6500` on white
    to pass normal-text contrast.
  - Score ring exposed as a labeled `role="progressbar"`.
  - Disclosure uses `aria-expanded`; chips and stars are real `<button>`s with
    `aria-pressed` / descriptive `aria-label`.

---

## New Types (`features/product-finder/types.ts`)

`ScoreFactor`, `RecommendationTier`, `RecommendationScore`, `ParsedFilterKind`,
`ParsedFilter`, `ParsedQuery`.

## Out of Scope

- Quote builder / cart export (deferred — not selected).
- Any real LLM or network call.
- Named/multiple saved lists, sharing, server-side persistence.

## Verification Gate

All must pass before the work is considered done:

```
npm run typecheck
npm run lint
npm test
npm run build
```

## Suggested Implementation Phasing

1. Scoring engine + `RecommendationExplanation` + `ProductCard` integration.
2. NL search parser + store wiring + `SearchBar` chips.
3. Favorites + recently-viewed store/persistence + star toggle + Saved & Recent panel.
4. Empty/no-results states + mobile/WCAG polish.

Each phase ships with its tests green.
