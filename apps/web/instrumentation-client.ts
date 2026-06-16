import type * as SentryNS from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// DORMANT GUARD: the Sentry browser SDK is loaded via dynamic import() gated on
// the DSN. When NEXT_PUBLIC_SENTRY_DSN is unset it inlines to `undefined` at
// build time, so the `if (dsn)` block — and the import() inside it — is
// dead-code-eliminated and the SDK ships in NO statically-loaded chunk (the same
// dormancy posthog-js gets). No DSN ⇒ no client, no Session Replay, no network,
// no bundle weight. When a DSN is set the SDK loads as a lazy chunk and inits.
// Session Replay sample rates default to 0 (off) until you opt in; masking is on
// so replay can never leak text/inputs/media (incl. payment fields).
if (dsn) {
  void import("@sentry/nextjs").then((Sentry) => {
    const sessionRate = Number(process.env.NEXT_PUBLIC_SENTRY_REPLAY_SESSION_RATE ?? "0");
    const errorRate = Number(process.env.NEXT_PUBLIC_SENTRY_REPLAY_ERROR_RATE ?? "0");
    Sentry.init({
      dsn,
      tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
      replaysSessionSampleRate: sessionRate,
      replaysOnErrorSampleRate: errorRate,
      integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true, maskAllInputs: true })],
      sendDefaultPii: false,
      enabled: process.env.NODE_ENV === "production",
    });
  });
}

// Next 15 App Router navigation tracing. Dormant: a no-op when no DSN (the Sentry
// import stays dead-code-eliminated). Active: forwards to Sentry once the lazy
// chunk has loaded.
export const onRouterTransitionStart = (
  ...args: Parameters<typeof SentryNS.captureRouterTransitionStart>
): void => {
  if (!dsn) return;
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.captureRouterTransitionStart(...args);
  });
};
