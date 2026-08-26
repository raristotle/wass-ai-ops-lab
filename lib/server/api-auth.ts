import { assertProductionSessionSecret, readSession, sessionsEnabled, type Session } from "@/lib/server/session";

/**
 * Auth + tenancy gate for the durable business endpoints (jobs, orders, vmi, rfq,
 * rfq-responses).
 *
 * Two modes, by whether SESSION_SECRET is configured:
 *
 *  • **Sessions ON** (per-tenant SSO active): a request must carry a valid signed
 *    **session cookie** (the browser UI, after login) OR `Authorization: Bearer
 *    <WRITE_API_TOKEN>` (server-to-server / agent → a "service" tenant). The
 *    session's `tenantId` scopes all data; everything else gets 401.
 *
 *  • **Sessions OFF** (pilot): the prior same-origin-or-token gate, single shared
 *    data space (tenantId null). Closes anonymous abuse without per-tenant split.
 *
 * Use `requireApiAuth` for the allow/deny decision and `tenantForRequest` for the
 * tenant to scope the store to (see `forTenant`). Procurement (CIF/PunchOut) is
 * intentionally NOT gated — external B2B surfaces with no tenant data.
 */

type Outcome = { allowed: true; tenantId: string | null; session: Session | null } | { allowed: false };

// Production must not boot without SESSION_SECRET (throws). The same-origin
// allowance below is still dropped when VERCEL_ENV is production, so a missed
// import path cannot collapse every caller into one shared namespace.
assertProductionSessionSecret();

function tokenOk(req: Request): boolean {
  const token = process.env.WRITE_API_TOKEN?.trim();
  return Boolean(token) && req.headers.get("authorization") === `Bearer ${token}`;
}

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const host = new URL(req.url).host || req.headers.get("host");
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}

function evaluate(req: Request): Outcome {
  if (sessionsEnabled()) {
    const session = readSession(req, Date.now());
    if (session) return { allowed: true, tenantId: session.tenantId, session };
    if (tokenOk(req)) return { allowed: true, tenantId: "service", session: null };
    return { allowed: false };
  }
  // Pilot mode: same-origin OR token, single shared space. The server token always works.
  if (tokenOk(req)) return { allowed: true, tenantId: null, session: null };
  // The same-origin allowance is DROPPED in production: Origin is forgeable and sessions-off
  // means no tenancy, so prod must run sessions ON (or use the token). Dev/preview keep the
  // convenient same-origin path so local/preview UIs aren't broken.
  if (sameOrigin(req) && process.env.VERCEL_ENV !== "production") {
    return { allowed: true, tenantId: null, session: null };
  }
  return { allowed: false };
}

/** 401 Response when the caller isn't authorized, else null. */
export function requireApiAuth(req: Request): Response | null {
  if (evaluate(req).allowed) return null;
  return new Response(JSON.stringify({ error: "Unauthorized." }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

/** The tenant id to scope this request's store to (null = single shared space). */
export function tenantForRequest(req: Request): string | null {
  const out = evaluate(req);
  return out.allowed ? out.tenantId : null;
}
