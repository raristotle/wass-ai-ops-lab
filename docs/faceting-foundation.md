# Faceting foundation (v3 Sprint 2)

Three deterministic, $0 search/faceting features. Sprint 2 of the third top-20
([docs/roadmap-next20-v3.md](roadmap-next20-v3.md)). No new external calls, no new
bundle weight (First Load JS held at 103 kB).

## #6 — Facets & sort for every Table column

Every attribute the dense Table view shows is now **sortable** and (where it
wasn't) **filterable** — closing the "see it but can't act on it" gap.

- **Sortable headers** — clicking any column header sorts the full result set by
  that column (server-side). Each `COLUMNS` entry carries a `sort` SortKey; the
  header shows ▲/▼ for the active column (`aria-sort` set). New server sorts:
  `nameAsc`, `skuAsc`, `dcStock`, `crosses`, `subcatAsc`, `uomAsc`,
  `lifecycleActive` (in `lib/catalog/search.ts`, the `SortKeySchema`, and the
  sort dropdown so a header-set sort and the dropdown stay in sync). `crosses`
  sorts via `crossCountForSku` (the same source the route uses).
- **Documented-crosses filter** — the "Crosses" column had no filter; added
  `onlyWithCrosses` ("Documented crosses only") in the sidebar, wired through the
  search engine, URL serialization, the applied-filters bar, and the store.

> Deliberately deferred: per-status lifecycle facets (the `onlyActive` filter
> already covers lifecycle) and a UoM facet (near-zero cardinality). SKU is
> covered by free-text search.

## #4 — Post-query "Refine by" suggestions

After a search, a **Refine by** row suggests the highest-signal one-tap
narrowings — *filters, not search terms*. `RefineByBar` reads the result-set
facet distribution already returned by search:

- `SearchResponse.refineFacets` (new) adds **Brand** + **Subcategory** enum
  facets with full-set counts (`computeRefineFacets` over the base-matched set);
  spec facets come from the existing `facets`.
- The pure `lib/product-finder-refine.ts` `buildRefineChips(...)` **round-robins**
  across facets for diversity, ranks by count within each round, and excludes
  anything already applied. Each chip shows its match count and applies the right
  filter (brand / subcategory / spec) on click.
- Shown only once the user has engaged (a query or a category/brand selection),
  so it stays out of the cold landing view.

## #8 — Scoped "search within this category"

When a typed query strongly matches a category or subcategory name, the
autocomplete offers **"Search only in {X}"**. The pure
`lib/product-finder-scope-suggest.ts` `scopeSuggestion(query)` matches
conservatively (subcategory over category; exact > prefix > contains; most
specific name wins) and never returns a non-existent branch. Selecting it scopes
browsing to that branch and clears the box to type within — and the scope shows
as a **removable chip in the applied-filters bar** (Sprint 1), so one tap expands
back. Follows NN/g's "scope only on explicit action" guidance.

## Tests

Pure cores unit-tested (`product-finder-refine`, `product-finder-scope-suggest`),
existing search/URL round-trip suites still green. Full suite at 1680 tests.
