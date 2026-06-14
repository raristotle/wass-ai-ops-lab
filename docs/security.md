# Security posture

Hardening applied in the wave-3 pass, and the known follow-ups.

## In place

- **Security headers** (`apps/web/middleware.ts`) on every response:
  `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), geolocation=(), microphone=(self)`,
  `Strict-Transport-Security`.
- **Rate limiting** (`lib/server/rate-limit.ts`) on the public API routes — the
  cost-bearing assistant route is capped hardest (20/min/IP), cross routes 60/min,
  SSO start 30/min. Returns `429` + `Retry-After`.
- **No internal leakage** — API error responses no longer echo exception
  messages to the client; errors are logged server-side (`lib/server/log.ts`).
- **XSS** — the assistant reply and all user-derived text render through React
  (auto-escaped); no `dangerouslySetInnerHTML` on user data.
- **CSV injection** — exports prefix `=+-@` cells (`lib/product-finder-csv`).
- **Secrets** — never committed; integration keys live only in env. `/api/health`
  reports integration *booleans*, never values.
- **SSO** — the OIDC `state` is an http-only, secure, sameSite cookie (CSRF).

## Follow-ups (tracked)

- **Content-Security-Policy** — needs per-route nonce tuning against Next's
  inline runtime + the Google Fonts origin; ship report-only first, then enforce.
- **Rate-limit store** — in-memory (per serverless instance). Swap to a shared
  store (Upstash/Redis) for a strict global limit.
- **Dependency audit** — `npm audit` flags transitive advisories from the MCP
  SDK (a dev/tooling dep, not in the deployed bundle); review on SDK updates.
- **SSO token-exchange** — finish the callback with JWKS id_token verification
  against the live tenant (see [sso.md](sso.md)).
