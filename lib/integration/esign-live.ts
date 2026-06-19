/**
 * Quote e-signature via Dropbox Sign (formerly HelloSign) — env-gated DORMANT
 * (v4-S2 #3). Turns the customer quote-acceptance flow into a legally-binding
 * close. Conservative, exactly like the Stripe deposit seam:
 *
 *  - $0 and ZERO network until DROPBOX_SIGN_API_KEY is set (dormant gate).
 *  - DEFAULTS TO test_mode — non-binding, no quota consumed, free — unless an
 *    operator explicitly sets DROPBOX_SIGN_TEST_MODE=false. So even a configured
 *    deployment costs nothing until someone deliberately flips to live signatures.
 *  - We use the EMAIL flow (POST /v3/signature_request/send): Dropbox emails the
 *    signer and hosts the signing UI, so NO embedded client_id / app-approval is
 *    needed and no signer document data is rendered in our app.
 *  - The webhook that flips a request to signed is verified with node:crypto
 *    HMAC-SHA256 over (event_time + event_type) keyed with the API key — the
 *    documented Dropbox Sign event_hash scheme — mirroring our other webhook seams.
 *
 * Project rule — never log PII/payloads: on error we log ONLY the HTTP status +
 * coarse context; never the signer email, the document, or the response body.
 *
 *   DROPBOX_SIGN_API_KEY    — server-only secret. The gate AND the webhook HMAC
 *                             key (Dropbox uses the account Primary Key for both).
 *   DROPBOX_SIGN_TEST_MODE  — "false" to send legally-binding live signatures;
 *                             anything else (default) stays in free, non-binding
 *                             test mode.
 *   ESIGN_FILE_URL_HOSTS    — optional comma-separated extra hostnames allowed as
 *                             the document source (SSRF allowlist); the request's
 *                             own origin host is always allowed.
 *
 * API host note: the product is "Dropbox Sign" but the live API host is still
 * api.hellosign.com/v3 — do NOT "correct" it to dropbox.com.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { logApiError } from "@/lib/server/log";

const SEND_URL = "https://api.hellosign.com/v3/signature_request/send";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** True only when the Dropbox Sign API key is present. Single source of dormancy. */
export function esignConfigured(): boolean {
  return Boolean(env("DROPBOX_SIGN_API_KEY"));
}

/**
 * true unless DROPBOX_SIGN_TEST_MODE is explicitly "false". Defaulting to test
 * mode means a configured-but-not-yet-paid deployment sends non-binding, $0,
 * no-quota requests — the operator opts INTO live signatures deliberately.
 */
export function esignTestMode(): boolean {
  return env("DROPBOX_SIGN_TEST_MODE") !== "false";
}

export interface SignatureRequestInput {
  quoteId: string;
  quoteNumber: string;
  signerName: string;
  signerEmail: string;
  /** https URL of the quote document Dropbox will fetch and present for signing. */
  fileUrl: string;
  subject?: string;
  message?: string;
  testMode: boolean;
}

/**
 * Pure: the JSON body for POST /signature_request/send. The quote id is stashed
 * in metadata (max 10 keys) so the webhook can correlate the event back to the
 * quote. Unit-tested.
 */
export function buildSignatureRequestBody(input: SignatureRequestInput): Record<string, unknown> {
  return {
    test_mode: input.testMode,
    title: `Quote ${input.quoteNumber}`,
    subject: input.subject ?? `Please sign your quote ${input.quoteNumber}`,
    message:
      input.message ??
      "Your Meridian Supply Co. quote is ready for signature. Review and sign to accept.",
    signers: [{ name: input.signerName, email_address: input.signerEmail }],
    file_urls: [input.fileUrl],
    metadata: { quote_id: input.quoteId },
  };
}

export type SignatureRequestResult =
  | { enabled: false; reason: "not-configured" | "error" }
  | { enabled: true; signatureRequestId: string; testMode: boolean };

/** Basic-auth header: the API key is the username with a blank password. */
function basicAuth(apiKey: string): string {
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

const SendResponseShape = (json: unknown): { signature_request?: { signature_request_id?: unknown } } =>
  (json && typeof json === "object" ? json : {}) as { signature_request?: { signature_request_id?: unknown } };

/**
 * Send a quote for signature. Dormant (no network) when the key is unset;
 * fail-closed on any Dropbox/network error so the caller can fall back to the
 * existing click-to-accept path.
 */
export async function createSignatureRequest(input: SignatureRequestInput): Promise<SignatureRequestResult> {
  const key = env("DROPBOX_SIGN_API_KEY");
  if (!key) return { enabled: false, reason: "not-configured" }; // ← dormant: no key ⇒ no network

  try {
    const res = await fetch(SEND_URL, {
      method: "POST",
      headers: {
        Authorization: basicAuth(key),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildSignatureRequestBody(input)),
      signal: AbortSignal.timeout(15_000),
    });
    const json: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = (json as { error?: { error_name?: string } }).error;
      logApiError("esign:send", new Error(`Dropbox Sign HTTP ${res.status}`), {
        error_name: err?.error_name ?? "unknown",
      });
      return { enabled: false, reason: "error" };
    }
    const id = SendResponseShape(json).signature_request?.signature_request_id;
    if (typeof id !== "string" || !id) {
      logApiError("esign:send", new Error("Dropbox Sign response missing signature_request_id"));
      return { enabled: false, reason: "error" };
    }
    return { enabled: true, signatureRequestId: id, testMode: input.testMode };
  } catch (e) {
    logApiError("esign:send", e);
    return { enabled: false, reason: "error" };
  }
}

/**
 * Pure: verify a Dropbox Sign webhook's event_hash. Dropbox computes it as
 * HMAC-SHA256(apiKey, event_time + event_type) — the two values concatenated
 * directly, no separator — and the HMAC key is the account API key. Returns true
 * iff the recomputed digest matches (constant-time). node:crypto only.
 * Unit-tested against the documented sample scheme.
 */
export function verifyEsignEventHash(
  eventTime: string,
  eventType: string,
  eventHash: string,
  apiKey: string,
): boolean {
  if (!eventTime || !eventType || !eventHash || !apiKey) return false;
  const expected = createHmac("sha256", apiKey).update(`${eventTime}${eventType}`).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const givenBuf = Buffer.from(eventHash, "utf8");
  return expectedBuf.length === givenBuf.length && timingSafeEqual(expectedBuf, givenBuf);
}

export interface ParsedEsignEvent {
  eventTime: string;
  eventType: string;
  eventHash: string;
  signatureRequestId: string | null;
}

/**
 * Pure: pull the fields we need from a parsed Dropbox Sign callback payload
 * (the JSON in the multipart `json` field). Returns null when the shape is
 * unrecognizable (no event object). The signature_request_id may be absent on a
 * plain callback_test ping.
 */
export function parseEsignEvent(payload: unknown): ParsedEsignEvent | null {
  const p = payload as {
    event?: { event_time?: unknown; event_type?: unknown; event_hash?: unknown };
    signature_request?: { signature_request_id?: unknown };
  };
  const ev = p.event;
  if (!ev || typeof ev.event_time !== "string" || typeof ev.event_type !== "string" || typeof ev.event_hash !== "string") {
    return null;
  }
  const srId = p.signature_request?.signature_request_id;
  return {
    eventTime: ev.event_time,
    eventType: ev.event_type,
    eventHash: ev.event_hash,
    signatureRequestId: typeof srId === "string" && srId ? srId : null,
  };
}

export interface EsignOutcome {
  signatureRequestId: string;
  status: "sent" | "viewed" | "signed" | "declined";
}

/**
 * Pure: map a parsed event to an outcome, or null when it's not state-changing
 * (e.g. callback_test, or an event with no signature_request_id). Single-signer
 * quotes treat `signature_request_signed` and `signature_request_all_signed` as
 * "signed" (accepted).
 */
export function esignOutcomeFromEvent(parsed: ParsedEsignEvent): EsignOutcome | null {
  if (!parsed.signatureRequestId) return null;
  const id = parsed.signatureRequestId;
  switch (parsed.eventType) {
    case "signature_request_sent":
      return { signatureRequestId: id, status: "sent" };
    case "signature_request_viewed":
      return { signatureRequestId: id, status: "viewed" };
    case "signature_request_signed":
    case "signature_request_all_signed":
      return { signatureRequestId: id, status: "signed" };
    case "signature_request_declined":
      return { signatureRequestId: id, status: "declined" };
    default:
      return null;
  }
}

/**
 * Pure: is `fileUrl` a safe document source to hand Dropbox? Only https, and the
 * host must be the request's own origin host or one of ESIGN_FILE_URL_HOSTS.
 * file_urls makes Dropbox's servers fetch the URL, so an unconstrained value
 * would be an SSRF/exfil vector — we only ever let it point at our own deployment.
 */
export function isAllowedFileUrl(fileUrl: string, originHost: string): boolean {
  let u: URL;
  try {
    u = new URL(fileUrl);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const extra = (env("ESIGN_FILE_URL_HOSTS") ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  const allowed = new Set([originHost.toLowerCase(), ...extra]);
  return allowed.has(u.hostname.toLowerCase());
}
