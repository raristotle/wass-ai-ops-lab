/**
 * Server-side PostHog seam (analytics + feature flags from route handlers),
 * env-gated dormant. With POSTHOG_KEY unset, getServerPostHog() returns null and
 * serverFeatureFlag() returns its caller-supplied fallback — no client is built,
 * nothing leaves the function. Mirrors the client gate in apps/web/app/providers.tsx.
 *
 * Serverless note: a Vercel function can freeze the moment it returns the
 * response, so the client is configured to flush immediately (flushAt 1,
 * flushInterval 0) and callers MUST await shutdown() — serverFeatureFlag() does
 * this in a finally so flag reads and captures aren't silently dropped.
 *
 *   POSTHOG_KEY   — server-only project key (the gate). May reuse the phc_ value
 *                   of NEXT_PUBLIC_POSTHOG_KEY, but server code never depends on
 *                   a NEXT_PUBLIC_ var.
 *   POSTHOG_HOST  — optional ingest host; defaults to https://us.i.posthog.com.
 */

import { PostHog } from "posthog-node";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** True when analytics is configured on EITHER the client or the server key. */
export function analyticsConfigured(): boolean {
  return Boolean(env("NEXT_PUBLIC_POSTHOG_KEY") || env("POSTHOG_KEY"));
}

/**
 * A posthog-node client, or null when the server seam is dormant. The caller
 * owns the lifecycle and MUST await client.shutdown() before the function ends.
 */
export function getServerPostHog(): PostHog | null {
  const key = env("POSTHOG_KEY");
  if (!key) return null; // ← dormant guard: no key ⇒ no client, no network
  return new PostHog(key, {
    host: env("POSTHOG_HOST") ?? "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
}

/** Evaluate one feature flag server-side; returns `fallback` when dormant. */
export async function serverFeatureFlag(key: string, distinctId: string, fallback = false): Promise<boolean> {
  const client = getServerPostHog();
  if (!client) return fallback;
  try {
    return (await client.isFeatureEnabled(key, distinctId)) ?? fallback;
  } finally {
    await client.shutdown();
  }
}
