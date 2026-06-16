# Dense results table + comparison drawer (#11, #12)

## #11 — Dense-data table with smart column hiding

A third results view (**List ☰ / Grid ⊞ / Table ▦**) in `ProductGrid`: a scannable,
Linear/Airtable-style table of the catalog's rich metadata. Column definitions and visibility
logic are **pure** in `lib/product-finder-columns.ts` (unit-tested); `ResultsTable.tsx` renders
the table with a "▦ Columns" menu (smart column hiding) **persisted to localStorage**. Each
row's name opens the product detail; a per-row checkbox feeds the existing compare flow.
WCAG-clean (axe-tested).

Columns: SKU · Product · Brand · Price · Branch · DC · Lifecycle · Crosses · Preferred ·
Category · UoM (price / branch / lifecycle shown by default; the rest toggle on).

## #12 — Comparison drawer: rich-metadata rows

`SpecCompareModal` already provides the side-by-side comparison drawer (product header columns,
price + stock rows with cheapest/diff highlighting, spec rows, PDF export, add-all). Sprint 3
adds two rows that justify substitutions from the data the catalog already carries:

- **Lifecycle** — `lifecycleStatus` with NRND/EOL flagged in orange.
- **Documented crosses** — `verifiedCrossCount`, the second-source depth.

Both surface the same metadata as #11; covered by the columns unit tests + the dense-table
axe test, and the comparison drawer's existing render path.
