# Stripe Tax — automatic sales tax at quote/checkout

Env-gated **dormant** seam. Computes destination-based US sales tax (and beyond) via
Stripe's [Tax Calculations API](https://docs.stripe.com/api/tax/calculations/create),
called with raw `fetch` (no Stripe SDK dependency).

**Cost: $0 — both before and after activation.** A *calculation* is not billed by Stripe;
only creating a tax *transaction* (`POST /v1/tax/transactions`) costs money, and this seam
**never** does that. It also never creates a charge or PaymentIntent.

## Files

| File | Role |
|---|---|
| `lib/integration/stripe-tax.ts` | `stripeTaxConfigured()`, pure `buildTaxForm()`, `calculateTax()` (returns `{enabled:false}` when dormant or on error). Unit-tested. |
| `apps/web/app/api/tax/quote/route.ts` | `GET` → `{configured}` boolean; `POST` (rate-limited + auth-gated) → tax breakdown, or `{configured:false, tax:null}` when dormant. |
| `apps/web/app/api/health/route.ts` | reports `integrations.stripeTax`. |

## Dormant behavior

With `STRIPE_SECRET_KEY` unset, `calculateTax()` returns before constructing any request —
zero `fetch` calls, zero Stripe billing possible, and `POST /api/tax/quote` returns
`{configured:false, tax:null}` so the checkout UI shows the pre-tax total.

## Privacy

Addresses are PII. Per the project rule (*never log raw payment payloads*), the seam logs
only HTTP status + Stripe error `type`/`code`/`param` + the coarse country/state (enough to
route a registration error) — never the postal code, the full address, the request body, or
the response — and the API never echoes the address back. Amounts are integer **cents**
(e.g. `1499` = $14.99).

## Activate

1. In Vercel, set the server-only secret (never `NEXT_PUBLIC_`):

   ```
   STRIPE_SECRET_KEY = sk_live_xxx        # sk_test_xxx in preview/dev
   # STRIPE_API_VERSION = 2026-05-27.dahlia   # optional: pin the response shape
   ```

2. In the **Stripe Dashboard** (the API key alone makes calls *succeed*, but returns $0 tax
   until this is done):
   1. Enable **Stripe Tax**.
   2. Set the business **origin / head-office address**.
   3. **Tax → Registrations** → add at least one jurisdiction where you collect tax.
   4. (Optional) set a default product tax code.

## Verify

> `POST /api/tax/quote` is rate-limited and **auth-gated**: the app's own browser calls pass
> (same-origin, with a session cookie when `SESSION_SECRET` is set); an external `curl`/Postman
> call must send `Authorization: Bearer <WRITE_API_TOKEN>` (with `WRITE_API_TOKEN` configured) or
> it returns 401 before any Stripe call. `GET /api/tax/quote` is public (config boolean only).

- **Dormant:** `GET /api/tax/quote` → `{"configured":false}`; `POST` → `{"configured":false,"tax":null}`
  with no call to `api.stripe.com`; `/api/health` shows `stripeTax:false`.
- **Active:** with `STRIPE_SECRET_KEY` set, `POST` a quote
  (`{currency:"usd", line_items:[{amount:1499,reference:"L1"}], address:{country:"US",state:"WA",postal_code:"98104"}, address_source:"shipping"}`)
  → 200 with `taxAmountExclusive`, `amountTotal`, `taxBreakdown[]`. A `0` result means no
  active registration for that jurisdiction yet (expected until the Dashboard steps above).
- **Cost proof:** Stripe Dashboard → Tax → Transactions stays **empty** — calculations are
  not billed and never appear there.
