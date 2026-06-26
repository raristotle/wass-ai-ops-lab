# Cross-reference (xref) file ingestion

How rep-supplied / manufacturer cross-reference spreadsheets become a live "paste a competitor part
→ get the documented equivalent" lookup. Built to absorb **more files** with one config + one rerun.

## What's ingested (2026-06-25)

**539,089 unique competitor→target cross pairs** from 7 files, deduped and junk-dropped:

| File | Sheet | Competitor cols | Target cols | Added |
|---|---|---|---|---|
| Hubbell Xref COMPLETE | `Hubbell_Xref_Data` | `CompetitorName`, `CompetitorPart` | `HubbellCatalogNo` (+`Brand`, `DegreeofMatch`) | 189,906 |
| Eaton/Danfoss Power | `Cross Reference` | `Competitor Part Number`, `Competitor Name` | `Danfoss Part Number` (+`Product Line`) | 264,455 |
| Panduit Master Cross | `GridView_Data` | `Competitor Name`, `Competitor Part` | `Panduit Part` | 44,899 |
| Leviton Cross 2-22-22 | `Leviton Xref Data` | `manufacturerName`, `manufacturerPart` | `levitonPart` (+`SIM`=UPC) | 39,425 |
| Leviton match output | `2022_06_11_…` | `mfr_part_num_substitute`, `mfr_name_substitute` | `mfr_part_num` (+`substitute_score`) | 411 |
| Potential-crosses | `Sheet1` | (grouped, `Substitutable?`=Y only) | — | 0 (all rejected) |

Dropped at parse (never fabricated): `NO CROSS`, `NOT IN SAP`, `#N/A`, blanks, self-crosses, and
the Potential-crosses rows marked not-substitutable.

## Data flow

```
xlsx files ──parse(per-file col map)──▶ unified {compBrand,compPart,tgtBrand,tgtPart,rel,source}
          ──dedupe(norm(compBrand|compPart)→norm(tgtBrand|tgtPart))──▶ xref-crosses.tsv
          ──pack(brands+sources interned, tab-delimited)──▶ data/real/xref-crosses.ts (~25 MB, gz ~3.4 MB)
          ──lazy build──▶ lib/catalog/xref-index.ts  (competitor-part → hits map, cached on globalThis)
          ──▶ /api/crosses/match returns `xref[]` per query (alongside the stocked `suggestions`)
```

`xref-crosses.ts` is server-side only (client bundle unchanged at 103 kB). The index parses on the
first cross-match request, capped per competitor part, isolated from the catalog.

## Adding a NEW xref file (the recipe)

1. Drop the `.xlsx` in the source folder.
2. Add one entry to the parser's `FILE_CONFIGS` — the sheet name and the column headers for
   competitor part / competitor name / target part / target brand (header-name based, so column
   order doesn't matter). Mark a `relation` rule if the file has a match-degree/score column.
3. Rerun the parse → pack scripts (they re-dedupe across **all** files, so re-ingesting is idempotent)
   → regenerate `data/real/xref-crosses.ts`.
4. `npm run typecheck && npm test && npm run build` (build with `--max-old-space-size=8192` — the
   packed string is large), then commit + deploy. The lookup picks up the new pairs automatically.

The parser is config-driven (one block per file); no code changes are needed for a new file with a
recognizable column layout — only a new config entry.

## Honesty rules

- Only pairs where BOTH the competitor and target part are present and non-junk are emitted.
- Relation defaults to `functional-substitute`; `equivalent` only when the file asserts it
  (Hubbell `DegreeofMatch=Equivalent`, Leviton `substitute_score ≥ 0.97`).
- A column is only mapped to a field when its meaning is unambiguous — e.g. the Leviton `SIM`
  column is a UPC/GTIN, NOT a Wesco stock number, so it is not ingested as one.
