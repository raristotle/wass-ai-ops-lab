import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { getStore, forTenant } from "@/lib/server/persistence";
import { webPushConfigured, sendPush, type PushSubscription } from "@/lib/server/web-push";

export const dynamic = "force-dynamic";

/**
 * Operator-triggered web-push broadcast (#17, NO cron). Sends a no-payload tickle
 * to every stored subscription (the SW shows a generic Meridian alert), pruning
 * any that the push service reports as gone (404/410). Dormant until the VAPID
 * keys are set. Auth-gated.
 */
const NS = "push-subs";
const LIST_CAP = 1000;
const keyOf = (endpoint: string) => crypto.createHash("sha256").update(endpoint).digest("hex").slice(0, 32);

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  if (!webPushConfigured()) {
    return NextResponse.json({ configured: false, sent: 0, pruned: 0 });
  }

  try {
    // Scope per tenant so an operator only reaches their own tenant's subscribers.
    const store = forTenant(getStore(), tenantForRequest(req));
    const subs = await store.list<PushSubscription>(NS, { limit: LIST_CAP });
    // The list is capped — surface truncation instead of silently under-reaching.
    const truncated = subs.length >= LIST_CAP;
    if (truncated) logApiError("/api/push/send", new Error(`Subscription list hit the ${LIST_CAP} cap; not all subscribers reached this batch.`));
    let sent = 0;
    let pruned = 0;
    for (const sub of subs) {
      if (!sub?.endpoint) continue;
      const r = await sendPush(sub);
      if (r.sent) sent += 1;
      if (r.gone) {
        await store.delete(NS, keyOf(sub.endpoint)).catch(() => {});
        pruned += 1;
      }
    }
    return NextResponse.json({ configured: true, sent, pruned, truncated });
  } catch (e) {
    logApiError("/api/push/send:POST", e);
    return NextResponse.json({ error: "Could not send push." }, { status: 400 });
  }
}
