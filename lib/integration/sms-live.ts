/**
 * Live SMS notifications (REAL) — Twilio Programmable SMS, env-gated like the FRED
 * commodity seam: a real text only when the Twilio credentials are set, otherwise
 * a no-op (callers keep their log-only path). Raw fetch (HTTP Basic), no SDK,
 * server-only. The form builder is pure + unit-tested; only the thin fetch wrapper
 * touches the network. Fail-closed: SMS is a side-channel, so any error returns
 * {enabled:true, sent:false} and never throws into the request path.
 *
 * COMPLIANCE: only send to numbers with prior express (TCPA) opt-in; honor STOP.
 * Never log the recipient or message body (PII).
 *
 *   TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN — HTTP Basic credentials (the gate).
 *   TWILIO_FROM_NUMBER  OR  TWILIO_MESSAGING_SERVICE_SID — exactly one sender.
 */

import { logApiError } from "@/lib/server/log";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** True only when SID + token + a sender (From or Messaging Service) are all set. */
export function smsConfigured(): boolean {
  return Boolean(
    env("TWILIO_ACCOUNT_SID") &&
      env("TWILIO_AUTH_TOKEN") &&
      (env("TWILIO_FROM_NUMBER") || env("TWILIO_MESSAGING_SERVICE_SID")),
  );
}

/** Pure: build the form-encoded body (To, Body, and exactly one sender). */
export function buildSmsForm(input: { to: string; body: string }): URLSearchParams {
  const form = new URLSearchParams();
  form.set("To", input.to);
  form.set("Body", input.body);
  const svc = env("TWILIO_MESSAGING_SERVICE_SID");
  const from = env("TWILIO_FROM_NUMBER");
  if (svc) form.set("MessagingServiceSid", svc);
  else if (from) form.set("From", from);
  return form;
}

export type SmsResult =
  | { enabled: true; sent: true; sid: string; status: string }
  | { enabled: true; sent: false; errorCode: number | null; errorMessage: string | null }
  | { enabled: false; reason: "no-keys" };

/**
 * Send a transactional SMS. Dormant (no creds) → {enabled:false}, no network.
 * Configured but the send fails → {enabled:true, sent:false} (logged, status
 * only). 201 with status queued/accepted means ACCEPTED, not yet delivered.
 */
export async function sendSms(input: { to: string; body: string }): Promise<SmsResult> {
  const sid = env("TWILIO_ACCOUNT_SID");
  const token = env("TWILIO_AUTH_TOKEN");
  if (!smsConfigured() || !sid || !token) return { enabled: false, reason: "no-keys" }; // ← dormant guard

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: buildSmsForm(input).toString(),
      signal: AbortSignal.timeout(12_000),
    });
    const json = (await res.json().catch(() => ({}))) as {
      sid?: string;
      status?: string;
      error_code?: number | null;
      error_message?: string | null;
      code?: number;
      message?: string;
    };
    if (!res.ok || json.error_code != null) {
      // Log status/code only — never the recipient or body (PII).
      logApiError("twilio:sms", new Error(`Twilio HTTP ${res.status} code ${json.error_code ?? json.code ?? "?"}`));
      return { enabled: true, sent: false, errorCode: json.error_code ?? json.code ?? null, errorMessage: json.error_message ?? json.message ?? null };
    }
    return { enabled: true, sent: true, sid: json.sid ?? "", status: json.status ?? "queued" };
  } catch (e) {
    logApiError("twilio:sms", e);
    return { enabled: true, sent: false, errorCode: null, errorMessage: "unreachable" };
  }
}
