# Product Finder — API Guide

How to use, manage, and extend the Product Finder's HTTP API.
All endpoints are **read-only GET** routes under `/api/products/*`, served by
Next.js route handlers in `apps/web/app/api/products/`. They run against the
in-memory deterministic catalog (`lib/catalog/`) — no database, no auth required,
no rate limits beyond the platform's.

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

### `GET /api/products/suggest?q=<text>`

Type-ahead suggestions. Returns `{ "items": SuggestItem[] }` —
`{ id, name, brand, sku, icon }`, capped to a small list. Empty/short queries
return an empty list.

### `GET /api/products/[id]?branchId=<branchId>`

Single product detail. Returns:

```jsonc
{
  "product": { /* CatalogProduct */ },
  "equivalents": [ /* top-8 scored alternative CatalogProducts */ ]
}
```

`branchId` (optional) makes the equivalents scoring count "in stock at *your*
branch" (e.g. `B-HOU-01`). 404 with `{ "error": "Not found" }` for unknown ids.

### `GET /api/products/[id]/goeswith`

Complementary products for cross-sell. Returns `{ "items": CatalogProduct[] }`.

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
- The API serves synthetic data only — there are no secrets, tokens, or PII in
  any response.
