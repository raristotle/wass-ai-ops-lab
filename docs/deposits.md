# Deposit collection — Stripe Checkout (dormant, real money)

The deposit seam is the **only money-moving surface** in the app, so it is built
conservatively and stays **dormant ($0, zero network) until `STRIPE_SECRET_KEY` is
set**. A charge is created **only** when an operator explicitly clicks **Request
deposit** on a sent/won quote — never automatically, never on a schedule (no cron).
Payment happens on **Stripe's hosted Checkout page**, so no card or bank details
ever touch this app (PCI scope stays with Stripe). Card and **ACH** (`us_bank_account`)
are both offered.

## Files

| File | Role |
|---|---|
| `lib/integration/stripe-deposit.ts` | `stripeDepositConfigured()` (the gate), pure `depositAmountCents` / `buildCheckoutForm` / `verifyStripeSignature` (node:crypto HMAC) / `depositOutcomeFromEvent`, and the thin `createDepositCheckout` raw-fetch wrapper (no Stripe SDK). |
| `lib/product-finder-deposit.ts` | The `DepositRecord` model + pure transitions (`newDepositRecord`, monotonic/idempotent `transitionDeposit`, `publicDeposit` client projection). |
| `apps/web/app/api/payments/deposit/route.ts` | `POST` = operator "Request deposit" (rate-limited + auth-gated + dormant-gated) → creates a Checkout Session, persists the record. `GET ?depositId` = tenant-scoped status; `GET` = `{configured}`. |
| `apps/web/app/api/payments/stripe-webhook/route.ts` | Stripe → us. **Signature-verified** (not session-auth) over the raw body; flips the deposit to paid/failed/expired via CAS `mutate`. |
| `features/product-finder/DepositButton.tsx` | The operator affordance on a quote row; renders nothing when the seam is dormant. |
| `apps/web/app/api/health/route.ts` | reports `integrations.deposits`. |

## How it works

1. **Operator** clicks **Request deposit** on a sent/won quote → `POST /api/payments/deposit`
   `{ quoteId, quoteNumber, totalCents, depositPct? }`.
2. The route computes the deposit (default **30%**, clamped to the Stripe minimum and
   the total), derives a **deterministic** `depositId = dep-<fnv1a(quoteId:amount)>`,
   creates a **Checkout Session** (card + ACH), and persists a `DepositRecord`
   (`status: "requested"`) in a **fixed global `deposits` namespace** with the owning
   `tenantId` stamped in.
3. The customer pays on Stripe's hosted page.
4. Stripe calls the **webhook**, which verifies the `Stripe-Signature` HMAC over the
   raw body and flips the deposit to **paid** (card → `checkout.session.completed`
   with `payment_status: "paid"`; ACH → `checkout.session.async_payment_succeeded`),
   **failed**, or **expired** — idempotently and monotonically (a paid deposit is
   never un-paid by a late/out-of-order event).
5. The operator's quote row shows **Deposit paid ✓** (status is read back via
   `GET ?depositId`, scoped to their tenant).

### Why a global namespace + stamped tenantId

The webhook is server-to-server from Stripe with **no session**, so it cannot recover
a per-tenant namespace prefix. The record therefore lives in one global namespace and
carries `tenantId`; the operator read path verifies `rec.tenantId === tenantForRequest(req)`
and `publicDeposit()` strips `tenantId`/`sessionId` from the client projection — so no
tenant can read another's deposit and no internal id leaks.

## Dormant behavior (the demo default)

With `STRIPE_SECRET_KEY` unset:

- `GET /api/payments/deposit` → `{configured:false}`; the **Request deposit** button
  renders nothing.
- `POST /api/payments/deposit` → `{enabled:false, reason:"not-configured"}` — no Stripe call.
- `POST /api/payments/stripe-webhook` → `503` (no signing secret to verify against).
- `/api/health` → `deposits:false`.

## Activate (operator-supplied keys — see the step-by-step in the chat summary)

In **Vercel → Environment Variables (server-only, never `NEXT_PUBLIC_`)**, then redeploy:

| Var | Where it comes from |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys (`sk_test_…` to pilot, `sk_live_…` for production). Also gates the shipped Stripe Tax calc. |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → add endpoint `https://<your-domain>/api/payments/stripe-webhook` (events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`) → copy the `whsec_…` signing secret. |
| `STRIPE_API_VERSION` | optional; pins the `Stripe-Version` header. |

Use **test mode** (`sk_test_` + a test webhook secret) first; Stripe's test card
`4242 4242 4242 4242` completes a card deposit, and the webhook flips it to paid.
Durable status survives restarts only when Postgres is configured (`POSTGRES_URL`);
otherwise the record is per-instance memory.

## Guardrails honored

- **Dormant/$0** until keyed; **charge only on explicit operator click**; **no cron**.
- **No card data** touches the app (hosted Checkout); **no raw payment payloads logged**
  (only coarse status/type).
- Webhook is **signature-verified** with a replay window; **no double-charge** (deterministic
  id + alreadyPaid guard + monotonic transitions).
