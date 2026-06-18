import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { getStore } from "@/lib/server/persistence";
import { logApiError } from "@/lib/server/log";
import {
  createDepositCheckout,
  depositAmountCents,
  stripeDepositConfigured,
} from "@/lib/integration/stripe-deposit";
import {
  DEPOSITS_NAMESPACE,
  newDepositRecord,
  publicDeposit,
  type DepositRecord,
} from "@/lib/product-finder-deposit";
import { fnv1aHex } from "@/lib/stable-id";

export const dynamic = "force-dynamic";

/**
 * Deposit collection (v3-S6 #19) — the ONLY money-moving surface, env-gated
 * DORMANT. POST is the explicit operator "Request deposit" action: it creates a
 * Stripe Checkout Session and persists a DepositRecord (auth-gated). GET reads a
 * deposit's status (tenant-scoped) or reports {configured}. With STRIPE_SECRET_KEY
 * unset this makes no Stripe call and returns {enabled:false}.
 *
 * The record lives in a FIXED global namespace (not tenant-prefixed) so the
 * sessionless Stripe webhook can update it; it carries the owning tenantId so a
 * tenant operator only ever reads their own.
 */

const InputSchema = z.object({
  quoteId: z.string().trim().min(1).max(120),
  quoteNumber: z.string().trim().min(1).max(120),
  totalCents: z.number().int().min(100).max(100_000_000), // ≥ $1
  depositPct: z.number().int().min(1).max(100).optional(),
  currency: z.string().trim().length(3).toLowerCase().default("usd"),
  customerEmail: z.string().trim().email().max(200).optional(),
});

function depositIdFor(tenantId: string | null, quoteId: string, amountCents: number): string {
  // Include the tenant so two tenants can never derive the same deposit key for
  // the same quote/amount (which would let one overwrite the other's record).
  return `dep-${fnv1aHex(`${tenantId ?? "_"}:${quoteId}:${amountCents}`)}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const depositId = url.searchParams.get("depositId");
  if (!depositId) {
    return NextResponse.json({ configured: stripeDepositConfigured() });
  }
  // Reading a specific deposit's status requires auth + tenant ownership.
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const rec = await getStore().get<DepositRecord>(DEPOSITS_NAMESPACE, depositId);
    if (!rec || rec.tenantId !== tenantForRequest(req)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ deposit: publicDeposit(rec) });
  } catch (e) {
    logApiError("/api/payments/deposit GET", e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 15, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);

  const denied = requireApiAuth(req);
  if (denied) return denied;

  // Dormant: never reach Stripe when the key is unset.
  if (!stripeDepositConfigured()) {
    return NextResponse.json({ enabled: false, reason: "not-configured" });
  }

  let input: z.infer<typeof InputSchema>;
  try {
    input = InputSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const tenantId = tenantForRequest(req);
  const amountCents = depositAmountCents(input.totalCents, input.depositPct);
  const depositId = depositIdFor(tenantId, input.quoteId, amountCents);
  const store = getStore();

  try {
    // Idempotency on the only money surface: never mint a SECOND payable link for
    // the same deposit.
    const existing = await store.get<DepositRecord>(DEPOSITS_NAMESPACE, depositId);
    if (existing && existing.tenantId === tenantId) {
      //  - already paid → return it, no new session.
      if (existing.status === "paid") {
        return NextResponse.json({ enabled: true, alreadyPaid: true, deposit: publicDeposit(existing) });
      }
      //  - still awaiting payment with a live link → REUSE it (do not create a 2nd session).
      if (existing.status === "requested" && existing.checkoutUrl) {
        return NextResponse.json({ enabled: true, depositId, url: existing.checkoutUrl, amountCents, reused: true });
      }
      // (failed/expired fall through and create a fresh session.)
    }

    const origin = new URL(req.url).origin;
    const checkout = await createDepositCheckout({
      depositId,
      quoteId: input.quoteId,
      quoteNumber: input.quoteNumber,
      tenantId,
      amountCents,
      currency: input.currency,
      successUrl: `${origin}/product-finder?deposit=success&id=${encodeURIComponent(depositId)}`,
      cancelUrl: `${origin}/product-finder?deposit=cancel&id=${encodeURIComponent(depositId)}`,
      customerEmail: input.customerEmail,
    });
    if (!checkout.enabled) {
      return NextResponse.json({ enabled: false, reason: checkout.reason }, { status: 502 });
    }

    const record = newDepositRecord({
      id: depositId,
      quoteId: input.quoteId,
      quoteNumber: input.quoteNumber,
      tenantId,
      amountCents,
      currency: input.currency,
      sessionId: checkout.sessionId,
      checkoutUrl: checkout.url,
      now: Date.now(),
    });
    await store.put(DEPOSITS_NAMESPACE, depositId, record);

    return NextResponse.json({ enabled: true, depositId, url: checkout.url, amountCents });
  } catch (e) {
    logApiError("/api/payments/deposit POST", e);
    return NextResponse.json({ error: "Deposit request failed" }, { status: 500 });
  }
}
