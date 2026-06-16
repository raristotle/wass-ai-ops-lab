import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { smsConfigured, sendSms } from "@/lib/integration/sms-live";

export const dynamic = "force-dynamic";

/**
 * Transactional SMS (Twilio). Dormant until the Twilio credentials are set: POST
 * returns {enabled:false, reason:"no-keys"} with no Twilio call. Rate-limited +
 * auth-gated. COMPLIANCE: callers must only send to TCPA-opted-in numbers; the
 * recipient/body are never logged.
 */

const BodySchema = z.object({
  to: z.string().regex(/^\+[1-9]\d{6,14}$/, "E.164 number required (e.g. +15558675310)"),
  body: z.string().min(1).max(640),
});

export function GET() {
  return NextResponse.json({ configured: smsConfigured() });
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  if (!smsConfigured()) return NextResponse.json({ enabled: false, reason: "no-keys" });
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    return NextResponse.json(await sendSms(parsed.data));
  } catch (e) {
    logApiError("/api/sms/send:POST", e);
    return NextResponse.json({ error: "Could not send the SMS." }, { status: 400 });
  }
}
