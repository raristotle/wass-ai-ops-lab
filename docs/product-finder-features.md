# Product Finder — Feature Listing

The complete capability list for the **AI Product Recommender**
(<https://app.raristotle.com/product-finder>), grouped by workflow.
For how-to detail see the [user guide](product-finder-help.md); for endpoints see
the [API guide](product-finder-api.md); for a presenter walkthrough see the
[demo script](product-finder-demo-script.md).

## Catalog & search

| Feature | Summary |
|---|---|
| 60,000-product catalog | Deterministic synthetic catalog — 6 categories, ~80 subcategories, ~77% electrical |
| Server-side search | Name / SKU / brand / spec search over the full catalog, paged 24 at a time |
| Type-ahead suggestions | Live dropdown of matching products as you type |
| Natural-language search | "20A breaker in stock under $50" → parsed into removable filter chips (price, stock, preferred, category, brand) |
| Quick picks | One-click common searches (Circuit Breakers, Cat6 Cable, IP Cameras, …) |
| Search history | Last 12 searches as clickable, persistent chips |

## Filtering

| Feature | Summary |
|---|---|
| Category / subcategory / brand filters | All six categories, ~80 subcategories, with live counts |
| Stock & preferred filters | In stock at my branch / at a DC / preferred suppliers only |
| Price range | Min/max price filter |
| Spec value facets | Per-spec checkboxes with live counts (Poles, Color, Type, …) |
| Spec range facets | Numeric min/max for Amperage, Voltage, Wattage, Lumens, kVA, Ports |
| Sort & view | Relevance, preferred, stock, price ↑↓, brand A–Z · list/grid toggle |

## Recommendations & product intelligence

| Feature | Summary |
|---|---|
| Find Alternatives | True functional **cross-references first** (✓ CROSS-REF = interchangeable on every canonical key spec), then closest SIMILAR matches; scored 0–100 with Excellent / Good / Partial tiers |
| Cross-reference precision | Quality-gated metric: **top-1 = 1.0** (#1 alternative is always a true equivalent when one exists), **precision@8 ≥ 0.98**; enforced by `lib/catalog/equivalence-metrics` test |
| Explainable scoring | "Why recommended?" point-by-point breakdown — specs, stock, preferred, price, type |
| **Out-of-stock substitutes** | OOS cards automatically offer the best in-stock substitute with Add / View actions (server-resolved) |
| Goes-well-with | Complementary cross-sell on the detail view (breaker → load center, …) |
| **Complete this job** | Basket-level cross-sell — surfaces complementary products the basket is missing (gaps only), one-tap add |
| Competitor cross-reference | Paste a competitor/legacy part number → Meridian equivalent; "Replaces" list per product |
| Spec compare | Side-by-side comparison of up to 4 products, differences + cheapest highlighted, PDF export |

## Product detail

| Feature | Summary |
|---|---|
| Branded product plates | Deterministic SVG image per product: category band, subcategory glyph, brand, SKU |
| Spec sheet | Full specification table with Required flags + printable PDF cut sheet |
| Volume pricing tiers | 1 / 10 / 50 / 100+ breaks, qualifying tier highlighted |
| Availability / ATP | Branch & DC stock, available-to-promise date, other stocking branches, transfer ETA |
| Lead time + watch | OOS lead-time estimate and "Notify when available" watch list |
| External sources | OOS fallback: distributor availability with price/qty/lead time + Where-to-Buy links |

## Basket, quoting & orders

| Feature | Summary |
|---|---|
| Basket | Quantity steppers, per-line volume/contract pricing, running total |
| Saved baskets | Name, save, reload, delete baskets — persistent per browser |
| Quote PDF | Branded quote: auto number, 30-day validity, rep & branch, priced line table |
| **Saved quotes + status** | Save a quote and track it Draft → Sent → Won / Lost; reload its lines into the basket; scoped per customer |
| **Email quote** (simulated) | Inline send form; records the quote as "Sent" for follow-up tracking |
| **Convert quote → order** | One-click conversion of a quote into a placed order; marks the quote Won + "✓ ordered" without touching the cart |
| **Rep margin** (internal) | Per-line and basket gross-margin %, color-coded; excluded from all customer-facing outputs |
| **Quantity stock warnings** | Flags cart lines where ordered qty exceeds available stock, with shortfall + backorder ETA |
| **Job templates / kits** | Save a basket as a reusable kit; "Add to Basket" merges it into the current cart |
| **Delivery ETA** | "Ships complete by" date in the cart — slowest line across branch/transfer/DC/lead-time tiers |
| Share basket | URL that rebuilds the exact basket (incl. customer/project) for any signed-in user |
| **CSV export** | One-click exports of search results (results bar) and the basket (with effective pricing + total), Excel-safe escaping |
| Orders & reorder | Place orders per customer; history with **expandable line detail** and one-click Reorder |
| BOM / list import | Paste or upload a parts list with quantities → matched lines added to the basket |

## Customers & pricing (simulated integration layer)

| Feature | Summary |
|---|---|
| Customer accounts | "Quoting for" selector drives pricing, orders, and quotes |
| Contract pricing | Category discounts + negotiated net prices, layered with volume tiers — List → Your price → You save % |
| Live inventory adapter | Branch/DC stock + ATP behind a swap-in interface |
| PIM provenance | Catalog source strip (source, count, last sync) |
| Adapter architecture | All integration seams in `lib/integration/` ready for real ERP/PIM/CRM/pricing systems |

## Account & app

| Feature | Summary |
|---|---|
| Demo auth & roles | sales / manager / admin accounts; branch drives stock scoring |
| Manager analytics | Role-gated Insights dashboard: KPIs, contract savings, top categories/products, orders over time, customer mix |
| **Quote pipeline** | Dashboard view: value/count by status, open vs. won/lost, win rate, conversion rate (won→ordered), and a stale-quote follow-up alert (>14 days) |
| **Interactive help** | "?" header button → searchable help topics with one-click "Try it" example searches |
| Favorites & recently viewed | Starred products and view history, persistent |
| Print support | Quote, spec sheet, and comparison print as clean documents |
