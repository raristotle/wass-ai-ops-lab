# Geocoding + address verification (Sprint 2 · #11, #10)

Two foundational, env-gated **dormant** data-spine seams. Both are $0 at pilot scale and stay dormant
(no network) until keys are set.

## Geocoding (#11) — `lib/integration/geocoding-live.ts`

Turns a US/Canada address into lat/long + a normalized address — the primitive under nearest-branch
routing, jobsite weather, landed-cost freight, and territory analytics.

- **Geocodio primary** (free 2,500 lookups/day, no card). **Google Maps fallback** used only when
  Geocodio misses AND a **hard monthly ceiling** (`GEO_GOOGLE_MONTHLY_CAP`, default 8000; set `0` to
  disable Google entirely) has not been hit — so it can never silently bill past the free tier.
- Every coordinate is **cached forever** per normalized address (`geocode` KV namespace), so
  steady-state lookups cost nothing. Google usage is metered per UTC month in `geo-usage`.
- `POST /api/geo/geocode` → `{configured, point:{lat,lng,formatted,accuracy,source}}` — rate-limited,
  auth-gated. `GET` → `{configured}`. Health flag `geocoding`.

Activate: `GEOCODIO_API_KEY=...` (and optionally `GOOGLE_MAPS_API_KEY=...` + `GEO_GOOGLE_MONTHLY_CAP`).

## Address verification (#10) — `lib/integration/address-verify-live.ts`

Standardizes a ship-to / jobsite / will-call address and returns ZIP+4 — cutting failed deliveries
and sharpening the destination fed to the integrated Shippo rate seam.

- **USPS Addresses v3** (free, OAuth2 client-credentials, no card). The bearer token is cached
  in-process until just before expiry, so most verifies skip the token hop.
- `POST /api/address/verify` (street + optional secondary/city/state/zip) →
  `{configured, verified:{streetAddress,city,state,zip5,zip4}}` — rate-limited, auth-gated, returns
  only the standardized address. `GET` → `{configured}`. Health flag `addressVerify`.

Activate: `USPS_CLIENT_ID=...` + `USPS_CLIENT_SECRET=...` (USPS Developer Portal).

## Verify (dormant)

`/api/health` → `geocoding:false`, `addressVerify:false`; the `GET` endpoints → `{configured:false}`;
the `POST` endpoints (same-origin) → `{configured:false, point|verified:null}` with no upstream call.
