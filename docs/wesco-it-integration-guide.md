# Wesco IT / API Integration Guide — AI Product Recommender

**Audience:** Wesco IT, ERP/PIM/CRM owners, and the API development team.
**Purpose:** Explain exactly what is needed to connect this application to Wesco's
**live** product, catalog, inventory, customer, and pricing systems.

> **What this app is today.** A working Next.js application (the "AI Product
> Recommender") running on a **deterministic, synthetic 60,000-product catalog** with
> **no external connectivity**. All "enterprise" behaviors — customer accounts,
> contract pricing, live inventory/ATP, PIM catalog provenance, competitor
> cross-reference — are **simulations behind adapter interfaces**. The simulations
> exist specifically so the real systems can be plugged in without rewriting the UI.
> The app is brand-neutral in the demo ("Meridian Supply Co."); branding is cosmetic
> and independent of this integration work.

---

## 1. The integration architecture (the "seam")

All external-system access is funneled through one directory:

```
lib/integration/
  types.ts            ← THE CONTRACT. Provider interfaces + DTOs. Do not change shapes lightly.
  index.ts            ← THE REGISTRY. getXProvider() functions. This is the swap point.
  customers.ts        ← mock CustomerProvider   (→ replace with CRM client)
  pricing.ts          ← mock PricingProvider     (→ replace with pricing-engine client)
  inventory.ts        ← mock InventoryProvider   (→ replace with ERP/WMS ATP client)
  catalog-source.ts   ← mock CatalogProvider     (→ replace with PIM client)
  cross-reference.ts  ← mock cross-reference     (→ replace with cross-ref data feed)
```

Every UI component and the state store call providers **only** through the registry
functions in `index.ts` (`getCustomerProvider()`, `getPricingProvider()`,
`getInventoryProvider()`, `getCatalogProvider()`, `getCrossReferenceProvider()`).
They never import the mock implementations directly.

**To go live with any one system: write a client that satisfies the interface in
`types.ts`, then change that system's `getXProvider()` in `index.ts` to return your
client instead of the mock. Nothing else in the app changes.** Each system can be
cut over independently (feature-flag friendly).

### 1a. CRITICAL — move real calls server-side first

The mocks are synchronous and run in the browser. **Real integrations must not put
credentials, internal endpoints, or customer/pricing data resolution in client-side
code.** Before connecting live systems:

1. Implement each real provider as a **server-side** client (Next.js Route Handler
   under `apps/web/app/api/...`, or a server module) that holds secrets via
   environment variables / a secrets manager — never in the bundle.
2. The browser calls those API routes; the route calls Wesco systems. This also lets
   you enforce auth, caching, rate limiting, and field-level redaction at the edge.
3. The current synchronous interfaces will likely become **async** (`Promise<...>`)
   for real network calls. The UI already uses async patterns elsewhere (search,
   suggest, goes-with), so adopt the same: add `loading`/`error` states where a
   provider becomes a fetch. Budget for this — it is the main UI-side change.

---

## 2. Per-system integration specs

For each provider: the app's interface (in `lib/integration/types.ts`), the Wesco
system it maps to, the data contract, and what the real implementation must do.

### 2.1 Customer accounts — `CustomerProvider`  (→ Wesco CRM / customer master)

```ts
interface CustomerProvider {
  list(): CustomerAccount[];           // → likely the rep's book of business, paginated/searchable
  get(id: string): CustomerAccount | null;
}
interface CustomerAccount {
  id: string; name: string;
  tier: "contract" | "standard";
  discountByCategory: Partial<Record<ProductCategory, number>>; // see pricing note
  netPrices?: Record<string, number>;  // productId → special net price
  shipToCity: string; terms: string;   // e.g. "Net 30"
}
```
- **Source:** customer master + the logged-in rep's assigned accounts. Scope `list()`
  to the authenticated rep (do not return the entire customer base).
- **Real changes:** `list()` should become a **searchable, paginated** endpoint (reps
  have hundreds/thousands of accounts) rather than returning everything. The UI's
  header selector should become a typeahead.
- **Auth/PII:** customer identity, terms, and ship-to are sensitive — gate by rep
  identity and role; audit access.

### 2.2 Contract / customer pricing — `PricingProvider`  (→ Wesco pricing engine)

```ts
interface PricingProvider {
  getPricing(product, ctx: { customer: CustomerAccount | null; qty: number }): ProductPricing;
}
interface ProductPricing {
  listPrice: number;
  contractPrice: number | null;   // negotiated base before volume breaks
  effectiveUnitPrice: number;     // what the customer pays at this qty
  savingsPct: number;
  source: "list" | "contract" | "volume" | "contract+volume";
}
```
- **Source:** the **pricing engine** is the system of record. The demo derives price
  locally from `discountByCategory` / `netPrices`; in reality, **call the pricing
  engine with (customerId, productId/sku, qty, ship-to, date)** and return its
  authoritative net price. Do **not** reimplement Wesco pricing rules in this app.
- **Demo rules to replace:** category-percent discounts *stack* with volume tiers;
  a negotiated **net price is a floor** (volume does not further discount it). Your
  pricing engine likely already encodes the real precedence — use its result as
  `effectiveUnitPrice` and map the rest of the DTO for display.
- **Performance:** pricing is called per visible product per qty. **Batch** it
  (price-many request for the products on a results page) and **cache** per
  (customer, product, qty, day). Real-time price calls per card will not scale
  otherwise.
- **Consistency requirement:** the cart total, quote total, and order total all use
  `effectiveUnitPrice` — they must come from the same pricing call so figures match
  across the basket, the quote PDF, and the placed order.

### 2.3 Live inventory / ATP — `InventoryProvider`  (→ Wesco ERP / WMS)

```ts
interface InventoryProvider {
  getAvailability(product, ctx: { branchId?: string; today: Date }): Availability;
}
interface Availability {
  inStock: boolean; branchQty: number; dcQty: number;
  atpDate: string | null;            // ISO yyyy-mm-dd, available-to-promise
  leadTime: string | null;
  otherBranches: { branchId; name; qty }[];
  transferEtaDays: number | null;
}
```
- **Source:** real-time **on-hand by location** + **ATP** (available-to-promise)
  considering inbound POs/allocations, plus branch network for transfers and a real
  **lead-time** for replenishment. The demo fabricates ATP from a hash.
- **Real changes:** likely async + cached with a short TTL (seconds–minutes).
  Consider an availability-by-location endpoint keyed on (sku, rep branch). Surface
  true transfer ETAs from the branch network/DC logic.
- **Freshness vs. load:** stock changes constantly; cache briefly and show an
  "as of" timestamp. Avoid hammering the ERP per card — fetch availability on detail
  open (as the app does) rather than for every grid row.

### 2.4 Catalog / PIM — `CatalogProvider` + the catalog itself  (→ Wesco PIM)

```ts
interface CatalogProvider { getSource(now: Date): CatalogSource; }  // provenance strip only
```
- **Two layers:**
  1. **`CatalogProvider`** today only returns provenance metadata (source name,
     product count, last sync) for the sidebar strip. Point it at real PIM sync
     metadata.
  2. **The actual product data** is the bigger job. Today products are generated into
     an in-memory index (`lib/catalog/*`) and served by
     `apps/web/app/api/products/{search,suggest,[id]}`. To use the **real catalog**,
     replace the generated source with a **PIM-fed catalog**: ingest Wesco's product
     master (attributes, specs, UOM, brand, category taxonomy, images, datasheets)
     and either (a) index it into the same in-memory/search structure on a schedule,
     or (b) back the search routes with a real search service (Elastic/OpenSearch,
     Algolia, or Wesco's existing product search).
- **Field contract the UI expects** (`CatalogProduct` in
  `features/product-finder/types.ts`): `id, sku, name, brand, category` (one of the 6
  category keys — map Wesco taxonomy to these or generalize the union),
  `subcategory, description, unitPrice, uom, specs[] ({name,value,isNonNeg}),
  preferred (bool), branchStock[], dcStock[], externalSources[], imageIcon`.
  Map PIM fields to this shape (or evolve the type). **Real product images**
  (`imageIcon` is an emoji today) and **manufacturer datasheet URLs** come from PIM
  here and would replace the generated SVG art / distributor-search links.
- **Spec facets** (the attribute/faceted search) are computed from `specs[]`; richer,
  normalized PIM attributes (with units) will make facets far better — consider
  numeric/range facets once attributes carry types and units.

### 2.5 Competitor / legacy cross-reference  (→ cross-reference data feed)

```ts
getCrossReferenceProvider(): {
  lookup(sku: string): CatalogProduct | null;      // competitor/legacy SKU → Wesco product
  referencesFor(product): { competitorSku; brand }[]; // "Replaces" list
}
```
- **Source:** a real **cross-reference dataset** (Wesco's own xref database, a
  supplier-provided mapping, or a commercial cross-reference service). The demo
  fabricates plausible SKUs.
- **Real changes:** `lookup` becomes a query against the xref store; `referencesFor`
  returns curated equivalents for a product. Keep the round-trip guarantee
  (a product's listed equivalents resolve back to that product).

### 2.6 Order submission & history  (→ Wesco order entry / ERP)  — partially present

The app has **per-customer order history** and a "place order" action, currently in
local state only. For live use, add an **OrderProvider** (reserved in `types.ts`):
- `placeOrder` → submit to Wesco **order entry / ERP** (returns a real order number,
  confirmation, promised dates).
- `listOrders(customerId)` → real order history.
- **eProcurement:** if customers buy via punchout, implement **cXML PunchOut** or
  **OCI** so the basket/quote returns to the customer's procurement system. This is a
  standard B2B distribution requirement and a likely high-value addition.

---

## 3. Non-functional requirements (do not skip)

| Concern | What's needed |
|---|---|
| **AuthN/AuthZ** | Replace the demo login (`lib/product-finder-store.ts` `DEMO_USERS`) with **real SSO** (SAML/OIDC). Scope data by rep identity + role. |
| **Secrets** | All system credentials/endpoints in env/secret manager, used only in **server-side** API routes — never the client bundle. |
| **PII / data governance** | Customer accounts, contract pricing, and order history are sensitive. Enforce per-rep access, encryption in transit, audit logging, retention policy. localStorage usage (cart, recents, watches, saved baskets, active customer) must be reviewed — move anything sensitive server-side. |
| **Caching** | Price (per customer/product/qty/day) and availability (short TTL) caching is mandatory for scale. Catalog/PIM sync on a schedule. |
| **Rate limiting / batching** | Batch pricing & availability for a results page; throttle ERP/pricing calls; add circuit breakers + graceful degradation (fall back to list price / "availability unavailable"). |
| **Latency & UX** | Real providers are async — add loading/skeleton + error states wherever a provider becomes a network call (the app already does this for search/suggest/goes-with; extend to pricing/availability). |
| **Observability** | Log/trace each integration call; monitor error rates and latency per system; alert on pricing/availability failures. |
| **Resilience** | Each provider should degrade independently — e.g. pricing down ⇒ show list price with a notice, not a blank app. |

---

## 4. Suggested protocols / standards

- **Catalog/search:** REST or GraphQL over a search service (OpenSearch/Algolia) fed
  by PIM; or Wesco's existing product API.
- **Pricing:** a **batch price** REST/GraphQL endpoint (price-many).
- **Inventory/ATP:** availability-by-location REST endpoint; consider streaming/webhooks
  for high-velocity stock if needed.
- **Customer/CRM:** REST with rep-scoped, paginated, searchable accounts.
- **eProcurement:** **cXML PunchOut** and/or **OCI** for procurement-system round-trip.
- **Taxonomy/attributes:** align on **UNSPSC** (or Wesco's taxonomy) and typed,
  unit-bearing attributes to power better facets and cross-references.

---

## 5. Cut-over checklist (per system)

1. Stand up the server-side client (secrets via env), satisfying the `types.ts`
   interface (make it async; add a Route Handler if the browser needs it).
2. Add **contract tests** against the interface so the real client and the mock are
   interchangeable (the existing unit tests document expected behavior/shapes).
3. Convert the consuming UI to async (loading/error) if the provider became a fetch.
4. Flip the `getXProvider()` in `lib/integration/index.ts` behind a **feature flag**
   (env var) so you can toggle real vs. mock per environment.
5. Add caching, rate limiting, observability for that call path.
6. Verify end-to-end (the help guide's demo script is a good acceptance walkthrough),
   then enable in production.

Order suggested by value × effort: **Catalog/PIM → Pricing → Inventory/ATP →
Customer/CRM → Order submission/PunchOut → Cross-reference → (optional) competitor
price feeds.**

---

## 6. Out of scope for this app / explicitly not built

- Real connectivity to any Wesco system (this guide is how to add it).
- Real competitor **price** feeds (3rd-party data + commercial/legal considerations).
- Payment/checkout, returns/RMA, real email/notifications (the "Notify when
  available" and quote/share are demo-only today).

---

## 7. Quick reference — files to touch

| To connect… | Implement interface | In file | Flip registry fn |
|---|---|---|---|
| CRM / customers | `CustomerProvider` | `lib/integration/customers.ts` (or new client) | `getCustomerProvider()` |
| Contract pricing | `PricingProvider` | `lib/integration/pricing.ts` | `getPricingProvider()` |
| Inventory / ATP | `InventoryProvider` | `lib/integration/inventory.ts` | `getInventoryProvider()` |
| PIM provenance | `CatalogProvider` | `lib/integration/catalog-source.ts` | `getCatalogProvider()` |
| Real catalog data | (catalog source) | `lib/catalog/*` + `apps/web/app/api/products/*` | n/a (data layer) |
| Cross-reference | `lookup`/`referencesFor` | `lib/integration/cross-reference.ts` | `getCrossReferenceProvider()` |
| Orders / PunchOut | `OrderProvider` (reserved) | new + `lib/product-finder-store.ts` | new `getOrderProvider()` |
| Auth | — | `lib/product-finder-store.ts` (`DEMO_USERS`) + new SSO | n/a |

All interface definitions live in **`lib/integration/types.ts`** — that file is the
contract. Start there.
