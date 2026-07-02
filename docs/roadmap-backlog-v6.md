# Roadmap v6 — Value/Cost Backlog & Sprint Plan (2026-06-27)

Synthesized from a four-lens review (rep workflow · data trust · adoption/growth · platform) run
against the live codebase, plus the 2026-06-20 strategy review. Every item cites the real gap it
closes — several were verified directly in code by the panel (file:line evidence noted).

**Strategic frame (unchanged):** the bottleneck is **real users + real order data**, not more
features. The 766K crosses + 9.7K enriched products are the moat; most value now comes from making
that moat *findable, trusted, and load-bearing* and from *activating* the shipped-but-dormant
real-data paths. Product-data enrichment continuation is **explicitly parked** by the owner.

**Scoring:** Value 1–10 (impact for a Wesco pilot). Cost S=1 / M=3 / L=8 points
(Claude-executed complexity + risk + token cost — not person-weeks). **Ratio = Value ÷ Cost points.**

## Backlog (ranked by value/cost ratio within sprint)

| ID | Story | Value | Cost | Ratio | Sprint |
|---|---|---|---|---|---|
| B1 | Bidirectional cross lookup | 9 | S | 9.0 | 1 |
| B4 | PostHog event instrumentation | 9 | S | 9.0 | 1 |
| B2 | Corroboration count + confidence band on bulk crosses | 8 | S | 8.0 | 1 |
| B3 | Provenance-aware ranking (real beats simulated) | 8 | S | 8.0 | 1 |
| B5 | Cold-start observability (health metric + maxDuration audit) | 4 | S | 4.0 | 1 |
| B6 | "Load your data" hub (order history + crosswalk out of ⌘K) | 9 | S | 9.0 | 2 |
| B7 | Crosswalk-first import sequencing guard | 8 | S | 8.0 | 2 |
| B8 | Post-import "what changed" — show the awakened engines | 8 | S | 8.0 | 2 |
| B10 | Labeled demo order-basket seed (day-one rails) | 7 | S | 7.0 | 2 |
| B9 | Sample CSVs + tour steps for both imports | 6 | S | 6.0 | 2 |
| B11 | Ingest the 8,220 Leviton UPCs as GTIN identifiers | 6 | S | 6.0 | 2 |
| B12 | Spec-aware Find Alternatives (use the 9.7K verified spec sets) | 8 | M | 2.7 | 3 |
| B13 | "Price on request" fast path (pending-price quote lines) | 8 | M | 2.7 | 3 |
| B14 | Datasheet link-rot monitor + "verify before send" badge | 6 | S | 6.0 | 3 |
| B15 | Migrate 766K crosses to Neon Postgres | 8 | M | 2.7 | 4 |
| B17 | Wesco stock-number capture on every part-number entry point | 7 | M | 2.3 | 4 |
| B16 | MCP/punchout API ergonomics (typed errors + cursor pagination) | 6 | M | 2.0 | 4 |
| B18 | Enrichment continuation (~94K un-enriched Hubbell + deeper tiers) | 5 | L | 0.6 | Parked |
| B19 | SSO/IdP + paid-seam activation (PostHog cloud, Sentry, Stripe…) | 7 | S* | — | Parked |

\* B19 is S in code (seams shipped) but gated on user-owned accounts/keys — not schedulable by Claude.

---

## Sprint 1 — "Trust the moat" (all Small; pure leverage of existing data)

> ✅ **SHIPPED to production 2026-07-01.** All five items (B1–B5) live; full delivery report,
> gate results, and the one owner action (activate PostHog for B4) in
> [sprint-1-completion.md](./sprint-1-completion.md). Gate green: lint 0 · typecheck clean ·
> 3,627 tests · build ok.

Theme: the 766K crosses exist but half the query direction misses, no confidence signal shows, and
fake products can outrank real ones. Fix findability + trust first — it's loss recovery on data
already paid for. Plus turn on the measurement everything later depends on.

- **B1 · Bidirectional cross lookup** — *As a rep, I want to search by MY stocked part number and
  see every competitor part that crosses to it — not just the reverse — so a "match this Hubbell
  number" call gets an answer instead of a miss.*
  Evidence: `lib/catalog/xref-index.ts` keys the Map on `identifierKey(f[1])` (competitor) only;
  `f[3]` (target) is parsed but never indexed. Fix: second Map keyed on target built in the same
  parse loop, hits tagged `matchedAs: competitor|target`. AC: `/api/crosses/match` and the lookup
  modal resolve both directions; xref-index tests cover a target-side query.
- **B4 · PostHog event instrumentation** — *As the owner, I want search / cross-lookup / imports /
  quote-send / quote-accept / add-to-cart captured as named events so I can see real activation
  funnels.* Evidence: providers + server analytics are fully built and dormant-guarded, but the repo
  has exactly ONE `capture()` call (`$pageview`). AC: ~10 named events firing when
  `NEXT_PUBLIC_POSTHOG_KEY` is set; zero behavior change when unset ($0 default preserved).
- **B2 · Corroboration count + confidence band on bulk crosses** — *As a branch manager, I want
  every cross hit to show "N sources agree" + verified/probable/needs-review banding so I can tell a
  rep "trust this one" in five seconds.* Evidence: `confidenceBand()`/`BAND_META` exist but only
  serve the small verified-cross tier; 59,577 parts have 2+ alternatives with distinct-source counts
  computable from data already in memory. AC: bulk hits in modal/Explorer/API carry
  `sourceCount` + band; band reuses BAND_META visuals.
- **B3 · Provenance-aware ranking** — *As a rep, I want real/enriched/verified products to outrank
  simulated placeholders on equal relevance so the first thing I quote is never a fake SKU.*
  Evidence: `scoreProduct()` has zero provenance term in SCORE_WEIGHTS despite the known
  "simulated can outrank real" issue. AC: provenance weight added; a real enriched product with equal
  keyword score sorts above a simulated one; render tests updated.
- **B5 · Cold-start observability** — *As the owner, I want /api/health to report xref index build
  time + row count, and the two read-hot routes to have explicit `maxDuration`.* Evidence: health
  reports ~35 integration booleans but nothing about the 36MB parse; `products/search` and
  `crosses/match` lack `maxDuration` (T0-3 only covered cost-bearing routes). Gives the before/after
  number for B15.

## Sprint 2 — "Real data in" (all Small; attacks the strategic bottleneck directly)

> ✅ **COMPLETE — all 6 items SHIPPED to production 2026-07-01** — B6 (Load-your-data hub), B7
> (crosswalk-first guard), B8 (post-import what-changed), B9 (sample CSVs + tour), B10 (labeled demo
> cross-sell baskets), B11 (Leviton UPC/GTIN → cross). Gate green: lint 0 · typecheck · 3,600+ tests ·
> build ok. Full report: [sprint-2-completion.md](./sprint-2-completion.md).

Theme: the engines that make the app feel alive (market-basket, also-bought, forecasts,
next-best-action) are shipped but starved. Make loading real data discoverable, ordered, and
rewarding — and add honest identifiers we already possess.

- **B6 · "Load your data" hub** — *As a pilot admin, I want a visible, named entry point for the
  order-history and crosswalk imports, not two of ~24 flattened ⌘K targets.* AC: persistent nav/admin
  card with import status (rows loaded, last import) using the existing manifests.
- **B7 · Crosswalk-first sequencing guard** — *As an admin importing order history, I want the app
  to detect a missing crosswalk and prompt me to load it first so my Wesco-numbered CSV doesn't
  resolve to zero lines.* Evidence: import route falls back to `resolveCustomerNumber()`; with
  `wescoSku` 0% populated, exact-match fails almost entirely → the most likely first-week "it's
  broken" moment. AC: guard + inline prompt when crosswalk is empty; copy explains why.
- **B8 · Post-import "what changed"** — *As an admin who just imported orders, I want to be shown
  WHERE the real signal now appears (which rails, which products) instead of a JSON receipt.*
  Evidence: the route already returns rulesMined/topPairs/headline — API-only today. AC: success
  state deep-links to 2–3 now-different surfaces using the manifest.
- **B10 · Labeled demo order-basket seed** — *As a branch manager demoing day one, I want cross-sell
  rails alive before real data lands.* Pattern already proven by `crosswalk.ts`'s `source:"demo"`
  entries. AC: 25–50 electrical-realistic baskets, clearly labeled, auto-hidden when real orders load.
- **B9 · Sample CSVs + tour steps** — one-click template downloads in both modals; tour stops on
  both imports (tour-content has zero crosswalk mentions today).
- **B11 · Leviton UPC/GTIN ingestion** — *As a rep, I want the 8,220 UPCs we already parsed (and
  honestly declined to mislabel as stock numbers) searchable as GTINs.* Evidence: `xref-wesco.tsv`
  sits unused in the scratch pipeline; catalog already indexes `gtin`. AC: GTIN search hits Leviton
  parts; provenance notes "UPC from Leviton cross file".

## Sprint 3 — "Quote with confidence" (rep-workflow depth)

> ✅ **SHIPPED to production 2026-07-02** — B12 (spec-aware Find Alternatives), B13 (price-on-request
> fast path), B14 (datasheet link-rot monitor, dormant). Gate green. Full report + the one opt-in
> action (enable the B14 cron): [sprint-3-completion.md](./sprint-3-completion.md).

Theme: the moments where a rep stakes credibility — proposing a substitute, quoting price, sending a
submittal.

- **B12 · Spec-aware Find Alternatives** — *As a rep mid-quote, I want alternatives ranked by
  verified attribute overlap (voltage/amperage/rating from the 9.7K enriched sets), not name
  similarity.* $0 deterministic Jaccard/weighted-overlap booster in the existing scoring path — the
  free complement to the paid pgvector seam, and the most direct "use what enrichment already
  bought" lever. AC: enriched-attr overlap outranks lexical near-miss in tests.
- **B13 · "Price on request" fast path** — *As a rep live on the phone, I want a one-click
  "pending price" action on any $0 real-tier line that drops it into my open quote flagged for
  branch price-check, instead of a dead end.* Routes into existing quote/audit machinery; does NOT
  attempt the bot-blocked buy.wesco.com. AC: pending-price lines flow through quote revisions +
  audit trail.
- **B14 · Datasheet link-rot monitor** — Vercel Cron HEAD-sweep over the 9.4K URLs in time-boxed
  batches → existing Neon KvStore; "link may be outdated" badge before a rep emails a submittal.
  AC: sweep runs on schedule at $0; badge renders on dead links.

## Sprint 4 — "Harden for scale" (Medium items, sequenced after usage exists)

> ✅ **SHIPPED to production 2026-07-02** — B15 (crosses → Neon Postgres, **dormant**; you run the
> one-time load), B16 (MCP/punchout typed errors + cursor pagination), B17 (Wesco stock-# capture).
> Gate green. Full report + the load/flag steps: [sprint-4-completion.md](./sprint-4-completion.md).
>
> 🎉 **All scheduled v6 items (Sprints 1–4, B1–B17) are now in production.** Remaining: only the
> explicitly-parked B18 (enrichment continuation) and B19 (paid-account activation).

Theme: durability once Sprints 1–3 prove demand. B15 supersedes the interim in-memory work.

- **B15 · Crosses → Neon Postgres** — *As the platform, I want the 766K pairs in an indexed table
  (btree on BOTH part columns) so cold start stops paying a 36MB parse and reverse lookup +
  GROUP-BY corroboration become single queries.* Neon is already live/load-bearing (KvStore,
  pgvector) — no new paid service. AC: p99 cold cross-match under ~1s; B1/B2 backed by SQL; packed
  literal retired from the serverless bundle. (The brand-sharding alternative is explicitly
  superseded by this.)
- **B17 · Wesco stock-number capture** — *As a rep, I want every part-number entry point (search,
  BOM import, quote line) to invite a labeled "Wesco stock #" so real identifiers accrue as a
  byproduct of daily use.* The drip-feed complement to B7's batch path. AC: captured numbers persist
  to the crosswalk store with provenance + dedup.
- **B16 · MCP/punchout ergonomics** — typed `{code, message, retryAfterMs?}` error envelope +
  `nextCursor` pagination on the routes the MCP server and punchout consumers call
  (backward-compatible). AC: MCP client can branch on error codes; UI consumers unaffected.

## Parked / gated (not scheduled — requires explicit owner action)

- **B18 · Enrichment continuation** — resumable loop is intact (targets pre-set to 10,836/2,911;
  ~2.8K tokens/product; ~94K Hubbell still identity-only). **Blocked on explicit token-budget
  approval per the cost guardrail — do not schedule.**
- **B19 · Activate dormant paid/account seams** — SSO/IdP, PostHog cloud project, Sentry, Stripe,
  Dropbox Sign, Nexar. Code-complete; blocked on user-owned accounts/keys. B4 makes PostHog
  activation immediately valuable when the key arrives.

## Sequencing rationale

1. **Sprint 1 before everything**: highest ratio (four S-items ≥8.0), zero new surface area, pure
   loss-recovery on the moat — and B4's instrumentation must exist BEFORE activation work so Sprint
   2's impact is measurable rather than anecdotal.
2. **Sprint 2 is the strategy**: every item removes a step between a pilot admin and the moment the
   dormant engines wake on real data. All S-cost; the sprint is deliberately light so it can ship
   the week a pilot starts.
3. **Sprint 3 deepens trust at the quote** — the conversion moment — once search/cross results are
   already trustworthy (S1) and ideally personalized by real data (S2).
4. **Sprint 4 last on purpose**: B15 is the "right home" for the crosses but B1's in-memory fix
   recovers the lost value NOW at S cost; migrating after usage exists means the latency win is
   observable (B5's metric) and justified.

*Panel: 4 Sonnet agents (rep-workflow, data-trust, adoption, platform lenses), 37 grounded
proposals deduped into 19 items; convergence was strong — bidirectional lookup, bulk-tier
confidence, provenance ranking, and PostHog instrumentation were each independently proposed by
2–4 lenses.*
