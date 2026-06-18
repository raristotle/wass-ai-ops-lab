import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import {
  stripeDepositConfigured,
  stripeWebhookConfigured,
  depositAmountCents,
  buildCheckoutForm,
  createDepositCheckout,
  verifyStripeSignature,
  depositOutcomeFromEvent,
} from "@/lib/integration/stripe-deposit";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("dormancy gates", () => {
  it("stripeDepositConfigured / stripeWebhookConfigured track their envs", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    expect(stripeDepositConfigured()).toBe(false);
    expect(stripeWebhookConfigured()).toBe(false);
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_x");
    expect(stripeDepositConfigured()).toBe(true);
    expect(stripeWebhookConfigured()).toBe(true);
  });
});

describe("depositAmountCents (pure)", () => {
  it("is a clamped percentage of the total", () => {
    expect(depositAmountCents(10000, 30)).toBe(3000);
    expect(depositAmountCents(10000)).toBe(3000); // default 30%
    expect(depositAmountCents(10000, 50)).toBe(5000);
  });
  it("clamps pct to 1..100 and never below the Stripe minimum or above the total", () => {
    expect(depositAmountCents(10000, 0)).toBe(100); // pct floored to 1% → 100c
    expect(depositAmountCents(10000, 999)).toBe(10000); // pct capped at 100%
    expect(depositAmountCents(40, 30)).toBe(40); // tiny total: min(total, max(raw,50)) = 40
    expect(depositAmountCents(1000, 1)).toBe(50); // raw 10c → floored to 50c min
  });
});

describe("buildCheckoutForm (pure)", () => {
  const form = buildCheckoutForm({
    depositId: "dep-9", quoteId: "Q-9", quoteNumber: "Q-20260618-0009", tenantId: "acme-com",
    amountCents: 3000, currency: "usd", successUrl: "https://x/ok", cancelUrl: "https://x/no",
    customerEmail: "buyer@example.com",
  });
  it("encodes a payment-mode session with card + ACH and the inline deposit line", () => {
    expect(form.get("mode")).toBe("payment");
    expect(form.get("payment_method_types[0]")).toBe("card");
    expect(form.get("payment_method_types[1]")).toBe("us_bank_account");
    expect(form.get("line_items[0][price_data][unit_amount]")).toBe("3000");
    expect(form.get("line_items[0][price_data][currency]")).toBe("usd");
    expect(form.get("line_items[0][price_data][product_data][name]")).toBe("Deposit — Quote Q-20260618-0009");
  });
  it("carries the deposit id as client_reference_id + metadata for the webhook", () => {
    expect(form.get("client_reference_id")).toBe("dep-9");
    expect(form.get("metadata[depositId]")).toBe("dep-9");
    expect(form.get("metadata[quoteId]")).toBe("Q-9");
    expect(form.get("metadata[tenantId]")).toBe("acme-com");
    expect(form.get("customer_email")).toBe("buyer@example.com");
  });
  it("omits tenantId/customer_email when absent", () => {
    const f = buildCheckoutForm({
      depositId: "d", quoteId: "q", quoteNumber: "n", tenantId: null,
      amountCents: 50, currency: "usd", successUrl: "https://x/ok", cancelUrl: "https://x/no",
    });
    expect(f.has("metadata[tenantId]")).toBe(false);
    expect(f.has("customer_email")).toBe(false);
  });
});

describe("createDepositCheckout (dormant gate)", () => {
  it("returns not-configured and never fetches when the key is unset", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const r = await createDepositCheckout({
      depositId: "d", quoteId: "q", quoteNumber: "n", tenantId: null,
      amountCents: 3000, currency: "usd", successUrl: "https://x/ok", cancelUrl: "https://x/no",
    });
    expect(r).toEqual({ enabled: false, reason: "not-configured" });
    expect(fetchSpy).not.toHaveBeenCalled(); // ← $0: zero network until keyed
  });

  it("returns the session id + hosted url on success and sends an Idempotency-Key", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "cs_123", url: "https://checkout.stripe.com/c/pay/cs_123" }), { status: 200 }),
    );
    const r = await createDepositCheckout({
      depositId: "dep-abc", quoteId: "q", quoteNumber: "n", tenantId: null,
      amountCents: 3000, currency: "usd", successUrl: "https://x/ok", cancelUrl: "https://x/no",
    });
    expect(r).toEqual({ enabled: true, sessionId: "cs_123", url: "https://checkout.stripe.com/c/pay/cs_123" });
    // Idempotency-Key collapses a retried request to ONE Stripe session (no 2nd charge).
    const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toBe("deposit-dep-abc");
  });

  it("fails closed on a Stripe error and on a malformed response", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { type: "card_error", code: "x" } }), { status: 402 }),
    );
    expect(await createDepositCheckout({ depositId: "d", quoteId: "q", quoteNumber: "n", tenantId: null, amountCents: 3000, currency: "usd", successUrl: "https://x/ok", cancelUrl: "https://x/no" })).toEqual({ enabled: false, reason: "error" });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("{}", { status: 200 })); // no id/url
    expect(await createDepositCheckout({ depositId: "d", quoteId: "q", quoteNumber: "n", tenantId: null, amountCents: 3000, currency: "usd", successUrl: "https://x/ok", cancelUrl: "https://x/no" })).toEqual({ enabled: false, reason: "error" });
  });
});

describe("verifyStripeSignature (pure HMAC)", () => {
  const secret = "whsec_test";
  const body = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
  const sign = (t: number, payload: string, sec = secret) =>
    `t=${t},v1=${createHmac("sha256", sec).update(`${t}.${payload}`).digest("hex")}`;

  it("accepts a valid, in-window signature", () => {
    const t = 1_700_000_000;
    expect(verifyStripeSignature(body, sign(t, body), secret, t + 10)).toBe(true);
  });
  it("rejects a tampered body", () => {
    const t = 1_700_000_000;
    expect(verifyStripeSignature(body + "x", sign(t, body), secret, t + 10)).toBe(false);
  });
  it("rejects a wrong secret", () => {
    const t = 1_700_000_000;
    expect(verifyStripeSignature(body, sign(t, body, "whsec_other"), secret, t + 10)).toBe(false);
  });
  it("rejects a stale timestamp outside the tolerance (replay protection)", () => {
    const t = 1_700_000_000;
    expect(verifyStripeSignature(body, sign(t, body), secret, t + 10_000)).toBe(false);
  });
  it("rejects a missing/blank header or secret", () => {
    expect(verifyStripeSignature(body, null, secret, 1)).toBe(false);
    expect(verifyStripeSignature(body, "t=1,v1=abc", "", 1)).toBe(false);
    expect(verifyStripeSignature(body, "garbage", secret, 1)).toBe(false);
  });
});

describe("depositOutcomeFromEvent (pure)", () => {
  const ev = (type: string, object: Record<string, unknown>) => ({ type, data: { object } });
  it("marks card completion paid only when payment_status is paid", () => {
    expect(depositOutcomeFromEvent(ev("checkout.session.completed", { metadata: { depositId: "d" }, payment_status: "paid" }))).toEqual({ depositId: "d", status: "paid" });
    expect(depositOutcomeFromEvent(ev("checkout.session.completed", { metadata: { depositId: "d" }, payment_status: "unpaid" }))).toBeNull(); // ACH still processing
  });
  it("maps async ACH settle/fail and expiry", () => {
    expect(depositOutcomeFromEvent(ev("checkout.session.async_payment_succeeded", { metadata: { depositId: "d" } }))).toEqual({ depositId: "d", status: "paid" });
    expect(depositOutcomeFromEvent(ev("checkout.session.async_payment_failed", { metadata: { depositId: "d" } }))).toEqual({ depositId: "d", status: "failed" });
    expect(depositOutcomeFromEvent(ev("checkout.session.expired", { client_reference_id: "d" }))).toEqual({ depositId: "d", status: "expired" });
  });
  it("returns null for unrelated events or a missing deposit id", () => {
    expect(depositOutcomeFromEvent(ev("payment_intent.created", { metadata: { depositId: "d" } }))).toBeNull();
    expect(depositOutcomeFromEvent(ev("checkout.session.completed", { payment_status: "paid" }))).toBeNull();
    expect(depositOutcomeFromEvent({})).toBeNull();
  });
});
