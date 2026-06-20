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
