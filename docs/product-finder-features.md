# Product Finder — Feature Listing

The complete capability list for the **AI Product Recommender**
(<https://app.raristotle.com/product-finder>), grouped by workflow.
For how-to detail see the [user guide](product-finder-help.md); for endpoints see
the [API guide](product-finder-api.md); for a presenter walkthrough see the
[demo script](product-finder-demo-script.md).

## Catalog & search

| Feature | Summary |
|---|---|
| 200,000-product catalog | Deterministic synthetic catalog — 6 categories, ~80 subcategories, ~77% electrical |
| Server-side search | Name / SKU / brand / spec search over the full catalog, paged 24 at a time |
| Type-ahead suggestions | Live dropdown of matching products as you type |
| Natural-language search | "20A breaker in stock under $50" → parsed into removable filter chips (price, stock, preferred, category, brand) |
| **Trade-term synonyms** | ~36 trade terms understood (romex → NM-B, GFI → GFCI, cat 6 → Cat6, EMT → conduit, wire nut, load center, wall pack, PoE, …), rewritten into removable chips before parsing |
| **"Did you mean?" typo tolerance** | Misspellings get a one-click suggestion; zero results with one confident fix auto-applies with a revertible "Showing results for X" notice |
| **Voice search** | Mic button in the search box (Chrome/Edge) — live dictation, transcript normalized ("twenty amp breaker" → "20A breaker") and run through NL search |
| **Deep-linkable searches** | The URL always reflects the current query/filters/sort (same grammar as the search API); "Copy link" button next to CSV export; coexists with `?cart=` share links |
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
| **"For you" rail** | Landing-view recommendations from your own data: **Time to reorder** (frequency-ranked, DUE badge 30+ days after last order, qty-prefilled Add), **From your favorites**, **Goes well with your orders** cross-sell; follows the active customer (walk-in sees all history with customer chips) |
| **Ask Meridian — Job Wizard** | Pick a job (200A service upgrade, 12 network drops, LED retrofit, 8-camera install, EV charger) → every step resolves to a stocked, priced catalog product (branch stock preferred) with swappable alternates, qty steppers, optional-step toggles, and an estimated total; one click adds the whole bill of materials to the basket. Deterministic; conversational version on the roadmap |
| **BOM match confidence** | Every Import List/BOM line scored 0–100% (exact SKU = 100%; exact numbers enforced — "20A" never silently matches a 200A part); non-high-confidence lines list up to 2 alternates with one-click **Use** swap; typo lines auto-corrected ("circut breakr" → "circuit breaker") and flagged; "n to review" summary |

## Product detail

| Feature | Summary |
|---|---|
| Branded product plates | Deterministic SVG image per product: category band, subcategory glyph, brand, SKU |
| **Distinct subcategory artwork + key-spec callout** | All 79 subcategories now carry their own stroke glyph (was 54 shared); the detail view's plate adds a key-spec badge (e.g. "20A") picked by priority (Amperage → Main Rating → … → Voltage, ≤8 chars) |
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
| **Submittal package (PDF)** | Approval-ready document for the whole basket: cover page + index + one full spec sheet per item |
| **Below-margin approval** | Quotes under a 20% margin floor auto-flag "Approval pending"; managers Approve/Reject; conversion blocked until signed off |
| **Saved quotes + status** | Save a quote and track it Draft → Sent → Won / Lost; reload its lines into the basket; scoped per customer |
| **Email quote** (simulated) | Inline send form; records the quote as "Sent" for follow-up tracking |
| **Convert quote → order** | One-click conversion of a quote into a placed order; marks the quote Won + "✓ ordered" without touching the cart |
| **Rep margin** (internal) | Per-line and basket gross-margin %, color-coded; excluded from all customer-facing outputs |
| **Line price override** | ✎ price on any cart line — custom unit price with guardrails (never above list, never below 5% margin over estimated cost; out-of-band entries snap to the bound); CUSTOM badge + reset; flows through quote sheet, saved quotes (per-line price captured), orders, and CSV; deep discounts still trip the 20% approval floor |
| **Customer quote link** | Per saved quote — copies a no-login link where the customer reviews the branded quote and **Accepts** (converts to order, marks Won), **Declines** (marks Lost), or **Requests changes** (counter-offer); expiry and approval-pending guards; copying a Draft's link auto-marks it Sent |
| **Counter-offers** | Customer "Request changes" notes flow back as an amber **COUNTERED** badge + inline note on the quote, a ↩️ bell notification, and a pipeline alert in Insights — answer with one-click **Revise** |
| **Quote revisions** | **Revise** loads an open quote (lines, customer, note, terms) into the basket; Save Quote creates **v2** linked to the original; superseded versions leave the pipeline/alerts and their customer links say a newer version exists; revisions chain (v3, v4…) |
| **Quote audit trail** | Per-quote **History**: created/status/approval events with actor names, customer link copies, counter-offers, conversion, and revision links — append-only, capped at 50 |
| **Quote notes & terms** | Free-text customer note + selectable T&C blocks (freight, returns, payment, commodity escalation, lead times) on the quote sheet — printed on the PDF and shown on the customer acceptance page |
| **Win/loss pricing guidance** | 📊 line under the basket margin: how quotes in the current margin band have historically closed (needs ≥3 decided quotes in the band); full **Pricing Win/Loss** card in Insights with per-band win rates and won-vs-lost average margins; fresh browsers seed a simulated quote history |
| **Quantity stock warnings** | Flags cart lines where ordered qty exceeds available stock, with shortfall + backorder ETA |
| **Job templates / kits** | Save a basket as a reusable kit; "Add to Basket" merges it into the current cart |
| **Delivery ETA** | "Ships complete by" date in the cart — slowest line across branch/transfer/DC/lead-time tiers |
| Share basket | URL that rebuilds the exact basket (incl. customer/project) for any signed-in user |
| **CSV export** | One-click exports of search results (results bar) and the basket (with effective pricing + total), Excel-safe escaping |
| Orders & reorder | Place orders per customer; history with **expandable line detail** and one-click Reorder |
| BOM / list import | Paste or upload a parts list with quantities → confidence-scored matched lines (see **BOM match confidence**) added to the basket |
| **Bulk price & availability** | Paste/upload many SKUs/part numbers → priced, in-stock, cross-referenced table (RFQ response); CSV export + add-to-basket |

## Customers & pricing (simulated integration layer)

| Feature | Summary |
|---|---|
| Customer accounts | "Quoting for" selector drives pricing, orders, and quotes |
| **Customer health scores** | Order-cadence tracking per account ("usually orders every 30 days — now 38 quiet"): Healthy/Watch/At-risk dot under the customer selector, 📉 bell alert for at-risk accounts, and a most-urgent-first **Customer Health** panel in Insights |
| **Metals index (simulated)** | Deterministic daily Copper/Aluminum index strip on the landing view with 30-day trends; copper-up triggers a "quote wire & cable now" nudge; quotes and the acceptance page cite the index date their pricing reflects |
| **Seasonal demand signals** | Weekly rotating merchandising banner (storm prep, heat advisory, construction kickoff, datacom refresh) with one-tap trending searches — simulated, feed-swappable |
| Contract pricing | Category discounts + negotiated net prices, layered with volume tiers — List → Your price → You save % |
| Live inventory adapter | Branch/DC stock + ATP behind a swap-in interface |
| **Live distributor pricing (REAL)** | Mouser + Digi-Key active: verified products' detail views fetch real price breaks, live stock, and datasheets per-request (never stored); simulated SKUs are never sent out. Try `AF09-30-10-13` |
| **Verified cross-references (source-backed)** | 200 pairs, every one citing the official document that states it (ABB competitor lookup, Mersen pocket cross guide, Hammond's Hoffman cross table, Hubbell bin-stock guide, Signify/Sylvania ballast guides, Rockwell migration profiles…): explainable match reason, attribute agreement/conflicts, source-stated attributes, source-derived warnings, confidence by source authority, <95% suppressed from production. Contradicting sources are settled by a documented rule (authority > quality score > recency); resolutions are listed in the data-quality report. Brand hierarchy (51 sourced brand→parent entries) and a provenance gate (≥95 confidence required; unsourced records quarantined) back the verified catalog — see [source-registry.md](source-registry.md) and the auto-regenerated [data-quality-report.md](data-quality-report.md). Try `FRN-R-30` |
| **Cross-reference source registry** | The 1,000-row source workbook ingested as a 166-source registry (`data/real/cross-source-registry.ts`): each source classified by access (free/registration/licensed), format (PDF/HTML table, interactive tool, API), and ingest status (ingested / ingestible / requires-browser / requires-API-key / requires-license); 13 sources extracted so far, truncated workbook URLs flagged honestly |
| **Cross-Reference Explorer** | `/product-finder/crosses` (also Ctrl+K): browse every source-backed pair — filter by brand/MPN/source kind, stocked-side indicators, source links, confidence — plus the full source registry with status chips. Read-only, deep-linkable |
| **Competitor-BOM conversion** | Import List / BOM recognizes documented competitor part numbers (`lib/catalog/bom-cross.ts`, `POST /api/crosses/match`): a cited "Verified cross — we stock the equivalent" suggestion per line, one-click swap, "N competitor parts crossable to stock" in the summary. Only ≥95%-confidence sources are ever suggested |
| **Cross badges on result cards** | Search results show ⇄ N VERIFIED CROSSES on verified/curated products with documented pairs (search API attaches `verifiedCrossCount`); click-through to the detail panel |
| **Substitute-&-save in quotes** | Each cart/quote line with a cheaper STOCKED documented cross shows the swap and the money it saves (`lib/catalog/cross-savings.ts`, `POST /api/crosses/savings`): unit + line savings, % less, source link, one-click "Swap & save"; a basket banner totals the documented savings. Pricing of both sides honors overrides/contract/volume |
| **Bulk cross-reference** | Paste/CSV up to 100 competitor part numbers (Bulk Cross-Ref, also Ctrl+K) → table of stocked equivalents with cited sources, per-row View/Add, Export CSV, and Add-all-to-basket. Reuses the verified cross engine; only ≥95% sources suggested |
| **Saved searches + alerts** | Save the current query+filters as a named, re-runnable, deep-linkable entry (★ Save this search); chips re-run it; a per-search bell toggles new-match alerts that surface in the notification bell (`lib/product-finder-saved-search.ts`). Two demo searches seed on first load |
| **Cross-coverage analytics** | Manager dashboard card (`/api/crosses/coverage`): source-backed pairs, both-sides-stocked %, pairs by category, source ingest-status mix, and the largest brands not yet hierarchy-modeled — straight from the data-quality report |
| **Cross review queue** | Cross-Reference Explorer "Review queue" tab: sub-95% pairs (distributor/industry tables) with Approve/Reject per pair, persisted locally, with pending/approved/rejected counts — the human-in-the-loop promotion seam |
| **Ask Meridian (conversational AI)** | Chat assistant (💬 toolbar button / Ctrl+K) that answers in plain English — search, cross-reference a competitor part to what we stock (with sources), spec Q&A, availability — grounded ONLY in catalog/cross tool results (`lib/product-finder-assistant.ts`, `/api/assistant` Anthropic tool-use loop). **Env-gated behind `ANTHROPIC_API_KEY`** like Resend: deploys dormant with a labeled "preview mode" banner and the Job Wizard fallback; zero AI cost until a key is set. Tools mirror the MCP server; never invents SKUs/specs/crosses |
| **MCP server** | `mcp/meridian-mcp-server.mjs` — a stdio Model Context Protocol server exposing `search_products`, `cross_reference`, `bulk_cross_reference`, `product_detail`, `check_availability`, `coverage_summary` as agent tools, backed by the live REST API. Zero AI cost; connect from Claude Desktop / Claude Code (`npm run mcp`, see [mcp/README.md](../mcp/README.md)). The "agentic procurement" surface |
| **Branch demand forecast** | Insights panel: trailing-90-day demand (orders + won quotes) by subcategory with trend arrows and a 30-day stocking projection; rows drill through to the subcategory |
| **Real quote email (Resend)** | With `RESEND_API_KEY` set, Email Quote delivers a real branded email — line table, note/terms, and a Review & Accept button opening the customer link; without a key it falls back to the labeled simulated send |
| PIM provenance | Catalog source strip (source, count, last sync) |
| Adapter architecture | All integration seams in `lib/integration/` ready for real ERP/PIM/CRM/pricing systems |

## Account & app

| Feature | Summary |
|---|---|
| Demo auth & roles | sales / manager / admin accounts; branch drives stock scoring |
| **Demo role quick-switcher** | Header "Demo role:" select (with a demo pill) swaps Sarah Chen (sales) / Marcus Rivera (manager) / Admin User instantly — no retyping credentials; Insights link and approval powers follow the role; cart/orders persist across switches |
| **Guided tour** | 7-step non-blocking tour card (welcome → NL search → filters → alternatives → basket & quote → insights → more tools) with one-click "try it" actions; auto-opens once per browser, restartable from the Help panel |
| **Command palette** | Ctrl+K / ⌘K (or the header ⌘K button) — jump to Search/Insights (role-gated), open Basket/Help/BOM import/Bulk pricing, restart the tour, switch demo role, quick-pick or free-text search |
| Manager analytics | Role-gated Insights dashboard: KPIs, contract savings, top categories/products, orders over time, customer mix |
| **Analytics drill-through** | Every KPI card, Top Categories bar, top-product row, customer-mix row, quote-status tile, and orders-over-time point clicks through to the underlying search, product, customer, quotes, or orders |
| **Quote pipeline** | Dashboard view: value/count by status, open vs. won/lost, win rate, conversion rate (won→ordered), an approval-needed alert (below-margin), and a stale-quote follow-up alert (>14 days) |
| **Interactive help** | "?" header button → searchable help topics with one-click "Try it" example searches |
| **Notification center** | 🔔 header bell with unread badge: below-margin approval requests (managers/admins), stale-quote follow-ups (>14 days), customer **counter-offers**, restock-watch alerts with estimated dates, and **at-risk customer** alerts; click-through deep-links to the quote section, product detail, or customer orders; read state persists |
| **Mobile field-rep layout** | Phone-ready (390px+): full-width basket drawer, bottom-sheet filters, single-column For-you rail, viewport-anchored notifications, mobile-first customer quote page |
| Favorites & recently viewed | Starred products and view history, persistent |
| Print support | Quote, spec sheet, and comparison print as clean documents |
