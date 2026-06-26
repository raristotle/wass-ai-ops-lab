# xref ingestion tool

Turns a pile of varied competitor→target **cross-reference spreadsheets** into the
packed `data/real/xref-crosses.ts` tier that the recommender's cross-match engine
(`lib/catalog/xref-index.ts`, `/api/crosses/match`) reads. Built so future cross
files drop in with little-to-no per-file work.

## Why this exists

Cross files arrive from dozens of manufacturers in dozens of shapes — two clean
columns, wide multi-brand matrices, merged-cell layouts, "is this a real match?"
verification columns, SKU lists that aren't crosses at all. Hand-mapping each one
is slow and error-prone. This tool auto-detects the common shapes and lets you
override the rest from one JSON file.

## One-time setup

```bash
npm i -D xlsx        # SheetJS — dev-only; never imported by app code, never in the browser bundle
```

(or set `XLSX_PATH` to an existing install.)

## Usage

```bash
# 1. ALWAYS dry-run first and eyeball the per-file "comp → tgt / sample" lines:
node scripts/ingest-xref/ingest.mjs --input <dir-of-spreadsheets> \
  --master <path-to-running-master.tsv> \
  --overrides scripts/ingest-xref/overrides.json --dry

# 2. Happy with the mappings? Re-run without --dry to write data/real/xref-crosses.ts:
node scripts/ingest-xref/ingest.mjs --input <dir> --master <master.tsv> \
  --overrides scripts/ingest-xref/overrides.json
```

Large literals need headroom: prefix with `NODE_OPTIONS=--max-old-space-size=8192`.

| Flag | Meaning |
|---|---|
| `--input <dir>` | directory of `.xlsx/.xls/.xlsb/.csv` to ingest (required) |
| `--master <tsv>` | running master of already-ingested pairs (deduped against). Created if missing. |
| `--overrides <json>` | per-file column overrides (see `overrides.json`) |
| `--dry` | parse + report only; write nothing |

The run is **idempotent**: every pair is deduped by normalized `(competitor → target)`,
so re-ingesting the same file adds nothing.

## Adding a new cross file

1. Drop it in the input dir, run `--dry`.
2. If it shows `OK` with the right `comp → tgt` columns and sane samples — done, re-run for real.
3. If it shows `??` (columns not confidently detected) or maps the wrong columns, add an
   entry to `overrides.json` keyed by the exact filename:

```jsonc
{
  "My Cross File.xlsx": {
    "sheet": "Sheet1",            // optional — defaults to the first sheet
    "comp": "Competitor Part",    // competitor/legacy part column header
    "tgt": "Our Part",            // target/replacement part column header
    "compBrand": "Acme",          // optional static brand label
    "tgtBrand": "Hubbell",        // optional static brand label
    "compBrandCol": "Mfr Name",   // optional — read the brand from a column instead
    "source": "My Cross File 2024",
    "relation": "functional-substitute", // or "equivalent"
    "filterCol": "Is Match?",     // optional — keep only verified rows...
    "filterVal": "yes"            // ...where this column equals this value
  }
}
```

### Override recipes

- **Wide / matrix file** (one key column crosses to several brand columns per row):
  ```jsonc
  "Cable X-ref.xlsx": { "wide": { "key": "Belden", "keyBrand": "Belden",
    "brands": ["Gepco", "Liberty", "West Penn Wire"] } }
  ```
  Emits, per brand column with a value: `competitor=row[brand] → target=row[key]`.
- **Not a cross** (product catalog, SKU list, doc registry, merged-cell layout that needs
  manual mapping): `"File.xlsx": { "skip": "why it's skipped" }`. Skips are logged so nothing
  is silently dropped.

## What it does NOT do

- It does not invent parts. Junk (`NO CROSS`, `#N/A`, relationship words like `DIRECT`,
  sentence cells, 4+-token cells) is dropped, not guessed.
- It does not handle merged-cell / 2-row-header layouts automatically — those are `skip`-ped
  with a reason and need a small custom parse. The skip list in `overrides.json` records which.
- It is a **build-time** tool. `xlsx` is dev-only and never ships to the browser; the output
  `xref-crosses.ts` is server-only (loaded lazily by the cross-match function, ~5MB gzipped).
