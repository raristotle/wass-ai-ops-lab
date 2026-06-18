import { NextResponse } from "next/server";
import { isAssistantEnabled } from "@/lib/product-finder-assistant";
import { readSsoConfig } from "@/lib/auth/sso";
import { commodityConfigured } from "@/lib/integration/commodity-live";
import { fxConfigured } from "@/lib/integration/fx-live";
import { geocodingConfigured } from "@/lib/integration/geocoding-live";
import { addressVerifyConfigured } from "@/lib/integration/address-verify-live";
import { groundingFetchConfigured } from "@/lib/integration/grounding-fetch";
import { ocrConfigured } from "@/lib/integration/ocr-live";
import { persistenceConfigured } from "@/lib/server/persistence";
import { queueConfigured } from "@/lib/server/queue";
import { rateLimiterConfigured } from "@/lib/server/rate-limit";
import { stripeTaxConfigured } from "@/lib/integration/stripe-tax";
import { rerankConfigured } from "@/lib/integration/rerank-live";
import { slackConfigured } from "@/lib/integration/slack-alerts";
import { nexarConfigured } from "@/lib/integration/nexar-live";
import { shippingConfigured } from "@/lib/integration/shipping-live";
import { hubspotConfigured } from "@/lib/integration/hubspot-live";
import { smsConfigured } from "@/lib/integration/sms-live";
import { pdfConfigured } from "@/lib/integration/pdf-live";
import { webPushConfigured } from "@/lib/server/web-push";
import { eciaConfigured } from "@/lib/integration/trustedparts-live";
import { oemsecretsConfigured } from "@/lib/integration/oemsecrets-live";
import { weatherConfigured } from "@/lib/integration/weather-live";
import { stripeDepositConfigured } from "@/lib/integration/stripe-deposit";

export const dynamic = "force-dynamic";

/**
 * Health / readiness probe. Reports liveness plus which integrations are
 * configured (booleans only — no secrets leave the server), so monitoring and
 * a quick "what's live in this environment" check both work off one endpoint.
 */
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "meridian-product-finder",
    // Short SHA of the live deployment (Vercel sets VERCEL_GIT_COMMIT_SHA at
    // build time) — lets a deploy be confirmed live without guessing on timing.
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    integrations: {
      assistant: isAssistantEnabled(),
      sso: readSsoConfig().enabled,
      resend: Boolean(process.env.RESEND_API_KEY),
      mouser: Boolean(process.env.MOUSER_API_KEY),
      digikey: Boolean(process.env.DIGIKEY_CLIENT_ID && process.env.DIGIKEY_CLIENT_SECRET),
      commodity: commodityConfigured(),
      fx: fxConfigured(),
      geocoding: geocodingConfigured(),
      addressVerify: addressVerifyConfigured(),
      grounding: groundingFetchConfigured(),
      ocr: ocrConfigured(),
      database: persistenceConfigured(),
      queue: queueConfigured(),
      ratelimit: rateLimiterConfigured(),
      stripeTax: stripeTaxConfigured(),
      deposits: stripeDepositConfigured(),
      rerank: rerankConfigured(),
      slack: slackConfigured(),
      nexar: nexarConfigured(),
      ecia: eciaConfigured(),
      oemsecrets: oemsecretsConfigured(),
      weather: weatherConfigured(),
      shipping: shippingConfigured(),
      hubspot: hubspotConfigured(),
      sms: smsConfigured(),
      pdf: pdfConfigured(),
      webpush: webPushConfigured(),
      // Inlined (booleans only) so the health route never imports the PostHog/Sentry SDKs.
      analytics: Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_KEY),
      sentry: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
    },
  });
}
