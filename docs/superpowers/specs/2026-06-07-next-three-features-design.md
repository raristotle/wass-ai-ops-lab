# Next Three Features — Design

**Date:** 2026-06-07
**Status:** Approved (design); building incrementally, full rigor (deploy per feature)
**Area:** Vercel config, `features/product-finder/`, `lib/catalog/`, `lib/`,
`apps/web/app/`

Three user-selected items (one has a sub-part): custom domain, category product
images, manager analytics dashboard, and normalized attributes + range facets.
Brand stays Meridian Supply Co. (no "Wesco" in code/UI). Deterministic where unit-
tested. Cost-conscious: confirm before runtime-cost features (none here add $ cost;
images use a keyless service).

---

## N1 — Custom domain `app.raristotle.com`
- Add the subdomain to the Vercel project (`web`) via CLI; Vercel returns the DNS
  record (CNAME → `cname.vercel-dns.com`).
- **User action required:** add that CNAME at the raristotle.com registrar. I cannot
  touch DNS. Apex (`raristotle.com`) is intentionally NOT used — subdomain only, so
  the main site is untouched.
- Verify reachable once DNS propagates. The existing `web-xi-virid-59.vercel.app`
  alias keeps working.

## N2 — Category product images
- `lib/product-finder-images.ts` (pure, tested): `imageUrlFor(product)` →
  keyless keyword photo URL from **LoremFlickr** mapped per **subcategory** keyword
  (e.g. "Circuit Breakers" → `circuit,breaker`), deterministic per product via a
  stable `lock` derived from `product.id` hash so each product gets a stable photo.
  A `SUBCATEGORY_KEYWORDS` map (fallback to category keyword, then generic
  "industrial,supply").
- UI: a `ProductImage` component used on `ProductCard` and in `ProductDetailModal`
  (replacing/överlaying the emoji/`ProductArt`): `<img loading="lazy">` with the
  keyword URL; **on error, fall back to the existing `ProductArt` SVG** so the app
  never shows a broken image and stays functional offline. Keep Meridian styling.
- No API key, no $ cost. Caveat documented: third-party photos, relevance varies;
  swappable for a curated bundle later (same `imageUrlFor` seam).
- Tests: `imageUrlFor` deterministic, correct keyword per subcategory, fallback
  keyword for unknown subcategory, URL well-formed.

## N3 — Manager analytics dashboard
- Role-gated: visible only to `manager`/`admin` (from auth `user.role`). A nav entry
  ("Dashboard"/"Insights") + a view at `apps/web/app/product-finder/dashboard/`
  (or a toggle within the finder). Sales reps don't see it.
- Data is **derived/synthetic** (no real telemetry): build a
  `lib/analytics.ts` (pure, tested) that computes metrics from available sources —
  seeded `orders` (per-customer, from the store/integration), the catalog, and a
  small deterministic seeded activity set. Metrics:
  - KPI cards: total orders, total order value, avg order value, active customers.
  - Top categories & top products (by order line value/qty).
  - Orders over time (last N periods) — line/bar.
  - Contract savings delivered (list vs effective, via the pricing provider).
  - Customer mix (orders by customer/tier).
- Charts via **Recharts** (already a dependency per CLAUDE.md). Wesco palette
  tertiary colors for series (per brand guide: `#EAAA00,#64CCC9,#DB6B30,#004986,
  #00573F`); never `#00AA13` as a series.
- A "demo analytics — derived from sample data" note. Tests cover the pure
  aggregation in `lib/analytics.ts`.

## N4 — Normalized attributes + range facets  (largest)
- `lib/catalog/attributes.ts` (pure, tested): `parseAttribute(specName, value) →
  { numeric: number; unit: string } | null`. Recognize numeric specs with units:
  Amperage (A), Voltage (V — handle "120/240V" → pick a representative/first or
  store both? store the leading number), Wattage (W), Lumens (lm), Gauge (AWG),
  kVA, Length/Size (in/ft), CCT (K), Ports (count), etc. Non-numeric → null.
  A `NUMERIC_SPECS` allow-list keyed by spec name with unit + parser so we only
  range-ify sensible ones; everything else stays categorical (enum) facets.
- `lib/catalog/facets.ts`: extend `computeFacets` to emit, for numeric specs, a
  facet `{ name, type: "range", unit, min, max }` (computed over matched set);
  categorical specs stay `{ name, type: "enum", values:[{value,count}] }`.
  Keep deterministic ordering.
- `lib/catalog/search.ts`: add `specRanges?: Record<string, { min?: number; max?:
  number }>` to params; a product matches a range if its parsed numeric value for
  that spec is within [min,max]. AND across spec names; combine with existing
  enum `specFilters`. Facets still computed over the pre-spec-narrow base set.
- `lib/catalog/schemas.ts`: parse `specmin.<Name>` / `specmax.<Name>` query params
  (name encoding rule consistent with the existing `spec.<Name>` fix — let
  URLSearchParams encode the key; do not double-encode).
- `lib/product-finder-api.ts` `filtersToQuery`: serialize specRanges.
- Store: `FilterState.specRanges`; `setSpecRange(name, {min,max})` re-runs search;
  `clearFilters` resets it; `resetStore()` includes it.
- UI (`FilterSidebar`): render range facets as a labeled min/max control
  (number inputs and/or a dual slider) with the unit; enum facets unchanged.
  Applying updates `specRanges` and re-runs search.
- Tests: parseAttribute (each unit, the "120/240V" case, junk→null); computeFacets
  numeric vs enum classification + min/max; searchCatalog range matching
  (inclusive bounds, open-ended min-only/max-only, AND with enum filters);
  schema round-trip for specmin/specmax with multi-word names.

---

## Rigor & cost
Each feature: TDD on pure modules → implementer subagent → review (deep review on
N4, lighter on N1/N2) → fix → live verify → deploy. Full gate each time
(`npm test`, `typecheck`, `build`, eslint). Always load the deployed page in a real
browser after store/selector changes (render-loop guard). Watch usage; flag if
approaching limits.

## Out of scope
Real raster product photos / licensed imagery; real analytics telemetry; apex
domain; numeric parsing of free-text specs beyond the NUMERIC_SPECS allow-list.
