/**
 * Web push (REAL) — env-gated DORMANT, self-hosted VAPID, $0. Sends a NO-PAYLOAD
 * "tickle" push that wakes the service worker (which shows a generic Meridian
 * alert) — so the in-app notification center can reach a field rep when the PWA is
 * closed. No-payload means no ECDH payload encryption: just a VAPID JWT (ES256,
 * signed with node:crypto — NO new dependency, same approach as the OIDC seam).
 * Unset VAPID keys ⇒ no network, $0.
 *
 *   VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY — raw base64url P-256 keypair (the gate).
 *   VAPID_SUBJECT                        — optional mailto:/https: contact.
 */

import crypto from "node:crypto";
import { logApiError } from "@/lib/server/log";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

export function webPushConfigured(): boolean {
  return Boolean(env("VAPID_PUBLIC_KEY") && env("VAPID_PRIVATE_KEY"));
}

// Legitimate browser push services only ever live on these hosts. Treating the
// list as AUTHORITATIVE turns the "stored endpoint → server fetch" path from a
// blind SSRF sink into a closed allow-list: a poisoned endpoint
// (http://169.254.169.254/…, http://localhost:6379/, an internal hostname) can
// never be stored or sent. Mirrors lib/integration/grounding-fetch.ts:isAllowedUrl.
const PUSH_HOSTS_EXACT = new Set(["fcm.googleapis.com"]); // Chrome / Android (FCM)
const PUSH_HOST_SUFFIXES = [
  "push.apple.com", // Safari / WebKit (web.push.apple.com)
  "push.services.mozilla.com", // Firefox (autopush)
  "notify.windows.com", // Edge / Windows (WNS)
];

/** True only for https URLs on a known browser-push service host. Exported for testing. */
export function isAllowedPushEndpoint(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || // literal IPv4
    host.includes(":") // IPv6 literal
  ) {
    return false;
  }
  if (PUSH_HOSTS_EXACT.has(host)) return true;
  return PUSH_HOST_SUFFIXES.some((d) => host === d || host.endsWith("." + d));
}

const b64url = (buf: Buffer | Uint8Array) => Buffer.from(buf).toString("base64url");

/** Build an EC P-256 private KeyObject from raw base64url VAPID keys. */
function vapidPrivateKey(pub: string, priv: string): crypto.KeyObject {
  const p = Buffer.from(pub, "base64url"); // 65 bytes: 0x04 || X(32) || Y(32)
  const x = b64url(p.subarray(1, 33));
  const y = b64url(p.subarray(33, 65));
  return crypto.createPrivateKey({ key: { kty: "EC", crv: "P-256", x, y, d: priv }, format: "jwk" });
}

/** VAPID JWT (ES256) for a push endpoint (RFC 8292). Exported for testing. */
export function vapidJwt(endpoint: string, pub: string, priv: string, subject: string): string {
  const aud = new URL(endpoint).origin;
  const header = b64url(Buffer.from(JSON.stringify({ alg: "ES256", typ: "JWT" })));
  const payload = b64url(Buffer.from(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })));
  const data = `${header}.${payload}`;
  const sig = crypto.sign("sha256", Buffer.from(data), { key: vapidPrivateKey(pub, priv), dsaEncoding: "ieee-p1363" });
  return `${data}.${b64url(sig)}`;
}

export interface PushSubscription {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
}

export type PushResult = { sent: boolean; gone: boolean };

/**
 * Send a no-payload web push to one subscription. Dormant (no network) when the
 * VAPID keys are unset; fail-soft. `gone:true` (404/410) means the subscription
 * was unsubscribed and the caller should prune it.
 */
export async function sendPush(sub: PushSubscription): Promise<PushResult> {
  const pub = env("VAPID_PUBLIC_KEY");
  const priv = env("VAPID_PRIVATE_KEY");
  if (!pub || !priv || !sub.endpoint) return { sent: false, gone: false };
  // Defense-in-depth: never POST to anything that isn't a recognized browser-push
  // host (the subscribe route already refuses these, but a legacy/poisoned record
  // could still be in the store). Not deliverable ⇒ prune it; no fetch.
  if (!isAllowedPushEndpoint(sub.endpoint)) return { sent: false, gone: true };
  try {
    const jwt = vapidJwt(sub.endpoint, pub, priv, env("VAPID_SUBJECT") || "mailto:alerts@meridian.example");
    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: { Authorization: `vapid t=${jwt}, k=${pub}`, TTL: "86400" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404 || res.status === 410) return { sent: false, gone: true };
    if (!res.ok) {
      logApiError("webpush:send", new Error(`Push HTTP ${res.status}`));
      return { sent: false, gone: false };
    }
    return { sent: true, gone: false };
  } catch (e) {
    logApiError("webpush:send", e);
    return { sent: false, gone: false };
  }
}
