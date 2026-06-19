# Real-data enrichment layers — DI-S1 / DI-S2 / DI-S3 (free, $0)

The first production increment of the [dataset-ingestion backlog](roadmap-dataset-ingestion.md).
It grounds every catalog product in three **free, web-verified, CC0/public-domain
reference datasets**, all computed locally with **no API key and $0 cost** — the
static build-time pattern (A), never a network call at request time.

> **No fabrication.** Every entry carries a `sourceUrl` and a `confidence` level.
> Facts come from GLEIF, Wikidata, SEC EDGAR, the ETIM model, ECHA/OEHHA, and the
> USITC HTS — not from a model's imagination. Compliance and tariff output is
> always labeled an **estimate to confirm** against the manufacturer's declaration.

## What shipped

| Backlog story | Dataset(s) | Lands as |
|---|---|---|
| **DI-4 / DI-5 / DI-6** — manufacturer entity | GLEIF LEI (CC0), Wikidata ownership P127/P749 (CC0), SEC EDGAR former-name history | `data/real/brand-entities.ts` (211 entries — 50 LEIs, 108 former-name records) |
| **DI-1** — ETIM classification | ETIM model (ODC-By) | `data/real/etim-classes.ts` (79 subcategory → ETIM class maps) |
| **DI-7 / DI-8** — compliance & trade | ECHA REACH-SVHC, EU RoHS, OEHHA Prop 65, USITC HTS + Section 301 | `data/real/substances.ts` (CAS-anchored substances + HTS chapters) |

## The three libraries

### 1. Brand entity graph — `lib/catalog/brand-entity.ts`

```ts
interface BrandEntity {
  brand: string;            // canonical catalog brand
  parentCompany?: string;   // direct owner (Wikidata P127/P749)
  ultimateParent?: string;  // top of the ownership chain
  lei?: string;             // 20-char GLEIF Legal Entity Identifier
  aliases: string[];        // trade names / common variants
  formerNames: string[];    // pre-rebrand names (SEC EDGAR), e.g. "Cutler-Hammer"
  sourceUrl: string;
  confidence: "high" | "medium" | "low";
}
```

- `brandEntityFor(brand)` — case-insensitive lookup.
- `resolveBrandAlias(name)` — maps an alias **or** former name back to the canonical
  catalog brand ("Cutler-Hammer" → "Eaton").
- `siblingBrands(brand)` — other catalog brands under the same ultimate parent.
- `expandBrandAliases(rawQuery)` — the **search lift**: when a ≥4-char alias or
  former name appears in a query (space-boundary match, never shadowing a real
  brand), it appends the canonical brand so the search resolves the modern part.
- `entityCoverage` / `validateEntities` — coverage metrics + structural validation
  (https sources, 20-char LEI format, no duplicate brands), exercised by the tests.

### 2. ETIM class map — `lib/catalog/etim-specs.ts`

```ts
interface EtimClass {
  subcategory: string;        // our catalog subcategory
  classCode: string;          // ETIM class code, e.g. EC000042 (MCB)
  className: string;          // human ETIM class name
  requiredFeatures: string[]; // engineering features ETIM expects for the class
  confidence: "high" | "medium" | "low";
}
```

- `etimClassFor(subcategory)` — the mapped ETIM class for a catalog subcategory.
- `etimCoverage(product)` → `{ classCode, className, required[], present[], missing[],
  coveragePct, confidence }` — checks which ETIM-required features the product
  already lists, using a small **concept bridge** (ETIM keyword ↔ our spec keyword,
  e.g. *current* ↔ *amp*, *pole* ↔ *pole*) plus a ≥4-char token fallback. Drives a
  coverage bar in the UI and a "what's missing for this class" gap list.

### 3. Compliance substances + HTS — `lib/catalog/compliance-substances.ts`

```ts
type ComplianceList = "REACH-SVHC" | "RoHS" | "Prop65";
interface Substance { name; cas; lists: ComplianceList[]; electricalUse; sourceUrl; }
interface HtsChapter { chapter; description; section301Note; exampleCategory; }
```

- `substancesForProduct(product)` — scans the product's name/specs/materials against
  **CAS-anchored trigger rules** (PVC → DEHP/BBP/DBP/DIBP + Lead; brass → Lead;
  fluorescent → Mercury; chromate → hexavalent chromium; cadmium plating → Cadmium)
  and returns the matched, real substances with their CAS numbers and sources.
- `complianceListsForProduct(product)` — the distinct REACH-SVHC / RoHS / Prop 65
  lists implicated, for badge rendering.
- `htsChapterInfo(htsCode)` — the HTS chapter (85 / 84 / 94 / 74 / 76) with its
  Section 301 note, complementing the shipped landed-cost overlay.

> This is **additive** — it does **not** touch the deterministic `compliance.ts`
> enrichment or the data-quality score, both of which stay exactly as tested.

## Where the data shows up

- **Product detail → Data Enrichment panel** (`features/product-finder/DataEnrichmentPanel.tsx`,
  injected into `ProductDetailModal` under the rebate panel): manufacturer entity
  (parent / ultimate / LEI / former names), ETIM class + coverage bar, and the
  "may contain" substance list with REACH-SVHC / RoHS / Prop 65 badges + HTS note.
- **Search** — `expandBrandAliases` runs in `parseQuery` (after synonym expansion),
  so a former or parent name resolves to the catalog brand with zero extra typing.
- **Embeddings** — `enrichedEmbeddingText` (in `lib/integration/embeddings-live.ts`)
  appends the parent / aliases / former names + ETIM class name to each product's
  embedding text, so semantic recall improves when embeddings are enabled. Dormant
  and $0 until `EMBEDDINGS_API_KEY` is set — identical behavior to before otherwise.

## Cost & dormancy

100% static, real data shipped with the app: **$0, no key, always on**. The only
thing gated is the optional embeddings backfill, which already required
`EMBEDDINGS_API_KEY` — this increment just feeds it richer text when it is on.

The remaining backlog sources that are large, volatile, or licensed (ENERGY STAR,
FCC EAS, GLEIF/Wikidata live APIs, BLS PPI, URDB, DSIRE, Open Icecat) stay as
**dormant env-gated live seams** in later increments — $0 until keyed, per the cost
guardrail.

## Tests

- `lib/catalog/brand-entity.test.ts` — data-driven over `BRAND_ENTITY_ENTRIES`
  (structural validation, LEI format, alias/former-name resolution, sibling
  grouping, `expandBrandAliases` lift).
- `lib/catalog/etim-specs.test.ts` — class lookup + coverage computation.
- `lib/catalog/compliance-substances.test.ts` — trigger rules, list rollup, HTS lookup.
- `lib/integration/embeddings-live.test.ts` — `enrichedEmbeddingText` appends
  brand-entity + ETIM enrichment for a known brand/category and falls back to base
  text for an unknown one.
- `lib/product-finder-help-content.test.ts` — asserts the `data-enrichment` help topic.
