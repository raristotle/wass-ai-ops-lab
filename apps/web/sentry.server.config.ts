import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

// DORMANT GUARD: with no DSN we never call init(), so no client is created and
// zero network occurs. (Per Sentry's docs an empty DSN stops event delivery but
// does NOT remove instrumentation overhead — only skipping init() does.)
// Project rule: keep sendDefaultPii false; never capture raw payment payloads.
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    sendDefaultPii: false,
    enabled: process.env.NODE_ENV === "production",
  });
}
