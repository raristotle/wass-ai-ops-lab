# Buy-Again rail + margin optimizer (Sprint 3 · #6, #14)

Two free, client-side enhancements that turn shipped data into repeat-order velocity and margin.

## "Buy it again" rail (#6)

`features/product-finder/BuyAgainRail.tsx` — an Amazon-Business/Grainger-style reorder surface on
the landing (mounted before `ForYouRail` in `apps/web/app/product-finder/page.tsx`):

- **Quick-add velocity chips** for the customer's most-ordered SKUs — ranked + "due" flagged by the
  shipped `reorderSuggestions()` engine (`lib/product-finder-foryou.ts`); each chip adds the last
  ordered quantity.
- **One-click reorder of a recent whole order** via the shipped `reorder(id)` action (previously only
  reachable from the Quick-Order Pad).
- Renders nothing for an account with no order history; scopes to the active customer.

## Whole-basket margin optimizer (#14)

`lib/product-finder-margin-optimizer.ts` (pure, unit-tested) + a collapsible **Margin optimizer**
panel in `CartDrawer`. It composes the existing margin model (`estimatedUnitCost` / `marginPct` /
`basketMargin`), the per-line override guardrails, and the substitute-&-save crosses into one pass:

- Flags **low-margin lines** (below the 15% "low" tier).
- For each, finds the best **spec-equivalent stocked cross that lifts the line's margin** (≥2 pts),
  showing the margin gained **and** the customer price delta so the rep can judge the trade.
- Shows the **blended before→after basket margin** and a one-click "apply all swaps".
- Internal-only — never shown on customer quotes. Reusable quote templates already ship as
  `JobTemplate`s in the cart drawer.

## Cost

$0 — both reuse shipped libs and data; no external service, no env vars.
