# Bulk external-data ingestion (catalog augmentation)

How the recommender's catalog is augmented with **real, source-cited** products pulled in bulk
from openly-accessible sources — the legitimate path to large volume, since manufacturer
e-commerce pages are anti-bot/ToS-gated and bulk electrical catalog data is otherwise paid.

## Tiers (`lib/catalog/external-products.ts`)

All external records are deduped by SKU and folded into the catalog **behind** the curated +
verified records (`generate.ts`), and the table grows by their count
(`CATALOG_SIZE = CATALOG_BASE_SIZE + EXTERNAL_PRODUCTS.length`).

| Tier | Source | Grade | Count |
|---|---|---|---|
| Spec-rich | **ENERGY STAR** certified bulbs (EPA, public domain, `data.energystar.gov`) | brand + model + full photometric specs | ~376 |
| Identity-only | **Hubbell** public product sitemaps (`hubbell.com/sitemaps/`, declared crawlable in robots.txt) | brand + catalog number + product name + source URL | ~104,000 |

## What is and isn't copied (the honesty / licensing line)

- **Copied:** factual product *identity* only — manufacturer, catalog/part number, product name
  (from the listing slug), product type, and the source URL. SKU numbers and product names are
  factual data; sitemaps are published expressly for crawlers.
- **NOT copied:** proprietary specs, marketing descriptions, datasheets, or images. Identity-only
  records carry empty engineering specs and `unitPrice: 0` ("price/specs on request"), score lower
  on the data-quality heuristic (honestly), and are excluded from the functional-equivalent
  precision gate (they aren't cross-reference candidates until enriched).
- **Never fabricated.** The only attributes attached are ones extracted/derived from the source
  (manufacturer; product type inferred from the listing name). Detailed specs are flagged for
  later enrichment, not invented.

## Method (reproducible, $0)

1. Read the manufacturer's `robots.txt` → its declared sitemap index.
2. Pull the product sub-sitemaps; extract `brand / catalog-number / name-slug` from each product
   URL (`hubbell.com/<brand>/en/products/<slug>/p/<sku>`).
3. Filter to US/Wesco-relevant brands; dedupe; pack to `data/real/<mfr>-catalog.ts`
   (`brandPath\tcatalogNumber\tnameSlug` per line — a single server-side string, client bundle
   unaffected).
4. `external-products.ts` parses + maps to `CatalogProduct`; `generate.ts` folds them in.

## Scaling to more manufacturers

The same extractor works on any manufacturer that publishes a crawlable product sitemap. Hubbell
alone yielded ~104k US SKUs (Burndy, Killark, Bryant, Wiegmann, Acme Electric, Wiring
Device-Kellems, Hubbell Power Systems, …). Add the next manufacturer by dropping a new
`data/real/<mfr>-catalog.ts` and one mapper call.

## Enrichment path ("bring the SKU in now, enrich later")

Identity records are deliberately thin. To enrich: run the SKU through the live Nexar/Octopart
seam (`/api/parts/enrich`, when keyed) or the manufacturer-page harvester (D4) to attach specs,
datasheets, and pricing — upgrading the record in place.
