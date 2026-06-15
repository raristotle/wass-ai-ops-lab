import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Server-side sessions (env-gated on SESSION_SECRET) — the foundation for real
 * per-tenant auth. A signed, HTTP-only cookie carries the authenticated principal
 * and their tenant; the durable endpoints verify it and scope all data to the
 * tenant. Stateless (HMAC-signed, no server store), so it works on serverless.
 *
 * Activated by setting SESSION_SECRET. When unset, sessions are dormant and the
 * endpoints fall back to the pilot same-origin/token gate (no tenancy) — so this
 * upgrade is opt-in and changes nothing until the secret is configured.
 */

export type AppRole = "admin" | "manager" | "sales";

export interface Session {
  /** Stable subject (the user's email / IdP sub). */
  sub: string;
  email: string;
  name: string;
  role: AppRole;
  tenantId: string;
  tenantName: string;
  /** issued-at / expiry, epoch seconds. */
  iat: number;
  exp: number;
}

export const SESSION_COOKIE = "meridian_session";
const TTL_SEC = 12 * 60 * 60; // 12h

function secret(): string | null {
  const s = process.env.SESSION_SECRET?.trim();
  return s ? s : null;
}

/** True when SESSION_SECRET is set — server sessions + per-tenant auth are active. */
export function sessionsEnabled(): boolean {
  return secret() !== null;
}

function hmac(data: string, key: string): string {
  return createHmac("sha256", key).update(data).digest("base64url");
}

/** Sign a session into a cookie value, or null if SESSION_SECRET is unset. */
export function signSession(input: Omit<Session, "iat" | "exp">, nowMs: number): string | null {
  const key = secret();
  if (!key) return null;
  const iat = Math.floor(nowMs / 1000);
  const full: Session = { ...input, iat, exp: iat + TTL_SEC };
  const payload = Buffer.from(JSON.stringify(full)).toString("base64url");
  return `${payload}.${hmac(payload, key)}`;
}

/** Verify + decode a cookie value into a Session, or null if invalid/expired. */
export function verifySession(value: string | undefined | null, nowMs: number): Session | null {
  const key = secret();
  if (!key || !value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = value.slice(0, dot);
  const sig = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(hmac(payload, key));
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (!s.exp || s.exp < Math.floor(nowMs / 1000)) return null;
    return s;
  } catch {
    return null;
  }
}

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/** Read + verify the session cookie from a request, or null. */
export function readSession(req: Request, nowMs: number): Session | null {
  return verifySession(parseCookies(req.headers.get("cookie"))[SESSION_COOKIE], nowMs);
}

/** Set-Cookie header for a freshly signed session value. */
export function sessionSetCookie(value: string): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${TTL_SEC}`;
}

/** Set-Cookie header that clears the session. */
export function sessionClearCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

/** Derive a tenant from an email domain (one tenant per organization). */
export function tenantFromEmail(email: string): { tenantId: string; tenantName: string } {
  const domain = (email.split("@")[1] ?? "demo").toLowerCase();
  const tenantId = domain.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "demo";
  return { tenantId, tenantName: domain };
}

/** Heuristic app role from a demo email local-part (sales@…, manager@…, admin@…). */
export function roleFromEmail(email: string): AppRole {
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (local.includes("admin")) return "admin";
  if (local.includes("manager")) return "manager";
  return "sales";
}
