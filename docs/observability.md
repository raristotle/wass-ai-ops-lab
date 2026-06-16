# Observability — analytics (PostHog) + error monitoring (Sentry)

Two env-gated **dormant** seams. With no env vars set they cost $0, make zero network
calls, add nothing to the browser bundle (both SDKs are dynamic-imported behind their
DSN/key gate), and change no runtime behavior. Activation is purely adding env vars in
Vercel and redeploying. Both report their state via `/api/health` (`analytics`,
`sentry` booleans — no secret leaves the server).

---

## PostHog — product analytics + feature flags + surveys/NPS

Free tier: 1M events/mo, 5k recordings. One SDK (`posthog-js`) bundles analytics,
feature flags, session replay, and surveys; `posthog-node` covers server-side flags.

### Files

| File | Role |
|---|---|
| `apps/web/app/providers.tsx` | `"use client"` `PostHogProvider`. Returns children untouched when `NEXT_PUBLIC_POSTHOG_KEY` is unset (before any `posthog-js` import). Manual `$pageview` on App Router navigation, inside `<Suspense>`. |
| `lib/server/analytics.ts` | Server seam: `getServerPostHog()` (null when dormant), `serverFeatureFlag()`, `analyticsConfigured()`. Serverless-safe (`flushAt:1`, always `shutdown()`). |

`autocapture` is **off** (B2B: explicit named events only — no noisy/PII capture, and it
preserves free-tier quota). `capture_pageview` is off because the App Router needs manual
pageviews; surveys/NPS are on and authored in the PostHog UI.

### Activate

Set in Vercel → redeploy (`NEXT_PUBLIC_` vars are inlined at build time):

```
NEXT_PUBLIC_POSTHOG_KEY = phc_xxx          # project key
NEXT_PUBLIC_POSTHOG_HOST = https://us.i.posthog.com   # or https://eu.i.posthog.com
POSTHOG_KEY = phc_xxx                       # server flags (read at runtime, no rebuild)
# POSTHOG_HOST = https://us.i.posthog.com   # optional server ingest host
```

### Verify

- **Dormant:** DevTools → Network filtered to `posthog` shows zero requests; no `ph_`
  cookies; the posthog-js chunk is never fetched.
- **Active:** one ingest POST per route change (no duplicates); events appear in PostHog
  Activity; a survey toggled live in the UI renders.

---

## Sentry — error monitoring + Session Replay

Free tier: 5k errors/mo. `@sentry/nextjs`.

### Files

| File | Role |
|---|---|
| `apps/web/instrumentation.ts` | `register()` lazy-imports the runtime config; exports `onRequestError`. |
| `apps/web/sentry.server.config.ts` / `sentry.edge.config.ts` | `Sentry.init()` **guarded on `SENTRY_DSN`** — skipped entirely when unset. |
| `apps/web/instrumentation-client.ts` | Browser init + Session Replay, guarded on `NEXT_PUBLIC_SENTRY_DSN`; exports `onRouterTransitionStart`. |
| `apps/web/next.config.ts` | `withSentryConfig` is applied **only when a DSN is present at build** — a dormant build keeps the exact original pipeline (no Sentry webpack plugin, no tunnel, no source-map step). |

Dormancy is explicit: a missing DSN does **not** automatically remove Sentry overhead, so
every `init()` is wrapped in `if (dsn) { … }`, and the browser SDK is loaded via a dynamic
`import()` gated on `NEXT_PUBLIC_SENTRY_DSN` — when it is unset the import is dead-code-
eliminated and the SDK ships in **no** client chunk (the server function still bundles the
SDK, but that never reaches a visitor). Session Replay sample rates default to **0**
(off) even after a DSN is set; replay masks all text/inputs/media so it can't leak PII or
payment fields. `sendDefaultPii` is `false`.

### Activate

Set in Vercel → redeploy:

```
NEXT_PUBLIC_SENTRY_DSN = https://xxx@oyyy.ingest.sentry.io/zzz   # browser
SENTRY_DSN = https://xxx@oyyy.ingest.sentry.io/zzz              # server + edge (same value)

# Optional — readable stack traces (source-map upload, build-time only):
SENTRY_AUTH_TOKEN = sntrys_xxx
SENTRY_ORG = your-org-slug
SENTRY_PROJECT = your-project-slug

# Optional — opt into Session Replay (defaults 0 = off):
NEXT_PUBLIC_SENTRY_REPLAY_SESSION_RATE = 0.1   # 10% of sessions
NEXT_PUBLIC_SENTRY_REPLAY_ERROR_RATE = 1.0     # 100% of error sessions
```

A token-less build still succeeds — it just skips source-map upload (stack traces stay
minified until you add `SENTRY_AUTH_TOKEN`).

### Verify

- **Dormant:** `npm run build` succeeds with no Sentry source-map step; DevTools shows zero
  requests to `*.ingest.sentry.io`; a thrown error sends nothing.
- **Active:** trigger a test error → it lands in the Sentry issues stream. With replay rates
  > 0, a replay attaches; at the default 0, no replay records even with the DSN set.

> `.gitignore` excludes `.env.sentry-build-plugin` and `.sentryclirc` so a local auth
> token is never committed.
