# Product Finder — API Guide

How to use, manage, and extend the Product Finder's HTTP API.
Catalog endpoints are **read-only GET** routes under `/api/products/*`, served by
Next.js route handlers in `apps/web/app/api/products/`. They run against the
in-memory deterministic catalog (`lib/catalog/`) — no database, no auth required.
The catalog GETs are not rate-limited; the cost- and write-sensitive routes are
(see **Rate limiting** below). Two routes reach outside the catalog:
`/api/products/[id]/live` (real distributor data) and `/api/quote-email`
(real email via Resend) — both documented below. Operational endpoints:
`/api/health` (readiness/integration status, below).

Base URL (production): `https://app.raristotle.com`

## Endpoints

### `GET /api/products/search`

Full catalog search. Returns one page of products plus facets and OOS substitutes.

| Param | Type | Meaning |
|---|---|---|
| `q` | string | Text query (name, SKU, brand, spec words) |
| `category` | csv | Any of `electrical,datacom,oem-electrical,av,security,safety` |
| `subcategory` | csv | Subcategory names (exact) |
| `brand` | csv | Brand names (exact) |
| `onlyBranchStock` | `true` | Only products with branch stock |
| `onlyDCStock` | `true` | Only products with DC stock |
| `onlyPreferred` | `true` | Only Preferred-line products |
| `priceMin` / `priceMax` | number | Unit-price bounds |
| `spec.<Name>` | csv | Spec value filter, e.g. `spec.Poles=1-Pole,2-Pole` (values URL-encoded) |
| `specmin.<Name>` / `specmax.<Name>` | number | Numeric spec range, e.g. `specmin.Amperage=15` |
| `sort` | enum | `relevance` (default), `preferred`, `branchStock`, `priceLow`, `priceHigh`, `brand` |
| `page` | number | 0-based page index (default 0) |
| `pageSize` | number | 1–100 (default 24) |

Response:

```jsonc
{
  "items": [ /* CatalogProduct[] — one page */ ],
  "total": 1234,
  "page": 0,
  "pageSize": 24,
  "facets": [ /* enum + range facets with live counts for the current filter set */ ],
  "substitutes": { "<oos-product-id>": { /* best in-stock CatalogProduct */ } }
}
```

`substitutes` contains an entry only for items on this page with **zero stock
everywhere**; the value is the best in-stock equivalent (spec match → stock →
price, deterministic tie-break).

Example:

```
GET /api/products/search?q=circuit%20breaker&spec.Amperage=15A&onlyBranchStock=true&sort=priceLow
GET /api/products/search?q=CB-EAT-329        # OOS product → substitutes map populated
```

#### Deep-link URLs (page, not API)

The Product Finder **page URL** mirrors this exact grammar — `q`, `category`,
`subcategory`, `brand`, `onlyBranchStock` / `onlyDCStock` / `onlyPreferred`,
`priceMin` / `priceMax`, `spec.<Name>`, `specmin.` / `specmax.<Name>`, and `sort`
all work on `/product-finder?…` and are kept in sync with the current view as you
search (the results bar's **Copy link** button copies it). `page` / `pageSize` are
ignored by the page, and the `?cart=` basket-share param rides alongside untouched.
No endpoint changes — the page decodes with the same parser
(`lib/product-finder-url.ts` delegating to `lib/catalog/schemas.ts`).

### `GET /api/products/suggest?q=<text>`

Type-ahead suggestions. Returns `{ "items": SuggestItem[] }` —
`{ id, name, brand, sku, icon }`, capped to a small list. Empty/short queries
return an empty list.

### `GET /api/products/[id]?branchId=<branchId>`

Single product detail. Returns:

```jsonc
{
  "product": { /* CatalogProduct (incl. lifecycleStatus) */ },
  "equivalents": [ /* top-8 scored alternative CatalogProducts */ ],
  "verifiedCrosses": [ /* source-backed cross results (verified/curated only) */ ],
  "brandHierarchy": { /* BrandNode: parent/division/sourceUrl, when known */ },
  "coverage": { "sources", "score": 1-5, "label", "risk", "blurb" }  // second-source grade
}
```

`branchId` (optional) makes the equivalents scoring count "in stock at *your*
branch" (e.g. `B-HOU-01`). 404 with `{ "error": "Not found" }` for unknown ids.

### `GET /api/products/[id]/goeswith`

Complementary products for cross-sell. Returns `{ "items": CatalogProduct[] }`.

### `GET /api/products/[id]/live`

**Live distributor data (REAL).** For `verified`/`curated` products only, fetches
real price, stock, and datasheet data from Mouser and Digi-Key per-request
(never stored — distributor terms prohibit caching). Simulated SKUs return
`{ "enabled": false, "reason": "simulated-sku" }` without any outbound call;
with no keys configured the reason is `"no-keys"`.

```jsonc
{
  "enabled": true,
  "configured": ["Mouser Electronics", "Digi-Key"],
  "quotes": [ { "distributor", "matchedPart", "manufacturer", "description",
                "unitPrice", "priceBreaks", "stock", "datasheetUrl", "productUrl" } ],
  "fetchedAt": "2026-06-11T22:00:00.000Z"
}
```

Configuration (env): `MOUSER_API_KEY`, `DIGIKEY_CLIENT_ID` + `DIGIKEY_CLIENT_SECRET`
(OAuth2 client-credentials). Values are trimmed defensively — a stray trailing
CR from Windows stdin piping once produced Digi-Key 401s. Empty `quotes` is
normal: electronics distributors don't carry most construction commodities.

### `GET | POST /api/quote-email`

The one **non-products, non-read-only** route: real quote email via Resend.

- `GET` → `{ "configured": boolean }` — whether `RESEND_API_KEY` is set (the
  cart UI switches between real-send and labeled simulated-send messaging).
- `POST { to, subject, html }` (Zod-validated) → `{ "sent": true, "id" }` on
  success; `{ "sent": false, "simulated": true }` when unconfigured; `502` with
  Resend's reason on provider errors (e.g. the free-tier
  only-to-account-owner restriction before a domain is verified).
- Sender defaults to `Meridian Supply Co. <onboarding@resend.dev>`; override
  with `RESEND_FROM` once a domain is verified. Email HTML is composed
  client-side by the pure, tested `quoteEmailHtml()` in
  `lib/product-finder-email.ts`.

### `GET /api/health`

Readiness / integration-status probe. Returns booleans only — never any secret
value — so it's safe to hit from an uptime monitor:

```jsonc
{
  "status": "ok",
  "service": "meridian-product-finder",
  "integrations": {
    "assistant": false,   // ANTHROPIC_API_KEY set?
    "sso": false,         // SSO_* configured?
    "resend": false,      // RESEND_API_KEY set?
    "mouser": true,       // MOUSER_API_KEY set?
    "digikey": false,     // DIGIKEY_CLIENT_ID + _SECRET set?
    "commodity": false,   // FRED_API_KEY set? (live metals index)
    "database": false,    // POSTGRES_URL set? (Neon durable server persistence)
    "queue": false,       // REDIS_URL set? (BullMQ worker activatable, separate host)
    "ratelimit": false    // UPSTASH_REDIS_REST_URL + _TOKEN set? (global limiter)
  }
}
```

`database`/`ratelimit`/`queue` are **readiness flags** for the env-gated infra seams
(`lib/server/persistence.ts`, `lib/server/rate-limit.ts`, `lib/server/queue.ts`).
Unset = the app uses per-instance memory server-side and localStorage in the
browser. Setting `POSTGRES_URL` activates the **Neon** durable store (the
`PersistedRecord` table, created on first write — no migration step); setting
`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` switches the rate limiter to a
**global** cross-instance cap. `REDIS_URL` only *signals* that a BullMQ worker could
run on a separate host (Vercel functions can't host one); no worker ships in-app.
All ship dormant at zero cost. See [docs/persistence.md](persistence.md) to activate.

### `GET /api/commodity`

Live metals index (REAL). With `FRED_API_KEY` set, returns real copper/aluminum
prices from FRED converted to $/lb, cited by observation date:

```jsonc
{ "enabled": true, "source": "FRED (Federal Reserve Economic Data)",
  "quotes": [ { "id", "label", "unit": "$/lb", "price", "change30d", "trend", "asOf" } ],
  "fetchedAt": "2026-06-14T…" }
```

Without a key: `{ "enabled": false, "reason": "no-keys" }` — the landing-view
strip then renders the deterministic simulation (labeled). Rate-limited 30/min.

### `POST /api/bom/analyze`

BOM intelligence — grades each line and recommends the best landed-cost award.
Body `{ items: [{ sku, qty }], branchId? }` (≤200 items). Returns one row per item:

```jsonc
{ "rows": [ {
  "sku", "qty", "product": { id, sku, name, brand, unitPrice, lifecycleStatus },
  "sourcingScore": 1,
  "health": { "grade": "A|B|C", "score": 0-100, "flags": [...], "action"? },
  "award": { "switch": bool, "lineSavings", "rationale",
             "best": { id, label, kind, landedUnit }, "currentLandedUnit" },
  "compliance": { "flags": [...], "countryOfOrigin", "section301": bool, "ulListed": bool }
} ], "compliance": { lines, ulListed, notUlListed, rohsIssues, prop65, tariffExposed, flagged } }
```

Composes the lifecycle, coverage, successor, cross, and compliance engines
(`lib/catalog/bom-health.ts`, `landed-cost.ts`, `compliance.ts`). Deterministic;
rate-limited 60/min.

### `POST /api/rfq` · `GET /api/rfq`

Durable server-side log of inbound RFQs the rep drafted — the first concrete
consumer of the persistence seam. `POST` records one intake
(`{ customer?, project?, lines, matched, quoteNumber, at }`, Zod-validated);
`GET` returns `{ backend, count, recent }` (most-recent 20). `backend` is
`"postgres"` when `POSTGRES_URL` is set, else `"memory"` (per-instance). The
RFQ→draft-quote modal posts best-effort; the draft is saved client-side
regardless, so a persistence outage never blocks the rep. POST 60/min, GET 30/min.

### `GET /api/jobs` · `POST /api/jobs` · `DELETE /api/jobs`

Server-persisted **Job (project) workspace** — the first durable entity the app
owns. A Job groups quotes, orders, and RFQs for one jobsite under a named project,
with a value rollup. `GET` lists jobs (`?id=` fetches one); `POST` upserts a
Zod-validated Job; `DELETE ?id=` removes one. Persists to Neon when `POSTGRES_URL`
is set (`backend: "postgres"`), per-instance memory otherwise. Job model + rollup
live in the pure lib (`lib/product-finder-job-workspace.ts`); the route stays thin.
Linked quotes/orders are denormalized snapshots, so the rollup is durable
server-side without the client store. All verbs rate-limited 60/min.

### `POST /api/orders` · `GET /api/orders`

Durable, **idempotent** order placement — the transactional surface behind agentic
checkout (the MCP `place_order` tool posts here). Body
`{ clientRef, items:[{sku, qty}], customer?, jobId?, source? }`. SKUs are resolved
and priced **server-side** against the catalog (`lib/catalog/sku-index.ts`); the
order model + pricing live in the pure lib `lib/product-finder-order-intake.ts`.
**Idempotency is by `clientRef`** — the order id is a deterministic function of it,
so a retried checkout returns the existing order (`idempotent:true`) instead of
double-placing. Unknown SKUs come back in `unresolved` (the order still places for
the known ones; all-unknown is a 400). A `jobId` rolls the order onto that Job's
value rollup. `GET` lists recent orders (`?id=` fetches one by order id or
clientRef). Persists to Neon when configured. POST 30/min, GET 60/min.

### `GET /api/vmi` · `POST /api/vmi` · `DELETE /api/vmi`

**Vendor-managed inventory** — durable per-SKU min/max policies + a live
replenishment view. `POST` upserts a policy `{ sku, min, max, customerId?,
branchId? }` (SKU validated against the catalog). `GET` returns one `ReorderLine`
per policy pairing **on-hand stock** (catalog) with **projected 30-day demand**
(summed from the durable `orders` namespace) to compute `available` and a
recommended `reorderQty` that restocks to `max`, with status `ok | reorder |
critical` (worst first). `DELETE ?id=` removes a policy. The reorder math is a
pure tested lib (`lib/product-finder-vmi.ts`); a flagged line drafts a
replenishment through `POST /api/orders`. All verbs 60/min.

### `GET /api/rfq-responses` · `POST /api/rfq-responses` · `DELETE /api/rfq-responses`

**Supplier collaboration** — a supplier's priced, lead-timed bid against an RFQ
(referenced by its quote number). `POST` upserts a bid `{ rfqRef, supplier,
lines:[{description, qty, unitPrice, leadTimeDays, inStock}], note? }` — one bid
per `(rfqRef, supplier)`, so resubmitting revises it. `GET ?rfqRef=` returns that
RFQ's bids **ranked best-first** (lowest total, lead time breaks ties); `GET`
returns all. Totals/lead time + ranking are a pure tested lib
(`lib/product-finder-supplier.ts`). The sell-side surface is the
**[supplier portal](/product-finder/supplier)** page. Persists to Neon when
configured. POST/DELETE 30/min, GET 60/min.

### `GET /api/procurement/cif`

**CIF 3.0 catalog export** for Ariba / SAP — the static flat-file catalog a buyer
loads so Meridian items appear in their procurement system without a live
punchout. Returns `text/plain` (`meridian-catalog.cif`) with the standard
`CIF_I_V3.0` header + quoted DATA rows (SKU, MPN, description, UNSPSC, price, UOM,
lead time, manufacturer, **item-level Supplier URL**). `?limit=` caps the sample
(default 200, max 1000). Generator is a pure tested lib (`lib/procurement/cif.ts`).
12/min.

### `POST /api/procurement/punchout` · `GET /api/procurement/punchout`

**cXML PunchOut setup** endpoint (the entry handshake, distinct from the
cart-return PunchOutOrderMessage). `POST` a `PunchOutSetupRequest`; we answer with
a `PunchOutSetupResponse` whose StartPage URL the buyer's browser opens.
**Level 2:** when the request carries a `<SelectedItem>` with a `SupplierPartID`,
the StartPage **deep-links to that product** (`X-PunchOut-Level: 2`); otherwise it
lands on the store home (Level 1). Parsing + response are a pure tested lib
(`lib/procurement/punchout-setup.ts`). `GET` returns endpoint info. POST 30/min.

## Rate limiting

Cost- and write-sensitive routes use a fixed-window per-caller limiter
(`lib/server/rate-limit.ts`; caller = first `x-forwarded-for` hop):

| Route | Limit |
|---|---|
| `POST /api/assistant` | 20 / min |
| `POST /api/crosses/match` | 60 / min |
| `POST /api/crosses/savings` | 60 / min |
| `POST /api/bom/analyze` | 60 / min |
| `POST /api/rfq` | 60 / min |
| `GET/POST/DELETE /api/jobs` | 60 / min |
| `POST /api/orders` | 30 / min |
| `GET/POST/DELETE /api/vmi` | 60 / min |
| `POST /api/rfq-responses` | 30 / min |
| `POST /api/procurement/punchout` | 30 / min |
| `GET /api/procurement/cif` | 12 / min |
| `GET /api/commodity` | 30 / min |
| `GET /api/rfq` | 30 / min |
| `GET /api/auth/sso/start` | 30 / min |

Over the limit returns `429` with `Retry-After` (seconds until the window
resets), `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`
(epoch seconds when the window resets) headers.
The backend is selected per request: with `UPSTASH_REDIS_REST_URL` +
`UPSTASH_REDIS_REST_TOKEN` set, counting goes through **Upstash Redis** over REST —
a true **global** cap across serverless instances (one `INCR`/`PEXPIRE`/`PTTL`
pipeline per request). Unset, it falls back to an in-memory **per-instance** store
(best-effort); an Upstash error also falls back, so a Redis blip never 500s a route.
See [docs/persistence.md](persistence.md).

## Security headers

`apps/web/middleware.ts` sets `X-Frame-Options: SAMEORIGIN`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: camera=(), geolocation=(), microphone=(self)`,
`Strict-Transport-Security`, and `X-DNS-Prefetch-Control: off` on every response.
Errors are logged server-side as structured JSON (`logApiError`); responses never
leak internal messages or stack traces. Full security posture: [docs/security.md](security.md).

## Managing the API

### Where things live

| Concern | Location |
|---|---|
| Route handlers (thin) | `apps/web/app/api/products/**/route.ts` |
| Search engine + facets | `lib/catalog/search.ts`, `lib/catalog/facets.ts` |
| Query-param parsing/validation | `lib/catalog/schemas.ts` (Zod) |
| Catalog generation + cache | `lib/catalog/generate.ts`, `lib/catalog/index.ts` |
| Alternative scoring | `lib/product-finder-scoring.ts`, `lib/catalog/equivalents.ts` |
| OOS substitute ranking | `lib/product-finder-substitute.ts` |
| Client fetch wrappers | `lib/product-finder-api.ts` |

Architecture rule: **route handlers stay thin** — parsing and logic live in
`lib/`, where everything is pure and unit-tested (`npm test`).

### Determinism

The catalog is generated from a fixed seed and cached on `globalThis` per server
instance. The same SKU (e.g. `CB-EAT-329`) exists with the same data in every
environment — safe to hard-code in demos and tests.

### Adding an endpoint

1. Put the logic in a pure, tested module under `lib/` (inject inputs; no
   `Date.now()` / `Math.random()` in scoring paths).
2. Add a thin handler: `apps/web/app/api/products/<name>/route.ts` with
   `export const dynamic = "force-dynamic"` and a `GET` that parses params
   (extend `lib/catalog/schemas.ts`) and returns `NextResponse.json(...)`.
3. Add a client wrapper in `lib/product-finder-api.ts`.
4. `npm run typecheck && npm test`, then deploy (push to `master` →
   Vercel auto-deploys production).

### Extending search filters

Add the param to `parseSearchQuery` in `lib/catalog/schemas.ts`, thread it
through `SearchFilters` in `lib/catalog/search.ts`, and mirror it in
`filtersToQuery` (`lib/product-finder-api.ts`) so the UI can send it. Tests live
in `lib/catalog/search.test.ts`.

### Operations

- **Deploy**: push to `master` (GitHub → Vercel) or `vercel --prod`.
- **Logs**: `vercel logs <deployment-url>` or the Vercel dashboard.
- **Smoke test**:
  `curl "https://app.raristotle.com/api/products/search?q=QO115" | jq .total`
- **Health check**:
  `curl "https://app.raristotle.com/api/health" | jq .status`  → `"ok"`
- The API serves synthetic data only — there are no secrets, tokens, or PII in
  any response.
