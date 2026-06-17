# Nameplate-photo → spec capture (Sprint 3 · #9)

Lets a field rep photograph an equipment **nameplate / label** and jump straight to the matching
catalog product — for the common jobsite case where there's no barcode, just a printed plate on aging
gear. Env-gated **dormant** ($0 until keyed); the parsing is free and always works.

## How it works

| Piece | Role |
|---|---|
| `lib/product-finder-nameplate.ts` | **pure, $0** parser — extracts catalog number, manufacturer (alias-canonicalized), voltage, amperage, HP, AIC/SCCR, phase from OCR'd text, and builds a catalog search query. Always works on text from any source. |
| `lib/integration/ocr-live.ts` | env-gated OCR seam — OCR.space (free 25k req/mo, no card) turns the photo into text. Dormant until `OCRSPACE_API_KEY` is set; fail-closed. Only the image→text step is gated. |
| `apps/web/app/api/ocr/nameplate/route.ts` | `POST {image}` → OCR → parse → `{fields, query}`. Rate-limited (10/min, OCR is heavier) + auth-gated; the image is never logged. `GET` → `{configured}`. |
| `features/product-finder/BarcodeScannerModal.tsx` | adds a **"Photograph a nameplate"** file input (`capture="environment"`) — shown only when OCR is configured — that posts the photo and runs the resulting catalog search. Works on iOS Safari (where `BarcodeDetector` doesn't). |
| `/api/health` | `ocr` flag. |

## Activate

`OCRSPACE_API_KEY=...` (free key from ocr.space). The nameplate option then appears in the Ctrl/⌘-K →
"Scan barcode" modal.

## Verify (dormant)

`/api/health` → `ocr:false`; `GET /api/ocr/nameplate` → `{configured:false}`; the scanner shows only
its barcode + manual-entry paths until the key is set.
