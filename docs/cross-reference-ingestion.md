# Cross-reference (xref) file ingestion

How rep-supplied / manufacturer cross-reference spreadsheets become a live "paste a competitor part
→ get the documented equivalent" lookup, and how genuinely-new products from those files become
searchable catalog entries. Built to absorb **more files** with one config + one rerun.

## The reusable tool

Ingestion is driven by **`scripts/ingest-xref/`** — see its [README](../scripts/ingest-xref/README.md).

- `ingest.mjs` — auto-detects competitor/target part columns; per-file overrides for the rest.
  Modes: 2-column, **wide/matrix** (one key column → many brand columns), per-row brand columns,
  **verified-row filter** (keep only rows a file marks "Yes"), and **skip** (non-cross files).
- `overrides.json` — exact-filename → column map / mode / skip-reason. The audit trail of how each
  file was handled (and *why* a file was skipped — nothing is dropped silently).
- Hardened junk filter, idempotent dedup, dry-run-first workflow.

```bash
npm i -D xlsx   # one-time (dev-only; never in the browser bundle)
node scripts/ingest-xref/ingest.mjs --input <dir> --master <master.tsv> \
  --overrides scripts/ingest-xref/overrides.json --dry   # review, then drop --dry
```

## What's ingested

**759,869 unique competitor→target cross pairs** from **57 files** (1,573 brands, 62 sources),
deduped, junk-dropped, and contradiction-filtered. Highlights by wave:

| Wave | Representative files | Pairs |
|---|---|---|
| Core manufacturer files | Hubbell, Eaton/Danfoss, Panduit, Leviton (×3) | ~539K |
| `*_Comparables` (legacy→Wesco comparable SKU) | ConduitFittings (+73K), WireMgmt (+42K), Enclosures (+32K), Hardware (+28K), Tools (+14K), Fuses, Safety, Lighting, Batteries, … | ~200K |
| Brand crosses | Wesco→Ferraz (+16K), Uline→Box (+13K), Wiring Devices (+7K), Northern→Liberty, Southwire→Madison, T&B→3M, Wesco→3M, Bosch→DeWalt, FLIR, TNB, Cable Ties | ~60K |
| Wide/matrix | Master Cable (12-brand), Corning, Fluke/Extech | ~2K |
| Security/camera | Hikvision→Hanwha, Dahua→Speco/Pelco/InVid, Inaxsys, SMB matrices | ~2K |
| Tools | SnapOn, WESCO/Hilti, Wright→Proto, Bosch↔Hilti, Greenlee, Bosch→DeWalt | ~3K |
| Merged-cell / wide layouts | INTERNAL camera, OB Offering (per-category), Stocked DS→NB, Northern camera | ~4K |
| Verified-only sources | CrossCheck + Leviton rep-crossref — kept **only** the rows confirmed "Yes/Y" | ~17K |

**Merged-cell, 2-row-header, and wide multi-brand layouts** the column auto-detector can't map are
handled by bespoke parsers in `scripts/ingest-xref/merged-parsers.cjs` (pairwise camera/tool
matrices, per-category owned-brand sheets, wide usage-report crosses). Genuinely-non-cross files
(product catalogs, SKU lists, Anixter↔vendor maps, customer usage lists) are still `skip`-ped with a
reason in `overrides.json`. **PDFs** (Cooper "fight sheets", Belden/Alpha/Hoffman/Strut guides) are
cross *documents*, not tables — not machine-ingested.

Dropped at parse (never fabricated): `NO CROSS`/`NO-CROSS`, `NOT IN SAP`, `#N/A`, relationship
words (`DIRECT`, `EXACT`), sentence cells, 4+-token cells, blanks, self-crosses, and unverified rows.

## Verify, contradictions & dedup (`verify-dedup.cjs`)

- **Dedup**: every pair is keyed by normalized `(competitor → target)`; exact duplicates collapse.
  Bidirectional pairs from matrices (A→B *and* B→A) are kept on purpose — either part finds the other.
- **Multiple targets are not contradictions.** A part legitimately crosses to several brands; all are
  kept (59,577 parts have 2+ valid alternatives).
- **Contradiction policy — rejection wins.** A pair explicitly marked *not-substitutable* in any
  source (CrossCheck "No", rep-crossref "N") is removed even if another file asserts it positively.
- **Backfill** (`backfill-brands.cjs`): missing manufacturer labels are filled from the source/column
  that implies them (Leviton, Uline, Southwire, Northern…). Brand completeness is now 99.98%.

## Analysis spreadsheet (`analysis-report.cjs`)

`docs/reports/Meridian-Cross-Reference-Analysis.xlsx` — counts by category, sub-category, target
manufacturer, competitor brand, and source file. A full row-per-cross export
(`Meridian-All-Crosses.csv`, 759,869 rows) is generated alongside for raw analysis.

## Running it: `/ingest-xref`

Drop the next batch and invoke the **`/ingest-xref`** skill (`.claude/skills/ingest-xref/`), or run
the tool directly. See [the tool README](../scripts/ingest-xref/README.md) for the full recipe.

Dropped at parse (never fabricated): `NO CROSS`/`NO-CROSS`, `NOT IN SAP`, `#N/A`, relationship
words (`DIRECT`, `EXACT`), sentence cells (`N/A — Pelco does not have…`), 4+-token cells, blanks,
self-crosses, and the unverified rows not confirmed "Yes".

## Genuinely-new products added from this batch

Files that are **product lists, not crosses** become searchable catalog entries (deduped by SKU):

- **`data/real/atkore-products.ts`** — 728 Atkore conduit/fittings/bodies with specs **straight
  from the Atkore catalog file** (catalog #, family, trade size, material, coating, fitting type,
  GTIN). No web research, no fabrication — every attribute is a source column.
- **`data/real/security-brand-products.ts`** — 100 top-selling Vivotek / Digital Watchdog / Speco /
  InVid SKUs, web-enriched with **verified** specs (resolution, form factor, lens, IR, IP rating)
  from each manufacturer's own site; unverifiable fields left blank.

## Data flow

```
xlsx/xls/xlsb/csv ──ingest.mjs (auto-detect + overrides)──▶ {compBrand,compPart,tgtBrand,tgtPart,source,rel}
   ──dedupe(norm(compPart)→norm(tgtPart))──▶ master tsv
   ──pack(brands+sources interned, tab-delimited)──▶ data/real/xref-crosses.ts (~35 MB, gz ~5.3 MB)
   ──lazy build──▶ lib/catalog/xref-index.ts  (competitor-part → hits map, cached on globalThis)
   ──▶ /api/crosses/match returns `xref[]` per query (alongside the stocked `suggestions`)
```

`xref-crosses.ts` is server-side only (client bundle unchanged at 103 kB). The index parses on the
first cross-match request, capped per competitor part, isolated from the catalog.

## Honesty rules

- Only pairs where BOTH parts are present and non-junk are emitted; no part is ever invented.
- Relation defaults to `functional-substitute`; `equivalent` only when the file asserts it.
- An **unverified** source (CrossCheck) is filtered to its confirmed-"Yes" rows only.
- A column is mapped to a field only when its meaning is unambiguous — e.g. the Leviton `SIM`
  column is a UPC/GTIN, NOT a Wesco stock number, so it is not ingested as one; and the WESCO-3M
  file's `3M Cross` column is a relationship label, so the real 3M part is taken from `3M ID`.
- Web-researched product specs include only fields verified on an authoritative source.
