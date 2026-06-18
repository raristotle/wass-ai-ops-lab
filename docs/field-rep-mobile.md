# Field-rep mobile — scan-to-reorder cycle count (v3 Sprint 4)

`#11` (scan-to-reorder bin manager) and `#17` (continuous cycle-count session) of
the third top-20 ([docs/roadmap-next20-v3.md](roadmap-next20-v3.md)), built as one
cohesive **"Cycle count & bins"** surface that fuses the shipped VMI engine with
the BarcodeDetector scanner. $0, client-side, no new bundle weight (First Load JS
held at 103 kB).

## What it does

A field rep opens **Cycle count & bins** (Ctrl/⌘-K), then:

1. **Scans** each shelf/van/bin SKU — continuously with the phone camera
   (`BarcodeDetector`, debounced) or with a wedge scanner / typing into the SKU
   box. Each new SKU resolves through `/api/products/quick-resolve`; a repeat scan
   increments that line's count.
2. **Enters the physical count** per line (editable).
3. Each line is **diffed against its VMI min/max policy** — below-min lines are
   flagged Reorder / Critical with the quantity to restock back up to max.
4. **One tap adds every below-min line to the basket** (`addToCart` → cart drawer)
   for normal checkout. Nothing is ordered until checkout.

## How it's built (reuse, not rebuild)

- **`lib/product-finder-cycle-count.ts`** (pure, tested) — `evaluateCounts` reuses
  the shipped VMI `reorderSuggestion` with the counted quantity as on-hand and zero
  projected demand (a point-in-time count). `replenishmentItems` is the below-min
  basket; `countSummary` tallies the session.
- **`CycleCountModal`** — reuses the hardened camera lifecycle from
  `BarcodeScannerModal` (camera released on close/unmount; permission-race guard;
  non-constructable-detector fallback), but **stays open and accumulates** a count
  session instead of closing on the first hit. Same-barcode detections are debounced
  (1.5 s) so a code lingering in view isn't counted dozens of times.
- VMI policies load once on open via `GET /api/vmi`; a SKU with no policy is still
  counted but never reordered.
- Reached via Ctrl/⌘-K → "Cycle count & bins". Set a SKU's min/max first in **VMI**.

## #11 vs #17

`#11` (bin manager) is the single-/few-bin flow — scan one bin, set its count, get
its replenishment. `#17` (cycle-count depth) is the same surface used continuously
to count a whole shelf/van in one pass and replenish all under-min lines at once.

## Tests

Pure core unit-tested (`product-finder-cycle-count`); `CycleCountModal` added to the
axe + Escape accessibility suites. Full suite at 1730 tests.
