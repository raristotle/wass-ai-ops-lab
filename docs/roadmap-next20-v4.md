# Meridian Product Finder — Fourth top-20 backlog (v4)

Produced **2026-06-18**, after the first three top-20s (16 sprints, 60 items) shipped to
prod. Ranked by **value ÷ cost** (dual-lens, each 1–10; higher value good, higher cost bad)
and clustered into **6 dependency/cost-aware sprints**.

> **Method note (transparency).** The multi-agent web-research workflow that produced the
> prior three refreshes could not run this time — the account hit its **weekly usage limit**
> (resets 10pm ET). This shortlist was therefore synthesized from **first-hand knowledge of
> the full shipped surface** (53 API routes, 170 libs, 78 components, 29 integration flags —
> see the roadmap memory) plus electrical-distribution domain analysis, rather than fresh
> external research. **Pricing / free-tier / API-contract specifics for the integration items
> (Sprints 5–6 especially) should be web-verified at each sprint's pickup** — exactly when the
> prior sprints verified them. Re-running the deep research workflow after the limit resets is
> a good optional first step for Sprint 5/6 grounding.

## What's already shipped (exclusion list — not re-proposed)

Hybrid keyword+fuzzy search (RRF + dormant Cohere rerank), full faceting/refine/scoped search,
cross-reference engine (+ confidence, gaps, bulk, competitor-BOM), quotes/pipeline (revisions,
audit trail, counter-offers, terms, customer acceptance page, margin guardrails+optimizer, SPA
rebates, tariff landed-cost), BOM intelligence (health, bid-award, fuzzy match, plan-takeoff
import), VMI, scan-to-reorder + cycle-count (+ OCR nameplate), order tracking + jobsite
delivery/will-call + RMA, aggregated offer ladder (Meridian+Mouser+Digi-Key+ECIA+OEMsecrets),
commodity/FX/tax/geocoding/address/weather/shipping/CRM/SMS/Slack/email/web-push seams,
digests, analytics (win-loss, customer health, rep scorecard, demand forecast, seasonal),
recommendations (also-bought, For-You, substitute-save), MCP server (read + transactional) +
registry, conversational Ask Meridian + datasheet RAG + spec-match agent + EOL sweep agent +
guided NEC selectors, lifecycle/EOL + second-source + UNSPSC + compliance/trade enrichment,
white-label, full per-tenant SSO (OIDC), procurement (cXML PunchOut L2, EDI 850, CIF,
OrderConfirmation, ShipNotice, multi-network), **Stripe deposit/ACH**, persistence (Neon) +
rate-limit (Upstash), observability (health/Sentry/PostHog), security + WCAG 2.2 AA, command
palette, keyboard nav, compare tray, intent-prefetch, applied-filters bar, dense table,
quick-order pad, job workspace, supplier portal, notification center.

## Ranked shortlist (by value ÷ cost)

| # | Item | Category | V | C | V/C | Cost band |
|---|---|---|---|---|---|---|
| 1 | **NEC engineering calculators** — conduit fill, voltage drop, wire ampacity, box fill → recommend the right wire/conduit/box and add to cart | vertical | 9 | 3 | **3.00** | $0 |
| 2 | **Submittal / O&M package generator** — auto-assemble a cut-sheet/spec/compliance PDF bundle for a quote or BOM | vertical | 8.5 | 3.5 | **2.43** | $0 |
| 3 | **Quote e-signature** — legally-binding accept on the customer page (Dropbox Sign, dormant) | integration | 8 | 3.5 | **2.29** | low |
| 4 | **pgvector semantic search** — embeddings recall layer fused into the shipped RRF, on the existing Neon (dormant embeddings) | AI | 9 | 4 | **2.25** | low |
| 5 | **Audit log + compliance export** — tamper-evident activity log + CSV/JSON export (enterprise/SOC2 readiness) | infra | 6.5 | 3 | **2.17** | $0 |
| 6 | **Lighting/utility rebate lookup** — match a fixture to DLC QPL / utility rebates (free data) | vertical | 7.5 | 3.5 | **2.14** | $0 |
| 7 | **Kitting / assemblies** — bundle SKUs into a sellable kit with price/stock rollup; quote/reorder as one | feature | 8 | 4 | **2.00** | $0 |
| 8 | **Rep next-best-action / coaching** — rules over shipped analytics (stale quotes, at-risk customers, cross-sell + rebate gaps) | feature | 7.5 | 4 | **1.88** | $0 |
| 9 | **Cut-to-length / by-the-foot CPQ-lite** — wire/conduit/strut sold by length with price + ampacity from the NEC engine | vertical | 7.5 | 4 | **1.88** | $0 |
| 10 | **Estimating / Procore BOM export** — push a BOM to Accubid/McCormick/ConEst/Procore item formats (complements the shipped import) | integration | 7 | 4 | **1.75** | low |
| 11 | **Data-quality / catalog-enrichment scoring** — spec-completeness, datasheet/image-backfill flags, dedupe; feeds every downstream feature | infra | 7 | 4 | **1.75** | $0 |
| 12 | **Will-call pick-ticket + branch ops queue** — pick lists + counter queue completing the will-call loop | feature | 6.5 | 4 | **1.63** | $0 |
| 13 | **Customer self-service portal** — logged-in order history, invoices, reorder, deposit status (reuses the shipped SSO/tenancy) | feature | 8 | 5 | **1.60** | low |
| 14 | **Visual part identification** — photograph a part/fitting → candidate SKUs (dormant vision model; extends OCR nameplate) | AI | 8 | 5 | **1.60** | medium |
| 15 | **QuickBooks / accounting sync** — push a won order's invoice + customer (free API, dormant) | integration | 7 | 4.5 | **1.56** | low |
| 16 | **Spanish localization (i18n)** — field-crew UI in Spanish (+ framework for more locales) | feature | 7 | 4.5 | **1.56** | low |
| 17 | **B2B net-terms / financing** — net-30 / pay-over-time at checkout (Balance/Resolve, dormant; complements Stripe deposit) | integration | 7.5 | 5 | **1.50** | medium |
| 18 | **Pricing intelligence / competitive monitoring** — track market/competitor price points, flag margin risk | AI/data | 7.5 | 6 | **1.25** | medium |
| 19 | **IDEA / ETIM catalog-data ingestion** — industry PIM feed for real catalog depth + standardized attributes | data-API | 8 | 7 | **1.14** | high |
| 20 | **ERP connector seam** — Epicor Eclipse / Prophet 21 / SAP (real availability + order writeback) | integration | 9 | 8 | **1.13** | high |

**Headline:** as in v3, the highest-ratio items are **$0 deterministic engines and vertical
depth over already-shipped primitives** (NEC math, PDF assembly, kitting) — not new SaaS. The
marquee AI bet (**pgvector semantic search**) scores well because it rides the **existing Neon**
(free vector infra) and only the embedding generation is a dormant/gated cost. Heavy
integrations (ERP, IDEA/ETIM) carry the most raw value but the highest cost/lead-time, so they
land last.

## Sprint schedule (6 sprints)

### Sprint 1 · Electrical-engineering value — $0 deterministic over shipped primitives  (#1, 2, 7, 9) ✅ SHIPPED 2026-06-18 · commit 034c5bd
The highest value/cost ratios, all $0, all pure testable libs reusing shipped foundations
(guided NEC selectors, the Gotenberg PDF seam, BOM/job-templates). **#1 NEC calculators** is the
keystone — build the conduit-fill / voltage-drop / ampacity / box-fill engine first; **#9
cut-to-length CPQ-lite** consumes that same wire/ampacity engine. **#2 submittal package** and
**#7 kitting** both extend the BOM model. Strong differentiation, no external accounts — ship first.

### Sprint 2 · Deal-closing + rep enablement  (#3, 8, 6, 5) ✅ SHIPPED 2026-06-19
Revenue and productivity over shipped surfaces. **#3 e-signature** turns the existing customer
acceptance page into a binding close (one dormant seam, free dev tier). **#8 next-best-action**
and **#5 rebate lookup** are $0/free-data layers over the shipped analytics + catalog; **#5**
also feeds Sprint-1 lighting kits. **#5 audit log** is $0 enterprise-readiness. **PREREQ: a
Dropbox Sign (or equivalent) account for #3.**

### Sprint 3 · AI recall + catalog quality  (#4, 11, 14) ✅ SHIPPED 2026-06-19
The marquee AI sprint. **#4 pgvector** adds an embeddings lane fused into the shipped RRF using
the **existing Neon** (free `vector` extension) — dormant until an embeddings key is set. **#11
data-quality scoring** pairs first: better spec/datasheet completeness → better embedding chunks
→ better recall. **#14 visual part ID** extends the shipped OCR nameplate path with a dormant
vision model. **PREREQ: embeddings + vision API keys (both dormant/$0 until set).**

### Sprint 4 · Customer self-service + branch ops  (#13, 12, 16)
**#13 customer portal** reuses the shipped per-tenant SSO + deposit/order state (logged-in
history, invoices, reorder). **#12 will-call pick-ticket** completes the counter/will-call loop.
**#16 Spanish i18n** is cross-cutting, so do it once the major surfaces are stable (one locale
pass touches every screen).

### Sprint 5 · Back-office & estimating connectors (dormant)  (#15, 10, 17)
External-account-gated dormant connectors that push/pull to the customer's back office —
cluster the account provisioning. **#15 QuickBooks** (won-order invoice/customer push), **#10
Procore/estimating export** (BOM → estimating tools), **#17 net-terms financing** (net-30 at
checkout, alongside the shipped Stripe deposit). **PREREQ: QuickBooks, Procore, and a financing-
partner account.** All ship env-gated dormant ($0/zero-network until keyed), per the guardrail.

### Sprint 6 · Heavy data & ERP — the biggest bets, last  (#18, 19, 20)
Highest cost and longest lead time; need data memberships / ERP partner credentials. **#18
pricing intelligence**, **#19 IDEA/ETIM catalog ingestion** (industry PIM depth), **#20 ERP
connector** (Epicor Eclipse / Prophet 21 / SAP — real availability + order writeback). Deliver
once everything above is live. **PREREQ: industry-data membership (#19) and an ERP integration
partnership/credentials (#20) — secure these before the sprint.**

## Caveats (cost / dependency)

- **Cost exposure is confined to a few items.** Truly $0/free: #1, #2, #5, #6, #7, #8, #9, #11,
  #12. Dormant/low (free dev tier until keyed): #3, #4, #10, #13, #15, #16. The only meaningfully
  paid/partner paths are **#14 vision** + **#18 pricing data** (gated/dormant) and **#17/#19/#20**
  (partner accounts) — keep every one env-gated dormant, $0 until activated, per [[cost-guardrail]].
- **Secrets discipline:** every new key (Dropbox Sign, embeddings/vision, QuickBooks OAuth,
  financing, ERP) stays server-only, never `NEXT_PUBLIC_`.
- **No-cron** still applies (#10/#15/#20 writebacks are operator/event-triggered, never scheduled).
- **Build order within Sprint 1:** ship the NEC wire/ampacity engine (#1) before #9, which depends
  on it; build the BOM-extension items (#2, #7) off the existing BOM model.
- **Re-verify before integration sprints:** web-confirm the current pricing/free-tier and API
  contracts for #3, #10, #15, #17, #18, #19, #20 at pickup (do this once the weekly limit resets).
