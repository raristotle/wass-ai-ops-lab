/**
 * Deposit record domain model (v3-S6 #19). A deposit is the only real-money
 * surface in the app, so its server-side record is the single source of truth
 * for "has the customer paid the deposit" — quotes/orders live client-side, and
 * the Stripe webhook (which has no session) writes this record in a FIXED global
 * `deposits` namespace, stamping the owning tenantId INTO the record so a tenant
 * operator can read back only their own. Pure data + transitions (now injected),
 * fully unit-testable; the route/webhook own persistence + Stripe.
 */

export const DEPOSITS_NAMESPACE = "deposits";

export type DepositStatus = "requested" | "paid" | "failed" | "expired";

export interface DepositRecord {
  /** Deterministic deposit id (also the store key + Stripe client_reference_id). */
  id: string;
  /** The quote this deposit is against (client-side quote id). */
  quoteId: string;
  /** Human quote number for display / Checkout line description. */
  quoteNumber: string;
  /** Owning tenant — carried IN the record because the webhook has no session to
   *  recover a tenant prefix. null in pilot mode (sessions off, shared space). */
  tenantId: string | null;
  amountCents: number;
  currency: string;
  status: DepositStatus;
  /** Stripe Checkout Session id, set once the session is created. */
  sessionId: string | null;
  /** Hosted Checkout URL of the in-flight session — reused on re-request so a
   *  repeat operator click can't mint a SECOND payable link for the same deposit. */
  checkoutUrl: string | null;
  createdAt: number;
  updatedAt: number;
  paidAt?: number;
}

export interface NewDepositInput {
  id: string;
  quoteId: string;
  quoteNumber: string;
  tenantId: string | null;
  amountCents: number;
  currency: string;
  sessionId: string | null;
  checkoutUrl: string | null;
  now: number;
}

/** A freshly-requested deposit (pre-payment). */
export function newDepositRecord(input: NewDepositInput): DepositRecord {
  return {
    id: input.id,
    quoteId: input.quoteId,
    quoteNumber: input.quoteNumber,
    tenantId: input.tenantId,
    amountCents: input.amountCents,
    currency: input.currency,
    status: "requested",
    sessionId: input.sessionId,
    checkoutUrl: input.checkoutUrl,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

/**
 * Pure status transition for a webhook outcome. Idempotent and monotonic: once
 * a deposit is "paid" it never moves back (a late `expired`/`failed` for an
 * already-settled session is ignored), so out-of-order Stripe events can't
 * un-pay a deposit.
 */
export function transitionDeposit(rec: DepositRecord, status: DepositStatus, now: number): DepositRecord {
  if (rec.status === "paid") return rec; // terminal: never downgrade a paid deposit
  if (rec.status === status) return rec; // idempotent: redelivered event, no change
  return {
    ...rec,
    status,
    updatedAt: now,
    ...(status === "paid" ? { paidAt: now } : {}),
  };
}

/** Public (client-safe) projection of a deposit — no tenant id leaks out. */
export function publicDeposit(rec: DepositRecord): {
  id: string;
  quoteId: string;
  status: DepositStatus;
  amountCents: number;
  currency: string;
  paidAt?: number;
} {
  return {
    id: rec.id,
    quoteId: rec.quoteId,
    status: rec.status,
    amountCents: rec.amountCents,
    currency: rec.currency,
    ...(rec.paidAt ? { paidAt: rec.paidAt } : {}),
  };
}
