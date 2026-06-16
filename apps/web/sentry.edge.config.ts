import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

// DORMANT GUARD: unset DSN ⇒ skip init() entirely (no client, no network).
// Mirrors sentry.server.config.ts for the edge runtime (middleware / edge routes).
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    sendDefaultPii: false,
    enabled: process.env.NODE_ENV === "production",
  });
}
