import { NextResponse } from "next/server";
import { isAssistantEnabled } from "@/lib/product-finder-assistant";
import { readSsoConfig } from "@/lib/auth/sso";
import { commodityConfigured } from "@/lib/integration/commodity-live";
import { persistenceConfigured } from "@/lib/server/persistence";
import { queueConfigured } from "@/lib/server/queue";
import { rateLimiterConfigured } from "@/lib/server/rate-limit";

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
      database: persistenceConfigured(),
      queue: queueConfigured(),
      ratelimit: rateLimiterConfigured(),
    },
  });
}
