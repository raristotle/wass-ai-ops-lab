# Free-dataset live seams — DI Increment 2 (dormant, $0 until keyed)

The second dataset-ingestion increment ([backlog](roadmap-dataset-ingestion.md)).
Where [Increment 1](dataset-ingestion-real-layers.md) shipped **static** real layers
(brand entity / ETIM / compliance), this increment adds **eight live API seams** for
the free sources whose data is too large, volatile, or licensed to embed at build
time. Every seam follows the project's proven dormant pattern:

> **env gate → pure transform (unit-tested) → thin raw `fetch` (timeout + `logApiError`)
> → fail-closed `{enabled:false}` union → health flag.** Each makes **zero network
> calls** until its switch is set, and is **$0** in normal use (free key or keyless).
> Server-only; no secret reaches the client.

All eight were **contract-verified against the live endpoints** before building (a
10-source research sweep), so the request/response shapes, auth, and free-tier limits
below are confirmed, not assumed.

## The eight seams

| # | Seam | Switch (env) | Cost | Feeds | Backlog |
|---|---|---|---|---|---|
| 1 | **ENERGY STAR** lighting certs | `ENERGY_STAR_APP_TOKEN` | Free token | rebate eligibility, lumens/W/efficacy + UPC | DI-2 |
| 2 | **DLC QPL** listing status | `DLC_QPL_API_TOKEN` | **Paid** subscription | rebate eligibility (DLC-listed?) | DI-2 |
| 3 | **FCC EAS** equipment auth | `FCC_SOCRATA_APP_TOKEN` | Free token | FCC ID → manufacturer + compliance badge | DI-9 |
| 4 | **Open Icecat** datasheets | `ICECAT_USERNAME` (+tokens) | Free account | specs / datasheet PDF / GTIN | DI-10 |
| 5 | **GLEIF** live LEI | `GLEIF_API_BASE_URL` | Keyless CC0 | brand entity (LEI + parent chain) | DI-S2 |
| 6 | **Wikidata** ownership | `WIKIDATA_USER_AGENT` | Keyless CC0 | brand entity (owner/aliases/GTIN/LEI) | DI-S2 |
| 7 | **BLS PPI** producer prices | `BLS_API_KEY` | Free key | commodity strip (electrical PPI) | DI-11 |
| 8 | **OpenEI URDB** utility rates | `OPENEI_API_KEY` | Free key | location-aware operating cost | DI-13 |

Code: `lib/integration/{energy-star,dlc-qpl,fcc-eas,icecat,gleif,wikidata,bls-ppi,urdb}-live.ts`.
Each exposes a `xConfigured()` gate (the single source of dormancy, surfaced on
`/api/health`) plus pure parse/transform functions covered by a sibling `*.test.ts`.

## API surface (grouped enrichment routes)

All routes are GET, rate-limited, and structured identically: a **no-param probe**
returns the readiness boolean(s) publicly with **zero network**, while an **actual
lookup** is auth-gated (`requireApiAuth`) and dormant-gated. They proxy to **fixed**
upstream hosts (the user input is a query param / SoQL filter, never the host), and
SoQL/SPARQL inputs are escaped — so there is no SSRF and no query injection.

| Route | Probe | Lookup |
|---|---|---|
| `/api/enrichment/lighting` | `{energyStar, dlcQpl}` | `?model=&brand=` (ENERGY STAR), `?dlcId=` (DLC) |
| `/api/enrichment/fcc` | `{fccEas}` | `?fccId=` |
| `/api/enrichment/datasheet` | `{icecat}` | `?gtin=` or `?brand=&mpn=` |
| `/api/enrichment/entity` | `{gleif, wikidata}` | `?name=` (GLEIF), `?brand=` (Wikidata) |
| `/api/commodity/ppi` | `?probe=1` → `{blsPpi}` | (no params) → PPI trend list |
| `/api/utility/rates` | `{urdb}` | `?address=&sector=` |

## Per-source activation steps

### 1. ENERGY STAR (free) — `ENERGY_STAR_APP_TOKEN`
1. Create a free account at <https://data.energystar.gov> (no card).
2. Profile → **Developer Settings** → create an **App Token**.
3. Set `ENERGY_STAR_APP_TOKEN` in Vercel → redeploy. The default dataset is the public
   "Connected Light Bulbs" table (lumens/watts/efficacy); the broader, access-restricted
   lighting tables also unlock with a registered token (override via `ENERGY_STAR_DATASET`).
   Data is EPA public domain.

### 2. DLC QPL (paid) — `DLC_QPL_API_TOKEN`
The programmatic API requires a **paid** DLC data/API subscription (the free MyDLC
account only allows manual web search). Request access via <https://designlights.org/qpl/>
or api@designlights.org, retrieve the bearer token from MyDLC → "QPL Data Access & API",
set `DLC_QPL_API_TOKEN`, redeploy. The seam distinguishes a `not-authorized` response
(valid token, insufficient tier) from a transport error.

### 3. FCC EAS (free) — `FCC_SOCRATA_APP_TOKEN`
Register a free Socrata/Tyler Data app token (same flow as ENERGY STAR, on
opendata.fcc.gov), set `FCC_SOCRATA_APP_TOKEN`, redeploy. US-government public domain.
Note: dataset `3b3k-34jp` is grantee-level (grantee code → applicant); full per-grant
detail (equipment class, frequencies) lives in the legacy EAS grant reports.

### 4. Open Icecat (free) — `ICECAT_USERNAME`
1. Register a free **Open Icecat** (Data: XML/JSON) account at <https://icecat.biz/registration>.
2. Set `ICECAT_USERNAME` (your account = the `shopname`). For production, mint
   `api-token` + `content-token` in the Icecat control panel and set `ICECAT_API_TOKEN` /
   `ICECAT_CONTENT_TOKEN`. Redeploy. Free tier covers sponsoring brands only (a
   non-sponsor returns a graceful no-match).
3. **Licensing:** Icecat requires you to **host image/PDF assets in your own storage**
   rather than hot-link at scale, and some brands restrict media to authorized resellers.
   The seam returns asset URLs as **references for an operator to mirror** — it never
   auto-embeds them.

### 5. GLEIF (keyless, CC0) — `GLEIF_API_BASE_URL`
No key or account. Set `GLEIF_API_BASE_URL=https://api.gleif.org/api/v1` to activate
(the switch enforces our "zero network until enabled" rule even for a keyless API),
redeploy. Honor the 60 req/min/IP limit (the seam batches a name search + the two
parent calls). Data is CC0.

### 6. Wikidata (keyless, CC0) — `WIKIDATA_USER_AGENT`
No key. Wikimedia policy **requires** a descriptive User-Agent; that string is both the
policy identity and our dormancy switch — set
`WIKIDATA_USER_AGENT="MeridianProductFinder/1.0 (you@example.com)"`, redeploy. Keep
queries narrow (the public endpoint has a hard 60s timeout). Data is CC0.

### 7. BLS PPI (free) — `BLS_API_KEY`
Register a free key at <https://data.bls.gov/registrationEngine/> (email + org, no card →
500 queries/day). Set `BLS_API_KEY`, redeploy. Verified electrical PPI series: WPU117
(electrical equipment), WPU1175 (switchgear & controls), WPU1178 (lighting fixtures).
US-government public domain.

### 8. OpenEI URDB (free) — `OPENEI_API_KEY`
Request a free key via the OpenEI signup form (api.data.gov key). `DEMO_KEY` works only
for smoke-testing (heavily throttled), so provision a real free key. Set `OPENEI_API_KEY`,
redeploy. Data is CC0. The lookup returns approved Commercial tariffs by address with
their energy/demand/fixed-charge structure.

## Honestly deferred (no genuinely free programmatic path)

- **World Bank "Pink Sheet" metals (DI-11).** The Indicators API is keyless JSON but
  **does not carry copper/aluminum** (verified: those indicator codes 404). The metals
  live only in a monthly **.xlsx** workbook behind a rotating doc-id URL — it needs an
  xlsx parser (a new dependency) and is **redundant** with the shipped FRED spot feed +
  the new BLS PPI seam. Deferred rather than add a dependency for duplicate coverage.
- **DSIRE incentive programs (DI-13).** The formerly-keyless DSIRE API now returns 403
  (paid subscription only), and the only free mirrors (NREL/OpenEI place-incentives) are
  **frozen at 2017 data**. No current free path exists; documented for when a paid
  subscription is provisioned. URDB (above) covers the live, free utility-rate half.

## Cost & guardrail

Every seam is **$0 until its switch is set**, and seven of the eight are free even when
active (DLC is the only paid one, and it stays dormant until a subscription token is
added). This honors the standing cost guardrail: zero incremental cost in the shipped
deployment; the operator opts each source in by setting one env var and redeploying.

## Tests

`lib/integration/{energy-star,dlc-qpl,fcc-eas,icecat,gleif,wikidata,bls-ppi,urdb}-live.test.ts`
— each asserts dormancy (gate false without the env var) and exercises the pure
parse/transform with representative payloads, including the SoQL/SPARQL escaping that
prevents query injection.
