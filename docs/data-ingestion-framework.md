# Data Ingestion Framework (Sprint D1)

The renewable, source-agnostic spine that lets the product recommender **collect, refresh,
and gate** product data — attributes, spec sheets, images, GTIN identity, and
cross-references — from outside sources, and **re-run** that collection later to pick up
new or changed data. This is sprint **D1** of the data-sources rejuvenation backlog
([roadmap-data-sources-v1.md](roadmap-data-sources-v1.md)); D2–D6 plug concrete sources
into this spine.

> **Honest by construction.** Every datum carries a `sourceUrl` and a `confidence`. The
> gate drops anything it cannot attribute or key — the framework never invents a value.
>
> **$0 by default.** The shipped deploy registers only a built-in, network-free self-test
> adapter. Live external sources stay dormant until an operator declares them in
> `INGEST_SOURCES`. Nothing runs on a schedule — runs are operator-triggered or queued
> (no cron, per the repo rules).

---

## The pipeline

Every source plugs into one **Source Adapter** and flows through the same five stages:

```
fetch()  → pull raw payloads        (REST API | bulk file | sitemap + HTML | JSON-LD)
parse()  → normalize → IngestRecord[]   (sku/mpn/gtin + attributes + datasheet + image + crosses)
gate     → keep records ≥ confidence floor AND with identity + sourceUrl   (drop the rest)
snapshot → persist the gated pull   (one snapshot per adapter, durable store)
diff     → compare vs the last snapshot → added / changed / removed
```

A later sprint (D2+) adds the sixth stage — **merge** — grafting gated records into the
catalog enrichment layer. D1 deliberately stops at `snapshot/diff` so the collection
machinery ships and is verifiable before any source touches live product data.

### The provenance gate

`gateRecords()` keeps a record only when **all** hold:

1. it has a usable identity — a `sku`, `mpn`, **or** `gtin`;
2. it carries a `sourceUrl`; and
3. its `confidence ≥ PRODUCTION_CONFIDENCE` (95, from `lib/catalog/provenance.ts`).

Everything else is returned in `dropped` and counted in the run report — visible, never
silently discarded.

### The diff

`diffSnapshots(prev, next)` keys records by `gtin → mpn → sku` (uppercased) and reports:

- **added** — keys present now, absent before (a first run → everything is added);
- **changed** — same key, different content signature (attribute/image/datasheet/cross
  changes, order-independent); and
- **removed** — keys present before, absent now.

This is what makes the framework *renewable*: re-running a source surfaces precisely
what's new since last time.

---

## Module map

| File | Responsibility |
|---|---|
| `lib/ingest/source-adapter.ts` | Pure core — types, `gateRecords`, `recordKey`, `diffSnapshots`, `runAdapter` orchestration. No I/O. |
| `lib/ingest/fetcher.ts` | The only network I/O — `politeGet` (per-host rate-limit, UA, timeout) + the pure `extractJsonLd` / `schemaOrgProducts` structured-data extractors. |
| `lib/ingest/snapshot-store.ts` | Durable persistence — latest snapshot + a capped rolling run log per adapter, over the injected KV store. |
| `lib/ingest/adapters/schema-org-product.ts` | Reference adapter factory — point it at product-page URLs; parses JSON-LD `Product` blocks. `parse()` is pure. |
| `lib/ingest/adapters/selftest.ts` | Network-free self-test adapter (embedded fixture) — proves the pipeline at $0. |
| `lib/ingest/registry.ts` | The catalog of runnable adapters — self-test always present, live sources from `INGEST_SOURCES`. |
| `lib/ingest/runner.ts` | Wires registry + fetcher + store into `runAdapter` — the single entry point the API/MCP/worker call. |

Everything in the pipeline takes injected dependencies (clock, fetcher, store), so the
whole framework is unit-tested offline with fixtures (`lib/ingest/*.test.ts`).

---

## Operating it

### From the app

`Ctrl/⌘-K → “Data ingestion”` opens the operator panel: it lists registered sources with
their last snapshot size and refresh time, and lets you **Run** one source or **Run all**.
Each run shows kept/dropped and the added/changed/removed diff, plus a recent run log.

### Over HTTP (operator-gated)

```
POST /api/ingest/run      { "adapterIds"?: ["schema-org:acme"] }   → { ok, persisted, reports }
GET  /api/ingest/status                                            → { sources, recentRuns, liveSourcesConfigured }
```

Both require the same auth as the other durable endpoints (a valid session cookie, or
`Authorization: Bearer <WRITE_API_TOKEN>`), and are rate-limited.

### Over MCP

The Meridian MCP server exposes two tools so an agent can operate the framework:

- `ingest_status` — what's registered, snapshot sizes, recent runs.
- `ingest_run { adapterIds? }` — trigger a renewable refresh.

---

## Declaring a live source

Set `INGEST_SOURCES` to a JSON array of schema.org adapter configs (single line):

```json
[
  {
    "id": "schema-org:acme",
    "label": "ACME product pages",
    "segment": "EES",
    "license": "public product pages; factual specs only",
    "brandFallback": "ACME",
    "urls": ["https://acme.example/p/1", "https://acme.example/p/2"]
  }
]
```

Guidelines baked into the framework:

- **Prefer official structured data.** The reference adapter reads schema.org / JSON-LD
  `Product` blocks (server-rendered on most manufacturer/distributor pages) before any
  HTML scraping — factual, stable, and dependency-free.
- **Be polite.** `politeGet` rate-limits to ≤1 request/second per host, sets an
  identifying User-Agent, and times out. Respect each site's robots.txt and ToS; harvest
  factual specifications, not copyrighted marketing prose.
- **Confidence reflects authority.** The reference adapter scores official structured data
  carrying an MPN or GTIN at/above the gate floor; a node with only a name is honestly
  dropped.

New source *types* (a REST API, a bulk file, a sitemap crawl) are new adapters that
implement the same `SourceAdapter` interface — `fetch()` + a pure `parse()` — and register
the same way. That's the extension point D2–D6 build on.

---

## D2 — Identity + attribute backbone

D1 collects records; **D2 makes them mergeable.** Two sources spell the same engineering
attribute a dozen ways — "Amps", "Amperage", "Current Rating (A)", "In" — and a record
keyed only by a raw spelling won't line up with another source's. The attribute backbone
normalizes those raw `{name, value}` pairs onto a **canonical taxonomy** so the same
attribute from any source collapses to one key with one unit. This is the prerequisite
the distributor (D3) and manufacturer (D4) harvests merge through.

| File | Responsibility |
|---|---|
| `lib/ingest/attribute-taxonomy.ts` | The canonical attribute dictionary (key + label + canonical unit + aliases) aligned to the catalog's ETIM concept groups, plus `resolveAttribute(rawName)` and `canonicalUnit(rawUnit)`. Pure data + resolvers. |
| `lib/ingest/attribute-normalize.ts` | `normalizeAttribute` / `normalizeAttributes` (parse numeric + canonical unit, dedupe by key), `normalizeRecord` (attach `normalizedAttributes`), `attributeCoverage`. Pure. |

**How a run uses it.** After gating, the runner maps each kept record through
`normalizeRecord`, which **adds** a `normalizedAttributes` array (the raw `attributes`
stay untouched as provenance) and reports the run's **attribute coverage** — the fraction
of raw attributes that mapped onto the canonical taxonomy. Because normalization only adds
a derived field, the renewable diff (computed on raw attributes) is unchanged.

**Honest by construction:**

- An attribute **name** the taxonomy doesn't recognize is reported as *unmapped*, never
  force-fit into a bucket. Coverage tells you, per run, how much was recognized.
- A **unit** is attached only when it actually appears in the source value. The canonical
  unit is the *expected* unit (metadata) — a bare `"2"` is never silently stamped `"2 A"`.
  A unit from a mismatched family (e.g. `mm` where inches are expected) is kept as the raw
  value but not asserted as canonical.
- The original `{name, value}` pair is preserved on every normalized attribute.

The admin panel surfaces the recognized canonical set ("Attribute backbone — N canonical
attributes") and each run shows its `attrs N% canonical` coverage; `GET /api/ingest/status`
returns the taxonomy and the per-run coverage, and the MCP `ingest_run` / `ingest_status`
reports carry `attributeCoverage`.

---

## D3 — Distributor identity harvest

A Source Adapter (`lib/ingest/adapters/distributor.ts`) that wraps the existing dormant
distributor seams — **Mouser + Digi-Key** (`lib/integration/distributor-live`) and
**Nexar / Octopart** (`lib/integration/nexar-live`) — to enrich a seed list of MPNs.

> **Terms-of-service boundary — the honest part.** Mouser/Digi-Key/Nexar API terms restrict
> caching and redistribution of their **proprietary catalog content**: pricing, stock,
> descriptions, and parametric specs. So this adapter persists **only the factual identity
> linkage** that is *not* their proprietary content — the **manufacturer part number** (the
> manufacturer's identifier), the **manufacturer/brand name** (a fact), and the **datasheet
> URL** (a link to the manufacturer's own document). Price/stock/description/specs are
> deliberately dropped and never enter a snapshot. (Live pricing/stock remains available
> per-request through the existing distributor seams — it just isn't ingested here.) The
> adapter's `license` string states this boundary so every run is auditable.

The transforms (`liveQuoteToIdentityRecord`, `nexarEnrichmentToIdentityRecord`,
`mergeIdentityRecords`) are pure; the same-MPN records from multiple distributors merge
into one, preferring the first non-empty brand/datasheet. The only I/O is the dormant
client calls in `fetch()`, which return nothing until distributor keys are set ($0 default).

**Activation** — two switches, both required:

1. Configure at least one distributor client: `MOUSER_API_KEY`, or
   `DIGIKEY_CLIENT_ID` + `DIGIKEY_CLIENT_SECRET`, or `NEXAR_CLIENT_ID` + `NEXAR_CLIENT_SECRET`.
2. Provide a seed MPN list: `INGEST_DISTRIBUTOR_MPNS="EX-BR120, ABC-123, …"`
   (comma/whitespace-separated, deduped, capped at 200 per run).

With both set, a `distributor:identity` source appears in the registry and a run enriches
those MPNs' brand + datasheet links through the same gate → snapshot → diff pipeline.

---

## D4 — Manufacturer product-page harvester + accurate images

A branded layer over the schema.org/JSON-LD adapter (`lib/ingest/adapters/manufacturer.ts`)
tuned for **manufacturer** product pages — Eaton, Schneider, Siemens, ABB, Hubbell,
Leviton, etc. The manufacturer is the authoritative source for its own products'
attributes, datasheets, and **product images** — and, unlike third-party distributor
catalog content, a manufacturer's own image of its own product is redistributable, so D4
harvests accurate images here.

It adds three things over the bare schema.org adapter:

- **A curated brand → Wesco-segment registry** (`MANUFACTURER_REGISTRY`) so a harvested
  record lands in the right segment (Eaton/Square D/Siemens/ABB → EES; Panduit/CommScope →
  CSS; Acuity → UBS; …). Aliases (Square D → Schneider, Cutler-Hammer → Eaton) resolve too.
- **A manufacturer-appropriate license note** stating it ingests factual specs + the
  manufacturer's own product images, never copyrighted marketing prose.
- **Best-image resolution** (`lib/ingest/image.ts`): every image reference is resolved to an
  absolute `http(s)` URL against the page it came from (handling protocol-relative `//cdn…`
  and root/relative `/img/…` refs) and obvious placeholders (spinners, "no-image",
  "coming-soon") are skipped — so the ingested `imageUrl` is an accurate, loadable link or
  nothing at all (never a fabricated/placeholder image). This image hardening also lifts the
  D1 schema.org sources.

**Activation** — declare manufacturer sources in `INGEST_MANUFACTURERS`, a single-line JSON
array (dormant/$0 until set):

```json
[{"brand":"Eaton","urls":["https://www.eaton.com/…/br120","https://www.eaton.com/…/br240"]}]
```

Each entry becomes a `manufacturer:<brand>` source. The segment is derived from the registry
(override with an optional `"segment"`). Harvesting uses the same polite fetch (≤1 req/s/host)
and gate → snapshot → diff pipeline as every other source.

---

## D5 — Cross-reference + lifecycle

Two signals the framework now captures: competitive **cross-references** and product
**lifecycle**.

### Cross-references (Nexar second sources)

`lib/ingest/adapters/cross-reference.ts` emits the `crosses` on an `IngestRecord`: for a
seed MPN, the alternate-manufacturer parts that are the same component. The data is Nexar's
`secondSources` (same part, different manufacturer) — D3 keeps only the primary identity;
**D5 picks up the second-source EDGES**. These are factual "part X is also made as part Y"
relations, not proprietary catalog content. `enrichmentToCrossRecord` is pure (emits one
cross per *distinct* second source, excluding the primary and dupes, relation
`"second-source"` — honest, not overclaimed as "equivalent"). The adapter
(`cross-reference:nexar`) is dormant until Nexar is keyed and shares the
`INGEST_DISTRIBUTOR_MPNS` seed list.

### Lifecycle (schema.org availability)

Manufacturer pages encode lifecycle in `offers.availability`. `lib/ingest/lifecycle.ts`
maps the schema.org `ItemAvailability` enum to a coarse state — only **`Discontinued`** is
treated as a lifecycle (EOL) signal; ordinary stock states (In/OutOfStock, PreOrder, …) are
availability, **not** lifecycle, so they map to nothing (honest — we don't infer a lifecycle
we weren't told). When present, it's carried as a factual `Lifecycle status` attribute, so
it flows through the gate, the D2 backbone (canonical `lifecycle-status` key), and the
renewable diff like any other spec — surfacing on the manufacturer (D4) and schema.org (D1)
sources automatically, at $0.

---

## D6 — Certifications, category depth, demand signals

The final layer adds three things.

### Category depth (D2 taxonomy expansion)

The canonical attribute backbone gains ~15 category-specific attributes — lighting (beam
angle, CRI, lamp base, rated life), datacom (shielding, jacket rating, bandwidth), wire
(insulation type, stranding), safety (arc-flash rating), plus certifications, country of
origin, and weight. Deeper coverage means more of each source's published specs collapse
to a canonical key (a higher `attrs N% canonical` per run).

### Certifications (schema.org `hasCertification`)

Manufacturer pages list their products' agency approvals. The schema.org parser now reads
`hasCertification` (string | `Certification` object | array) into a factual `Certifications`
attribute, which normalizes onto the canonical `certification` key. Approvals listed in a
page's `additionalProperty` ("Agency Approvals", "UL Listing", …) already mapped via the D2
aliases — so this captures both paths. No new network call (it rides the D1/D4 harvest).

### Demand signals (CPSC product recalls)

`lib/ingest/adapters/cpsc-recalls.ts` is a **free, keyless** source over the U.S. CPSC
SaferProducts REST service (U.S. government public domain). It turns recalls that name a
product **model** into records flagging that model with a `Safety recall` attribute and the
recall URL — a real safety/demand signal ("is anything we carry under recall?"). Only
recalls carrying a usable model become records; a recall with no model has no identity and
is skipped, never invented. Output is bounded (last 365 days, ≤500 records).

Per the "zero network until explicitly enabled" rule it stays dormant until
`INGEST_CPSC_RECALLS=1` (free, but an explicit operator switch — mirrors the NWS weather
seam). Then a `demand:cpsc-recalls` source appears in the panel.

---

That completes the data-sources rejuvenation backlog (D1–D6): a renewable, honest,
$0-by-default ingestion framework spanning the source spine (D1), the identity + attribute
backbone (D2), distributor identity (D3), manufacturer pages + images (D4), cross-reference
+ lifecycle (D5), and certifications + category depth + demand signals (D6).
