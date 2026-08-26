import { timingSafeEqual } from "node:crypto";
import type { AppRole } from "@/lib/server/session";

/**
 * Password + role checks for POST /api/auth/login.
 *
 * Fail-closed:
 *  - DEMO_LOGIN_PASSWORD has no committed default. Unset → login is not configured.
 *  - Role is never inferred from the email local-part. The address must appear in
 *    the allowlist (built-in demo accounts, or DEMO_LOGIN_ROLES when set).
 */

const ROLES: ReadonlySet<AppRole> = new Set(["admin", "manager", "sales"]);

/** Explicit full-email allowlist. Unknown addresses are rejected. */
const DEFAULT_LOGIN_ROLES: Readonly<Record<string, AppRole>> = {
  "sales@meridiansupply.com": "sales",
  "manager@meridiansupply.com": "manager",
  "admin@meridiansupply.com": "admin",
};

export type DemoLoginFailure = { ok: false; status: 401 | 503; error: string };
export type DemoLoginSuccess = { ok: true; email: string; role: AppRole };
export type DemoLoginResult = DemoLoginSuccess | DemoLoginFailure;

function isAppRole(value: string): value is AppRole {
  return ROLES.has(value as AppRole);
}

type Env = Record<string, string | undefined>;

/** Shared demo password from env, or null when unset (no fallback). */
export function demoLoginPassword(env: Env = process.env): string | null {
  const value = env.DEMO_LOGIN_PASSWORD?.trim();
  return value ? value : null;
}

/**
 * Constant-time password compare. Length is checked first because
 * timingSafeEqual throws on unequal Buffer lengths.
 */
export function passwordsMatch(given: string, expected: string): boolean {
  const a = Buffer.from(given, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * Parse DEMO_LOGIN_ROLES (`email:role,email:role`). Separators may be `:` or `=`.
 * When the env var is unset/blank, the built-in demo allowlist is used.
 * When it is set, it replaces the built-in map entirely (empty → nobody).
 */
export function loginRoleMap(env: Env = process.env): ReadonlyMap<string, AppRole> {
  const raw = env.DEMO_LOGIN_ROLES;
  if (raw === undefined) return new Map(Object.entries(DEFAULT_LOGIN_ROLES));
  const trimmed = raw.trim();
  if (!trimmed) return new Map();

  const out = new Map<string, AppRole>();
  for (const part of trimmed.split(/[,;\n]+/)) {
    const entry = part.trim();
    if (!entry) continue;
    const splitAt = entry.includes("=") ? entry.indexOf("=") : entry.indexOf(":");
    if (splitAt <= 0) continue;
    const email = entry.slice(0, splitAt).trim().toLowerCase();
    const role = entry.slice(splitAt + 1).trim().toLowerCase();
    if (!email.includes("@") || !isAppRole(role)) continue;
    out.set(email, role);
  }
  return out;
}

/** Allowlisted role for this email, or null if the address is unknown. */
export function roleForLoginEmail(email: string, env: Env = process.env): AppRole | null {
  return loginRoleMap(env).get(email.trim().toLowerCase()) ?? null;
}

/**
 * Decide a password-login attempt. Always runs the password compare (when a
 * password is configured) so unknown emails and bad passwords share one 401.
 */
export function evaluateDemoLogin(
  email: string,
  password: string,
  env: Env = process.env,
): DemoLoginResult {
  const expected = demoLoginPassword(env);
  if (!expected) {
    return { ok: false, status: 503, error: "Login is not configured." };
  }
  const role = roleForLoginEmail(email, env);
  const passwordOk = passwordsMatch(password, expected);
  if (!role || !passwordOk) {
    return { ok: false, status: 401, error: "Invalid credentials." };
  }
  return { ok: true, email: email.trim().toLowerCase(), role };
}
