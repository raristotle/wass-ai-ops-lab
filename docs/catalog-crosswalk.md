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
  dropped + counted, never invented.
- `crosswalkIndex(store, scopeKey)` — the per-scope lookup index = a deterministic DEMO
  seed (illustrative `WX-100000…` numbers mapped to real preferred products, labeled
  `source:"demo"`) PLUS any imported entries (which override the demo on a key
  collision). Cached ~20s per scope; fails closed to the demo seed.
- `resolveCustomerNumber(index, num)` — normalized sync lookup → `{ sku, source,
  customerNumber }` or null.
- `saveCrosswalk` / `getCrosswalkManifest` / `clearCrosswalk` — durable-store bridge.

## API
- `POST /api/catalog/crosswalk/import` — `{ csv, customer? }`. Auth-gated, tenant-scoped.
  Each row's SKU is verified against the catalog (unmatched rows reported, never kept).
  Replaces the demo crosswalk with the customer's real mappings.
- `GET /api/catalog/crosswalk` — the import manifest (or null for demo-only). Auth-gated.
- `DELETE /api/catalog/crosswalk` — clear (falls back to the demo seed). Auth-gated.

## Where it resolves
- **Search box autocomplete** (`/api/products/suggest`) — typing a customer number
  surfaces the carried product, labeled "your #…".
- **Single resolve** (`/api/products/resolve`) — adds `matchedVia:"crosswalk"` + the
  `customerNumber`.
- **Quick-Order pad / paste-to-quote** (`/api/products/quick-resolve`) — pasted customer
  numbers resolve to carried products.

## UI
`CrosswalkImportModal` (Ctrl/⌘-K → "Import catalog numbers"): paste/upload the CSV,
label the customer, import, see the count (and skipped/not-carried). The search
dropdown shows the matched customer number as a "your #" badge.

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
`lib/catalog/crosswalk.test.ts` (parser, demo seed, import-override, clear),
`features/product-finder/CrosswalkImportModal.render.test.tsx`, and the
`catalog-crosswalk` help topic.
