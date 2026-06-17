# Meridian Product Finder — next top-20 roadmap (2026-06-16 refresh)

Produced after the first top-20 (5 sprints) fully shipped to production. Method: 6 parallel
research streams (web-verified 2025-2026 pricing/capabilities) → 70 raw candidates → 52 deduped →
each scored on **value** and **cost** through two independent lenses (distributor-ops + product-
strategy), averaged → ranked by value ÷ cost → clustered into dependency-ordered sprints.

Every external integration ships **env-gated dormant** ($0, no network until a key is set), no cron,
secrets server-only — the same constraints that held across the first 20.

> **Status (2026-06-17): ✅ ALL 5 SPRINTS SHIPPED — the entire refreshed top-20 is live in production.**
> Sprint 1 (`ed2c4bc`), Sprint 2 (`8065882`), Sprint 3 (`98925b0`), Sprint 4 (`8985b50`), Sprint 5
> (outbound integrations). Each shipped with: deterministic core + dormant gating, an adversarial
> Workflow review with findings fixed, gates green (typecheck/test/build), and live `/api/health`
> verification that every new integration reads dormant (`false`) until a key is provisioned.

## Ranked top-20 (value ÷ cost)

Value/Cost are 1-10 dual-lens averages (cost: 10 = most expensive/hardest).

| # | Story | Type | Val | Cost | V/C | $ posture |
|---|---|---|----|----|----|---|
| 1 | Paste-to-quote velocity box (multi-SKU paste → dedupe → cross-ref auto-match) | UX | 8.0 | 3.0 | 2.7 | $0 — reuses shipped libs |
| 2 | Multi-currency indicative quoting (Frankfurter) | API | 4.5 | 2.0 | 2.3 | $0 — free, no-key FX |
| 3 | Sticky compare tray + spec-diff highlighting | UX | 6.0 | 3.0 | 2.0 | $0 |
| 4 | Slack outbound MCP (post-only quote/order alerts) | MCP | 6.0 | 3.0 | 2.0 | $0 — free workspace |
| 5 | Trade-term synonym/abbreviation search expansion | feature | 5.0 | 2.5 | 2.0 | $0 |
| 6 | "Buy Again" reorder rail + one-click reorder | feature | 7.5 | 4.0 | 1.9 | $0 — existing Neon data |
| 7 | Proactive EOL / substitution sweep agent | feature | 7.5 | 4.0 | 1.9 | ~pennies (Haiku, gated) |
| 8 | Bulk cross-ref confidence UX + demand-ranked gap queue | UX | 7.5 | 4.0 | 1.9 | $0 |
| 9 | Nameplate-photo → spec capture on the PWA scanner | feature | 7.0 | 4.0 | 1.8 | $0 — shared OCR free tier |
| 10 | Address verify + autocomplete (USPS v3 free) | API | 5.5 | 3.0 | 1.8 | $0 (Smarty optional ~$17/mo) |
| 11 | Branch/customer/jobsite geocoding (Geocodio) | API | 5.5 | 3.0 | 1.8 | $0 at pilot caps |
| 12 | Free "fetch" MCP as default web-grounding (avoid metered Brave) | MCP | 4.5 | 2.5 | 1.8 | $0 |
| 13 | Keyboard-first results power layer (j/k/a/c) | UX | 5.0 | 3.0 | 1.7 | $0 |
| 14 | Reusable quote templates + margin-optimizer | feature | 8.0 | 5.0 | 1.6 | $0 |
| 15 | Multi-network punchout (SAP Business Network + Coupa) | 3rd-party | 6.5 | 4.0 | 1.6 | $0 — free supplier seats |
| 16 | Server-side branded PDF docs (Gotenberg self-host) | infra | 6.5 | 4.0 | 1.6 | $0 — OSS, self-host |
| 17 | PWA web-push notifications (self-host VAPID) | infra | 6.5 | 4.0 | 1.6 | $0 |
| 18 | Rep scorecard & pipeline cohort dashboard | feature | 6.5 | 4.0 | 1.6 | $0 |
| 19 | Publish Meridian to the MCP Registry + Claude Code plugin | MCP | 4.0 | 2.5 | 1.6 | $0 |
| 20 | Spec-to-product matching agent (NEC spec → compliant SKU set) | feature | 7.5 | 5.0 | 1.5 | ~cents/query (gated) |

## Sprints (dependency-ordered)

Sequencing rules: front-load low-hanging fruit, put shared foundations before their consumers,
build value progressively. Every story's hard deps are already-shipped features or active infra, so
nothing is hard-blocked — ordering is about synergy.

### Sprint 1 · Quick wins — velocity & findability  (#1, 2, 3, 5, 13)
Highest value/cost-ratio stories, each riding entirely on shipped surfaces (quick-order pad, spec-
compare, search lib, cmd-K) with no new scaffolding. Banks visible rep-productivity momentum first.
`#5` (synonyms) also seeds the query-expansion recall the Sprint 4 agents lean on.

### Sprint 2 · Data spine — geocoding, address & grounding  (#10, 11, 12)
Foundational lookups later sprints consume. Geocoding is the primitive under nearest-branch / weather
/ territory analytics; address-verify shares the same ship-to fields + thin-route pattern; the free
fetch-MCP becomes the canonical grounding source the Sprint 4 agents cite. All cache/throttle via the
active Neon + Upstash spine.

### Sprint 3 · Reorder & personalization  (#6, 9, 14)
Monetizes the stable order/quote history + recommendation surfaces — best after Sprint 1's velocity UX
exists to receive their output. Buy-Again and templates+margin-optimizer share data plumbing;
nameplate-OCR feeds the same cross-ref/selector pathways.

### Sprint 4 · Cross-reference intelligence & proactive agents  (#7, 8, 20)
Most upstream-dependent, deliberately later. Needs request/search logs, the synonym layer (#5),
compliance enrichment, and the fetch-MCP grounding (#12). Groups all the Anthropic-key-using,
log-and-compliance-dependent work in one phase. Candidate-finding stays deterministic ($0); only
rationale/answer text calls Haiku (pennies, gated).

### Sprint 5 · Outbound integrations & analytics  (#4, 15, 16, 17, 18, 19)
Amplifies the events/documents/data everything before produced. Slack MCP, web-push, and rep
scorecard hang off the shipped notification event bus + accumulated history; Gotenberg renders shipped
HTML templates; multi-network punchout extends shipped cXML/PunchOut L2; the MCP Registry publish is
dead-last (depends on a hosted remote MCP connector being settled first).

## Caveats (from the dual-lens scoring)

- **#5 is partly already shipped** — `lib/product-finder-synonyms.ts` already wires into NL search.
  Treat as expansion/curation, not net-new.
- **#10 is table-stakes, not a moat** — defensive hygiene every competitor has; worth doing, not
  differentiating.
- **#19 has an out-of-top-20 prerequisite** — a hosted *remote* MCP connector must exist first.
- **#7 and #20 are the only token-spending items** — both gated on the existing `ANTHROPIC_API_KEY`,
  deterministic candidate-finding, Haiku only for narration.

## Cost posture

16 of 20 are genuinely $0 (free APIs, OSS self-host, or pure reuse of shipped data/infra). The only
money exposure is optional and capped: Smarty (only past free USPS), Google geocoding (hard-capped
behind free Geocodio), and the two gated agents' Haiku pennies. No cron; every external seam dormant.
