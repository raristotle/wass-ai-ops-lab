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

## To extend coverage further

- **Eaton Crouse-Hinds Competitor Cross Reference** (`eaton.com/.../cross-reference-search.html`) —
  competitor → Crouse-Hinds, for the breaker/fitting brands Eaton covers. Browser-drivable like the
  Appleton tool.
- **Paid cross/identity data** — Nexar/Octopart, Digi-Key, ECIA TrustedParts (env-gated seams already
  exist in `lib/integration/`).
- **Per-category manufacturer interchange tables** where published (e.g. Leviton/P&S spec-grade
  device cross sheets) — add as `data/real/*-crosses.ts` with the source URL.
