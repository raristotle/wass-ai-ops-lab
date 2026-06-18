# Meridian Product Finder — THIRD top-20 roadmap (2026-06-17)

Produced after the first two top-20s (10 sprints, 40 items) fully shipped. Method: a 10-agent
Workflow — 1 inventory agent (read the repo to build an exhaustive "already shipped" exclusion list)
→ 6 parallel web-research streams (free/cheap **data APIs**, **MCP** connectors to free apps,
**3rd-party** integrations, **UX** patterns mined from best-of-breed comparable apps, **feature**
deepening of shipped surfaces, new **AI/agentic** capabilities) → 69 candidates → dual-lens value/cost
scoring (distributor-ops lens + product-strategy lens, averaged) → ranked by value ÷ cost →
dependency-clustered into 6 sprints.

Every external integration ships **env-gated dormant** ($0, no network until a key is set), no cron,
secrets server-only — the same constraints that held across the first 40 items.

> **What rose to the top:** the highest value/cost items are all **pure client-side UX polish on
> already-shipped surfaces** ($0, no new accounts), followed by **deterministic rule/search engines**
> over the shipped pricing/compliance/search lanes, then **field-rep mobile workflows** fusing the
> shipped VMI + scanner primitives, and finally the **external-data and payment lanes** that need
> accounts. No MCP, AI-model, or 3rd-party-SaaS item cracked the top 20 — they scored lower on
> value÷cost because they carry higher build/run cost for the marginal value over what's already shipped.

## Ranked top-20 (value ÷ cost)

Value/Cost are 1–10 dual-lens averages (cost: 10 = most expensive to build **and** run, factoring the
$0-dormant constraint — a free dormant seam is cheap; a metered/always-on or heavy-build item is expensive).

| # | Story | Type | Val | Cost | V/C | $ posture |
|---|---|---|----|----|----|---|
| 1 | Intent-prefetch for instant product navigation | UX | 6.5 | 1.5 | 4.33 | $0 — client prefetch over existing routes |
| 2 | Applied-filters overview bar (one-tap remove + Clear all) | UX | 6.0 | 1.5 | 4.00 | $0 |
| 3 | Add-to-cart-from-results with inline quantity (known-item fast path) | UX | 7.5 | 2.0 | 3.75 | $0 |
| 4 | Post-query refinement suggestions (suggest filters, not terms) | UX | 7.0 | 2.0 | 3.50 | $0 |
| 5 | Smarter compare: "highlight differences only" + hide shared rows | UX | 7.0 | 2.0 | 3.50 | $0 |
| 6 | Facets for every column shown in Table view | UX | 7.0 | 2.0 | 3.50 | $0 |
| 7 | NWS jobsite weather risk for delivery/install scheduling | data-API | 6.0 | 2.0 | 3.00 | $0 — no-key gov API |
| 8 | Scoped "search within this category" chip from autocomplete | UX | 6.0 | 2.0 | 3.00 | $0 |
| 9 | SPA / rebate claim-back recovery on won quotes | feature | 9.0 | 3.0 | 3.00 | $0 — deterministic rule engine |
| 10 | TrustedParts (ECIA) authorized-distributor price & availability | data-API | 8.5 | 3.0 | 2.83 | $0 — free key, authorized-only |
| 11 | Scan-to-reorder bin manager for field reps (KeepStock-style) | feature | 8.5 | 3.0 | 2.83 | $0 — VMI + on-device scanner |
| 12 | Aggregated offer ladder with quantity-break price curve | feature | 8.0 | 3.0 | 2.67 | $0 dormant — reuses Mouser/Digi-Key seams |
| 13 | cXML order lifecycle: Confirmation + ShipNotice emit | data-API | 8.0 | 3.0 | 2.67 | $0 — XML serialization |
| 14 | Tariff-aware landed-cost overlay for quotes & BOMs | feature | 8.0 | 3.0 | 2.67 | $0 — static USTR rate table |
| 15 | Plan-takeoff import → confidence-matched BOM | feature | 8.0 | 3.0 | 2.67 | $0 — CSV into existing matcher |
| 16 | OEMsecrets multi-distributor aggregate pricing on crosses | data-API | 7.5 | 3.0 | 2.50 | $0 — free distributor-referral API |
| 17 | Scanner depth: shelf/van cycle-count + reorder from scan | feature | 7.5 | 3.0 | 2.50 | $0 |
| 18 | Hybrid search + RRF fusion (wire the dormant Cohere reranker) | feature | 7.5 | 3.0 | 2.50 | $0 core; rerank optional/capped |
| 19 | Deposit & balance collection via Stripe Checkout (ACH-first) | data-API | 8.5 | 3.5 | 2.43 | pay-per-txn only; ACH 0.8% capped $5 |
| 20 | Live-preview search: results reshape as you type | UX | 6.0 | 2.5 | 2.40 | $0 |

(69 candidates scored; full per-item "what / which API / cost source" is captured in the workflow output.)

## Sprints (dependency-ordered)

Sequencing rules: front-load the lowest-hanging fruit (highest V/C, no new scaffolding) first; ship
shared foundations before their consumers; group items that share data/plumbing; concentrate
external-account and cost-exposure work last.

### Sprint 1 · Instant-feel UX on shipped surfaces  (#1, 2, 3, 5) — ✅ SHIPPED 2026-06-17 (commit e1022be)
Highest value/cost ratios, each pure client-side polish over the already-shipped PWA cache, NL chips,
detail route, volume-pricing tiers, and 4-product compare. No new facet plumbing, no external accounts,
$0. Independent of everything else — banks immediate perceived-speed and task-completion wins so every
later feature lands on a tighter UI. Live: intent-prefetch (bounded/capped detail cache), applied-filters
bar, table quick-add + volume-tier hint, compare differences-only. Adversarial-reviewed; 1667 tests;
First Load JS held at 103 kB. See [docs/instant-feel-ux.md](instant-feel-ux.md).

### Sprint 2 · Faceting foundation — see-it / filter-it / refine-it  (#6, 4, 8) — ✅ SHIPPED 2026-06-17 (commit 7c45953)
Live: sortable Table column headers + `onlyWithCrosses` filter (#6), refine-by-filter chips from the
result-set facet distribution (#4), and the scoped "search only in {X}" autocomplete row (#8).
Adversarial-reviewed; 1692 tests; First Load JS held at 103 kB. See [docs/faceting-foundation.md](faceting-foundation.md). Original plan:

Shared FOUNDATION: the per-result-set facet-distribution engine. Ship **#6 "facets for every Table
column"** first (the producer — guarantees every shown attribute is a real, filterable facet), then
**#4 post-query refinement** (the direct consumer — ranks the highest-signal facet values from that
same distribution) and **#8 scoped category chip** (reuses Sprint 1's removable-chip UI + the category
branch). All deterministic, $0. Sits after Sprint 1's applied-filters bar, which establishes the chip UI.

### Sprint 3 · Deterministic margin, tariff & search-quality engines  (#9, 14, 18, 15) — ✅ SHIPPED 2026-06-18 (commit cba350a)
Live: SPA/rebate claim-back card, tariff-adjusted landed cost in BOM Intelligence, hybrid RRF search,
and plan-takeoff CSV import. All $0/deterministic; the Cohere rerank stays dormant until COHERE_API_KEY.
Adversarial-reviewed (cost-dormancy verified); 1722 tests; First Load JS 103 kB. See [docs/deterministic-engines.md](deterministic-engines.md). Original plan:

Pure deterministic engines over the shipped pricing/compliance/search lanes — all $0, no external
account — that unblock the high-value money/import features. **#9 SPA claim-back** (the single
highest-value story, V=9) and **#14 tariff landed-cost** share the quote/BOM line model and plumb
together; **#18 RRF fusion** finally gives the standalone `/api/rerank` a real caller (Cohere pass stays
dormant); **#15 plan-takeoff import** rides the shipped fuzzy-match + BOM Health pipeline and benefits
from the tariff overlay landing first so imported BOMs price with duty awareness.

### Sprint 4 · Field-rep mobile workflows on shipped primitives  (#11, 17)
Siblings that fuse the **same** two shipped primitives — the VMI min/max engine + the BarcodeDetector
scanner — into a job-site "Bins"/cycle-count workflow. Build **#11 bin manager** first (scan one bin →
set count → propose replenishment), then extend into **#17 continuous multi-SKU cycle-count** (reuses
the quick-resolve pipeline #11 establishes). Self-contained, $0, client-side; no dependency on the
faceting or pricing foundations, so it could run in parallel with Sprint 3 if capacity allows.

### Sprint 5 · Env-gated live distributor & weather data lanes  (#12, 10, 16, 7)
External data-API adapters sharing the per-request, never-stored, env-gated-dormant pattern beside the
shipped Mouser/Digi-Key adapters. **#12 aggregated offer ladder** is the foundation — it builds the
Octopart-style sortable seller/stock/lead-time/price-break panel and renders **internal-only** when keys
are dormant; **#10 TrustedParts (ECIA)** and **#16 OEMsecrets** then slot in as additional env-gated
source adapters feeding that same ladder + cross-ref rows. **#7 NWS weather** is bundled as the same
"external data lane" but is $0/no-key (reuses the shipped geocoding seam) — a safe way to exercise the
lane while ECIA/OEMsecrets accounts are provisioned. **PREREQ: ECIA + OEMsecrets accounts/keys.**

### Sprint 6 · Order-lifecycle close-out & gated payment capture  (#13, 19)
Net-new buy-to-pay completion, with the heaviest prerequisites, so last. **#13 cXML
Confirmation/ShipNotice** extends the shipped `lib/procurement/cxml.ts` and reads existing order-tracking
state — document generation is deterministic/$0, but transmission stays **operator-triggered POST, never
cron**. **#19 Stripe deposit collection** is the only item that moves real money: `STRIPE_SECRET_KEY`-
gated, server-only, charge created **only** on an explicit operator "Request deposit" click, webhook
flips the quote/order to Paid. Both depend on a mature quote/order state (strengthened by Sprint 3) and
a provisioned Stripe webhook.

## Caveats (from the dual-lens scoring + clustering)

- **Cost exposure is confined to two items.** #19 Stripe deposits is the only story that moves real
  money — keep it key-gated, server-only, charge only on explicit operator action. #18's Cohere rerank
  is the only other paid path — the RRF core stays $0/deterministic; the Cohere pass stays dormant unless
  `COHERE_API_KEY` is set.
- **External accounts before their sprint:** ECIA TrustedParts (#10), OEMsecrets (#16), Stripe (#19).
  All ship env-gated dormant — $0 and zero network until the key is set; live responses are per-request,
  never stored; render internal-only when absent.
- **No-cron touches #13** (transmission is operator-triggered POST/BullMQ, never scheduled) and **#7**
  (NWS lookups are on-demand, never polled).
- **Secrets discipline:** every new key (STRIPE_SECRET_KEY, COHERE_API_KEY, ECIA, OEMsecrets) is
  server-only, never `NEXT_PUBLIC_`.
- **Sprint 2 ordering:** ship/verify #6 (column→facet audit) first so #4 and #8 draw from a complete,
  trustworthy facet set.
- **#7 NWS** is $0/no-key but still makes an external network call — confirm it's acceptable under the
  "zero network until key" spirit of the guardrail (included partly to exercise the lane safely).
- **AI cost guardrail unaffected:** none of these 20 put candidate-finding on a paid model — AI stays
  deterministic/$0, only short narration may call Haiku, which no item here changes.

## Why MCP / 3rd-party / AI items didn't make the cut

The research surfaced strong candidates in those categories (Google Sheets/Drive MCP for quote export,
DocuSign/Dropbox Sign e-signature, vector/visual search, voice quoting, etc.), but each scored lower on
value÷cost than the top 20 — either higher build/run cost, a metered/always-on dependency, or marginal
value over surfaces already shipped (the app already has its own MCP server, conversational AI, datasheet
RAG, three AI agents, Slack/HubSpot/Twilio/Resend, e-procurement, and a payment-adjacent Stripe Tax seam).
They remain on the bench for a future refresh if priorities shift toward back-office integration.
