/**
 * Salesforce CRM sync (v5-S3 #13) — env-gated DORMANT, $0 until configured.
 *
 * Pushes a won quote to Salesforce: create a Contact (by email) and an associated
 * Opportunity in the won stage. Mirrors the HubSpot seam so /api/crm/sync can target
 * either CRM by `provider`. Dormant (zero network) until both an access token and an
 * instance URL are set:
 *
 *   SALESFORCE_ACCESS_TOKEN — OAuth bearer (the dormancy switch).
 *   SALESFORCE_INSTANCE_URL — e.g. https://yourorg.my.salesforce.com
 *   SALESFORCE_API_VERSION  — optional, default v60.0
 *   SALESFORCE_WON_STAGE    — optional Opportunity StageName, default "Closed Won"
 *
 * Pure body builders are unit-tested; the thin POSTs fail closed and never throw
 * into the caller. Server-only; the token is a header, never logged.
 */

import { logApiError } from "@/lib/server/log";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** True only when BOTH the token and instance URL are set. Single source of dormancy. */
export function salesforceConfigured(): boolean {
  return Boolean(env("SALESFORCE_ACCESS_TOKEN") && env("SALESFORCE_INSTANCE_URL"));
}

export interface WonQuote {
  email: string;
  firstName?: string;
  lastName?: string;
  dealName: string;
  amount: number;
}

/** Pure: Contact create body (Salesforce requires a LastName). */
export function contactBody(q: WonQuote): Record<string, string> {
  const body: Record<string, string> = { Email: q.email, LastName: q.lastName || q.email.split("@")[0] || "Unknown" };
  if (q.firstName) body.FirstName = q.firstName;
  return body;
}

/** Pure: Opportunity create body in the won stage, with a close date the caller stamps. */
export function opportunityBody(q: WonQuote, contactId: string, closeDate: string): Record<string, string | number> {
  return {
    Name: q.dealName,
    Amount: Number(q.amount.toFixed(2)),
    StageName: env("SALESFORCE_WON_STAGE") ?? "Closed Won",
    CloseDate: closeDate, // YYYY-MM-DD
    ContactId: contactId,
  };
}

export type SalesforceSyncResult =
  | { enabled: true; provider: "salesforce"; contactId: string; opportunityId: string; syncedAt: string }
  | { enabled: false; reason: "no-keys" | "error" };

/**
 * Create a Contact + Opportunity in Salesforce for a won quote. Dormant + fail-closed.
 * NOTE: like the HubSpot seam, Opportunity creation is NOT idempotent — the caller
 * should dedupe by the returned opportunityId per quote.
 *
 * `now` is injected (ISO string) so the close-date is deterministic/testable.
 */
export async function syncWonQuoteToSalesforce(q: WonQuote, now: string): Promise<SalesforceSyncResult> {
  const token = env("SALESFORCE_ACCESS_TOKEN");
  const instance = env("SALESFORCE_INSTANCE_URL");
  if (!token || !instance) return { enabled: false, reason: "no-keys" }; // dormant: no creds ⇒ no network

  const version = env("SALESFORCE_API_VERSION") ?? "v60.0";
  const base = `${instance.replace(/\/$/, "")}/services/data/${version}/sobjects`;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  try {
    const cRes = await fetch(`${base}/Contact`, {
      method: "POST",
      headers,
      body: JSON.stringify(contactBody(q)),
      signal: AbortSignal.timeout(8000),
    });
    if (!cRes.ok) {
      logApiError("salesforce:contact", new Error(`Salesforce contact HTTP ${cRes.status}`));
      return { enabled: false, reason: "error" };
    }
    const contactId = (await cRes.json())?.id;
    if (!contactId) return { enabled: false, reason: "error" };

    const closeDate = now.slice(0, 10); // YYYY-MM-DD
    const oRes = await fetch(`${base}/Opportunity`, {
      method: "POST",
      headers,
      body: JSON.stringify(opportunityBody(q, contactId, closeDate)),
      signal: AbortSignal.timeout(8000),
    });
    if (!oRes.ok) {
      logApiError("salesforce:opportunity", new Error(`Salesforce opportunity HTTP ${oRes.status}`));
      return { enabled: false, reason: "error" };
    }
    const opportunityId = (await oRes.json())?.id;
    if (!opportunityId) return { enabled: false, reason: "error" };

    return { enabled: true, provider: "salesforce", contactId, opportunityId, syncedAt: now };
  } catch (e) {
    logApiError("salesforce:sync", e);
    return { enabled: false, reason: "error" };
  }
}
