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
| **White-label brand mode** | The brand identity (name + logo lockup + accent) is a swappable config (`lib/brand.ts`): "Meridian" default + a "Wesco" profile. A header **Brand** switcher flips it live — logo, login, auth screen, quote PDF, and submittal all re-skin instantly (persisted in `pf_brand`). The pitch "this is *your* branded app" moment; real logo art + exact palette drop into a profile without touching components |
| **Enterprise SSO seam** | Login offers "Sign in with SSO" — a working demo flow that maps IdP group claims to the app role (`lib/auth/sso.ts`, tested), plus the real OIDC authorization-code start (`/api/auth/sso/{config,start}`) that activates when `SSO_*` env vars name an IdP (Azure AD / Okta / Ping). Password login stays. Token-exchange callback (with JWKS verification) is the documented onboarding step ([docs/sso.md](sso.md)) |
| **Procurement export (cXML + EDI 850)** | The cart exports a basket as a **cXML PunchOutOrderMessage** (Ariba/Coupa/SAP punchout) or an **EDI X12 850 purchase order** — the formats a customer's ERP/buying system actually consumes (`lib/procurement/`, pure + tested, valid envelopes). One click downloads the file; "how a quote becomes a real PO" |
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

## Platform reliability & security (Wave 3 hardening)

| Feature | Summary |
|---|---|
| **API rate limiting** | Fixed-window per-caller limiter (`lib/server/rate-limit.ts`, tested) on the cost- and write-sensitive routes — `/api/assistant` (20/min), `/api/crosses/match` & `/api/crosses/savings` (60/min), `/api/auth/sso/start` (30/min). Over-limit returns `429` with `Retry-After` + `X-RateLimit-*` headers. In-memory per instance today; Upstash/Redis is the documented multi-instance upgrade |
| **Security headers** | One middleware (`apps/web/middleware.ts`) sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, and `X-DNS-Prefetch-Control` on every response. Full CSP (per-route nonces) is the documented follow-up |
| **Health endpoint** | `GET /api/health` → `{ status, service, integrations }` with **booleans only** (assistant / sso / resend / mouser / digikey configured), no secret values — an uptime-monitor and readiness probe target |
| **Structured error logging** | `logApiError()` (`lib/server/log.ts`) emits one JSON line per server error (message + truncated stack); API responses never return internal messages or stack traces to the client |
| **Component/render test net** | React Testing Library + jsdom render tests for the render-critical UI (brand switcher, saved-searches bar, assistant panel) guard the store-selector render-loop class of regression, on top of the full pure-logic unit suite |
| **Security posture doc** | [docs/security.md](security.md) — headers, rate limiting, no-internal-leakage, XSS-via-React-escaping, CSV-injection guard, secrets handling, and the prioritized follow-up list |

## Sourcing intelligence & procurement readiness (Backlog Wave 1)

| Feature | Summary |
|---|---|
| **Product lifecycle status** | Every product carries a lifecycle status — Active / NRND / LTB (last-time-buy) / EOL / Discontinued — derived deterministically from the id (curated/verified real parts stay Active). Powers the EOL UX below (`lib/catalog/lifecycle.ts`). |
| **Lifecycle / EOL-risk UX** | "Design out the obsolete": obsolescent parts show a ⚠ status badge on result cards and the detail header, an **Active products only** sidebar filter (`onlyActive`, deep-linkable) hides them, and an obsolescent part's detail view surfaces the best **active successor we stock** with one-click "Use active part — add to cart" (`lib/catalog/successor.ts`). |
| **Second-source coverage score** | Reframes the cross-reference engine as single-source risk: each part is graded 1–5 (Single-source → Broadly sourced) by its distinct STOCKED interchangeable sources — true functional equivalents + documented verified crosses we stock (`lib/catalog/coverage-score.ts`, attached by `/api/products/[id]`); shown as a risk-coloured chip on the detail view, with a `bomSourcing` rollup for baskets. |
| **UNSPSC commodity classification** | Every product classifies to an 8-digit UNSPSC code (subcategory map → category fallback, granularity reported honestly: commodity/class/family/segment — `lib/catalog/unspsc.ts`). Emitted in the **cXML PunchOut** `Classification` element and the **EDI 850** PO1 `UN` qualifier — the validated code Ariba/Coupa require before catalog go-live. |
| **Approval-routing policy engine** | The single hard-coded 20%-margin rule is now a configurable policy (`lib/product-finder-approval-policy.ts`, tested): rules on margin band, order value (>$25k), and discount depth (>25% off list), each with an approver role and a time-based escalation window. Quotes save "Approval pending" when any rule fires, with the triggering reason recorded in the audit trail. |
| **Live commodity index (REAL, env-gated)** | With `FRED_API_KEY` set, the metals strip fetches REAL copper/aluminum prices from FRED (Federal Reserve Economic Data), converted to $/lb and cited by observation date; without a key it shows the labeled deterministic simulation. Per-request, never stored, zero cost until keyed (`lib/integration/commodity-live.ts`, `GET /api/commodity`, `commodity` boolean on `/api/health`). |
| **Guided engineering selectors** | NEC-grounded calculators (📐 Selectors toolbar button / Ctrl+K) that turn an engineering question into a code-correct answer AND a stocked SKU: **conduit fill** (smallest EMT/PVC trade size within NEC Ch.9 fill limits), **wire size** (the conductor that satisfies both ampacity and a voltage-drop target — whichever governs), and **breaker/OCPD sizing** (next standard rating per 240.6, 125% for continuous loads). Each answer resolves to an active in-stock product and one-click adds to the basket (`lib/catalog/nec-selectors.ts`, pure + tested). The only platform that connects an NEC calc to a distributor's priced inventory. |

## Post-purchase & inbound automation (Backlog Wave 2)

| Feature | Summary |
|---|---|
| **Inbound RFQ → draft quote** | Paste or upload a customer's messy takeoff/BOM (📥 RFQ → Quote toolbar button / Ctrl+K) and the app drafts the quote: every line fuzzy-matched + confidence-scored, competitor parts crossed to stocked equivalents, then one click adds the matched lines to the basket and saves a **draft quote** for the rep to review and send (`lib/product-finder-rfq.ts`). Deterministic — no AI key required; an LLM extraction step is the env-gated upgrade for more unstructured formats. |
| **Order tracking + jobsite delivery / will-call** | Every order in history gets a **Track order** timeline (Placed → Confirmed → Processing → Shipped/Staged → Out-for-delivery/Ready → Delivered/Picked-up) with a promised date derived from the stocking ETA, plus a **Jobsite delivery ↔ Will-call pickup** toggle that re-labels the flow (`lib/product-finder-tracking.ts`). Closes the gap where the app went dark after checkout; a carrier/WMS feed drops in behind the same seam. |
| **Self-service returns / RMA** | A **Start a return** action on any order: pick lines + a reason, get an **RMA number** + estimated credit, and track status (Requested → Approved → In-transit → Received → Credit issued) — surfaced in the 🔔 notification bell until resolved (`lib/product-finder-returns.ts`). Rounds out the post-purchase loop; a customer-facing RMA email is a roadmap fast-follow on the existing Resend path. |
| **Persistence + rate-limit + queue seams (env-gated, dormant)** | The durable-backend foundation, all dormant at zero cost: (1) a namespaced server store (`lib/server/persistence.ts`) that activates a **Neon** Postgres `PersistedRecord` table when `POSTGRES_URL` is set (HTTP serverless driver, table auto-created on first write — no migration), per-instance memory otherwise; (2) a **global** rate limiter (`lib/server/rate-limit.ts`) that switches from per-instance memory to **Upstash Redis** over REST when `UPSTASH_REDIS_REST_URL` + `_TOKEN` are set; (3) a job-queue signal (`lib/server/queue.ts` — inline today, separate-host BullMQ worker when `REDIS_URL` is set). `/api/health` reports `database`/`ratelimit`/`queue`. The first concrete consumer is the **inbound-RFQ intake log** (`POST/GET /api/rfq`, namespace `rfq-intake`) — the RFQ→draft modal records each draft best-effort, so it survives across instances once Postgres is wired. Activation recipe: [docs/persistence.md](persistence.md). |

## BOM intelligence & sourcing optimization (Backlog Wave 3)

| Feature | Summary |
|---|---|
| **BOM Health Score** | 🩺 BOM Health (toolbar / Ctrl+K) grades every basket line **A/B/C** on lifecycle, stock depth, single-source risk, and substitute availability, with a rollup (worst grade, average score, "N lines to review") and a per-line recommended fix — swap to the active successor, qualify a second source, or take a cheaper documented cross (`lib/catalog/bom-health.ts`, `POST /api/bom/analyze`). Composes the Wave-1 lifecycle, coverage, and successor engines into the durable worklist every BOM platform (Octopart, Arrow, Z2Data) sells. |
| **Landed-cost / bid-award optimizer** | The same analysis scores each line's supply options — the current part, documented stocked crosses, and the active successor — by **landed cost** (list price + estimated freight + a lead-time carrying penalty) and recommends the best award with an explainable rationale and the per-line savings, totalled across the basket (`lib/catalog/landed-cost.ts`). The distributor's sell-side mirror of the Coupa/Ariba bid-comparison agents — deterministic, no AI key; an LLM rationale is the optional upgrade. |

## Bid-readiness & conformance (Backlog Wave 4 — no-infra items)

| Feature | Summary |
|---|---|
| **Compliance & trade enrichment** | Every product carries derived compliance attributes — UL listing, RoHS / REACH-SVHC / Prop 65, country-of-origin, 10-digit HTS code, and **USTR Section 301 tariff exposure** (`lib/catalog/compliance.ts`, same deterministic-seed discipline as lifecycle/UNSPSC). The BOM Intelligence analysis (`/api/bom/analyze`) adds a per-line compliance flag set and a BOM rollup (lines flagged, tariff-exposed count) — the attribute set that makes the recommender bid-grade for submittals, AHJ approvals, and government/MRO work, with the 2026-relevant tariff lens. A real UL Product iQ / manufacturer-declaration feed is the env-gated upgrade. |
| **WCAG 2.2 AA conformance (CI-enforced)** | axe-core (via `vitest-axe`) runs over the render-critical feature modals on the jsdom test net — a structural WCAG violation fails the suite, the same gate every change passes. Conformance practices (dialog semantics, control labels, keyboard/Escape, colour-plus-text status, 24px targets) and the Lighthouse-CI / INP follow-ups are documented in [docs/accessibility.md](accessibility.md). The procurement gate for public-sector, utility, and enterprise accounts. |

## Job & project workspace (Backlog Wave 4 — persistence-activated)

These items were unblocked once durable persistence (Neon) went live. See [docs/persistence.md](persistence.md).

| Feature | Summary |
|---|---|
| **Job workspace** | A server-persisted **Job (project)** container (🗂️ Jobs toolbar / Ctrl+K) that groups the quotes, orders, and inbound RFQs for one jobsite under a single named project, with a live value rollup (quoted vs booked, counts per kind) and an open/won/closed status. The first durable *entity* the app owns: `POST/GET/DELETE /api/jobs` over the Neon-backed KvStore, with the model + rollup in the pure lib `lib/product-finder-job-workspace.ts`. Quotes/orders still live in the client store and are linked as denormalized snapshots, so the rollup stays correct and viewable server-side across instances. The container the transactional-MCP checkout and supplier portal build on. |
| **Transactional MCP + agentic checkout** | The MCP server (`mcp/meridian-mcp-server.mjs`) gains three **write** tools — `create_job`, `list_jobs`, and `place_order` — so an agent can go from search → cross-reference → actually **transact**, not just read. `place_order` posts to a new durable, **idempotent** `POST /api/orders` that resolves + prices each `{sku, qty}` server-side against the catalog and persists the order (Neon when configured), optionally rolling it onto a Job. Idempotency is by `clientRef` — a retried checkout returns the existing order rather than double-placing, the safety property an autonomous agent needs. Order model + pricing are a pure tested lib (`lib/product-finder-order-intake.ts`); the route stays thin. |
