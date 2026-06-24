# Cross-coverage audit (real data layer)

_Last updated: 2026-06-24 (data-quality loop, Chrome-driven iteration)._

## Heuristic

Two deterministic, $0 signals over the **real** data layer (`data/real/`). The ~200k synthetic
catalog (`lib/catalog/generate.ts`, `dataSource: "simulated"`) is generated-by-design and is **not**
auditable against manufacturer sites, so it is excluded from accuracy scoring.

1. **Product-data completeness** — `lib/catalog/data-quality-score.ts` (specs / datasheet /
   provenance / lifecycle / identifier → 0–100).
2. **Cross coverage** — % of real products with ≥1 **source-cited** verified cross.

## Where it stands

- Real products: **661**. Completeness: **avg ~100/100** — no SKU/spec/identifier errors to fix.
- Cross coverage before this loop: **71 / 661 (10.7%)** — 590 uncrossed.
- Crosses added this loop, all source-cited (never fabricated):
  - **23** Crouse-Hinds ↔ Appleton interchange pairs from the Prime Controls BOM
    (`data/real/bom-crosses.ts`); **21 of 23 independently confirmed** against the Appleton Group
    Competitor Cross Reference tool, 2 rep-asserted only (GRC strut straps the tool had no cross for).
  - **10** real catalog products (8 RACO + 2 Bridgeport boxes/fittings) crossed to Appleton parts
    via the same authoritative tool (`data/real/appleton-tool-crosses.ts`).

## Method (Appleton Group Competitor Cross Reference tool)

Emerson's public tool at `edt.youritdept.com/crossref` accepts competitor catalog numbers and
returns Appleton-Group equivalents. We drove it in-browser (Claude-in-Chrome), submitting the
relevant competitor part numbers and **filtering each result to the matching `Comp. Brand`** (the
tool returns same-number matches from multiple competitor brands). Only the factual cross verdicts
were recorded — nothing was scraped or cached from a ToS-restricted page.

## Why coverage is bounded well below 99%

A brand census of the 590 uncrossed real products shows the catalog is dominated by categories with
**no single authoritative competitor-cross tool**, plus many genuinely unique items:

| Segment (examples) | Uncrossed | Cross tool available? |
|---|---|---|
| Wiring devices — Leviton, Pass & Seymour, Lutron, Legrand | ~70 | No public 1:1 cross tool |
| Breakers / controls — Square D, Siemens, Allen-Bradley, Schneider, Eaton | ~70 | No public 1:1 cross tool |
| Datacom / AV — 3M, Panduit, CommScope, Cisco, Shure, Hanwha, Tripp Lite, APC | ~80 | Mostly unique SKUs, no cross |
| Conduit fittings / boxes — RACO, Bridgeport, Hubbell, Steel City | ~25 | **Yes — Appleton tool (used here)** |

Only the conduit-fitting / outlet-box subset (~25) is addressable by the Appleton tool, and not all
of those return a cross (cable tray and strut, e.g. Eaton B-Line Flextray, have no Appleton
equivalent). The remainder would require either category-specific manufacturer cross tools that
don't exist publicly, paid identity/cross data (Nexar/Digi-Key/ECIA), or per-part manual research —
and many items have no true cross at all. We therefore **do not** chase a 99% number by fabricating
pairs; every cross in the repo cites a source.

## Why we use the Appleton tool but NOT the Eaton tool

A tool being *technically* drivable in a browser does not make its data usable in this product.
The two tools differ on the one thing that matters — the license attached to their data:

- **Appleton Group Competitor Cross Reference** (`edt.youritdept.com/crossref`) presents its
  competitor→Appleton cross data **openly, with no confidentiality or proprietary restriction**. It
  is a sales-enablement tool whose intended purpose is for distributors and customers to surface and
  act on Appleton equivalents. Using and storing that data is consistent with its purpose. → **Used**
  (31 crosses shipped: `data/real/bom-crosses.ts` + `data/real/appleton-tool-crosses.ts`).
- **Eaton to-competitor Cross-Reference search** (`eaton.com/us/en-us/cross-reference-search.html`)
  gates its data behind terms that state, verbatim: _"The Eaton product cross-reference information
  available via this tool … is **proprietary** and provided … on a **CONFIDENTIAL** and 'AS IS'
  basis."_ Harvesting that data and republishing it in this production recommender would breach the
  confidentiality term the user of the tool agrees to. → **NOT used.** We do not extract or store it.
  (Reviewed 2026-06-24; no query was ever submitted.) A human rep may of course use the Eaton tool
  interactively for an individual quote — that is its intended single-use case — but it is not a
  bulk data source we can ingest.

## Nexar/Octopart — already wired; what it does and does not give us

Reviewed 2026-06-24. Nexar (Octopart) is **already integrated** and dormant pending keys, in two
places, so there is nothing to build:

- `lib/integration/nexar-live.ts` → `/api/parts/enrich` — live compliance docs, multi-distributor
  stock + price breaks, datasheets, and second-source MPNs for a part. **Octopart's coverage
  includes electrical-distribution SKUs** (verified: it returns Square D `QO130M200PC` with real
  distributor offers + datasheet), so this is a strong *product-data enrichment* lane.
- `lib/ingest/adapters/cross-reference.ts` (D5) — turns Nexar's `secondSources` into cross records,
  honestly labeled relation `"second-source"` (same part, alternate manufacturer), **not** "equivalent".

What it will and won't move:
- ✅ **Enrichment** (datasheets, specs-adjacent compliance docs, multi-distributor pricing/stock):
  genuinely useful for the "fix detailed info / specs / add SKUs" goal, for the parts Octopart carries.
- ⚠️ **Cross coverage**: Nexar's only cross signal is `secondSources` — and proprietary electrical /
  AV gear (Square D breakers, Leviton devices, RACO boxes, Shure mics) generally has **no** alternate-
  manufacturer second source, so this adds *few* crosses. It will **not** reach 99% cross coverage.
  (Its `similarParts` is algorithmic spec-similarity, which the simulated equivalence engine already
  provides — so we don't treat it as verified crosses either.)

To activate: add `NEXAR_CLIENT_ID` + `NEXAR_CLIENT_SECRET` to the Vercel env (credentials must be
added by the account owner — the assistant cannot enter them), optionally set
`INGEST_DISTRIBUTOR_MPNS` to the uncrossed MPNs for the D5 cross run, then trigger an ingest run.
Cost: D3 + D5 each call Nexar once per seed MPN against the account's metered plan.

## To extend coverage further (compliant paths only)

- **Paid cross/identity data** — Nexar/Octopart (wired, see above), Digi-Key, ECIA TrustedParts
  (env-gated seams already exist in `lib/integration/`). These license cross/identity data for use.
- **Per-category manufacturer interchange tables** where the manufacturer publishes them openly
  (e.g. the Appleton tool above, or openly-posted Leviton/P&S spec-grade device cross sheets) — add
  as `data/real/*-crosses.ts` with the source URL, after confirming the source carries no
  confidentiality/no-redistribution restriction.
- **Publicly-advertised category facts** — e.g. Eaton openly markets that its UL-Classified Type CHQ
  (3/4") and CL (1") breakers are listed to replace GE / ITE-Siemens / Murray / Square D Homeline /
  Crouse-Hinds / T&B loadcenter breakers. That category-level claim is public marketing (not the
  confidential tool) and could seed *generic* substitution guidance, but it is not a part-number
  cross and is intentionally not encoded as per-SKU `VerifiedCrossEntry` data.
