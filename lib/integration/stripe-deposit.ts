/**
 * Stripe deposit collection (REAL money) — env-gated DORMANT, exactly like the
 * shipped Stripe Tax seam. This is the ONLY path in the app that can move money,
 * so it is deliberately conservative:
 *
 *  - $0 and ZERO network until STRIPE_SECRET_KEY is set (dormant gate).
 *  - A charge is created ONLY when the operator explicitly requests a deposit
 *    (POST /api/payments/deposit) — never automatically, never on a schedule.
 *  - We create a Stripe **Checkout Session** (hosted page), so NO card / bank
 *    details ever touch this app (PCI scope stays with Stripe). Card + ACH
 *    (us_bank_account) are both offered.
 *  - The webhook that flips a deposit to Paid is **signature-verified** with
 *    node:crypto HMAC-SHA256 (no Stripe SDK), mirroring the session-cookie seam.
 *
 * Project rule — never log raw payment payloads: on error we log ONLY the HTTP
 * status + Stripe error type/code; never the body, the email, or the response.
 *
 *   STRIPE_SECRET_KEY      — server-only secret (sk_test_/sk_live_). The gate.
 *   STRIPE_WEBHOOK_SECRET  — whsec_… signing secret for webhook verification.
 *   STRIPE_API_VERSION     — optional; pins the Stripe-Version header.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { logApiError } from "@/lib/server/log";

const CHECKOUT_URL = "https://api.stripe.com/v1/checkout/sessions";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** True only when the Stripe secret key is present. Single source of dormancy. */
export function stripeDepositConfigured(): boolean {
  return Boolean(env("STRIPE_SECRET_KEY"));
}

/** True when the webhook signing secret is present (verification can run). */
export function stripeWebhookConfigured(): boolean {
  return Boolean(env("STRIPE_WEBHOOK_SECRET"));
}

const DEFAULT_DEPOSIT_PCT = 30;
const STRIPE_MIN_CENTS = 50; // Stripe's minimum USD charge is $0.50

/**
 * Pure: the deposit amount in cents for a quote total. `pct` is clamped to
 * 1..100; the result is at least the Stripe minimum and never exceeds the total.
 */
export function depositAmountCents(totalCents: number, pct: number = DEFAULT_DEPOSIT_PCT): number {
  const total = Math.max(0, Math.round(totalCents));
  const p = Math.min(100, Math.max(1, pct));
  const raw = Math.round((total * p) / 100);
  // A total at or below the Stripe minimum can't host a smaller deposit → the
  // whole total is the deposit. Otherwise clamp into [STRIPE_MIN_CENTS, total].
  if (total <= STRIPE_MIN_CENTS) return total;
  return Math.min(total, Math.max(raw, STRIPE_MIN_CENTS));
}

export interface DepositCheckoutInput {
  depositId: string;
  quoteId: string;
  quoteNumber: string;
  tenantId: string | null;
  amountCents: number;
  currency: string; // lowercase ISO, e.g. "usd"
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

/**
 * Pure: the form-encoded body for a Checkout Session. Stripe is
 * application/x-www-form-urlencoded with bracket-nested params (NOT JSON).
 * Offers card + ACH; carries the deposit id as client_reference_id + metadata so
 * the webhook can locate the record. Unit-tested.
 */
export function buildCheckoutForm(input: DepositCheckoutInput): URLSearchParams {
  const f = new URLSearchParams();
  f.set("mode", "payment");
  f.set("success_url", input.successUrl);
  f.set("cancel_url", input.cancelUrl);
  f.set("client_reference_id", input.depositId);
  // Payment methods: card (instant) + ACH bank debit (settles asynchronously).
  f.set("payment_method_types[0]", "card");
  f.set("payment_method_types[1]", "us_bank_account");
  // Single line item priced inline (no pre-created Price object needed).
  f.set("line_items[0][quantity]", "1");
  f.set("line_items[0][price_data][currency]", input.currency);
  f.set("line_items[0][price_data][unit_amount]", String(input.amountCents));
  f.set("line_items[0][price_data][product_data][name]", `Deposit — Quote ${input.quoteNumber}`);
  f.set("metadata[depositId]", input.depositId);
  f.set("metadata[quoteId]", input.quoteId);
  if (input.tenantId) f.set("metadata[tenantId]", input.tenantId);
  if (input.customerEmail) f.set("customer_email", input.customerEmail);
  return f;
}

export type DepositCheckoutResult =
  | { enabled: false; reason: "not-configured" | "error" }
  | { enabled: true; sessionId: string; url: string };

const CheckoutResponseShape = (json: unknown): { id?: unknown; url?: unknown } =>
  (json && typeof json === "object" ? json : {}) as { id?: unknown; url?: unknown };

/**
 * Create a Checkout Session for a deposit. Dormant (no network) when the key is
 * unset; fail-closed on any Stripe/network error. The ONLY money-moving call,
 * and it only ever runs from the explicit operator deposit request.
 */
export async function createDepositCheckout(input: DepositCheckoutInput): Promise<DepositCheckoutResult> {
  const key = env("STRIPE_SECRET_KEY");
  if (!key) return { enabled: false, reason: "not-configured" }; // ← dormant: no key ⇒ no network

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/x-www-form-urlencoded",
    // Idempotency-Key = the deterministic deposit id, so a retried / duplicated
    // request collapses to the SAME Checkout Session instead of a second payable
    // link (Stripe replays the original response for 24h). Belt-and-suspenders
    // alongside the route's in-flight-session reuse.
    "Idempotency-Key": `deposit-${input.depositId}`,
  };
  const ver = env("STRIPE_API_VERSION");
  if (ver) headers["Stripe-Version"] = ver;

  try {
    const res = await fetch(CHECKOUT_URL, {
      method: "POST",
      headers,
      body: buildCheckoutForm(input).toString(),
      signal: AbortSignal.timeout(10_000),
    });
    const json: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = (json as { error?: { type?: string; code?: string } }).error;
      logApiError("stripe-deposit:checkout", new Error(`Stripe Checkout HTTP ${res.status}`), {
        type: err?.type ?? "unknown",
        code: err?.code ?? null,
      });
      return { enabled: false, reason: "error" };
    }
    const shaped = CheckoutResponseShape(json);
    if (typeof shaped.id !== "string" || typeof shaped.url !== "string") {
      logApiError("stripe-deposit:checkout", new Error("Stripe Checkout response missing id/url"));
      return { enabled: false, reason: "error" };
    }
    return { enabled: true, sessionId: shaped.id, url: shaped.url };
  } catch (e) {
    logApiError("stripe-deposit:checkout", e);
    return { enabled: false, reason: "error" };
  }
}

/**
 * Pure: verify a Stripe webhook signature (the `Stripe-Signature` header).
 * Format is `t=<unixSeconds>,v1=<hexHmac>[,v1=…]`. The signed payload is
 * `${t}.${rawBody}`, HMAC-SHA256 with the webhook secret. Returns true iff a v1
 * matches (constant-time) AND the timestamp is within `toleranceSec` of `nowSec`
 * (replay protection). node:crypto only — no SDK. Unit-tested.
 */
export function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowSec: number,
  toleranceSec = 300,
): boolean {
  if (!header || !secret) return false;
  let t: number | null = null;
  const v1: string[] = [];
  for (const part of header.split(",")) {
    const [k, val] = part.split("=");
    if (k === "t") t = Number(val);
    else if (k === "v1" && val) v1.push(val);
  }
  if (t == null || !Number.isFinite(t) || v1.length === 0) return false;
  if (Math.abs(nowSec - t) > toleranceSec) return false; // replay window

  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  return v1.some((sig) => {
    const sigBuf = Buffer.from(sig, "utf8");
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
  });
}

/**
 * Pure: map a parsed Stripe event to a deposit outcome, or null when the event
 * is not deposit-relevant. Handles card (instant `checkout.session.completed`
 * with payment_status "paid") and ACH (async settle/fail). The depositId is read
 * from the session metadata we set at creation.
 */
export interface DepositOutcome {
  depositId: string;
  status: "paid" | "failed" | "expired";
}
export function depositOutcomeFromEvent(event: unknown): DepositOutcome | null {
  const e = event as { type?: unknown; data?: { object?: unknown } };
  if (typeof e.type !== "string") return null;
  const obj = (e.data?.object ?? {}) as {
    metadata?: { depositId?: unknown };
    client_reference_id?: unknown;
    payment_status?: unknown;
  };
  const depositId =
    (typeof obj.metadata?.depositId === "string" && obj.metadata.depositId) ||
    (typeof obj.client_reference_id === "string" && obj.client_reference_id) ||
    null;
  if (!depositId) return null;

  switch (e.type) {
    case "checkout.session.completed":
      // Card is "paid" immediately; ACH is "processing" here and settles later.
      return obj.payment_status === "paid" ? { depositId, status: "paid" } : null;
    case "checkout.session.async_payment_succeeded":
      return { depositId, status: "paid" };
    case "checkout.session.async_payment_failed":
      return { depositId, status: "failed" };
    case "checkout.session.expired":
      return { depositId, status: "expired" };
    default:
      return null;
  }
}
