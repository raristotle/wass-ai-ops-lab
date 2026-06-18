import { NextResponse } from "next/server";
import { getStore, mutate } from "@/lib/server/persistence";
import { logApiError } from "@/lib/server/log";
import { depositOutcomeFromEvent, verifyStripeSignature } from "@/lib/integration/stripe-deposit";
import { DEPOSITS_NAMESPACE, transitionDeposit, type DepositRecord } from "@/lib/product-finder-deposit";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook (v3-S6 #19). Stripe → us, server-to-server: it has NO session,
 * so it is NOT requireApiAuth-gated — it is authenticated by the HMAC-SHA256
 * signature on the raw body instead (mirroring the session-cookie seam). On a
 * deposit-relevant event it flips the DepositRecord (in the fixed global
 * `deposits` namespace) to paid/failed/expired via CAS `mutate`, idempotently.
 *
 * Dormant until STRIPE_WEBHOOK_SECRET is set. Never logs the event payload
 * (project rule: no raw payment payloads) — only event type + outcome.
 */
const MAX_BODY_BYTES = 1_000_000;

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    // Dormant: no signing secret ⇒ we cannot verify, so we accept nothing.
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return new Response("Payload too large.", { status: 413 });

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return new Response("Payload too large.", { status: 413 });

  const sig = req.headers.get("stripe-signature");
  const nowSec = Math.floor(Date.now() / 1000);
  if (!verifyStripeSignature(raw, sig, secret, nowSec)) {
    // Coarse log only — never the body or signature.
    logApiError("/api/payments/stripe-webhook", new Error("Invalid Stripe signature"));
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: unknown;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const outcome = depositOutcomeFromEvent(event);
  if (!outcome) {
    // Verified but not a deposit event (or no deposit id) — ack so Stripe stops retrying.
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    const updated = await mutate<DepositRecord>(getStore(), DEPOSITS_NAMESPACE, outcome.depositId, (cur) =>
      cur ? transitionDeposit(cur, outcome.status, Date.now()) : null,
    );
    // updated === null means we have no such deposit on record (e.g. a test event) — ack anyway.
    return NextResponse.json({ received: true, depositId: outcome.depositId, status: updated?.status ?? "unknown" });
  } catch (e) {
    // A storage failure: return 500 so Stripe retries the (idempotent) update.
    logApiError("/api/payments/stripe-webhook", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
