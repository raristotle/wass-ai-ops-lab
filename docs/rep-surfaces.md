# Rep-Facing Attach Surfaces (v5-S2)

Five surfaces that put the cross-sell engine (v5-S1) in front of a rep at the moment
they're authoring — paste an RFQ, prep a call, build a quote, fill a cart. All are
**$0 and deterministic**; the only optional paid path is an LLM RFQ parser in Quote
Copilot, dormant until an Anthropic key is set.

| # | Surface | Where | Engine |
|---|---|---|---|
| 5 | Quote Copilot | Ctrl/⌘-K → "Quote Copilot" | RFQ resolve + S1 companions |
| 6 | Account 360 | Ctrl/⌘-K → "Account 360" | subcategory adjacency graph |
| 7 | Segment Solution Builder | Cart → "Complete the …" | Wesco segment taxonomy |
| 8 | Services Attach | Cart → "Add Wesco services" | cart-shape rules |
| 9 | Preferred-brand swaps | Cart → "Preferred-brand swaps" | cross-ref + margin |

---

## #5 Quote Copilot — `lib/product-finder-quote-copilot.ts`

Paste an RFQ/takeoff → a draft quote where every resolved line arrives with its
companions. Reuses the shipped RFQ pipeline (`parseBomLines` → `matchBomScored`,
fuzzy + typo rescue) and the S1 companion rail (`/api/products/{id}/companions` per
line, merged + deduped).

- `copilotDraftLines(scored)` — matched lines, low-confidence flagged for review.
- `buildCopilotDraft(scored, attach, crossable)` → `{ lines, attach, summary }` —
  the attach rail is required-first, deduped, and never includes a drafted line.
- `copilotHeadline(summary)` — the result banner.

UI: `QuoteCopilotModal`. Required companions are pre-checked; the rep keeps/drops
add-ons, then adds the draft + kept companions to the cart in one action.

**Dormant LLM upgrade:** parsing a messy prose RFQ email into clean BOM lines turns
on only when `ANTHROPIC_API_KEY` is set (reuses the `assistant` health flag); the
deterministic parser is always the fallback. No model call ships otherwise.

## #6 Account 360 / whitespace — `lib/product-finder-account-360.ts`

`buildAccount360(history, adjacency, maxGaps)` → `{ purchased, whitespace, topReorder,
summary }`.

- **purchased** — families ranked by spend, with share.
- **whitespace** — for each owned family, its companion families (from the adjacency
  graph) the account has *never* bought, scored by the spend that "pulls" toward the
  gap. Required gaps (they buy the device, not the mandatory companion) get a fixed
  floor so they always sort first.
- **topReorder** — most-ordered SKUs.

Adjacency comes from `GET /api/companions/adjacency` (`subcategoryAdjacency()` in
`companion-graph.ts` — spec rules + affinity at the subcategory grain, no 200k
catalog). UI: `Account360Modal`, fed by the active customer's quote history.

## #7 Segment Solution Builder — `lib/catalog/wesco-segments.ts`

Wesco's three business units (EES / CSS / UBS) mapped to subcategories, plus curated
**solution templates** — the family set that makes a complete install.

- `segmentForSubcategory(subcat)` — explicit map, then keyword classifier, EES default.
- `solutionCoverage(template, cartSubcats)` → covered/gap families + a percentage.
- `bestSolutionFor(seedSubcat, cartSubcats)` — the template the seed belongs to with
  the most already-covered families (the package the cart is closest to finishing).

Served by `POST /api/cart/upsell`, which resolves a stocked product for each gap. UI:
the "Complete the …" strip on the cart (coverage meter + one-click gap adds).

## #8 Services Attach — `lib/product-finder-services-attach.ts`

`deriveCartShape(lines)` → `servicesForCart(shape)`. Conservative trigger rules over
the cart's shape:

- cut-to-length (sold-by-the-foot lines), kitting (multi-family BOM), panel labeling
  (distribution gear), VMI (≥3 consumable lines), staging (≥$10k), and jobsite
  delivery (always). Each offer carries the reason it fired. Pure client-side, $0.

## #9 Preferred-brand swaps — `lib/product-finder-private-label.ts`

- `cartPenetration(lines)` — line & value % that's already preferred.
- `preferredSwaps(lines, findPreferredEquiv, maxUnitPriceIncrease=0)` — for each
  commodity line, its preferred functional equivalent at the same-or-lower customer
  price, with the margin lift. The lever is modeled directly: a preferred / private-
  label line carries `PREFERRED_MARGIN_ADVANTAGE` (8 points) of extra margin on the
  line's revenue — INTERNAL only, never on a customer artifact.
- `penetrationAfterSwaps(lines, swaps)` — the lift if every swap is taken.

Served by `POST /api/cart/upsell` (equivalents from the shipped `findEquivalents`,
filtered to `preferred`). UI: the "Preferred-brand swaps" strip with per-line Swap +
"Swap all" and a before→after penetration meter.

---

## API surface

### `GET /api/companions/adjacency`
`{ adjacency: { [subcat]: { to, required }[] } }` — the subcategory companion graph.
Public read, $0.

### `POST /api/cart/upsell`
`{ skus[], qtys?[], branchId?, seedSku? }` → `{ resolved, swaps, penetration, solution }`.
Rate-limited (30/min), public read (reflects only the cart's own SKUs). Returns full
products for the swap targets and segment gaps so the client can add them straight to
the cart.

## Cost & honesty

Everything here is $0 and deterministic. The market-basket / behavioral signals stay
off until real order history is supplied; the LLM RFQ parser stays off until a key is
set. The private-label margin advantage is a documented, conservative internal
assumption — never shown to a customer.

## Tests

`lib/product-finder-quote-copilot.test.ts`, `lib/product-finder-account-360.test.ts`,
`lib/catalog/wesco-segments.test.ts`, `lib/product-finder-services-attach.test.ts`,
`lib/product-finder-private-label.test.ts`, plus the render tests
`features/product-finder/CartUpsellSection.render.test.tsx` and `Account360Modal.render.test.tsx`,
and the `quote-copilot` / `account-360` / `segment-builder` / `services-attach` /
`private-label` help topics.
