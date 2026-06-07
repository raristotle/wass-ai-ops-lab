# Simulated Enterprise-Integration Layer (Features 1–5) — Design

**Date:** 2026-06-06
**Status:** Approved (design); building incrementally, full rigor (deploy per feature)
**Area:** `lib/integration/` (new), `lib/product-finder-store.ts`, `lib/catalog/`,
`features/product-finder/`, `apps/web/app/api/products/`

## Intent & honesty boundary

Implements top-20 features **#1 contract/real pricing, #2 live catalog/PIM, #3
live inventory/ATP, #4 competitor cross-reference, #5 customer accounts + order
history**. Four of these (1,2,3,5) need real Wesco/ERP/PIM/CRM systems that are
**not reachable from this sandbox**. They are therefore built as **realistic,
deterministic SIMULATIONS behind adapter interfaces** — the seam where real APIs
plug in later. Every mock carries a `// INTEGRATION SEAM` marker and the UI shows
a "simulated / demo data" note where it implies live data. Brand stays Meridian
Supply Co. (no "Wesco" in code/UI).

## Foundation — `lib/integration/` adapter layer

Pure interfaces (the swap point) + mock implementations + a registry.

```
lib/integration/
  types.ts        // provider interfaces + DTOs (PricingProvider, InventoryProvider,
                  //   CustomerProvider, OrderProvider, CatalogSource)
  customers.ts    // seeded CustomerAccount[] (deterministic)
  pricing.ts      // mock PricingProvider
  inventory.ts    // mock InventoryProvider (ATP)
  cross-reference.ts // synthetic competitor/legacy SKU map
  catalog-source.ts  // PIM source metadata over the existing generated catalog
  index.ts        // registry: returns the mock impls today; one place to swap to real
```

`index.ts` exports `getPricingProvider()`, `getInventoryProvider()`, etc., each
returning the mock now with a comment block: *"Replace with real Wesco API client
here — interface is the contract."* Components/store call providers through the
registry, never the mock directly.

All providers are **deterministic & pure** (no Date.now/Math.random in tested
modules — inject timestamps; derive variation from stable hashes of ids). Unit-
tested in the node vitest setup.

## #5 — Customer accounts (foundation; build first)

`CustomerAccount = { id, name, tier: "contract"|"standard", discountByCategory:
Partial<Record<ProductCategory, number>> (fraction off list), netPrices?:
Record<productId, number> (special net), shipToCity, terms: string }`.

Seed ~4 accounts in `customers.ts` with distinct profiles (e.g. "Gulf Coast
Industrial" — heavy electrical discount + net prices on breakers; "Lone Star Data
Systems" — datacom discount; "Apex Facilities" — flat 8%; "Walk-in / Standard" —
no contract). Deterministic ids.

Store: `customers: CustomerAccount[]`, `activeCustomerId: string | null` (persist
`pf_active_customer`). `setActiveCustomer(id)`. A **customer selector** in the
header (rep picks "who am I quoting for"). The active customer drives contract
pricing (#1), order history (#5b), and pre-fills the quote Customer field.

## #1 — Contract / customer pricing

`PricingProvider.getPricing(product, { customerId, qty }) → { listPrice,
contractPrice|null, volumeUnitPrice, effectiveUnitPrice, savingsPct, source }`.
- listPrice = `product.unitPrice`.
- contractPrice = customer `netPrices[id]` if present, else
  `listPrice * (1 - discountByCategory[category] ?? 0)`; null if standard/no
  customer.
- volume tiers (existing `lib/product-finder-pricing.ts`) apply on top of the
  contract base; `effectiveUnitPrice = min(contract-or-list at qty tier)`.
- UI: ProductCard + ProductDetailModal + cart show **List / Your price / You save
  N%** when a contract customer is active; cart total uses `effectiveUnitPrice`.
  A small "contract pricing — simulated" note.

## #3 — Inventory / ATP

`InventoryProvider.getAvailability(product, { branchId }) → { inStock, branchQty,
dcQty, atpDate|null, leadTime, otherBranches: [{branchId, name, qty}],
transferEtaDays|null }`. Derived deterministically from existing
branchStock/dcStock + `lib/product-finder-leadtime.ts`. ATP date for OOS = a
stable near-future date (inject "today"). UI: detail modal "Availability" panel —
branch/DC, ATP date, lead time, "Also stocked at: <branches>", transfer ETA. A
"live inventory — simulated" note.

## #2 — Catalog / PIM integration framing

`catalog-source.ts` wraps the existing 60k generated catalog as a PIM source:
`getCatalogSource() → { source: "PIM (simulated)", productCount, lastSyncedAt
(injected), attributeCompleteness }`. Surface a small **"Catalog source"** strip
(e.g. in the sidebar footer or an admin/info popover): source, product count, last
sync, and that attributes/specs are "synced from PIM." This is the thinnest as new
behavior — value is the adapter seam + provenance UI, not new data.

## #4 — Competitor / legacy cross-reference

`cross-reference.ts`: deterministic synthetic map. For each catalog product derive
1–2 plausible competitor/legacy part numbers (e.g. from brand prefix + id hash) →
`competitorSku → productId`, plus reverse `productId → [{competitorSku, brand}]`.
- `lookupCrossReference(sku) → CatalogProduct | null`.
- UI: a **"Cross-reference"** entry (search box mode or a small panel) — paste a
  competitor/legacy part number, get the Meridian equivalent. On ProductDetail, a
  **"Replaces / cross-references"** list. Genuinely demo-native (no real feed).

## #5b — Per-customer order history + reorder

Extend G2 orders to be **per active customer**: `placeOrder` stamps
`customerId`; order history shows the active customer's orders; seed a couple of
demo orders per seeded customer. Reorder unchanged (loads lines into cart). Quote
uses the active customer's name.

## Testing & rigor (per feature)

Each: TDD on pure modules (providers, pricing math, cross-ref, ATP) → implementer
subagent → adversarial review subagent → fix → **live browser verify** → deploy.
Full gate each time: `npm test`, `npm run typecheck`, `npm run build`, eslint.

## Out of scope

Real connectivity to any Wesco system; real competitor price feeds; SSO; payment.
Everything is synthetic/deterministic behind the documented adapter seam.
