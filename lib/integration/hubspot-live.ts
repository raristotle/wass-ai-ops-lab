/**
 * Live CRM sync (REAL) — HubSpot, env-gated like the FRED commodity seam: from a
 * WON quote, upsert a Contact (by email, idempotent) and create an associated
 * Deal — only when HUBSPOT_PRIVATE_APP_TOKEN is set; otherwise a no-op. Raw fetch,
 * no SDK, server-only. The request-body builders are pure + unit-tested; only the
 * thin fetch wrapper touches the network. Fail-closed: any error → {enabled:false}.
 *
 *   HUBSPOT_PRIVATE_APP_TOKEN — Private App token (pat-…). The gate (Bearer).
 *   HUBSPOT_DEAL_PIPELINE     — optional internal pipeline id (default pipeline if unset).
 *   HUBSPOT_DEAL_WON_STAGE    — optional internal won dealstage id (default "closedwon").
 */

import { logApiError } from "@/lib/server/log";

const BASE = "https://api.hubapi.com";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** True when the HubSpot private-app token is present. Single source of dormancy. */
export function hubspotConfigured(): boolean {
  return Boolean(env("HUBSPOT_PRIVATE_APP_TOKEN"));
}

export interface WonQuote {
  email: string;
  firstName?: string;
  lastName?: string;
  dealName: string;
  amount: number;
}

/** Pure: idempotent contact upsert body (by email). */
export function contactUpsertBody(q: WonQuote): { inputs: { idProperty: string; id: string; properties: Record<string, string> }[] } {
  const properties: Record<string, string> = { email: q.email };
  if (q.firstName) properties.firstname = q.firstName;
  if (q.lastName) properties.lastname = q.lastName;
  return { inputs: [{ idProperty: "email", id: q.email, properties }] };
}

/** Pure: deal-create body with an inline deal→contact association (type 3, HUBSPOT_DEFINED). */
export function dealCreateBody(q: WonQuote, contactId: string): {
  properties: Record<string, string>;
  associations: { to: { id: string }; types: { associationCategory: string; associationTypeId: number }[] }[];
} {
  const properties: Record<string, string> = {
    dealname: q.dealName,
    amount: q.amount.toFixed(2), // HubSpot property values are strings
    dealstage: env("HUBSPOT_DEAL_WON_STAGE") ?? "closedwon",
  };
  const pipeline = env("HUBSPOT_DEAL_PIPELINE");
  if (pipeline) properties.pipeline = pipeline;
  return {
    properties,
    associations: [{ to: { id: contactId }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }] }],
  };
}

export type HubspotSyncResult =
  | { enabled: true; contactId: string; dealId: string; syncedAt: string }
  | { enabled: false; reason: "no-keys" | "error" };

/**
 * Sync a won quote to HubSpot: upsert the contact, then create + associate the
 * deal. Returns {enabled:false} when dormant (no token) or on any error — never
 * throws. NOTE: deal creation is not idempotent (HubSpot has no deal business
 * key); the caller should dedupe by storing the returned dealId per quote.
 */
export async function syncWonQuoteToHubspot(q: WonQuote): Promise<HubspotSyncResult> {
  const token = env("HUBSPOT_PRIVATE_APP_TOKEN");
  if (!token) return { enabled: false, reason: "no-keys" }; // ← dormant: no token ⇒ no network

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  try {
    const cRes = await fetch(`${BASE}/crm/v3/objects/contacts/batch/upsert`, {
      method: "POST",
      headers,
      body: JSON.stringify(contactUpsertBody(q)),
      signal: AbortSignal.timeout(12_000),
    });
    if (!cRes.ok) {
      logApiError("hubspot:contact", new Error(`HubSpot contact HTTP ${cRes.status}`));
      return { enabled: false, reason: "error" };
    }
    const cJson = (await cRes.json().catch(() => ({}))) as { results?: { id?: string }[] };
    const contactId = cJson.results?.[0]?.id;
    if (!contactId) return { enabled: false, reason: "error" };

    const dRes = await fetch(`${BASE}/crm/v3/objects/deals`, {
      method: "POST",
      headers,
      body: JSON.stringify(dealCreateBody(q, contactId)),
      signal: AbortSignal.timeout(12_000),
    });
    if (!dRes.ok) {
      logApiError("hubspot:deal", new Error(`HubSpot deal HTTP ${dRes.status}`));
      return { enabled: false, reason: "error" };
    }
    const dJson = (await dRes.json().catch(() => ({}))) as { id?: string };
    if (!dJson.id) return { enabled: false, reason: "error" };

    return { enabled: true, contactId, dealId: dJson.id, syncedAt: new Date().toISOString() };
  } catch (e) {
    logApiError("hubspot:sync", e);
    return { enabled: false, reason: "error" };
  }
}
