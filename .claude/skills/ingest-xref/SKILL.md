---
name: ingest-xref
description: Ingest manufacturer cross-reference spreadsheets into the recommender's cross-match engine. Use when the user drops one or more competitor→target cross-reference files (.xlsx/.xls/.xlsb/.csv, or a folder/zip of them) and wants them folded into the 738K-pair xref dataset that powers the Cross-reference Lookup and /api/crosses/match.
---

# Ingest cross-reference files

Wraps the reusable tool at `scripts/ingest-xref/` (see its README). Follow these steps exactly.

## Input

`$ARGUMENTS` is a path to a file, a folder, or a zip of cross-reference spreadsheets. If empty, ask
the user for the path.

## Steps

1. **Stage the files.** If given a zip, extract it to a scratch folder. If given loose files or a
   folder, collect every `.xlsx/.xls/.xlsb/.csv` into one flat input dir. PDFs are cross *documents*,
   not tables — list them for the user and do not machine-ingest them.

2. **Ensure xlsx is available** for the build-time tool: `npm i -D xlsx` (or set `XLSX_PATH` to an
   existing install). It is dev-only and never reaches the browser bundle.

3. **Bootstrap / locate the master TSV.** The running master of already-ingested pairs lives in the
   ingestion scratch dir (default `C:/Users/raris/bom-cross-ingest`): `xref-crosses.tsv` is the 6-col
   canonical, `inbox/xref-master.tsv` is the 7-col tool master. If continuing, re-bootstrap the
   7-col master from the 6-col canonical first so dedup sees the full set.

4. **Dry-run FIRST** and read every per-file line:
   ```bash
   node scripts/ingest-xref/ingest.mjs --input <dir> --master <master.tsv> \
     --overrides scripts/ingest-xref/overrides.json --dry
   ```
   - `OK` lines: confirm the `comp → tgt` columns and the sample pairs look like real part numbers.
   - `??` / wrong-column / junk-sample lines: add an entry to `scripts/ingest-xref/overrides.json`
     (keyed by exact filename) — `comp`/`tgt`, `wide`, `compBrandCol`/`tgtBrandCol`, `filterCol`/
     `filterVal`, or `skip` with a reason. Re-run `--dry` until every file is OK or honestly skipped.

5. **Real run** (drop `--dry`) — writes `data/real/xref-crosses.ts`. Then update the 6-col canonical
   master from the new 7-col master so the next batch bootstraps from the full set.

6. **Gate**: `NODE_OPTIONS=--max-old-space-size=8192 npm run typecheck && npx vitest run && npm run build`
   (the literal is large; 8 GB heap is required). Confirm the client bundle is still ~103 kB
   (the data is server-only).

7. **Ship**: commit (Conventional Commit), push to `master` (Vercel auto-deploys), then poll
   `https://app.raristotle.com/api/health` for the new commit SHA, and live-verify a few new parts
   via `POST /api/crosses/match`.

8. **Document**: update `docs/cross-reference-ingestion.md` counts, and record the run in the
   `wass-ai-ops-lab-product-finder-roadmap` memory.

## Honesty rules (non-negotiable)

- Never invent a part or a cross. Junk (`NO CROSS`, `#N/A`, relationship words, sentence cells,
  4+-token cells) is dropped, not guessed.
- An unverified source is filtered to its confirmed rows only (`filterCol`/`filterVal`).
- Map a column to a field only when its meaning is unambiguous; skip-with-reason anything that needs
  a custom parse (merged cells, 2-row headers) rather than mis-mapping it.
