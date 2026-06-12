# Product Finder — Data Quality & Cross-Reference Report

Generated from datasets built 2026-06-10. Regenerated automatically by the test gate (`lib/catalog/data-quality.test.ts`) — do not hand-edit.

## Verified product records

| Metric | Value |
|---|---|
| Records loaded | 647 |
| Production-ready (verified, ≥95% confidence) | 647 |
| Below threshold (quarantined/review) | 0 |
| Distinct brands | 187 |
| Brands with modeled hierarchy | 52 |

### Confidence distribution

| Band | Records |
|---|---|
| 95+ | 647 |
| 85-94 | 0 |
| 70-84 | 0 |
| <70 | 0 |

### Field coverage

| Field | Present | % |
|---|---|---|
| specSheetUrl | 647 | 100% |
| productUrl | 0 | 0% |
| sourceUrl | 0 | 0% |
| wescoSku | 0 | 0% |
| catalogNumber | 0 | 0% |
| gtin/upc | 99 | 15.3% |
| parentCompany | 376 | 58.1% |

### Largest brands not yet hierarchy-modeled

- Master Lock (9 products)
- HID (8 products)
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
- Tork (4 products)
- Unistrut (4 products)

## Cross-reference dataset

| Metric | Value |
|---|---|
| Source-backed pairs | 34 |
| Pairs with both sides in catalog | 3 |
| Pairs with one side in catalog | 30 |
| Source: manufacturer-cross | 27 |
| Source: industry-table | 5 |
| Source: distributor-cross | 2 |
| Structural problems | 0 |

## Missing inputs (reported, not guessed)

- **Wesco sales-volume ranking** — Wesco sales-volume ranking is not public and has not been provided. Coverage targets (top-80% of sales volume) cannot be computed — not guessing. Drop the file at data/real/wesco-sales-rank.json with schema [{ "mpn": string, "brand": string, "rank": number≥1, "wescoSku"?, "annualUnits"?, "revenueSharePct"? }].
- **Wesco brands index page** — https://www.wesco.com/us/en/brands.html returns HTTP 403 to scripted fetchers (WAF). Per-brand pages (wesco.com/us/en/brands/<letter>/<slug>.html) are indexed by search engines and recorded as wescoBrandUrl where confirmed; the full index needs a browser session or an approved feed.
