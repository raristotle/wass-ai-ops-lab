/**
 * E-signature record domain model (v4-S2 #3). When a rep sends a quote for
 * signature via Dropbox Sign, this server-side record is the source of truth for
 * "has the customer signed". Quotes live client-side, and the Dropbox Sign
 * webhook (which has no session) writes this record in a FIXED global `esign`
 * namespace, stamping the owning tenantId INTO the record so a tenant operator
 * reads back only their own. Pure data + transitions (now injected), fully
 * unit-testable; the route/webhook own persistence + the Dropbox API.
 *
 * The record is keyed by the Dropbox `signature_request_id` so the webhook (which
 * only knows that id) can locate it directly.
 */

export const ESIGN_NAMESPACE = "esign";

export type EsignStatus = "sent" | "viewed" | "signed" | "declined" | "error";

export interface EsignRecord {
  /** Dropbox signature_request_id — also the store key + correlation id. */
  id: string;
  /** The quote this signature is against (client-side quote id). */
  quoteId: string;
  /** Human quote number for display. */
  quoteNumber: string;
  /** Owning tenant — carried IN the record because the webhook has no session to
   *  recover a tenant prefix. null in pilot mode (sessions off, shared space). */
  tenantId: string | null;
  status: EsignStatus;
  /** true = Dropbox test_mode (non-binding, no quota, $0). The default. */
  testMode: boolean;
  createdAt: number;
  updatedAt: number;
  signedAt?: number;
}

export interface NewEsignInput {
  id: string;
  quoteId: string;
  quoteNumber: string;
  tenantId: string | null;
  testMode: boolean;
  now: number;
}

/** A freshly-sent signature request (pre-signature). */
export function newEsignRecord(input: NewEsignInput): EsignRecord {
  return {
    id: input.id,
    quoteId: input.quoteId,
    quoteNumber: input.quoteNumber,
    tenantId: input.tenantId,
    status: "sent",
    testMode: input.testMode,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

/** Rank used to keep transitions monotonic — a status never moves "backwards". */
const STATUS_RANK: Record<EsignStatus, number> = {
  error: 0,
  sent: 1,
  viewed: 2,
  signed: 3,
  declined: 3,
};

/**
 * Pure status transition for a webhook outcome. Idempotent and monotonic:
 *  - "signed" and "declined" are terminal — a later/out-of-order event can never
 *    move a signed or declined request to anything else.
 *  - a redelivered event (same status) is a no-op.
 *  - "viewed" can't downgrade a request that's already "signed", etc.
 */
export function transitionEsign(rec: EsignRecord, status: EsignStatus, now: number): EsignRecord {
  if (rec.status === "signed" || rec.status === "declined") return rec; // terminal
  if (rec.status === status) return rec; // idempotent redelivery
  if (STATUS_RANK[status] < STATUS_RANK[rec.status]) return rec; // never go backwards
  return {
    ...rec,
    status,
    updatedAt: now,
    ...(status === "signed" ? { signedAt: now } : {}),
  };
}

/** Public (client-safe) projection — no tenant id leaks out. */
export function publicEsign(rec: EsignRecord): {
  id: string;
  quoteId: string;
  status: EsignStatus;
  testMode: boolean;
  signedAt?: number;
} {
  return {
    id: rec.id,
    quoteId: rec.quoteId,
    status: rec.status,
    testMode: rec.testMode,
    ...(rec.signedAt ? { signedAt: rec.signedAt } : {}),
  };
}
