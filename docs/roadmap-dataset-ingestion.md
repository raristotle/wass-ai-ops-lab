# Dataset-ingestion backlog — improving the recommender with external data

Produced **2026-06-19** via a multi-agent web-research sweep across the data
categories that **Google Dataset Search** (<https://datasetsearch.research.google.com/>)
surfaces — product/attribute, manufacturer/brand, standards/eligibility,
compliance/trade, and pricing/commodity — cross-checked against our shipped
ingestion pipeline. Every dataset below was found and vetted for **license,
access method, and cost**, with **free sources prioritized** and **valuable paid
sources flagged with their real price**.

Goal: feed better **attributes, datasheets, manufacturer hierarchy,
cross-references, classification, compliance flags, and price signals** into the
Meridian Product Finder so search, embeddings (#4), the data-quality score (#11),
the cross-reference engine, the rebate estimator, and the landed-cost overlay all
get sharper.

---

## How to keep discovering datasets (the method)

Use **Google Dataset Search** with these query shapes, then vet each hit for
license + access + freshness before adding a story here:

- `electrical product attributes`, `circuit breaker dataset`, `lighting fixtures dataset`
- `GTIN UPC product database`, `manufacturer brand ownership`, `company parent subsidiary`
- `ENERGY STAR certified products`, `DLC qualified products`, `UL listing`
- `HTS tariff section 301`, `REACH SVHC`, `RoHS substances`, `Prop 65 list`
- `producer price index electrical`, `copper aluminum commodity price`

Also worth bookmarking as ongoing discovery surfaces: **data.gov**,
**data.europa.eu** (EU Open Data), **AWS Registry of Open Data**, **Hugging Face
Datasets**, **Kaggle**, and **github.com/awesomedata/awesome-public-datasets** /
**awesome-industrial-datasets**.

---

## Two ingestion patterns (reuse, don't reinvent)

Every story picks one of the two patterns the app already ships:

### A. Static build-time layer  *(for stable reference/attribute data — the default)*
1. Land the source as JSON under `data/real/` (or a new `data/ref/<dataset>/`).
2. Extend / add a builder modeled on **`scripts/build-real-products.mjs`** (schema
   validate → link-verify URLs → dedupe → emit a typed `.ts` with a `verifiedAt`).
3. **Provenance + confidence gate** via `lib/catalog/provenance.ts` (`assessRecord` →
   only ≥95 `productionReady` enter the catalog; the rest land in the data-quality
   report). Tag each record's `dataSource`/`provenance` so it flows into the **#11
   data-quality score**.
4. Merge in **`lib/catalog/generate.ts`** (a real SKU matching a curated entry
   *upgrades* it; otherwise it's appended) → it shows up in `getCatalog()`, search,
   embeddings, and faceting automatically.
5. Sync identifiers/hierarchy: keep brands aligned with **`data/real/brand-hierarchy.ts`**;
   populate `gtin`/`catalogNumber`/`wescoSku`/`parentCompany`; the quality report
   (`lib/catalog/data-quality.ts`) surfaces gaps.

### B. Dormant live API seam  *(for fresh/volatile data — pricing, availability, programs)*
Mirror the shipped seams (`lib/integration/*-live.ts`, e.g. `commodity-live`,
`embeddings-live`): an `env()` gate + `xConfigured()` boolean, `{enabled:false}`
fail-closed union, `rateLimit → requireApiAuth → dormant-gate → Zod → logic →
logApiError`, a `/api/...` route, and a `health` flag. **$0 and zero network until
its key is set** — honors the cost guardrail.

> **License discipline:** several sources (Octopart/Nexar, GS1, IDW, Icecat Full)
> restrict caching/redistribution. Live/volatile data → pattern B (fetch per
> request, don't persist). Openly-licensed reference data (ETIM ODC-By, ENERGY
> STAR public-domain, Wikidata/GLEIF CC0) → pattern A (snapshot at build), keeping
> the required attribution.

---

## Ranked master list (value ÷ cost)

**Free, highest-ROI (do first):**

| Dataset | License / cost | Access | What it improves |
|---|---|---|---|
| **ETIM Classification Model** | Free (ODC-By) | bulk CSV/IXF/Excel | The electrical **attribute backbone** — defines required specs per category; drives faceting, completeness scoring, like-for-like cross-ref |
| **ENERGY STAR Certified Products** | Free (public-domain) | Socrata REST + CSV | Cert flag + efficacy/wattage/UPC for lighting/electronics; spec + GTIN fill |
| **DLC QPL** (SSL/NLC) | Free (web export; bulk = paid) | CSV export | DLC-qualified flag + photometric specs → powers the shipped **rebate estimator (#6)** |
| **GLEIF LEI** (L1+L2) | Free (CC0) | bulk CSV/JSON + REST | **Parent-company rollups** + a stable global ID per manufacturer (brand hierarchy) |
| **Wikidata** (P127/P749, GTIN P3962) | Free (CC0) | SPARQL + dumps | Brand aliases + ownership chains + cross-walk IDs (LEI/CIK/DUNS) → entity resolution for cross-ref |
| **Open Icecat** | Free tier (Full = paid) | XML/JSON API + feeds | Datasheets/specs/images/GTINs/marketing copy on the real-products layer (strong on lighting/datacom) |
| **USITC HTS + Section 301/232** | Free (public-domain) | JSON/CSV (no key) | HTS code + duty + 301 surcharge → the shipped **tariff/landed-cost overlay (#14)** |
| **California Prop 65 list** (OEHHA) | Free | CSV/XLSX | Per-SKU Prop 65 flag (PVC/lead wire, brass connectors) + BOM rollup |
| **ECHA REACH SVHC + EU RoHS** | Free | CSV/web | RoHS/REACH compliance flags + BOM rollup |
| **FCC Equipment Authorization (EAS)** | Free (public-domain) | Socrata REST + bulk | "FCC ID verified" flag for wireless/datacom; grantee→manufacturer normalization |
| **BLS PPI** (electrical/metals series) | Free | REST API | Wholesale price-trend for **YOUR** products (wire/conduit/switchgear) — metal-cost passthrough |
| **World Bank "Pink Sheet"** + **FRED** | Free | CSV / REST | License-clean copper/aluminum benchmarks for the commodity strip (FRED already wired) |
| **SEC EDGAR** | Free (public-domain) | REST + bulk | US public-parent identity + **former-name history** (resolves rebrands/spin-offs) |
| **Amazon ESCI Shopping Queries** | Free (research) | GitHub/HF | Substitute/Complement **ground-truth labels** → train/validate the cross-ref + substitute engine and ranking |
| **DSIRE** (incentive programs) | Free open-data (commercial API = ask) | XML/JSON + API | The **program** layer — which rebates/incentives apply by location — pairs with QPL/ENERGY STAR product eligibility |
| **NREL/OpenEI URDB** (utility rates) | Free (dev key) | REST + CSV | Converts kWh-saved → **$ saved** for the rebate estimator using the customer's local rate |
| **DOE CCMS + Tax-Credit Lookup** | Free (public-domain) | bulk Excel/CSV | Efficiency data for federally-regulated gear (transformers/motors) + **IRA 25C tax-credit** eligibility |
| **UNSPSC** | Free (PDF; member Excel) | PDF/data.gov | Procurement classification (already shipped #64) — keep current |

**Freemium (free tier; paid to scale — build dormant, pattern B):**

| Dataset | Free tier | Paid | Improves |
|---|---|---|---|
| **Octopart / Nexar** | 1,000 calls/mo | quote-only (enterprise) | Live datacom/electronics pricing, datasheets, lifecycle/EOL, second-source |
| **GS1 Verified by GS1** | free single lookup | membership (~low-hundreds $/yr+) | Authoritative GTIN/brand validation; barcode→true brand owner |
| **TraceParts** | free per-part | publishing plans | CAD/drawings + datasheet PDFs on product pages |
| **metals.dev** | 100 req/mo | from ~$1.49/mo | Near-real-time copper/aluminum tick for the strip |
| **AHRI Directory** | ≤250 rows/search | data subscription | HVAC cert + rebate/tax-credit eligibility |
| **UL Product iQ** | free search | paid API | UL-listing verification (breakers/wire/conduit/connectors) |

**Paid watchlist (provision/quote before a story — pattern B, dormant):**

| Dataset | Price | Why it's worth it |
|---|---|---|
| **IDEA Industry Data Warehouse (IDW)** | quote-only (NEMA/NAED) | **The domain-perfect source** — the US electrical channel's own ETIM/UNSPSC-native attributes, datasheets, GTINs **and price sync** for breakers/wire/conduit. The single highest-value paid option. |
| **Full Icecat** | low-thousands $/yr | Guaranteed coverage across 40k+ brands |
| **OpenCorporates API** | £2,250–£12,000/yr | Private/non-US manufacturer legal entities GLEIF/EDGAR miss |
| **Crunchbase** | $99–199/mo (+Enterprise API) | Recent M&A/acquisition layer for brand hierarchy |
| **D&B Direct+** | 5–6 figure/yr | Gold-standard complete corporate family tree |
| **LME official data** | ~$85/report, ~$1,200/yr API | Official metal settlements (not justified vs free Pink Sheet for this app) |

---

## Sprint stories (value-ordered, all $0 unless noted)

> **Increment 1 shipped 2026-06-19** — the free static layers of DI-S1/S2/S3.
> See [dataset-ingestion-real-layers.md](dataset-ingestion-real-layers.md).
> ✅ **DI-1** (ETIM class map), ✅ **DI-4** (GLEIF LEI), ✅ **DI-5** (Wikidata
> ownership/aliases), ✅ **DI-6** (SEC EDGAR former names), ✅ **DI-8** (REACH/
> RoHS/Prop 65 CAS triggers), 🟡 **DI-7** (HTS chapter + Section 301 lookup added
> as additive enrichment; the per-subcategory tariff table replacement remains).
>
> **Increment 2 shipped 2026-06-19** — the free LIVE API seams (dormant/$0 until
> keyed), contract-verified against the live endpoints. See
> [dataset-ingestion-live-seams.md](dataset-ingestion-live-seams.md).
> ✅ **DI-2** (ENERGY STAR free Socrata + DLC QPL paid-token seam), ✅ **DI-9**
> (FCC EAS Socrata), ✅ **DI-10** (Open Icecat datasheets), ✅ **DI-11** (BLS PPI
> electrical series; World Bank Pink Sheet deferred — metals only in a rotating-URL
> xlsx, redundant with FRED), ✅ **DI-13** (OpenEI URDB utility rates; DSIRE
> deferred — free API now 403/paid, free mirror frozen at 2017), plus **GLEIF +
> Wikidata LIVE** lookups (the live-refresh companions to Increment 1's static layer).
>
> **Increment 3 shipped 2026-06-19** — the two remaining $0/no-account items, both
> contract-verified by web research first.
> ✅ **DI-7** (full per-subcategory USITC HTS + real MFN + per-subcategory Section 301
> + steel Section 232 — [hts-tariff.md](hts-tariff.md)); ✅ **DI-12** (offline
> cross-reference/substitute ranking eval against our verified-cross ground truth —
> research confirmed Amazon ESCI is query→product, the wrong shape, so we use our own
> cited crosses — [cross-reference-eval-report.md](cross-reference-eval-report.md)).

### DI-S1 · Attribute + classification backbone  *(free, pattern A)*
**✅ DI-1 — ETIM classification ingestion.** Land ETIM (groups/classes/features/values/
units) as a typed reference under `data/ref/etim/`; map our subcategories → ETIM
classes; derive **required-spec sets** per category. *Improves:* completeness
scoring (#11), faceting, and like-for-like cross-ref matching. *Acceptance:* each
electrical subcategory maps to an ETIM class; the data-quality score penalizes a
breaker missing amperage/poles/breaking-capacity; ODC-By attribution shown.
**✅ DI-2 — ENERGY STAR + DLC QPL lighting enrichment.** Snapshot ENERGY STAR
(Socrata) + DLC QPL CSV; upgrade matching lighting SKUs with cert flag + efficacy/
wattage/UPC. *Improves:* rebate estimator (#6), compliance facet, spec fill.
*Acceptance:* lighting SKUs carry an `energyStar`/`dlcQualified` flag + photometric
specs; rebate estimate cites the listing.
**DI-3 — UNSPSC refresh.** Re-parse the current UNSPSC codeset; verify `unspscFor`
coverage. *Acceptance:* no electrical subcategory falls back to a generic code.

### DI-S2 · Manufacturer / brand entity layer  *(free CC0, pattern A)*  — ✅ shipped
**✅ DI-4 — GLEIF LEI parent rollups.** Ingest LEI L1+L2 RR; attach an LEI + direct/
ultimate parent to each manufacturer. *Improves:* brand hierarchy, second-source.
*Acceptance:* every catalog brand resolves to an LEI or is reported as a gap.
**✅ DI-5 — Wikidata brand graph.** SPARQL for brand→owner (P127/P749) + aliases +
cross-walk IDs; feed the brand-hierarchy registry + cross-ref "equivalent brand".
*Acceptance:* "Square D / Homeline / QO → Schneider" resolves; aliases improve search recall.
**✅ DI-6 — SEC EDGAR name history.** Add US public-parent identity + former-name map.
*Acceptance:* a rebranded/spun-off manufacturer still resolves to its current parent.

### DI-S3 · Compliance + trade enrichment  *(free public-domain, pattern A)*
**✅ DI-7 — HTS + Section 301.** Replace the static tariff table with the USITC HTS +
Chapter-99 301/232 mapping; assign HTS per subcategory. *Improves:* landed-cost
overlay (#14) accuracy. *Acceptance:* duty + 301 surcharge derive from a real HTS code.
*(SHIPPED Increment 3: full per-subcategory verified HTS table — real MFN +
per-subcategory Section 301 + steel Section 232 — replacing the chapter model.)*
**✅ DI-8 — Prop 65 + REACH/RoHS flags.** Ingest OEHHA Prop 65 + ECHA SVHC + RoHS
Annex II as CAS lists; flag SKUs whose materials reference a listed substance.
*Acceptance:* per-SKU compliance flags + BOM rollup ("contains SVHC?").
**✅ DI-9 — FCC EAS verified flag.** Dormant Socrata seam (pattern B) OR build-snapshot
for the grantee-code→manufacturer map. *Acceptance:* wireless/datacom SKUs show an
"FCC ID verified" facet.

### DI-S4 · Product content + price/demand signals  *(free, mixed pattern)*
**✅ DI-10 — Open Icecat datasheets.** Pattern A snapshot of Open Icecat for sponsored
brands → fill datasheets/images/specs/GTINs/marketing copy on the real-products
layer (respect DRM-gated assets). *Improves:* #11 score, embeddings (#4) chunks, search.
**🟡 DI-11 — BLS PPI + Pink Sheet commodity signals.** Add BLS PPI electrical series +
World Bank Pink Sheet to the commodity strip (FRED seam already exists). *Improves:*
metal-cost passthrough realism.
**✅ DI-12 — Amazon ESCI substitute labels.** Use ESCI Substitute/Complement pairs as
ground truth to **validate + tune** the cross-reference/substitute ranking (offline
eval, not shipped data). *Acceptance:* a measured precision/recall on substitutes.
*(SHIPPED Increment 3: research confirmed ESCI is query→product — the WRONG shape —
so the eval uses our own verified-cross dataset as held-out ground truth instead;
measured recall@10 39.3%, precision@1 25%, MRR 0.321 over 28 evaluable pairs.)*
**🟡 DI-13 — URDB + DSIRE rebate depth.** Dormant seams (pattern B): URDB for $-saved
math, DSIRE for "which programs apply here". *Improves:* the rebate estimator from a
range to a location-aware figure.

### DI-S5 · Freemium dormant seams  *(free tier, gate dormant, pattern B)*
**DI-14 — Nexar/Octopart** (datacom/electronics live pricing+datasheets — extends
the shipped offer ladder; 1k free calls/mo, get a quote before production).
**DI-15 — GS1 Verified GTIN validation** (clean/verify GTINs; barcode→brand for
scan-to-reorder + visual part ID).
**DI-16 — TraceParts CAD** + **metals.dev** live tick.

### DI-S6 · Paid watchlist  *(provision/quote first — biggest data lift)*
**DI-17 — IDEA IDW** (the domain-perfect attribute+price source for breakers/wire/
conduit — get a quote; dormant seam until funded). **DI-18 — Full Icecat**,
**OpenCorporates**, **Crunchbase/D&B** for deep entity coverage.

---

## Notes & guardrails
- **Cost guardrail honored:** every freemium/paid source ships as a **dormant,
  env-gated seam** ($0 until a key is set). The free build-layer datasets add no
  runtime cost.
- **Provenance everywhere:** ingested records carry a `dataSource`/source URL so the
  **data-quality score (#11)** reflects the upgrade and the quality report tracks
  coverage — better data → better embeddings (#4) → better recall.
- **License first:** never persist Octopart/Nexar/GS1/IDW pricing or catalog data
  beyond what their ToS allows; those are pattern-B (per-request, not cached).
- Start with **DI-S1 + DI-S2** — ETIM + ENERGY STAR/DLC + GLEIF + Wikidata are the
  highest value-per-dollar, all free/CC0, and they compound (better attributes and
  better entity resolution lift search, cross-ref, embeddings, and compliance at once).
