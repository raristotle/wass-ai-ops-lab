# Sprint 2 — "Real data in" — Completion Report

Delivers the Sprint 2 items from [roadmap-backlog-v6.md](./roadmap-backlog-v6.md). Theme: the
behavioral engines (market-basket, also-bought, forecasts, next-best-action) are shipped but
**starved** — Sprint 2 makes loading real data **discoverable, correctly ordered, and rewarding**,
and adds honest identifiers we already possess. **$0 — pure UI + existing routes/store; no new paid
service.**

## Part 1 — the import experience (SHIPPED 2026-07-01)

### B6 · "Load your data" hub
Both pilot-onboarding imports were buried among ~24 flattened ⌘K targets. Added a visible **📥 Load
data** button in the top toolbar (and a ⌘K entry) that opens a hub showing each import's live status
(rows loaded / rules mined, from the existing manifests), recommends the correct order
(crosswalk-first — see B7), opens either import, and offers one-click sample templates (B9).
- Files: `features/product-finder/DataHubModal.tsx` (+ render test), store flag `dataHubOpen`,
  `ProductFinderShell.tsx` (toolbar + mount), `product-finder-commands.ts` + `CommandPalette.tsx`
  (⌘K entry).

### B7 · Crosswalk-first import guard
The order-history import resolves each line by exact SKU, then the customer catalog-number crosswalk.
With `wescoSku` ~0% populated and only the illustrative demo crosswalk active, a Wesco-numbered order
export resolves almost **nothing** — the #1 first-week "it's broken" moment. Now the import route
computes whether a **real** crosswalk exists and, on a zero- or low-resolution import, returns
`needsCrosswalk: true`; the modal renders an amber prompt with a one-click **"Load catalog crosswalk
→"** jump to that import.
- Files: `apps/web/app/api/order-history/import/route.ts` (guard + flag),
  `product-finder-api.ts` (`needsCrosswalk` on the result type),
  `OrderHistoryImportModal.tsx` (prompt).

### B8 · Post-import "what changed"
After an order import, the success state now deep-links to the surfaces the new signal changed —
"See where it shows up now →" chips that search each top-pair antecedent subcategory, landing the
operator on results whose cross-sell rail blends the freshly-mined co-purchase lift. No more
JSON-receipt dead end.
- Files: `OrderHistoryImportModal.tsx` (deep-link chips off the manifest `topPairs`).

### B9 · Sample CSVs + tour steps
One-click **Sample CSV** downloads in the hub and in both import modals. The samples use **real
carried SKUs** (verified against the live catalog) so "download → import" works end to end — the
order sample even mines genuine co-purchase rules. Added a guided-tour step ("Load your own data")
that opens the hub and explains the crosswalk-first order.
- Files: `lib/product-finder-samples.ts` (templates + SSR-safe `downloadTextFile`, + test), both
  import modals, `product-finder-tour-content.ts` (+ test), `TourOverlay.tsx` (`openDataHub` action).

### Gate results (Part 1 — all green)
| Gate | Result |
|---|---|
| `npm run lint` | ✅ 0 errors |
| `npm run typecheck` | ✅ clean |
| `npm test` | ✅ 334 files / 3,634 tests |
| `npm run build` | ✅ compiled successfully |

*(Also hardened the two known cold-module-load pricing tests from 30 s → 60 s so full-suite CPU
contention can't flake the gate.)*

## Part 2 — B11 (SHIPPED 2026-07-01)

### B11 · Leviton UPCs → GTIN
Ingested the 8,220 Leviton MPN→UPC rows we parsed but honestly declined to mislabel as Wesco stock
numbers. Those Leviton parts are cross-reference **targets**, not stand-alone catalog products, so
rather than bloat the catalog with 8K spec-less entries, a Leviton **UPC/GTIN now resolves to the
Leviton MPN and its documented cross** — a rep who scans or types a physical Leviton barcode gets the
Wesco cross. Normalizes UPC-A (11-digit, leading zero dropped) and GTIN-12; parses lazily (only when a
UPC-shaped query actually misses a direct cross lookup, so it's $0 until used).
- Files: `data/real/leviton-gtin.ts` (packed GTIN-12→MPN, 8,220 pairs), `lib/catalog/leviton-gtin.ts`
  (resolver, + test), `lib/catalog/xref-index.ts` (`lookupXref` GTIN fallback + `viaGtin` hit field, +
  test), `SearchBar.tsx` ("via Leviton UPC" provenance chip), Help note.
- $0 / local — no web fetch; does not touch the parked enrichment loop.

## Part 3 — remaining (next iteration)

- **B10 · Labeled demo order-basket seed** — seed clearly-labeled demo co-purchase baskets so the
  cross-sell rail is alive before real data lands, auto-hidden once a real import exists. This is the
  most cross-cutting item: it changes the live cross-sell rail's default data source, needs a
  "demo vs real" flag surfaced through the companions API and the rail UI, and must never mislabel
  demo lift as real — so it's being done deliberately in its own pass rather than rushed.

## ACTION REQUIRED (you)

**None for Part 1.** B6/B7/B8/B9 are live the moment this deploys — try the **📥 Load data** button,
download a Sample CSV, and import it. (The only outstanding owner action across both sprints is still
the optional PostHog key from [Sprint 1](./sprint-1-completion.md#action-required-you--activate-posthog-analytics-b4-5-minutes-optional).)
