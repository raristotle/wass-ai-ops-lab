import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { hubspotConfigured, syncWonQuoteToHubspot } from "@/lib/integration/hubspot-live";
import { salesforceConfigured, syncWonQuoteToSalesforce } from "@/lib/integration/salesforce-live";

export const dynamic = "force-dynamic";

/**
 * Sync a won quote to CRM — HubSpot (Contact upsert + Deal) or Salesforce (Contact +
 * Opportunity), selected by `provider` (default hubspot). Each provider is dormant
 * until its keys are set: POST returns {enabled:false, reason:"no-keys"} with no CRM
 * call. Rate-limited + auth-gated. Deal/Opportunity creation is not idempotent — the
 * caller should dedupe by the returned dealId/opportunityId per quote (v5-S3 #13).
 */

const BodySchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
  dealName: z.string().min(1).max(200),
  amount: z.number().nonnegative(),
  provider: z.enum(["hubspot", "salesforce"]).default("hubspot"),
});

export function GET() {
  return NextResponse.json({ hubspot: hubspotConfigured(), salesforce: salesforceConfigured() });
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const { provider, ...quote } = parsed.data;
    if (provider === "salesforce") {
      if (!salesforceConfigured()) return NextResponse.json({ enabled: false, reason: "no-keys" });
      return NextResponse.json(await syncWonQuoteToSalesforce(quote, new Date().toISOString()));
    }
    if (!hubspotConfigured()) return NextResponse.json({ enabled: false, reason: "no-keys" });
    return NextResponse.json(await syncWonQuoteToHubspot(quote));
  } catch (e) {
    logApiError("/api/crm/sync:POST", e);
    return NextResponse.json({ error: "Could not sync to CRM." }, { status: 400 });
  }
}
