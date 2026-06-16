import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { hubspotConfigured, syncWonQuoteToHubspot } from "@/lib/integration/hubspot-live";

export const dynamic = "force-dynamic";

/**
 * Sync a won quote to HubSpot (upsert Contact by email + create associated Deal).
 * Dormant until HUBSPOT_PRIVATE_APP_TOKEN is set: POST returns {enabled:false,
 * reason:"no-keys"} with no HubSpot call. Rate-limited + auth-gated. Deal creation
 * is not idempotent — the caller should dedupe by the returned dealId per quote.
 */

const BodySchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
  dealName: z.string().min(1).max(200),
  amount: z.number().nonnegative(),
});

export function GET() {
  return NextResponse.json({ configured: hubspotConfigured() });
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  if (!hubspotConfigured()) return NextResponse.json({ enabled: false, reason: "no-keys" });
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    return NextResponse.json(await syncWonQuoteToHubspot(parsed.data));
  } catch (e) {
    logApiError("/api/crm/sync:POST", e);
    return NextResponse.json({ error: "Could not sync to CRM." }, { status: 400 });
  }
}
