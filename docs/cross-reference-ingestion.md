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

**738,102 unique competitor→target cross pairs** from **47 files** (1,535 brands, 50 sources),
deduped and junk-dropped. Highlights by wave:

| Wave | Representative files | Pairs |
|---|---|---|
| Core manufacturer files | Hubbell, Eaton/Danfoss, Panduit, Leviton (×3) | ~539K |
| `*_Comparables` (legacy→Wesco comparable SKU) | ConduitFittings (+73K), WireMgmt (+42K), Enclosures (+32K), Hardware (+28K), Tools (+14K), Fuses, Safety, Lighting, Batteries, … | ~200K |
| Brand crosses | Wesco→Ferraz (+16K), Uline→Box (+13K), Wiring Devices (+7K), Northern→Liberty, Southwire→Madison, T&B→3M, Wesco→3M, Bosch→DeWalt, FLIR, TNB, Cable Ties | ~60K |
| Wide/matrix | Master Cable (12-brand), Corning, Fluke/Extech | ~2K |
| Security/camera | Hikvision→Hanwha, Dahua→Speco/Pelco/InVid, Inaxsys | <1K |
| CrossCheck (**unverified** source) | kept **only** the 873 rows confirmed "Yes" | 0.9K |

**19 of 66 files were skipped** (logged with a reason in `overrides.json`): product catalogs and
SKU lists (added as products instead — see below), Anixter↔vendor item maps, doc-link registries,
and merged-cell / 2-row-header layouts that need a small custom parse. **26 PDFs** (Cooper "fight
sheets", the Product-Crosses guides) are cross *documents*, not tables — not machine-ingested.

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
