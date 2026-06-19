import { getStore, mutate } from "@/lib/server/persistence";
import { logApiError } from "@/lib/server/log";
import {
  parseEsignEvent,
  verifyEsignEventHash,
  esignOutcomeFromEvent,
} from "@/lib/integration/esign-live";
import { ESIGN_NAMESPACE, transitionEsign, type EsignRecord } from "@/lib/product-finder-esign";
import { recordAuditEventSafe } from "@/lib/server/audit-log";

export const dynamic = "force-dynamic";

/**
 * Dropbox Sign webhook (v4-S2 #3). Dropbox → us, server-to-server: it has NO
 * session, so it is NOT requireApiAuth-gated — it is authenticated by the
 * HMAC-SHA256 event_hash (over event_time+event_type, keyed with the API key)
 * instead. On a state-changing event it flips the EsignRecord (fixed global
 * `esign` namespace) via CAS `mutate`, idempotently.
 *
 * Dropbox requires the body to CONTAIN "Hello API Event Received" with a 200 for
 * EVERY accepted callback (including the callback_test ping), or it disables the
 * callback. Events arrive as multipart/form-data with the JSON in a field named
 * "json". Dormant until DROPBOX_SIGN_API_KEY is set. Never logs the payload.
 */

const ACK = "Hello API Event Received";
const ackResponse = () => new Response(ACK, { status: 200, headers: { "content-type": "text/plain" } });

export async function POST(req: Request) {
  const apiKey = process.env.DROPBOX_SIGN_API_KEY?.trim();
  if (!apiKey) {
    // Dormant: no key ⇒ we cannot verify, so we accept nothing.
    return new Response("Webhook not configured", { status: 503 });
  }

  let payload: unknown;
  try {
    const form = await req.formData();
    const json = form.get("json");
    if (typeof json !== "string") {
      return new Response("Bad request", { status: 400 });
    }
    payload = JSON.parse(json);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const parsed = parseEsignEvent(payload);
  if (!parsed) {
    return new Response("Bad request", { status: 400 });
  }

  // Authenticate the event BEFORE trusting anything.
  if (!verifyEsignEventHash(parsed.eventTime, parsed.eventType, parsed.eventHash, apiKey)) {
    logApiError("/api/esign/webhook", new Error("Invalid Dropbox Sign event_hash"));
    return new Response("Invalid signature", { status: 401 });
  }

  const outcome = esignOutcomeFromEvent(parsed);
  // Verified but not state-changing (callback_test, or no signature_request_id):
  // Dropbox still requires the magic ack string.
  if (!outcome) return ackResponse();

  try {
    const updated = await mutate<EsignRecord>(getStore(), ESIGN_NAMESPACE, outcome.signatureRequestId, (cur) =>
      cur ? transitionEsign(cur, outcome.status, Date.now()) : null,
    );
    // Record a tamper-evident audit entry for terminal signature outcomes, scoped
    // to the record's owning tenant. Best-effort — never blocks the webhook ack.
    if (updated && (outcome.status === "signed" || outcome.status === "declined")) {
      await recordAuditEventSafe(updated.tenantId, {
        actor: "dropbox-sign",
        action: outcome.status === "signed" ? "esign.signed" : "esign.declined",
        target: updated.quoteNumber,
        detail: `quote ${updated.quoteId}${updated.testMode ? " (test mode)" : ""}`,
        at: Date.now(),
      });
    }
    // updated === null means no such request on record (e.g. a stray event) — ack anyway.
    return ackResponse();
  } catch (e) {
    // Storage failure: return 500 so Dropbox retries the (idempotent) update.
    logApiError("/api/esign/webhook", e);
    return new Response("Update failed", { status: 500 });
  }
}
