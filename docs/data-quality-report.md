# Product Finder — Data Quality & Cross-Reference Report

Generated from datasets built 2026-06-12. Regenerated automatically by the test gate (`lib/catalog/data-quality.test.ts`) — do not hand-edit.

## Verified product records

| Metric | Value |
|---|---|
| Records loaded | 661 |
| Production-ready (verified, ≥95% confidence) | 661 |
| Below threshold (quarantined/review) | 0 |
| Distinct brands | 188 |
| Brands with modeled hierarchy | 52 |

### Confidence distribution

| Band | Records |
|---|---|
| 95+ | 661 |
| 85-94 | 0 |
| 70-84 | 0 |
| <70 | 0 |

### Field coverage

| Field | Present | % |
|---|---|---|
| specSheetUrl | 661 | 100% |
| productUrl | 0 | 0% |
| sourceUrl | 0 | 0% |
| wescoSku | 0 | 0% |
| catalogNumber | 0 | 0% |
| gtin/upc | 111 | 16.8% |
| parentCompany | 381 | 57.6% |

### Largest brands not yet hierarchy-modeled

- Master Lock (9 products)
- HID (8 products)
- Hammond (6 products)
- Mersen (6 products)
- Shure (5 products)
- MCR Safety (5 products)
- Pyramex (5 products)
- Bosch (5 products)
- DSC (5 products)
- Crown (4 products)
- QSC (4 products)
- Epson (4 products)
- JBL (4 products)
- Netgear (4 products)
- RAB Lighting (4 products)

## Cross-reference dataset

| Metric | Value |
|---|---|
| Source-backed pairs | 200 |
| Pairs with both sides in catalog | 30 |
| Pairs with one side in catalog | 87 |
| Source: manufacturer-cross | 177 |
| Source: industry-table | 9 |
| Source: distributor-cross | 14 |
| Structural problems | 0 |
| Conflicts resolved by the source-priority rule | 2 |

### Conflict resolutions

Rule: source authority (manufacturer-cross > datasheet > distributor-cross > industry-table), then workbook quality score, then recency, then specificity.

- **Demoted** Hoffman A10106CH ↔ Hammond HJ10106HLP — demoted from 'equivalent': a higher-priority source names a different equivalent (winner: https://www.hammfg.com/pdf/Hoffman2HammondXRef.pdf)
- **Demoted** Osram Sylvania QTP2x32T8/UNV ISN-SC ↔ Philips Advance ICN-2P32-N — demoted from 'equivalent': a higher-priority source names a different equivalent (winner: https://www.assets.signify.com/is/content/Signify/Assets/advance/20190931-cross-reference-guide-osram-motorola.pdf)

## Cross-reference source registry

Ingested from the "Top 1000 Product Cross-Reference Source Records" workbook: 1166 per-section rows deduped to 166 sources.

| Ingest status | Sources |
|---|---|
| requires-license | 4 |
| requires-api-key | 6 |
| requires-browser | 98 |
| ingested | 13 |
| no-direct-crosses | 32 |
| ingestible | 13 |
| URLs truncated by the workbook (literal "...") | 37 |
| Registry structural problems | 0 |

### Sources extracted into the cross dataset

- **Hammond Competitor Cross-Reference Search** — 1 SKU-level pairs extracted (enclosures) on 2026-06-11
- **Mersen Pocket Cross Reference Guide** — 16 SKU-level pairs extracted (fuses) on 2026-06-11
- **Mersen Amp-Trap 2000 Cross Reference Chart** — 7 SKU-level pairs extracted (fuses) on 2026-06-11
- **Carol Electronics to Belden Cross Reference Guide** — 4 SKU-level pairs extracted (cable) on 2026-06-11
- **SYLVANIA QUICKCROSS** — 13 SKU-level pairs extracted (lighting) on 2026-06-11
- **Philips Advance ULT Cross Reference Guide** — 37 SKU-level pairs extracted (lighting) on 2026-06-11
- **Hoffman to Hammond Cross Reference** — 17 SKU-level pairs extracted (enclosures) on 2026-06-11
- **Rockwell Bulletin 100-D/G to 100-E Migration Profile - 100-D contactors** — 2 SKU-level pairs extracted (controls) on 2026-06-11
- **Belden to General Cable Carol Cross Reference Index** — 4 SKU-level pairs extracted (cable) on 2026-06-11
- **AutomationDirect DINnectors Phoenix Contact Cross Reference** — 4 SKU-level pairs extracted (controls) on 2026-06-11
- **Lake Cable Belden Broadcast Cross Reference - Broadcast coax** — 2 SKU-level pairs extracted (cable) on 2026-06-11
- **Lake Cable Belden Cable Cross Reference** — 4 SKU-level pairs extracted (cable) on 2026-06-11
- **Lake Cable General Cable Cross Reference - General Cable equivalents** — 2 SKU-level pairs extracted (cable) on 2026-06-11

## Missing inputs (reported, not guessed)

- **Wesco sales-volume ranking** — Wesco sales-volume ranking is not public and has not been provided. Coverage targets (top-80% of sales volume) cannot be computed — not guessing. Drop the file at data/real/wesco-sales-rank.json with schema [{ "mpn": string, "brand": string, "rank": number≥1, "wescoSku"?, "annualUnits"?, "revenueSharePct"? }].
- **Wesco brands index page** — https://www.wesco.com/us/en/brands.html returns HTTP 403 to scripted fetchers (WAF). Per-brand pages (wesco.com/us/en/brands/<letter>/<slug>.html) are indexed by search engines and recorded as wescoBrandUrl where confirmed; the full index needs a browser session or an approved feed.
