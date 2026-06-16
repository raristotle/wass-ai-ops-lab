"use client";

/**
 * PostHog analytics + feature flags + surveys/NPS — env-gated dormant seam.
 *
 * DORMANT until NEXT_PUBLIC_POSTHOG_KEY is set: PostHogProvider returns its
 * children untouched BEFORE any posthog-js import, so no SDK loads, no script
 * injects, no request fires, no cookies are set, and the SSR output is identical.
 * posthog-js is pulled in via dynamic import() (a separate chunk) that is only
 * fetched once the provider actually activates — so the dormant client never
 * downloads it. Activation is purely setting the env vars in Vercel + redeploy
 * (NEXT_PUBLIC_ vars are inlined at build time).
 *
 * App Router specifics (per PostHog's Next.js guide):
 *  - capture_pageview is OFF; we send $pageview manually on route change.
 *  - PostHogBootstrap sits inside <Suspense> because useSearchParams() would
 *    otherwise opt every page out of static rendering.
 *  - autocapture is OFF (B2B: explicit events only — no noisy or PII captures,
 *    and it preserves free-tier quota).
 */

import { ReactNode, Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

// Init-once guard at module scope so a remount can't double-init the singleton.
let phInitialized = false;

export function PostHogProvider({ children }: { children: ReactNode }) {
  if (!KEY) return <>{children}</>; // ← DORMANT GUARD: no posthog import, no network
  return (
    <>
      <Suspense fallback={null}>
        <PostHogBootstrap phKey={KEY} />
      </Suspense>
      {children}
    </>
  );
}

function PostHogBootstrap({ phKey }: { phKey: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // One effect keyed on the route: lazy-load + init posthog-js once, then capture
  // a $pageview for the CURRENT route — on mount AND on every navigation. The URL
  // is built from the router-provided pathname/searchParams (not window.location),
  // so the first pageview is correctly attributed even though init resolves async,
  // and no navigation falls into a gap between two effects. The dynamic import
  // means the posthog-js chunk is only ever fetched when the seam is active.
  useEffect(() => {
    let cancelled = false;
    void import("posthog-js").then(({ default: posthog }) => {
      if (cancelled) return;
      if (!phInitialized) {
        posthog.init(phKey, {
          api_host: HOST,
          capture_pageview: false, // App Router: $pageview sent manually below
          capture_pageleave: true,
          autocapture: false, // B2B: explicit named events only
          disable_surveys: false, // surveys/NPS authored in the PostHog UI
          person_profiles: "identified_only",
          defaults: "2025-05-24",
        });
        phInitialized = true;
      }
      let url = window.location.origin + pathname;
      const qs = searchParams.toString();
      if (qs) url += "?" + qs;
      posthog.capture("$pageview", { $current_url: url });
    });
    return () => {
      cancelled = true;
    };
  }, [phKey, pathname, searchParams]);

  return null;
}
