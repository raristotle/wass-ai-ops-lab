# Data-Sources Rejuvenation Backlog (v1)

**Goal:** raise the **accuracy, quality, and volume** of product / manufacturer / cross-
reference / spec-sheet / image data in the Meridian recommender (WESCO pilot) by adding
**40+ free or legally-scrapeable sources**, behind a **renewable, rerunnable** collection
framework that can re-check sources for new data and be exposed as APIs/MCP feeds.

> **Hard constraints honored throughout:** $0 incremental cost (scrape = $0; freemium/paid
> = dormant env-gated seam, never auto-billed); **no fabrication** (every datum carries
> source + confidence; unverifiable rows are dropped, never invented); polite, legal
> scraping (robots.txt/ToS, rate-limit, cache, prefer official APIs + schema.org structured
> data before HTML scraping).
>
> **Confidence column:** `H` = high confidence it's free/scrapeable + accessible (from prior
> verification or well-established public access); `V` = **verify at pickup** (free-tier terms,
> license, or scrapeability must be re-confirmed on the live site before building — same
> discipline as the existing roadmap's "re-verify pricing at pickup"). An adversarial
> verification workflow is finishing in parallel; its confirmed verdicts will be folded into
> a v1.1 revision.

Already ingested (excluded as net-new): Open Icecat (datasheets + relations), ENERGY STAR,
DLC QPL, FCC EAS, GLEIF/Wikidata/SEC EDGAR, ETIM, USITC HTS + Section 301, BLS PPI,
OpenEI/URDB, UNSPSC, REACH/RoHS/Prop65, ~200 verified crosses, brand hierarchy, and **live**
Mouser + Digi-Key **pricing**. `EC3/openEPD` stays **rejected** (free tier forbids caching into
a production app = a paid trap).

---

## 1. The renewable collection framework (the prerequisite for everything)

Every source below is implemented as a **Source Adapter** behind one interface, so the app
can re-run it later, diff for new data, and expose it as an API/MCP feed — all $0.

```
SourceAdapter:
  id, segment, dataTypes, cadence, license, robots/ToS policy
  fetch()      → pull raw (REST API | bulk file | sitemap+HTML | structured-data/JSON-LD)
  parse()      → normalize to {sku/mpn/gtin, attributes, datasheetUrl, imageRef, crosses, …}
  provenance() → attach sourceUrl + confidence + fetchedAt (reuse assessRecord ≥95 gate)
  snapshot()   → store the normalized pull in the durable store (namespace per adapter)
  diff()       → compare vs last snapshot → adds / changes / removals
  merge()      → gated merge into the catalog enrichment layer (static) OR serve live (seam)
```

**Run model (no cron — per CLAUDE.md):** adapters run **operator-triggered** or via the
existing **BullMQ** queue seam; each run snapshots + diffs + writes a data-quality delta
report. **Two ingestion shapes reused from the repo:** (A) **static build-layer** (the
`scripts/build-real-products.mjs` → provenance gate → `generate.ts` merge → data-quality
report pattern) for openly-licensed reference data; (B) **dormant env-gated live seam**
(`lib/integration/*-live.ts`) for volatile/restricted data ($0 until keyed).

**Scraping etiquette + legality (built into the framework):** obey `robots.txt`; prefer
official APIs and **schema.org / JSON-LD `Product`** structured data on product pages before
HTML scraping; per-domain rate-limit + cache + ETag/Last-Modified; store **factual** specs
(public, non-copyrightable data — e.g. amperage, poles, GTIN), not copyrighted prose/drawings;
treat each datasheet/image as a **reference URL** to mirror only where the license permits
(Icecat/GS1/manufacturer terms vary). A domain whose ToS prohibits scraping is dropped in
favor of its official API or skipped.

**MCP / API exposure:** each adapter gets a thin MCP tool (`refresh_source`, `get_product_data`)
and an internal HTTP feed, so downstream agents/clients pull product data without re-scraping.

---

## 2. Source catalog (≥40 net-new sources, grouped by data type)

> Cost types: **$0-API** (free official API) · **$0-bulk** (free bulk download) · **scrape**
> (public structured-data/HTML, $0) · **freemium-dormant** (free tier, seam dormant until keyed)
> · **paid-dormant** (paid, dormant seam only). Renewability: **api** · **bulk** · **scrape-rerun**
> · **mcp**.

### A. Manufacturer product data — specs, submittal PDFs, accurate images, GTINs *(highest value)*
These hero brands publish public product pages (most with schema.org/JSON-LD), spec/submittal
PDFs, and product images. A **manufacturer product-page harvester** (sitemap → JSON-LD → diff)
ingests them per-brand. **Value: HIGH** (accurate images + submittal sheets + real specs for the
exact brands Wesco sells; complements Icecat where its coverage is thin).

| # | Source | Data | Cost | Renew | Conf |
|---|---|---|---|---|---|
| 1 | **Eaton** product catalog (eaton.com) | attributes, datasheets, images, GTIN | scrape | scrape-rerun | V |
| 2 | **Schneider Electric / Square D** (se.com, Exchange/mySchneider) | attributes, datasheets, images | scrape / $0-API | api | V |
| 3 | **Siemens** Industry Mall + SIOS | attributes, datasheets, CAx, images | scrape | scrape-rerun | V |
| 4 | **ABB Library** (library.abb.com) | datasheets, manuals, images | scrape | scrape-rerun | V |
| 5 | **Hubbell** (hubbell.com) | attributes, spec sheets, images | scrape | scrape-rerun | V |
| 6 | **Leviton** product data | attributes, spec sheets, images | scrape | scrape-rerun | V |
| 7 | **Legrand / Pass & Seymour** (legrand.us) | attributes, spec sheets, images | scrape | scrape-rerun | V |
| 8 | **Lutron** submittals | attributes, submittal PDFs, images | scrape | scrape-rerun | V |
| 9 | **Southwire** (wire/cable ampacity, specs) | attributes, spec sheets, images | scrape | scrape-rerun | V |
| 10 | **Panduit** (panduit.com) | attributes, datasheets, CAD, images | scrape | scrape-rerun | V |
| 11 | **nVent** (Hoffman/Caddy/Erico) | attributes, datasheets, images | scrape | scrape-rerun | V |
| 12 | **Emerson Appleton/Crouse-Hinds/Killark** | attributes, datasheets, images | scrape | scrape-rerun | V |

### B. Distributor / aggregator APIs — full product data on REAL MPNs *(highest value÷cost; plumbing exists)*
Mouser + Digi-Key are already wired for **pricing** — expand the same adapters to harvest the
**parametric attributes + datasheet URLs + accurate image URLs** they already return.

| # | Source | Data | Cost | Renew | Conf |
|---|---|---|---|---|---|
| 13 | **Digi-Key Product Information API** (expand existing) | attributes, datasheet, image, media | $0-API | api | H |
| 14 | **Mouser Search API** (expand existing) | attributes, datasheet, image | $0-API | api | H |
| 15 | **Newark / element14 (Farnell) Product Search API** | attributes, datasheet, image | $0-API | api | V |
| 16 | **Octopart / Nexar GraphQL** (expand dormant seam) | datasheets, images, specs, lifecycle | freemium-dormant | api/mcp | H |
| 17 | **TrustedParts / ECIA** (expand existing adapter) | datasheet, authorized-distributor data | $0-API | api | H |
| 18 | **Grainger / Graybar / Rexel** public catalogs | attributes, images, datasheets | scrape | scrape-rerun | V (ToS-gated) |

### C. Cross-reference / competitive-replacement / lifecycle *(fills the crosses gap)*
| # | Source | Data | Cost | Renew | Conf |
|---|---|---|---|---|---|
| 19 | **Manufacturer competitive-cross tools** (Eaton/Square D/Siemens/ABB xref) | cross-reference | scrape | scrape-rerun | V |
| 20 | **Manufacturer PCN/PDN portals** (EOL + recommended replacement) | lifecycle, cross-reference | scrape | scrape-rerun | V |
| 21 | **ECIA / ECIAauthorized** | cross-reference, authorized parts | $0-API / scrape | api | V |
| 22 | **SiliconExpert / Z2Data** (free tiers) | lifecycle/EOL, cross-reference | freemium-dormant | api | V |

### D. Product images — accurate, license-clear
| # | Source | Data | Cost | Renew | Conf |
|---|---|---|---|---|---|
| 23 | **Manufacturer media/DAM** (ABB Library, Schneider download center, Eaton media) | images by MPN | scrape | scrape-rerun | V |
| 24 | **GS1 image-by-GTIN / 1WorldSync** | images by GTIN | freemium-dormant | api | V |
| 25 | *(distributor image CDNs — delivered via §B APIs)* | images | $0-API | api | H |

### E. Attribute / spec standards + parametric / photometric *(the facet backbone — sequence early)*
| # | Source | Data | Cost | Renew | Conf |
|---|---|---|---|---|---|
| 26 | **IEC Common Data Dictionary (CDD, 61360)** | attribute dictionary | $0-bulk | bulk | V |
| 27 | **GS1 GPC** (Global Product Classification) | taxonomy/brick | $0-bulk | bulk | V |
| 28 | **eCl@ss** (basic) | classification + attributes | freemium-dormant | bulk | V |
| 29 | **IES photometric files (LM-63 .ies) + LM-79** | lumens/distribution for luminaires | scrape | scrape-rerun | V |
| 30 | **NEMA device configs** (enclosure NEMA 250, motor frames MG-1, WD-6 plug/recept) | attributes/codes | scrape | one-time + refresh | H |
| 31 | **NEC factual tables** (310.16 ampacity, box-fill, conduit-fill) — NFPA free-access read | engineering attributes | scrape | one-time | V (encode facts only) |

### F. Certification / listing directories *(trust attributes)*
| # | Source | Data | Cost | Renew | Conf |
|---|---|---|---|---|---|
| 32 | **UL Product iQ** | UL listings | scrape / paid-dormant | scrape-rerun | V |
| 33 | **Intertek Directory of Listed Products (ETL)** | ETL listings | scrape | scrape-rerun | V |
| 34 | **CSA Group certification record** | CSA listings | scrape | scrape-rerun | V |
| 35 | **NIOSH NPPTL Certified Equipment List** | PPE/respirator certs | $0-bulk/API | bulk | V |
| 36 | **DOE CCMS** (transformer/motor efficiency) | efficiency attributes | scrape-export | scrape-rerun | **H** (prior-verified) |

### G. GTIN / identity / master data *(dedup + image-by-GTIN backbone — sequence early)*
| # | Source | Data | Cost | Renew | Conf |
|---|---|---|---|---|---|
| 37 | **GS1 US Data Hub / Verified by GS1** | GTIN→brand validation | freemium-dormant | api | V |
| 38 | **1WorldSync** (GDSN free tiers) | GTIN master data | freemium-dormant | api | V |
| 39 | **Open Icecat UPC dataset** (8edu-y555 — part of Icecat) | GTIN↔model↔brand | $0-API | api | H |

### H. Government / open-data product data *(net-new; several prior-verified)*
| # | Source | Data | Cost | Renew | Conf |
|---|---|---|---|---|---|
| 40 | **EPREL** (EU energy labels — lighting/displays) | efficiency specs | $0-API | api | **H** (prior-verified) |
| 41 | **CPSC Recalls API** (SaferProducts.gov) | recall/safety risk | $0-API | api | **H** (prior-verified) |
| 42 | **Census Building Permits + USASpending + BLS QCEW + Socrata permits** | demand-side geo signals | $0-API/bulk | api | **H** (prior-verified) |
| 43 | **RUS/USDA accepted-materials (utility)** | utility-segment approved products | $0-bulk | bulk | V |

### I. Category-specific (datacom / security / utility / safety)
| # | Source | Data | Cost | Renew | Conf |
|---|---|---|---|---|---|
| 44 | **TIA / BICSI cabling categories** (Cat6A/8, OM/OS fiber, PoE classes) | datacom taxonomy/facets | scrape | one-time | V |
| 45 | **ONVIF conformant-products list** | security camera/device data | $0-bulk | bulk | V |
| 46 | **CommScope / Corning fiber product data** | datacom attributes, datasheets | scrape | scrape-rerun | V |
| 47 | **NEMA WD-6 mating logic** (plug/receptacle pairs) | wiring-device facts | one-time curate | one-time | **H** (prior-verified) |

> **Count: 47 net-new source entries** across 9 data-type groups (≥40 target met). Items
> marked **H (prior-verified)** were confirmed free + accessible in the earlier strategy
> review; **V** items need a live re-check at pickup (the parallel verification workflow will
> sharpen these into a v1.1).

---

## 3. Ranked backlog — value ÷ cost, prerequisite-first

Value 1–10 (impact on catalog accuracy/coverage/search for Wesco). Cost 1–5 (1 = cheap;
scraping multiple brands or legal review raises cost). **Ratio = value ÷ cost.** Stories are
grouped per source-group (one adapter family per story). Sequenced so **foundation + identity +
attribute backbone come first** (later enrichment depends on them), then highest value÷cost.

| # | Story | Segment | Val | Cost | Ratio | Cost-type | Depends on | Sprint |
|---|---|---|---|---|---|---|---|---|
| DS-1 | **Source-Adapter framework** (fetch/parse/provenance/snapshot/diff/merge + scrape runtime + operator-trigger + data-quality delta) | infra | 10 | 4 | 2.5 | $0 | — | **D1** |
| DS-2 | **MCP/API feed wrapper** for adapters (refresh_source / get_product_data) | infra | 7 | 2 | 3.5 | $0 | DS-1 | **D1** |
| DS-3 | **GTIN/identity backbone** (Open Icecat UPC + GS1/1WorldSync dormant) | identity | 8 | 3 | 2.7 | $0-API + freemium | DS-1 | **D2** |
| DS-4 | **Attribute/taxonomy backbone** (IEC CDD + GS1 GPC + eCl@ss → subcategory map) | attributes | 8 | 4 | 2.0 | $0-bulk | DS-1 | **D2** |
| DS-5 | **NEMA/NEC factual tables** (configs, ampacity, fill, mating) | attributes | 7 | 2 | 3.5 | scrape/curate | DS-4 | **D2** |
| DS-6 | **Distributor-API product-data harvest** (expand DigiKey + Mouser to attrs/datasheets/images) | mfr/dist | 9 | 2 | **4.5** | $0-API | DS-1, DS-3 | **D3** |
| DS-7 | **Newark/Farnell + Nexar/Octopart + ECIA** product-data adapters | mfr/dist | 8 | 3 | 2.7 | $0-API + freemium | DS-6 | **D3** |
| DS-8 | **Manufacturer product-page harvester — Tier-1 brands** (Eaton, Schneider, Siemens, ABB, Hubbell, Leviton) | manufacturer | 9 | 4 | 2.25 | scrape | DS-1, DS-3, DS-4 | **D4** |
| DS-9 | **Manufacturer harvester — Tier-2 brands** (Legrand, Lutron, Southwire, Panduit, nVent, Emerson) | manufacturer | 8 | 4 | 2.0 | scrape | DS-8 | **D4** |
| DS-10 | **Accurate-image layer** (manufacturer DAM + distributor CDN + GS1-by-GTIN) | images | 8 | 3 | 2.7 | scrape + $0-API | DS-6, DS-8 | **D4** |
| DS-11 | **Cross-reference harvester** (manufacturer competitive-cross tools) | cross-ref | 9 | 4 | 2.25 | scrape | DS-1, DS-3 | **D5** |
| DS-12 | **Lifecycle / EOL + replacement** (PCN/PDN portals; SiliconExpert/Z2Data dormant) | lifecycle | 7 | 3 | 2.3 | scrape + freemium | DS-11 | **D5** |
| DS-13 | **Certification badges** (Intertek ETL, CSA, UL iQ, NIOSH, DOE CCMS) | compliance | 7 | 4 | 1.75 | scrape/$0-bulk | DS-1, DS-3 | **D6** |
| DS-14 | **Lighting photometrics** (IES LM-63/LM-79) + EPREL | lighting | 7 | 3 | 2.3 | scrape + $0-API | DS-4 | **D6** |
| DS-15 | **Category depth** (TIA/BICSI datacom, ONVIF security, RUS utility, safety/PPE) | datacom/sec/util/safety | 6 | 4 | 1.5 | scrape/$0-bulk | DS-4 | **D6** |
| DS-16 | **Distributor-catalog scrape** (Grainger/Graybar/Rexel — only where ToS permits / via their APIs) | dist | 6 | 4 | 1.5 | scrape (ToS-gated) | DS-1 | **D6** |
| DS-17 | **Demand-side geo signals** (Census BPS + USASpending + CPSC Recalls + Socrata permits) | demand/risk | 6 | 3 | 2.0 | $0-API | DS-1 | **D6** |

---

## 4. Sprint plan (development → production)

Each sprint ends with the standard gate (typecheck + full suite + build → adversarial review →
deploy → live verify → docs/help/memory). Earlier sprints unblock later ones.

### **Sprint D1 — Renewable collection foundation** *(prerequisite for all)*
DS-1, DS-2. Build the Source-Adapter framework, the polite-scraping runtime (robots/ToS,
rate-limit, cache, JSON-LD-first), snapshot + diff + provenance, the operator-trigger/BullMQ
run loop, the per-adapter data-quality delta report, and the MCP/API feed wrapper. **Nothing
ingests well without this** — it's the renewable, rerunnable, MCP-exposable spine the rest plug into.

### **Sprint D2 — Identity + attribute backbone** *(prereq for enrichment quality)*
DS-3, DS-4, DS-5. GTIN/identity resolution (so new product data dedups + joins by GTIN/MPN),
and the attribute/taxonomy dictionaries (IEC CDD, GS1 GPC, eCl@ss, NEMA/NEC facts) that give
incoming specs a normalized home + power faceted search. **Sequenced second because every
later harvester writes through these.**

### **Sprint D3 — Distributor-API product-data harvest** *(highest value÷cost)*
DS-6, DS-7. Expand the **already-authenticated** Digi-Key/Mouser seams from pricing to full
product data (parametric attributes, datasheet URLs, accurate images) on real MPNs, then add
Newark/Farnell + Nexar + ECIA. **Best ratio (4.5)** because the API plumbing already exists and
the data is clean/licensed.

### **Sprint D4 — Manufacturer harvester + accurate images** *(highest raw value)*
DS-8, DS-9, DS-10. The schema.org/sitemap harvester across the hero brands Wesco sells —
real specs, submittal PDFs, and **accurate brand images** (the catalog's biggest visible gap).
Tier-1 brands first, then Tier-2; images layered from manufacturer DAM + distributor CDNs + GS1.

### **Sprint D5 — Cross-reference + lifecycle**
DS-11, DS-12. Harvest manufacturer competitive-cross tools (directly grows the ~200-row crosses
asset) and PCN/PDN EOL + recommended-replacement feeds. **Depends on identity (DS-3) to map
both sides.**

### **Sprint D6 — Certifications, category depth, demand signals, distributor scrape**
DS-13…DS-17. Cert badges (UL/Intertek/CSA/NIOSH/DOE), lighting photometrics + EPREL, datacom/
security/utility/safety category depth, ToS-permitting distributor catalogs, and the demand-side
geo signals. **Next-level value; all build on the D1–D2 foundation.**

---

## 5. Honesty + cost notes

- **$0 throughout the build.** Scraping is $0; official free APIs are $0; freemium/paid sources
  (Nexar, GS1, 1WorldSync, eCl@ss, SiliconExpert, UL-iQ-API) ship as **dormant seams** — code
  only, no key, no bill — exactly like the existing integrations.
- **No fabrication.** Each adapter attaches `sourceUrl + confidence` and passes the provenance
  ≥95 gate; rows that can't be verified to a carried product are dropped. Images/datasheets are
  stored as **reference URLs** and mirrored only where the license permits.
- **Legality.** Public factual specs are ingested via official APIs and schema.org structured
  data first; HTML scraping is polite (robots/ToS/rate-limit/cache) and avoids copyrighted prose,
  drawings, and any ToS-prohibited domain (those fall back to the domain's API or are skipped).
- **Renewable by design.** Every source is an adapter that re-runs (operator-triggered or queued),
  snapshots, diffs for new/changed/removed data, and is exposed as an MCP tool / internal feed.

> **Status:** this v1 is built from prior-verified sources + domain knowledge with each entry's
> confidence marked. A parallel adversarial-verification workflow (run `wb29spln0`) is confirming
> the **V**-marked sources on their live sites (free-tier terms, license, scrapeability); its
> verdicts will be merged into **v1.1**, promoting/demoting/dropping sources and tightening the
> ranking.
