/**
 * Tamper-evident audit log (v4-S2 #5) — SOC2/compliance readiness.
 *
 * A hash-CHAINED, HMAC-keyed activity log: each entry embeds the prior entry's
 * hash, and its own hash is HMAC-SHA256(secret, canonical(entry)). Because the
 * HMAC key is a server secret, a reader who can see the stored log still cannot
 * forge or silently edit an entry (plain SHA-256 chaining would let anyone with
 * the data recompute a consistent chain). `verifyAuditChain` recomputes every
 * hash and the prevHash linkage to detect insertion, deletion, reordering, or
 * field edits, reporting the first broken sequence number.
 *
 * Pure + deterministic: the secret and timestamps are injected, so it is fully
 * unit-testable. node:crypto is server-only — client code imports TYPES only, so
 * this module never enters a browser bundle.
 *
 * One chain per tenant lives in the durable `audit` namespace; the route appends
 * via the CAS `mutate` helper so concurrent writes can't fork the chain.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const AUDIT_NAMESPACE = "audit";
/** Single key holding the tenant's chain (array, oldest-first). */
export const AUDIT_CHAIN_KEY = "chain";

/** The business events we record. Free-form is allowed, but these are canonical. */
export const AUDIT_ACTIONS = [
  "quote.sent",
  "quote.accepted",
  "quote.declined",
  "quote.countered",
  "quote.won",
  "quote.lost",
  "order.placed",
  "deposit.paid",
  "esign.sent",
  "esign.signed",
  "esign.declined",
  "rma.opened",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number] | (string & {});

/** The signed fields of an entry (everything except its own hash). */
export interface AuditFields {
  seq: number;
  at: number;
  /** Who/what performed the action (tenant user, "system", "dropbox-sign", …). */
  actor: string;
  action: AuditAction;
  /** The entity acted on (quote number, order id, …). */
  target: string;
  detail: string;
  /** Hash of the previous entry — "" for the genesis entry. */
  prevHash: string;
}

export interface AuditEntry extends AuditFields {
  /** HMAC-SHA256(secret, canonical(fields)). */
  hash: string;
}

export interface NewAuditInput {
  actor: string;
  action: AuditAction;
  target: string;
  detail: string;
  at: number;
}

/** Deterministic serialization of the signed fields (fixed positional order). */
export function canonicalAuditFields(f: AuditFields): string {
  return JSON.stringify([f.seq, f.at, f.actor, f.action, f.target, f.detail, f.prevHash]);
}

/** HMAC-SHA256 hex of an entry's canonical fields under `secret`. */
export function computeAuditHash(f: AuditFields, secret: string): string {
  return createHmac("sha256", secret).update(canonicalAuditFields(f)).digest("hex");
}

/**
 * Append an entry to a chain, returning the new chain (the input is not mutated).
 * seq increments from the last entry; prevHash links to the last entry's hash.
 */
export function appendAuditEntry(chain: AuditEntry[], input: NewAuditInput, secret: string): AuditEntry[] {
  const last = chain[chain.length - 1];
  const fields: AuditFields = {
    seq: last ? last.seq + 1 : 0,
    at: input.at,
    actor: input.actor,
    action: input.action,
    target: input.target,
    detail: input.detail,
    prevHash: last ? last.hash : "",
  };
  const entry: AuditEntry = { ...fields, hash: computeAuditHash(fields, secret) };
  return [...chain, entry];
}

export interface ChainVerification {
  valid: boolean;
  /** seq of the first entry that fails verification, or null when valid. */
  brokenAt: number | null;
  length: number;
}

/** Constant-time hex compare. */
function hashEq(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Verify chain integrity: every entry's hash recomputes, seq is contiguous from
 * 0, and each prevHash links to the prior entry's hash. Returns the first broken
 * seq (by position) or null when the whole chain is intact.
 */
export function verifyAuditChain(chain: AuditEntry[], secret: string): ChainVerification {
  for (let i = 0; i < chain.length; i++) {
    const e = chain[i];
    const expectedPrev = i === 0 ? "" : chain[i - 1].hash;
    const expectedSeq = i === 0 ? 0 : chain[i - 1].seq + 1;
    const recomputed = computeAuditHash(
      { seq: e.seq, at: e.at, actor: e.actor, action: e.action, target: e.target, detail: e.detail, prevHash: e.prevHash },
      secret,
    );
    if (e.seq !== expectedSeq || e.prevHash !== expectedPrev || !hashEq(recomputed, e.hash)) {
      return { valid: false, brokenAt: e.seq, length: chain.length };
    }
  }
  return { valid: true, brokenAt: null, length: chain.length };
}

/** Header + rows for a compliance CSV export. */
export const AUDIT_CSV_HEADER = ["Seq", "Timestamp (UTC)", "Actor", "Action", "Target", "Detail", "Hash", "Prev Hash"];

export function auditCsvRows(chain: AuditEntry[]): (string | number)[][] {
  return chain.map((e) => [
    e.seq,
    new Date(e.at).toISOString(),
    e.actor,
    e.action,
    e.target,
    e.detail,
    e.hash,
    e.prevHash,
  ]);
}
