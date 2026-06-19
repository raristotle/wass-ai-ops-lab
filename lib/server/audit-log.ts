/**
 * Server-side helper for appending to a tenant's tamper-evident audit chain
 * (v4-S2 #5). Centralizes the HMAC secret resolution + CAS append so the audit
 * route AND server-observed events (e.g. the e-sign webhook) record the same way.
 *
 * The HMAC key is AUDIT_SECRET, falling back to SESSION_SECRET, then a dev
 * constant. For real tamper-evidence in production, set AUDIT_SECRET (or rely on
 * the SSO SESSION_SECRET) — with the dev constant the chain still detects
 * accidental edits but not an adversary who knows the constant.
 */

import { getStore, forTenant, mutate } from "@/lib/server/persistence";
import {
  AUDIT_NAMESPACE,
  AUDIT_CHAIN_KEY,
  appendAuditEntry,
  verifyAuditChain,
  type AuditEntry,
  type NewAuditInput,
  type ChainVerification,
} from "@/lib/product-finder-audit";

/** The HMAC key for the audit chain. */
export function auditSecret(): string {
  return process.env.AUDIT_SECRET?.trim() || process.env.SESSION_SECRET?.trim() || "meridian-audit-dev";
}

/** True when a real (non-dev) audit signing key is configured. */
export function auditSigned(): boolean {
  return Boolean(process.env.AUDIT_SECRET?.trim() || process.env.SESSION_SECRET?.trim());
}

/** Append one event to the tenant's chain (CAS). Returns the new entry or null. */
export async function recordAuditEvent(tenantId: string | null, input: NewAuditInput): Promise<AuditEntry | null> {
  const store = forTenant(getStore(), tenantId);
  const secret = auditSecret();
  const chain = await mutate<AuditEntry[]>(store, AUDIT_NAMESPACE, AUDIT_CHAIN_KEY, (cur) =>
    appendAuditEntry(cur ?? [], input, secret),
  );
  return chain ? chain[chain.length - 1] : null;
}

/** Best-effort append that never throws — for server-observed events on hot paths. */
export async function recordAuditEventSafe(tenantId: string | null, input: NewAuditInput): Promise<void> {
  try {
    await recordAuditEvent(tenantId, input);
  } catch {
    // Audit append must never break the primary operation; swallow.
  }
}

/** Read the tenant's chain (oldest-first), bounded. */
export async function readAuditChain(tenantId: string | null, limit?: number): Promise<AuditEntry[]> {
  const store = forTenant(getStore(), tenantId);
  const chain = (await store.get<AuditEntry[]>(AUDIT_NAMESPACE, AUDIT_CHAIN_KEY)) ?? [];
  return limit && chain.length > limit ? chain.slice(chain.length - limit) : chain;
}

/** Verify the tenant's full chain. */
export async function verifyTenantChain(tenantId: string | null): Promise<ChainVerification> {
  const store = forTenant(getStore(), tenantId);
  const chain = (await store.get<AuditEntry[]>(AUDIT_NAMESPACE, AUDIT_CHAIN_KEY)) ?? [];
  return verifyAuditChain(chain, auditSecret());
}
