# Cross-Sell Companion Engine (v5-S1)

The companion engine turns a single product (or a whole cart / BOM) into the set of
parts that **go with it** — the wall plate a switch needs, the fittings a run of
conduit needs, the surge protector usually bought with a panel. It powers the
**Cross-sell companions** section of the product-detail modal, the cart "complete
your order" rail, and four cross-sell MCP tools for agents.

It is **deterministic and $0**: no model calls, no external network, no new
dependency. It runs entirely against the in-memory synthetic catalog and gets
*sharper* — not *more expensive* — as real order history accumulates.

---

## What a "companion" is

Each companion carries three things beyond the product itself:

| Field | Meaning |
|---|---|
| `relation` | `"required"` (engineering-mandatory) or `"recommended"` (commonly attached) |
| `attachScore` | 0-100 rank — how strongly this belongs with the seed product |
| `reasons` | human-readable "why" lines (the spec rule, the lift, the affinity) |
| `sources` | which engines fired: `"spec-rule"`, `"market-basket"`, `"affinity"` |

`required` is used **conservatively** — only where leaving the companion out yields
an installation that does not work or does not meet code:

- Switches / Receptacles / Combination devices / Dimmers → **Wall Plates & Covers**
- Conduit / Flexible Conduit → **Conduit Fittings**
- Wire & Cable → **Lugs / Connectors**
- Cable Tray → **Strut & Channel**

Everything else is `recommended`.

---

## The three signals

The engine is a blend of three independent signals, each contributing edges that are
merged per target subcategory (`lib/catalog/companion-graph.ts`):

### 1. Spec-rule inference — `lib/catalog/companion-rules.ts`
A curated table of ~55 deterministic edges (`COMPANION_RULES`). Each rule names a
`from` subcategory, a `to` subcategory, a `relation`, a `why`, and an optional
`specHint` that reads the source product's specs to pick a better-matched companion
(e.g. a 2-gang switch → a 2-gang plate). This is the always-on backbone: it makes the
demo rich on day one, with no data.

### 2. Affinity map — `lib/catalog/goeswith.ts`
The shipped `AFFINITY` map (also behind the legacy "Goes well with" list). Reused, not
duplicated — the companion engine imports it and layers relation/score/why on top.

### 3. Market-basket association rules — `lib/catalog/market-basket.ts`
Classic association-rule mining over baskets (orders). For each ordered pair A→B it
computes:

```
support(A→B)    = count(A and B) / totalBaskets
confidence(A→B) = count(A and B) / count(A)
lift(A→B)       = confidence(A→B) / (count(B) / totalBaskets)
```

`lift > 1` means B is bought with A *more* than chance — a real co-purchase signal.
Rules are filtered by `minCount` (default 2) and `minLift` (default 1.0) and sorted by
lift. Grain can be `"subcategory"` (default, robust on sparse data) or `"product"`.

This signal is an **overlay**: it activates only when baskets are supplied, so the
engine stays honest — it does not invent behavioral data it doesn't have. The cart
endpoint accepts the caller's own order history (`baskets`) and feeds it in, so the
"gets smarter with history" claim is real and demoable without any server-side order
store.

---

## Scoring & blending

`aggregateSubcatEdges()` merges the three signals into one edge per target
subcategory: relation is upgraded to `required` if any signal says so; reasons and
sources accumulate; market-basket lift is captured. `scoreEdge()` then produces the
0-100 attach score:

- base: `required` = 70, `recommended` = 40
- `+ lift` contribution (market-basket)
- `+ 10` if a companion candidate is in stock at the branch
- `+ 8` if the candidate is a preferred line
- `+ 5` when spec-rule and market-basket agree
- clamped to `[0, 100]`

`bestInSubcategory()` picks the single best concrete product for each target
subcategory, honoring the spec hint first, then in-stock, then preferred/price. A
**materialized index** (`topBySubcategory()`) precomputes the top-12 products per
subcategory and per-product results are memoized — an in-memory stand-in for a Neon
materialized table that keeps lookups in the sub-10ms range. (Promoting this to a real
Neon materialized view is a documented dormant enhancement; it is **not** needed for
$0 operation.)

---

## Public API (engine)

`lib/catalog/companion-graph.ts`:

- `companionsFor(product, k=6, ctx={})` → `Companion[]` — the single-product rail,
  required-first then by attach score, never including the seed.
- `completeAssembly(products, ctx={}, k=6)` → `{ missingRequired, recommended }` —
  given a set, the required companions whose subcategory is **absent**, plus top
  recommendations (never overlapping the missing-required set).
- `attachSuggestionsForCart(products, ctx={}, k=6)` → `Companion[]` — the deduped
  cart-level attach rail, excluding items already in the cart.
- `_resetCompanionCache()` — test/SSR helper.

`CompanionContext` carries `branchId`, an optional `rulesBySubcat` (the mined
market-basket overlay), and `excludeIds`.

---

## HTTP surface

### `GET /api/products/{id}/companions?branchId=&k=`
The always-on single-product rail for the UI. Returns the **full** `CatalogProduct`
for each companion (so the client can add it to the cart or open its detail), plus
`relation` / `attachScore` / `reasons` / `sources`. `k` is clamped 1-12 (default 6).

```jsonc
{
  "sku": "SW-...",
  "required": 1,
  "companions": [
    { "relation": "required", "attachScore": 82, "reasons": ["Required: a switch needs a wall plate"],
      "sources": ["spec-rule"], "product": { /* full CatalogProduct */ } }
  ]
}
```

### `POST /api/companions`
The cart / BOM endpoint (and the agent-facing surface — slim product shapes).
Rate-limited (30/min).

```jsonc
// request
{ "skus": ["SW-1","CDT-1"], "mode": "complete-assembly" | "attach",
  "branchId": "B-HOU-01", "baskets": [ { "items": [ { "productId": "x", "subcategory": "Circuit Breakers" } ] } ] }
```

- `mode: "complete-assembly"` → `{ resolved, missingRequired[], recommended[] }`
- `mode: "attach"` (default) → `{ resolved, attach[] }`
- Supplying `baskets` activates the market-basket lift overlay for that request.
- Unresolved SKUs are dropped; an all-unresolved request returns `{ unresolved: true, … }`.

---

## MCP tools

`mcp/meridian-mcp-server.mjs` exposes the engine to agents:

| Tool | Calls | Returns |
|---|---|---|
| `get_companions({ sku, branchId? })` | `POST /api/companions` (attach, one SKU) | companions for one SKU |
| `complete_assembly({ skus, branchId? })` | `POST /api/companions` (complete-assembly) | `missingRequired` + `recommended` |
| `attach_suggestions({ skus, branchId? })` | `POST /api/companions` (attach) | cart-level attach rail |
| `get_substitutes({ sku })` | `product_detail` | verified cross-reference substitutes |

All return compact, agent-friendly shapes (`sku`, `name`, `relation`, `attachScore`,
`reasons`, `inStock`).

---

## UI

`features/product-finder/CompanionsPanel.tsx` renders the rail on the product-detail
modal: required companions grouped under **"Complete the assembly"** with an **"Add all
required"** one-click CTA, then **"Frequently attached"** recommendations. Each row
shows the relation badge (green = Required, blue = Add-on), the attach score, the price,
and a `+` add-to-cart button; clicking the row opens that companion's detail.

---

## Cost & honesty

- **$0.** No model calls, no paid API, no new infra. Spec-rule + affinity are pure
  in-process data; market-basket is pure arithmetic over baskets the caller already has.
- **No invented behavior.** Market-basket lift only appears when real baskets are
  supplied; otherwise the rail is the deterministic engineering view.
- **Dormant enhancement (documented, not built):** promote `topBySubcategory()` to a
  Neon materialized view + Upstash cache if catalog scale ever demands it. Still $0
  until an operator opts in.

---

## Tests

- `lib/catalog/companion-rules.test.ts` — rule dataset shape, required edges, `specValue`.
- `lib/catalog/market-basket.test.ts` — support/confidence/lift math, filters, grains.
- `lib/catalog/companion-graph.test.ts` — required-first ordering, market-basket overlay,
  memoization, complete-assembly missing-required detection, cart dedup.
- `features/product-finder/CompanionsPanel.render.test.tsx` — required/recommended split,
  attach score, "Add all required", single-add.
- `lib/product-finder-help-content.test.ts` — the `cross-sell-companions` help topic.
