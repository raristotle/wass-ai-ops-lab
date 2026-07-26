# Customer Catalog-Number Crosswalk

Part of [pilot data onboarding](pilot-data-onboarding.md). Lets a buyer find a product
by **their own** internal catalog/item number — not just the manufacturer SKU — so the
app feels like *their* tool. Importing a customer's number→product crosswalk means
their buyers search the way they already think.

## Why
Distributor customers keep their own item numbers (a Wesco buyer searches a Wesco
catalog number). The synthetic/real catalog is keyed by manufacturer SKU, so today a
buyer's own number finds nothing (`wescoSku` / `catalogNumber` are 0%). This is the
honest counterpart to the audit's "re-key to real Wesco SKUs": we never fabricate a
customer's numbers — they load via import; a small **illustrative DEMO crosswalk**
makes the feature demoable until then.

## Resolution order (everywhere)
```
exact manufacturer SKU  →  customer crosswalk  →  competitor/legacy cross-reference  →  search
```
Exact SKU is always tried first, so a customer number can never shadow a real SKU.

## Module — `lib/catalog/crosswalk.ts`
- `parseCrosswalkCsv(csv)` — pure parser of a `customer number,sku` CSV (column-synonym
  + token matching, delimiter detection, quoted fields). Rows missing either side are
  dropped, never invented — and each dropped row is returned in `stats.rejects` with its
  source line number (see [Unresolved rows](#unresolved-rows--the-triage-export)).
- `resolveCrosswalkRows(rows, resolveSku)` — verifies each parsed row's SKU against the
  catalog via an **injected** resolver (so the branch is testable without loading the
  200k-product catalog), returning the entries to keep and the rows to triage.
- `crosswalkIndex(store, scopeKey)` — the per-scope lookup index = a deterministic DEMO
  seed (illustrative `WX-100000…` numbers mapped to real preferred products, labeled
  `source:"demo"`) PLUS any imported entries (which override the demo on a key
  collision). Cached ~20s per scope; fails closed to the demo seed.
- `resolveCustomerNumber(index, num)` — normalized sync lookup → `{ sku, source,
  customerNumber }` or null.
- `saveCrosswalk` / `getCrosswalkManifest` / `clearCrosswalk` — durable-store bridge.
- `saveCrosswalkRejects` / `getCrosswalkRejects` / `buildCrosswalkRejectReport` — the
  triage report bridge (bounded; cleared with the crosswalk).

## Module — `lib/catalog/crosswalk-reject.ts`
The failure-reason taxonomy, the reject row shape, and `crosswalkRejectsCsv`. Kept
**separate from `crosswalk.ts` on purpose**: `crosswalk.ts` pulls in the 200k-product
catalog (via the demo seed), and the browser modal needs the CSV builder without that.
Nothing here imports `crosswalk.ts`; the dependency runs one way only.

## API
- `POST /api/catalog/crosswalk/import` — `{ csv, customer? }`. Auth-gated, tenant-scoped.
  Each row's SKU is verified against the catalog (unmatched rows reported, never kept).
  Replaces the demo crosswalk with the customer's real mappings. Returns `rejects` — the
  triage report — on success **and** on the 422 "nothing matched" failure.
- `GET /api/catalog/crosswalk` — the import manifest + the last import's `rejects`
  (both null for demo-only). Auth-gated.
- `DELETE /api/catalog/crosswalk` — clear (falls back to the demo seed). Also drops the
  triage report, which described a crosswalk that no longer exists. Auth-gated.

## Unresolved rows — the triage export

A count of unresolved rows is a dead end: "12 unresolved" tells an operator *how many*
rows failed but not *which*, *why*, or *what to do*. Yet those rows are the most
actionable output the import produces — each is either a data-entry error the customer
can fix or a genuine catalog gap worth knowing about. So every row that fails to become
a mapping is kept, not just counted.

**Workflow: export → fix the source CSV → re-import.**
1. Import. If any rows failed, the import modal shows *"N rows didn't import"* with a
   **Download unresolved rows (CSV)** control. (Nothing failed → no control, no noise.)
2. Open the CSV. Each row names the source line number, the cells exactly as supplied,
   why it failed, and what to do about it.
3. Fix those lines in the original file — or delete them if the part genuinely isn't
   carried.
4. Re-import. The import **replaces** the crosswalk and the triage report, so the report
   always describes the most recent file.

The report is persisted next to the manifest, so it survives closing the modal or
reloading the page. It is capped at 1,000 rows (`MAX_STORED_CROSSWALK_REJECTS`); the
honest total is still reported and the UI says when the list was truncated.

### Export columns
| Column | Meaning |
|---|---|
| `Row` | 1-based line number in the uploaded file, counting the header. Blank lines still consume a line number, so it matches what the operator sees in their spreadsheet. |
| `Customer number` | The lookup-key cell exactly as supplied (may be empty). Never normalized. |
| `SKU` | The SKU cell exactly as supplied (may be empty). Never normalized. |
| `Reason` | One of the taxonomy codes below. |
| `Lookup key tried` | `identifierKey(sku)` — the one candidate an exact-match resolver considers. Surfacing it explains otherwise-invisible normalization (`QO 115` → `QO115`). |
| `Near match` | An **exact** alternative, or blank. Never a fuzzy guess. |
| `What to do` | The fix, written for the person holding the source file. |

### Failure-reason taxonomy
A reason must (1) correspond to a branch the code actually distinguishes, (2) describe a
row that was **discarded**, and (3) imply a *different* fix from the others. These three
are exactly the branches the import path has:

| Reason | Raised by | What it means | Fix |
|---|---|---|---|
| `missing_customer_number` | `parseCrosswalkCsv` | The lookup-key cell was blank. A row blank on *both* sides reports this one — the lookup key is the row's reason to exist. | Fill in the number buyers type, or delete the row. |
| `missing_sku` | `parseCrosswalkCsv` | The SKU cell was blank. Split from the reason above deliberately: *which* side is empty is the whole fix. | Fill in the SKU it maps to, or delete the row. |
| `sku_not_carried` | `resolveCrosswalkRows` | The SKU was present but no catalog product matches it under any identity (manufacturer SKU, Wesco stock #, catalog #, GTIN). | Fix the typo, or accept the part isn't carried. |

**Near match / swapped columns.** When a SKU doesn't resolve, the row's *other* cell is
tried against the same index. A hit proves the two columns are swapped — one fix for the
whole file instead of hundreds of imagined typos — and lands in `Near match`. This is an
exact O(1) lookup, never a similarity guess: if a candidate can't be proven, the column
stays blank.

**Deliberately absent** (documented so nobody "restores" them):
- *ambiguous / multiple matches* — impossible today. `resolveBySku` is an O(1) `Map`
  lookup keyed by `identifierKey`, so a key hits exactly one product or none. If a fuzzy
  or multi-index matcher ever lands, `sku_ambiguous` becomes the fourth reason and its
  candidates belong in `Near match`.
- *unmappable header row* — a whole-**file** failure, not a row failure. The import route
  rejects it up front with a 400 naming both required columns; a per-row report would just
  repeat "we couldn't read this file" N times.
- *duplicate customer number* — both rows are **stored** today; the later one simply wins
  when `crosswalkIndex` is built. That fails criterion (2), so it is out of scope. If
  import ever drops the losing row, add `duplicate_customer_number` and put the winning
  row's line number in `Near match`.

**To add a reason:** append it to `CROSSWALK_REJECT_REASONS`, add its fix text to
`CROSSWALK_REJECT_HINTS` (the `Record` type fails the build until you do — intentional),
update the table above, and cover the branch in `lib/catalog/crosswalk-reject.test.ts`.

### CSV safety
Every cell in the first three columns is untrusted text copied verbatim out of a
customer's uploaded file. The export goes through the repo's shared `toCsv`/`csvField`
(`lib/product-finder-csv.ts`), which quotes delimiters/newlines and prefixes an
apostrophe on any cell starting with `=`, `+`, `-`, `@`, **tab, or CR** — the last two
because Excel and LibreOffice strip leading control whitespace *before* deciding whether
a cell is a formula. There is exactly one CSV writer in this repo; do not add a second.

## Where it resolves
- **Search box autocomplete** (`/api/products/suggest`) — typing a customer number
  surfaces the carried product, labeled "your #…".
- **Single resolve** (`/api/products/resolve`) — adds `matchedVia:"crosswalk"` + the
  `customerNumber`.
- **Quick-Order pad / paste-to-quote** (`/api/products/quick-resolve`) — pasted customer
  numbers resolve to carried products.

## UI
`CrosswalkImportModal` (Ctrl/⌘-K → "Import catalog numbers"): paste/upload the CSV,
label the customer, import, see the count (and skipped/not-carried). When rows failed,
a **Download unresolved rows (CSV)** control appears — shown only when there is
something to triage. The search dropdown shows the matched customer number as a
"your #" badge.

## Honesty
The DEMO crosswalk is clearly labeled `source:"demo"` and uses obviously-illustrative
`WX-100000…` numbers — it is NOT presented as real customer data. Real customer numbers
arrive only via import, and only rows whose SKU we actually carry are kept. $0 — pure
parsing + the existing durable store.

## CSV format
```csv
your number,our_sku
WX-100023,CB-SQU-28
WX-100024,QO115
```
Recognized customer-number columns: `customer number`, `your sku`, `cust part`, … ·
sku columns: `sku`, `our_sku`, `mpn`, `part`, …

## Tests
`lib/catalog/crosswalk.test.ts` (parser, reject line numbers, `resolveCrosswalkRows`
branches, report persistence, demo seed, import-override, clear),
`lib/catalog/crosswalk-reject.test.ts` (taxonomy coverage, CSV shape, formula-injection
safety, empty case), `features/product-finder/CrosswalkImportModal.render.test.tsx`
(the download control's show/hide rule), and the `catalog-crosswalk` help topic.
