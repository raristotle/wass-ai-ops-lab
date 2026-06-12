# Product Finder — Source Registry

Where every class of data in the Product Finder comes from, its authority
tier, and the gate it must pass before reaching production recommendations.

## Provenance classes

| Class | Source | Authority | Gate |
|---|---|---|---|
| `verified` product records | Web-researched manufacturer datasheets/catalog pages, link-verified at build (`scripts/build-real-products.mjs`, `data/real/real-products.ts`) | Manufacturer | `assessRecord ≥95` → production; else quarantined (`lib/catalog/provenance.ts`) |
| `curated` product records | Hand-curated demo seeds (`data/mock/catalog-products.ts`) | Internal | Labeled `curated`; eligible for verified crosses only as resolution targets |
| `simulated` product records | Deterministic generator (`lib/catalog/generate.ts`, seed 1337) | None — synthetic | Labeled `simulated` everywhere; never presented as real SKUs; never sent to external APIs; excluded from verified crosses |
| Brand hierarchy | Corporate/brand pages and acquisition announcements, one `sourceUrl` per relationship (`data/real/brand-hierarchy.ts`) | Manufacturer/corporate | `validateHierarchy` structural gate; unsourced relationships are not added |
| Cross-reference pairs | Official manufacturer cross tools/PDFs, datasheets, authorized distributor cross tables, established industry guides (`data/real/verified-crosses.ts`) | Per `sourceKind` | Confidence by source authority (97/96/88/86); `<95` suppressed from the production path (`lib/catalog/verified-crosses.ts`) |
| Cross-reference source registry | The "Top 1000 Product Cross-Reference Source Records" workbook (1,166 per-section rows → 166 unique sources, `data/real/cross-source-registry.ts`) | Varies per source | Classified by access + format (`lib/catalog/cross-sources.ts`); only free, parseable, full-URL sources are extraction candidates; 37 workbook URLs arrived truncated (literal `...`) and are flagged |
| Live pricing/stock | Mouser + Digi-Key APIs, per-request, never persisted (`lib/integration/distributor-live.ts`) | Authorized distributor APIs | Verified/curated SKUs only; simulated SKUs never leave the app |
| Simulated equivalence | Spec-similarity engine over the synthetic catalog (`lib/catalog/equivalence.ts`) | None — synthetic | Demo-labeled; entirely separate from verified crosses |
| Wesco sales ranking | **NOT AVAILABLE** — ingestion seam ready (`lib/catalog/sales-rank.ts`, expects `data/real/wesco-sales-rank.json`) | — | Missing input reported, never guessed |

## Source priority (research rules)

1. Wesco brand/product pages — `wesco.com/us/en/brands/...` (index page 403s scripted fetchers; per-brand URLs recorded from search-engine results)
2. Official manufacturer product pages
3. Manufacturer catalogs, PDFs, datasheets
4. Manufacturer cross-reference tools
5. Authorized distributor product pages
6. Reputable industry cross-reference tables
7. Public catalog APIs / structured feeds

Rejected categories: SEO spam, weak-provenance marketplaces, unsupported
reseller content, AI-generated pages.

## Confidence model

| Band | Meaning | Production |
|---|---|---|
| ≥95 | Manufacturer/Wesco/datasheet/official-cross verified | Yes |
| 85–94 | Multiple reputable secondary sources | No — review |
| 70–84 | Partial/single-source support | No — review |
| <70 | No usable provenance | Quarantined |

## Cross-conflict resolution rule

When sources contradict each other, one record is chosen deterministically
(`resolveCrossConflicts`, `lib/catalog/verified-crosses.ts`), in this order:

1. **Source authority** — manufacturer-cross > datasheet > distributor-cross > industry-table
2. **Source quality score** — the workbook's 0–100 quality score for the source (by domain)
3. **Recency** — newer `verifiedAt` wins
4. **Specificity** — more source-stated attributes wins
5. **Deterministic tiebreak** — lexicographic source URL

Conflict classes: the **same pair from two sources** keeps only the winner
(the loser is dropped and logged); **conflicting "equivalent" claims** (one
origin product, two different MPNs of the same target brand) keep the winner
as `equivalent` and demote the losers to `functional-substitute` with an
explanatory note — documented crosses are never silently discarded. Every
resolution is listed in the data-quality report.

## Cross-extraction filtering rules

- Targets must be orderable SKUs/catalog numbers. Series-level rows without a
  full part number (e.g. OptiFuse guide series) are excluded.
- Where a manufacturer's cross table crosses at series level with an explicit
  amp/size convention (Mersen's `(amp)` placeholder), the anchor's rating is
  applied to instantiate the SKU and the row's note discloses it.
- Compatibility-only data (LED-lamp↔ballast, camera↔VMS) is not an
  equivalence cross and is not ingested into the cross dataset.
- Every kept pair carries a fetched-this-session source URL and a quoted row
  as evidence (archived in `data/real/research/xref-extract/`).

Reports: [data-quality-report.md](data-quality-report.md) (regenerated by the
test gate on every run).
