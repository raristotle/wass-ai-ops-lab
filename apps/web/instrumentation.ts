import * as Sentry from "@sentry/nextjs";

/**
 * Next.js 15 server/edge bootstrap. register() lazy-imports the runtime-specific
 * Sentry config, each of which self-guards on SENTRY_DSN — so with no DSN this
 * imports a module whose init() is skipped: no client, no network, no cost.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures nested React Server Component / route-handler errors. A no-op when no
// Sentry client was initialized (DSN unset), so it is safe to export always.
export const onRequestError = Sentry.captureRequestError;
