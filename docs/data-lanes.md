# Aggregated offer ladder + dormant data lanes (Sprint 5)

The **offer ladder** stacks the internal Meridian offer plus every *configured* external
distributor source into one ranked seller / stock / lead-time / price-break panel on the
product detail modal — an Octopart-style "where can I get this, how fast, how cheap" view.
Three new env-gated dormant lanes feed it (or, for weather, the delivery flow):

| Lane | Adapter | Gate env | Cost |
|---|---|---|---|
| ECIA TrustedParts (authorized-distributor only) | `lib/integration/trustedparts-live.ts` | `ECIA_API_KEY` | $0 — free token |
| OEMsecrets (broad authorized + independent aggregate) | `lib/integration/oemsecrets-live.ts` | `OEMSECRETS_API_TOKEN` | $0 — free referral API |
| NWS jobsite weather (install-risk for delivery) | `lib/integration/weather-live.ts` | `WEATHER_CONTACT` | $0 — free gov API |

Every lane follows the same dormant pattern as the shipped Mouser/Digi-Key and Nexar seams:
**$0 and zero network until its env is set; per-request, never stored; fail-closed** (any
auth/fetch/empty error → `{enabled:false}`, never a throw into the request path). Keys are
**server-only — never `NEXT_PUBLIC_`** — and are never logged (`logApiError` records only
status/message).

## Files

| File | Role |
|---|---|
| `lib/product-finder-offers.ts` | Pure ladder math: `Offer`/`OfferBreak` types, `rankOffers` (in-stock → entry price → authorized → source), `bestOffer`, `offerSources`, `entryPrice` (smallest-qty break — the fair cross-source comparator), `priceCurve` (dedupe-by-qty + sort for the sparkline). |
| `lib/product-finder-offer-build.ts` | Maps the always-on internal lanes to `Offer`: `internalOffer(product)` (price tiers + branch/DC stock), `liveQuoteToOffer(quote)` (Mouser/Digi-Key). |
| `lib/integration/trustedparts-live.ts` | `eciaConfigured()`, pure `mapTrustedPartsToOffers()`, `getTrustedPartsOffers(mpn)`. |
| `lib/integration/oemsecrets-live.ts` | `oemsecretsConfigured()`, pure `mapOemsecretsToOffers()`, `getOemsecretsOffers(mpn)`. Brokers without a `franchised` flag are marked **not** authorized so the ranker never over-credits them. |
| `lib/integration/weather-live.ts` | `weatherConfigured()`, pure `assessInstallRisk()` / `forecastToOutlook()` (electrical-crew install-risk flags), `getJobsiteWeather(lat,lng)` (NWS 2-step points→forecast). |
| `apps/web/app/api/products/[id]/offers/route.ts` | `GET` → ranked ladder. Rate-limited (30/min). Internal offer always present; external lanes queried **only** for real (verified/curated) parts AND only when configured. Reports per-lane status in `lanes` (no key material). |
| `apps/web/app/api/weather/route.ts` | `GET ?lat=&lng=` or `?address=` (address path chains the dormant geocoding seam). Rate-limited (30/min). Exits dormant **before** any geocode/NWS call when `weatherConfigured()` is false. |
| `features/product-finder/OfferLadderPanel.tsx` | Ladder UI + mini SVG quantity-break price curve; internal-only when lanes are dormant. |
| `features/product-finder/JobsiteWeatherBadge.tsx` | Install-risk chip on jobsite-delivery tracking; renders nothing when dormant / out of US NWS coverage. |
| `apps/web/app/api/health/route.ts` | reports `integrations.ecia`, `.oemsecrets`, `.weather`. |

## Dormant behavior (the demo default)

With none of the three envs set:

- `GET /api/products/[id]/offers` returns just the **Meridian** offer (price tiers + on-hand
  stock) and makes **zero** outbound calls. `lanes` shows only `{ meridian: "internal" }`.
- `GET /api/weather` returns `{enabled:false, reason:"no-keys"}` immediately — no geocode, no NWS.
- The panel shows the internal volume ladder with a note that external sources stack in once
  keyed; the weather badge renders nothing.
- `/api/health` reports `ecia:false, oemsecrets:false, weather:false`.

## Activate

All keys are set in **Vercel → Environment Variables (server-only)**, then redeploy. The user
provisions the accounts/keys; the app reads them — never commit a key.

1. **ECIA TrustedParts** — request an API token at [trustedparts.com](https://www.trustedparts.com/)
   (ECIA-run; authorized-distributor data). Set `ECIA_API_KEY`. Optional `ECIA_API_BASE` override.
2. **OEMsecrets** — request a partfinder API token at
   [oemsecrets.com](https://www.oemsecrets.com/api). Set `OEMSECRETS_API_TOKEN`. Optional
   `OEMSECRETS_API_BASE` override.
3. **NWS weather** — no key, but [api.weather.gov](https://www.weather.gov/documentation/services-web-api)
   requires a User-Agent identifying the app with a contact, and our guardrail is *zero network
   until enabled* — so set `WEATHER_CONTACT` (e.g. an ops email or URL). The **address** path
   also needs a geocoding key (see `docs/geocoding-address.md`); the **lat/lng** path does not.

> **Authorized vs broker.** TrustedParts is authorized-distributor-only by design (the
> differentiator vs broker-inclusive feeds). OEMsecrets is broad: it marks franchised sellers,
> and the adapter treats anything without that flag as a broker (`authorized:false`) so the
> ladder's authorized tie-break stays honest.

## Guardrail notes

- **No cron.** NWS lookups are on-demand only (fired by opening the tracking panel), never polled.
- **Cost.** All three lanes are $0; there is no paid path in this sprint. The ladder reuses the
  already-shipped Mouser/Digi-Key live seam for its two internal-plus-distributor lanes.
- **SSRF.** Upstream hosts are fixed (or an explicit env base); the MPN/address are URL-encoded;
  the NWS forecast URL is taken from NWS's own points response (api.weather.gov).
