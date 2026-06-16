# Paste-to-quote velocity box (Sprint 1 · #1)

Upgrades the **Quick-Order Pad** into a spreadsheet-friendly paste box: a buyer drops a list of
`SKU qty` lines — from a prior order, a catalog, or a **competitor BOM** — and gets a resolved cart
in one click. Free; reuses shipped libs; no external API.

## What changed

`lib/product-finder-quick-order.ts` gained two pure, unit-tested functions:

- `aggregateQuickLines(parsed)` — collapses duplicate SKUs into one line, **summing** their
  quantities (case-insensitive), preserving first-seen order, clamped to the per-line ceiling. So
  `QO115 5` + `qo115 3` becomes a single `QO115` line at qty 8.
- `resolveQuickOrderSmart(parsed, exact, cross)` — resolves each line by **exact SKU first**, then
  falls back to the **cross-reference** resolver (competitor/legacy part number → Wesco product),
  tagging each line `exact` | `cross` | `none`.

`features/product-finder/QuickOrderModal.tsx` aggregates the paste client-side, then resolves the
SKUs against the **full catalog** server-side via `POST /api/products/quick-resolve` (exact SKU →
canonical `lookupCrossReference`, reusing the shared `resolveQuickOrderSmart` lib over `getCatalog()`
— not the curated demo subset). Cross-matched lines are badged with the competitor part they resolved
from. Unmatched lines are still flagged for review; nothing is silently dropped. SKU is the contract
— an unresolved line is flagged, not fuzzy-guessed.

## Try it

Ctrl/⌘-K → "Quick-Order Pad", paste a mix of Wesco and competitor SKUs (one per line, optional
quantity), **Resolve list** → competitor parts show a `↔ cross-ref` badge → **Add to cart**.

## Cost

$0 — pure parsing + the existing cross-reference and catalog libs. No external service.
