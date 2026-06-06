# Search History + Collapsible Saved & Recent Panel — Design

**Date:** 2026-06-05
**Status:** Approved (design)
**Area:** `lib/product-finder-store.ts`, `features/product-finder/SavedAndRecentPanel.tsx` (+ small `CollapsibleSection`)

## Problem

The Saved & Recent panel shows Recently Viewed and Favorites, always expanded,
with no way to collapse them or clear the list. Users also want to see and re-run
the **search terms** they've typed.

## Decisions (user-approved)

| Question | Decision |
|---|---|
| "Hide with a dropdown" | **Collapse/expand toggle** (chevron header); collapsed state remembered |
| "Searched history" | **Track typed search terms** as a new Search History list; click to re-run |
| "Reset" | **Per-list Clear link** on each section header |

## Architecture

Search terms are captured in the store's `runNlSearch(raw)` — the single funnel
all search entry points (Enter, suggestion click, quick-pick) already pass
through. Empty/whitespace raw (the NoResults "clear" path, `removeNlFilter`) is
skipped. This mirrors the existing `recentlyViewed`/snapshot persistence and is
unit-testable in the node vitest setup.

### Store (`lib/product-finder-store.ts`)

New slice + actions:
- `searchHistory: string[]` — most-recent-first, **deduped case-insensitively**
  (an existing term moves to front rather than duplicating), capped at
  `MAX_SEARCH_HISTORY = 12`. Persisted to localStorage key `pf_search_history`.
- `addSearchTerm(term: string): void` — trims; no-op on empty; updates list +
  persists. Called from the top of `runNlSearch` when `raw.trim()` is non-empty.
- `clearSearchHistory(): void` — empties `searchHistory`, removes
  `pf_search_history`.
- `clearRecentlyViewed(): void` — empties `recentlyViewed` and `recentSnapshots`,
  removes `pf_recent` and `pf_recent_snap`.
- `hydrateSavedState()` also reads `pf_search_history` (via the existing
  `readArr` helper). localStorage guards use `typeof localStorage !== "undefined"`
  (project gotcha — node tests mock localStorage, not window).

`runNlSearch` change: first line (when `raw` trims non-empty) calls
`get().addSearchTerm(raw)`; existing parse/search behavior unchanged.

### Panel (`features/product-finder/SavedAndRecentPanel.tsx`)

`CollapsibleSection` helper (same file): props `{ title, count, collapsed,
onToggle, onClear?, children }`. Header is a button row — chevron `▾` (expanded)
/ `▸` (collapsed), title (uppercase, Wesco `#4F758B`), count badge, and an
optional **Clear** text link (right-aligned, `#4F758B` hover `#1D252D`) that
stops propagation. Body hidden when collapsed. `aria-expanded` on the toggle.

Collapsed state per section is remembered in localStorage
(`pf_collapsed_history`, `pf_collapsed_recent`, `pf_collapsed_favorites`),
read once on mount into component `useState`, written on toggle (guarded on
`typeof localStorage`).

Three sections (panel still returns null only when all three are empty):
1. **Search history** (full-width, top) — clickable **chips** of past queries;
   click → `runNlSearch(term)`; **Clear** → `clearSearchHistory()`.
2. **Recently viewed** — existing `MiniRow` list (cap 6 shown), collapsible,
   **Clear** → `clearRecentlyViewed()`.
3. **Favorites** — `MiniRow` list, collapsible. No Clear (the ★ toggle removes).

Layout: search-history block on its own row; Recently viewed + Favorites in the
existing 2-column grid below.

## Testing

Store unit tests (`lib/product-finder-store.test.ts`):
- `addSearchTerm` dedupe (case-insensitive, moves to front), cap at 12, order.
- `runNlSearch("gfci")` records "gfci"; `runNlSearch("")` records nothing.
- `clearSearchHistory()` empties list; `clearRecentlyViewed()` empties recents +
  snapshots.
- `resetStore()` enumerates `searchHistory: []`.

Components verified via typecheck + build + live browser check (type several
searches → chips appear → click re-runs → collapse hides each section and
survives reload → Clear empties).

## Out of scope

Server-side history, cross-device sync, search analytics, collapsing/clearing
Favorites differently than specified.
