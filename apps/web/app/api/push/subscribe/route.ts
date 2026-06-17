import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { getStore, forTenant } from "@/lib/server/persistence";
import { webPushConfigured, isAllowedPushEndpoint } from "@/lib/server/web-push";

export const dynamic = "force-dynamic";

/**
 * Web-push subscription registration (#17). GET returns whether push is configured
 * + the VAPID public key the client needs to subscribe. POST stores a browser push
 * subscription (auth-gated) in the KV. Dormant-friendly: GET works always; the
 * client only shows the "enable alerts" affordance when configured.
 */
const NS = "push-subs";

const SubSchema = z.object({
  // Allow-list the host so a poisoned/internal endpoint (SSRF) is a 400 and never
  // stored — push/send later POSTs to whatever is here.
  endpoint: z.string().url().max(800).refine(isAllowedPushEndpoint, "Unsupported push endpoint host."),
  keys: z.object({ p256dh: z.string().max(200).optional(), auth: z.string().max(100).optional() }).optional(),
});
const BodySchema = z.object({ subscription: SubSchema });

export function GET() {
  return NextResponse.json({
    configured: webPushConfigured(),
    publicKey: process.env.VAPID_PUBLIC_KEY?.trim() || null,
  });
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
    const sub = parsed.data.subscription;
    const key = crypto.createHash("sha256").update(sub.endpoint).digest("hex").slice(0, 32);
    // Scope per tenant so one tenant can't inject endpoints into another's broadcast.
    await forTenant(getStore(), tenantForRequest(req)).put(NS, key, sub);
    return NextResponse.json({ ok: true });
  } catch (e) {
    logApiError("/api/push/subscribe:POST", e);
    return NextResponse.json({ error: "Could not register the subscription." }, { status: 400 });
  }
}
