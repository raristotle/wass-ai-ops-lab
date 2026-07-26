/**
 * Client-side analytics event helper (B4) — the named-event companion to the dormant PostHog seam
 * initialized in apps/web/app/providers.tsx.
 *
 * DORMANT by default: with NEXT_PUBLIC_POSTHOG_KEY unset, track() returns immediately — no posthog-js
 * import, no network, no cookies (identical to the provider's dormant guard). When the key IS set,
 * the provider has already init'd the singleton, so track() lazy-imports posthog-js and captures a
 * named event. Analytics must NEVER break the UX, so every failure is swallowed.
 *
 * B2B posture: explicit named events only (autocapture is off) — no PII, quota-friendly. Keep prop
 * values to counts/enums/booleans, never customer identifiers or part-level PII.
 */

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export type AnalyticsEvent =
  | "search_run"
  | "cross_lookup"
  | "add_to_cart"
  | "bom_import"
  | "order_history_import"
  | "crosswalk_import"
  // PF-5: the operator downloaded the unresolved-row triage export — the signal that
  // a failed import is being acted on rather than abandoned. Row count only.
  | "crosswalk_rejects_export"
  | "quote_sent"
  | "quote_accepted"
  | "substitute_saved"
  | "bulk_cross_upload";

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean | undefined>): void {
  if (!KEY) return; // ← dormant: no key ⇒ no import, no network
  if (typeof window === "undefined") return; // never run during SSR
  void import("posthog-js")
    .then(({ default: posthog }) => {
      try {
        posthog.capture(event, props);
      } catch {
        /* analytics failures must not surface to the user */
      }
    })
    .catch(() => {
      /* chunk load failure is non-fatal */
    });
}
