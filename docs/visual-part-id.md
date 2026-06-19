# Visual part ID (AI vision) — v4-S3 #14

Photograph a part — not just a clean nameplate — and identify it. Claude vision
reads the brand, catalog number, and ratings it can see; the **catalog resolves
the real stocked SKU** (the model never invents a part number). Extends the
shipped OCR nameplate path (#9), which only handles flat labels.

**Dormant + $0** until `ANTHROPIC_API_KEY` is set — the **same key that powers
Ask Meridian**, so there's no new key or cost surface, and it reuses the existing
`assistant` health flag.

## Architecture (vision proposes, catalog disposes)

- **`lib/server/anthropic-vision.ts`** — gated Claude-vision helper, mirroring
  `anthropic-summary.ts`: one Claude Haiku call with an image block, gated on
  `isAssistantEnabled()`, returns null when dormant or on error. The image is
  never logged.
- **`lib/product-finder-vision.ts`** — pure parsing: `parseImageDataUrl`,
  `parseVisionFields` (model JSON → the same `NameplateFields` the OCR path uses),
  `visionQuery`. Defensive — tolerates code fences, ignores non-string values,
  requires at least one real observation.
- **`POST /api/vision/part-id`** — rate-limited (8/min), auth-gated, dormant-
  checked; runs the vision call → parser → catalog query.
- **UI** — `BarcodeScannerModal` already has the `capture="environment"` photo
  input. When vision is configured it's tried first (handles whole-product
  photos); it falls back to OCR (#9) then manual entry. The resulting query runs
  the normal deterministic catalog search, so only **real SKUs** ever surface.

## Why it can't hallucinate a SKU
The model is prompted to return ONLY observed attributes as JSON — brand, catalog
number, voltage/amperage/HP/AIC/phase, and a product-type descriptor. Those flow
into the existing `nameplateQuery` → catalog search, which resolves to stocked
products. A part number the model can't actually read is never fabricated, and a
query that matches nothing simply returns no results (fall back to manual entry).

## Activation
1. Set `ANTHROPIC_API_KEY` in Vercel (the same key Ask Meridian / the agents use)
   and redeploy.
2. `GET /api/vision/part-id` → `{ "configured": true }`; `GET /api/health` →
   `integrations.assistant: true`.
3. Open the scanner (Ctrl/⌘-K → "Scan barcode") → "Photograph the part to identify
   it".

Cost is one cheap Claude Haiku vision call per photo, only when keyed. No key ⇒ the
photo path uses OCR (if configured) or manual entry — $0.
