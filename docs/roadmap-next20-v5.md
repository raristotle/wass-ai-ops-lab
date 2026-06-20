# FIFTH top-20 backlog — cross-sell / upsell / product-family focus

Produced **2026-06-19** via a multi-agent web-research sweep (8 research streams →
71 net-new candidates → dedup → re-scored value÷cost → balanced + sprint-clustered).
Streams: cross-sell/upsell/family · accessory-relation data · for-sale 3rd-party
services · data feeds · MCP additions · rep + customer UX · efficiency/latency ·
Wesco-specific. Every candidate was checked against the **full shipped-feature list**
so this backlog is net-new, and 3rd-party pricing was web-verified at research time
(re-verify at each sprint's pickup).

**Mandate:** make this the best **cross-sell / upsell / product-family / add-on attach**
tool for Wesco **inside sales reps** (primary) and eventually **direct customers** —
the theme dominates (≈16 of 20 items). **Cost guardrail honored:** S1–S4 (14 items)
are entirely **$0** (first-party data + open standards + free tiers); only S5–S6 touch
paid third parties, each shipped **env-gated dormant — no key, no money**.

## Ranked top-20 (by value ÷ cost)

| # | Item | Area | V | C | V/C | Cross-sell payoff | 3rd-party (verified) | Sprint |
|---|---|---|---|---|---|---|---|---|
| 1 | **Cross-Sell MCP tool-pack** (`get_companions`/`complete_assembly`/`attach_suggestions`/`get_substitutes`) | MCP | 10 | 2 | **5.0** | Turns every external agent (rep chat, customer ChatGPT, ERP/procurement bot) into a cross-sell surface | $0 (open MCP over internal services) | S1 |
| 2 | **Materialized companion-graph + attach-rank tables** (+ Upstash cache) | Efficiency | 9 | 3 | 3.0 | Sub-10ms always-on companion rails on every line — slow rails get ignored | $0 (Neon/Upstash/BullMQ already live) | S1 |
| 3 | **Market-basket association-rule + demand-signal engine** (lift/confidence over our orders+quotes+won BOMs) | Data | 9 | 2 | 4.5 | Self-improving, account-scoped "A→B" companions + reorder-cycle replenishment upsell | $0 (in-house FP-growth on Neon) | S1 |
| 4 | **Spec-rule companion inference** (breaker→lug, conduit→fittings, NEMA→hub) | Data | 9 | 3 | 3.0 | Guarantees engineering-mandatory attach on long-tail SKUs with a defensible "why" | $0 (existing ETIM/UNSPSC/NEC selectors) | S1 |
| 5 | **Quote Copilot** — paste-an-RFQ → full draft quote + per-line companions | UX | 10 | 4 | 2.5 | Every drafted line arrives pre-loaded with its family + add-ons; reps upsell by default | Claude API (dormant seam; ~¢/RFQ Haiku) | S2 |
| 6 | **Account 360 / call-prep whitespace panel** | UX | 9 | 3 | 3.0 | "They buy breakers but source whips elsewhere" — whitespace is the biggest AOV lever | $0 (reuses health/reorder/win-loss) | S2 |
| 7 | **Segment Solution Builder** (EES/CSS/UBS gap-driven multi-family BOM) | Wesco | 9 | 4 | 2.25 | Coverage meter flags empty families to attach — one search → a full segment package | $0 (Wesco taxonomy + kit/BOM engines) | S2 |
| 8 | **Services Attach to Cart** (kitting, labeling, VMI, cut-to-length, project services) | Wesco | 9 | 4 | 2.25 | Wesco's most differentiated, highest-margin, stickiest cross-sell, triggered by order shape | $0 (rules over shipped cart/CPQ/VMI) | S2 |
| 9 | **Wesco private-label / preferred-brand upsell lane** (penetration meter + bulk swap) | Wesco | 8 | 3 | 2.67 | Pure-margin shift without changing the spec — highest-margin distributor lever | $0 (shipped cross-ref + margin math) | S2 |
| 10 | **Open Icecat accessory-relations ingestion** (ProductRelated / RelationTypeCode) | Data | 9 | 3 | 3.0 | Manufacturer-authored "accessory of X" edges — the highest-signal attach source | Open Icecat free tier ($0) | S3 |
| 11 | **Contract / agreement-aware pricing + entitlement attach** (national-acct / OMNIA / integrated-supply) | Wesco | 9 | 5 | 1.8 | "You're entitled to X — attach it now"; steers subs to contracted brands | $0 to start (internal contract model) | S3 |
| 12 | **Quote/CPQ MCP server** (`build_quote`/`price_line`/`apply_margin_guardrail`/`counter_offer`/`suggest_upsell`) | MCP | 9 | 3 | 3.0 | The upsell tool writes margin-aware add-ons directly as draft quote lines | $0 (MCP over shipped quote engine) | S3 |
| 13 | **Salesforce/HubSpot CRM MCP bridge** (opportunity-aware whitespace) | MCP | 8 | 3 | 2.67 | Agent reads live account/opportunity context → recommends the unbought family | HubSpot MCP $0; Salesforce customer-licensed | S3 |
| 14 | **Side-by-side compare → "complete the upgrade" builder** | UX | 8 | 3 | 2.67 | Good/better/best ladder; selecting a winner auto-adds that variant's specific companions | $0 (shipped compare + family graph) | S3 |
| 15 | **Quick-order pad** — paste-to-grid bulk entry + per-row companion chips | UX | 8 | 3 | 2.67 | Companion chip on every resolved row; attach at the high-volume entry path | $0 (MIT data grid + shipped cross-ref) | S4 |
| 16 | **Customer self-service reorder + subscription portal** with attach nudges | UX | 8 | 4 | 2.0 | Buy-again + recurring consumables, each surfacing "bought with" + upgrade nudges | $0 (shipped portal + BullMQ; dormant Stripe sub) | S4 |
| 17 | **Project & permit demand-signal lane** → pre-scoped segment-BOM outreach | API | 9 | 5 | 1.8 | Map a permit/solicitation → a pre-built bundle + likely contractor → ranked daily lead list | SAM.gov + USAspending **FREE**; Shovels ~$599/mo (dormant) | S5 |
| 18 | **Embedded B2B net-terms / pay-by-invoice at checkout** | API | 9 | 5 | 1.8 | "Approved up to $X on terms" badge reps use to upsell the full financed BOM | Resolve/Balance/TreviPay ~2–8%/txn (dormant) | S5 |
| 19 | **Real-time stock & lead-time via manufacturer EDI 846** (IDEA Exchange) | Data feed | 8 | 6 | 1.33 | Availability-aware substitution + kit completion + "ships complete by" promises | IDEA Exchange VAN + membership (custom; dormant) | S5 |
| 20 | **ERP / order MCP connector** (Epicor P21/Kinetic / SAP) — live ATP + place-order | MCP | 8 | 6 | 1.33 | Recommends only what's orderable NOW at the customer's price; rec → order in-agent | Customer ERP creds; SAP = AWS-for-SAP usage (dormant) | S6 |

## Sprint clusters (chronological + value order)

### S1 — Cross-sell engine core *(all $0, foundational)* — items 1–4
Build the always-on, agent-callable **companion brain** every later item reads from.
The **market-basket** engine (behavioral edges) and **spec-rule** engine
(engineering-mandatory edges) feed the **materialized `companion_edges`/`attach_rank`
tables**, which the **MCP tool-pack** exposes to every agent and which all in-app rails
read. Highest value÷cost in the pool and mutually reinforcing — doing it first makes
every downstream UX/Wesco/agent item richer and faster for free. No prereqs beyond the
shipped recs stack.

### S2 — Rep-facing attach surfaces *(mostly $0, one dormant LLM seam)* — items 5–9
Put the S1 engine where reps actually work so **attach is the default, not a remembered
step**: Quote Copilot (paste-RFQ → draft quote + companions, the highest-leverage
authoring surface), Account 360 whitespace, Segment Solution Builder, Services Attach,
and the private-label penetration lane. Only paid exposure: the Claude API on Quote
Copilot (dormant until keyed). **Prereq:** S1 companion graph + attach_rank.

### S3 — Authoritative relations + agentic & contract depth *($0–free-tier)* — items 10–14
Raise edge **quality** and **reach**: Open Icecat adds free manufacturer-authored
accessory edges atop S1's mined+spec edges; the contract engine makes attach
entitlement- and margin-correct for national accounts; the CPQ MCP + CRM MCP bridge
extend the S1 tool-pack into full agentic quoting + opportunity-aware whitespace;
compare-to-upgrade captures decision-moment attach. **Prereq:** S1 tool-pack/graph + S2
quote surfaces.

### S4 — D2C self-service & bulk-entry attach *($0)* — items 15–16
Widen **where** attach happens — bulk paste-to-grid + customer self-service reorder/
subscription — seeding the direct-customer ambition on the shipped portal + S1 companion
chips + BullMQ scheduling. Retention/velocity plays after the rep-facing core.

### S5 — Paid external demand & commerce signals *(env-gated dormant)* — items 17–19
The first real paid-account integrations, **after** the $0 engine is proven. Each maps
onto S1/S2: permit/solicitation signals feed the Segment Builder's pre-scoped BOM (free
SAM.gov/USAspending ships first at $0; **Shovels keyed only when funded**); net-terms
unlocks larger financed baskets at quote-acceptance; EDI 846 makes availability-aware
attach truthful. **Hard guardrail:** all ship dormant — no key, no money.

### S6 — ERP system-of-record connector *(highest cost/dependency, dormant)* — item 20
Close the loop to the distributor ERP so cross-sell is **ATP- and contract-true**
end-to-end: real ATP + contract price means every S1–S5 suggestion is buyable now at the
customer's price, and orders place without leaving the agent. Lands last (deepest
external dependency: customer ERP credentials/license). For SAP, verify AWS-for-SAP MCP
usage against the ~$100/mo guardrail before keying.

## For-sale 3rd-party services / APIs / data feeds (the paid menu)

All ship **env-gated dormant**; the operator funds + keys each when ready.

| Service | Type | Verified pricing (2026) | Powers |
|---|---|---|---|
| **Anthropic Claude** (Haiku) | LLM API | ~a few ¢/RFQ | Quote Copilot draft + companion attach |
| **Open Icecat** | Product-relations data | **Free** (email-confirm account) | Manufacturer-authored accessory edges |
| **HubSpot MCP** | CRM agent bridge | **Free** (all tiers) | Opportunity-aware whitespace cross-sell |
| **Salesforce MCP** | CRM agent bridge | Customer-licensed (no Meridian cost) | Same, for SFDC shops |
| **Shovels API** | Permit/construction data | ~$599/mo entry | Permit → pre-scoped bundle lead list |
| **SAM.gov + USAspending** | Federal solicitation/award | **Free** | Public-sector demand lane (ships first) |
| **Resolve / Balance / TreviPay** | B2B net-terms / pay-by-invoice | ~2–8% per transaction (no platform floor) | Financed-BOM upsell at checkout |
| **IDEA Exchange (EDI 846)** | Real-time stock/lead-time | VAN + IDEA membership (custom) | Availability-aware attach + kit completion |
| **Epicor P21/Kinetic / SAP ERP** | System-of-record | Customer license; SAP MCP usage-billed | Live ATP + contract price + place-order |
| **Constructor.io / Algolia Recommend / Bloomreach / Nosto / Klevu** | Recs-as-a-service | (evaluated; **not** top-20 — our first-party engine + free relation data out-scores the build/run cost) | — |

## Scoring method & balance

Re-scored all 71 candidates (not self-scores). **Value** weighted by: direct cross-sell/
attach/family impact (primary), Wesco fit (EES/CSS/UBS, contract, private-label,
services), eventual D2C, and foundational-multiplier effect. Generic perf/infra was
capped unless it directly accelerates attach (only the materialized companion graph
survived at value 9 — instant rails materially change attach behavior; pure-runtime
items like Fluid Compute / ISR / Edge Config / SSR streaming scored well on ratio but
were cut as attach-indirect). **Cost** = build + run + paid-account/new-infra (dormant
zeroes RUN cost; BUILD cost kept honest). **Area balance in the top-20:** Cross-sell data
3 · MCP 4 · UX 5 · Wesco 4 · API 2 · Data feed 1 · Efficiency 1 — ~16/20 directly
cross-sell/upsell/family, as required.

**Notable dedup/merges:** four construction/permit candidates → one (Shovels + free
SAM.gov/USAspending); Apriori + POS sell-through → one market-basket engine; Upstash
response cache folded into the materialized graph; Salesforce REST sync dropped for the
cheaper CRM **MCP** bridge; data-center/security-AV/guided-configurator candidates folded
as templates inside the Segment Solution Builder.

**Cost exposure:** S1–S4 (14/20) are entirely $0 / first-party / open-standard / free-tier
and carry the bulk of the cross-sell value — the engine and its rep+customer surfaces ship
before any spend. Only S5–S6 (6 items) touch paid third parties, every one dormant until
an operator keys it, keeping the build within the flat ~$100/mo plan unless explicitly
funded.

> Research caveat: the dedicated cross-sell/upsell research stream hit a transient API
> rate-limit, but the theme was covered redundantly across the accessory-data, MCP, UX,
> and Wesco streams (71 candidates total), so the cross-sell emphasis is intact. Re-verify
> all 3rd-party pricing/contracts at each sprint's pickup.
