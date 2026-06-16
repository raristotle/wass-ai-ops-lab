# Parts enrichment — Nexar / Octopart (dormant seam)

Env-gated dormant seam. Enriches a manufacturer part number (MPN) with
manufacturer-backed **compliance documents**, **multi-distributor inventory depth +
price breaks**, **datasheets**, and **second-source discovery** via the
[Nexar API](https://nexar.com/api) (Octopart data, GraphQL `supply.domain`), called
with raw fetch (no SDK). $0 and zero network until the Nexar credentials are set;
fail-closed (any auth/fetch/empty error → caller falls back to simulated enrichment).

> Octopart's standalone v3/v4 REST API was retired; its data now flows through
> Nexar's single GraphQL endpoint. This seam uses the OAuth2 client-credentials grant.

## Files

| File | Role |
|---|---|
| `lib/integration/nexar-live.ts` | `nexarConfigured()`, pure `nexarSearchToEnrichment()` transform, `enrichByMpn()` fetch wrapper with a 24h in-process OAuth **token cache**. |
| `apps/web/app/api/parts/enrich/route.ts` | `POST {mpn, limit?}` → enrichment or `{enabled:false}`; `GET` → `{configured}`. Rate-limited (20/min) + auth-gated. |
| `apps/web/app/api/health/route.ts` | reports `integrations.nexar`. |

## Dormant behavior

With `NEXAR_CLIENT_ID` / `NEXAR_CLIENT_SECRET` unset, `nexarConfigured()` is false and
`enrichByMpn()` returns `{enabled:false, reason:"no-keys"}` **before** any network call;
`POST /api/parts/enrich` returns the same. No token is fetched, nothing is billed.

## Activate

1. Create a **Supply** application at [portal.nexar.com](https://portal.nexar.com) to get a
   client id + secret (`supply.domain` scope).
2. Set in Vercel (server-only — never `NEXT_PUBLIC_`) → redeploy:

   ```
   NEXAR_CLIENT_ID = ...
   NEXAR_CLIENT_SECRET = ...
   ```

Cost: Nexar bills per **returned part** against a monthly query allotment (historically a
free/low tier ≈ Octopart's old ~100/mo, paid steps from there — confirm the current
allotment on the portal before relying on it). Keep `limit` low (default 5, max 10). The
OAuth token is valid 24h and cached in-process, so only the GraphQL call counts per enrich.

## Verify

- **Dormant:** `GET /api/parts/enrich` → `{"configured":false}`; `/api/health` shows `nexar:false`.
- **Active:** `POST {"mpn":"LM339"}` → `{enabled:true, source:"Nexar (Octopart)", enrichment:{ manufacturer, datasheetUrl, compliance[], distributors[], secondSources[] }}`.
