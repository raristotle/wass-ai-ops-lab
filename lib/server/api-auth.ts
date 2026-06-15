/**
 * Write/read gate for the durable business endpoints (jobs, orders, vmi, rfq,
 * rfq-responses) — the records that carry customer/order/bid data.
 *
 * Two accepted callers, everything else gets 401:
 *  1. **Same-origin browser requests** — the app's own UI. Browsers send `Origin`
 *     on POST/DELETE (and we accept it on GET too); we allow it when the Origin's
 *     host matches the request Host. This keeps the in-app modals working with no
 *     secret in the client.
 *  2. **Bearer token** (`Authorization: Bearer <WRITE_API_TOKEN>`) — server-to-
 *     server / agent callers (the MCP server). Only available when WRITE_API_TOKEN
 *     is configured.
 *
 * This closes the "any anonymous script can read/forge/delete every record" hole
 * the review flagged, without a per-user model. It is a pilot-grade control, NOT
 * a substitute for real per-tenant SSO (a determined caller can still forge an
 * Origin header) — the dormant SSO seam remains the path to true multi-tenant auth.
 * The public procurement endpoints (CIF / PunchOut) are intentionally NOT gated:
 * they are external B2B integration surfaces and expose no other-tenant data.
 */
export function requireApiAuth(req: Request): Response | null {
  const token = process.env.WRITE_API_TOKEN?.trim();
  if (token && req.headers.get("authorization") === `Bearer ${token}`) return null;

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      // Same-origin when the Origin's host matches the deployment host (req.url is
      // absolute on Vercel/Next; the Host header is used as a fallback).
      const host = new URL(req.url).host || req.headers.get("host");
      if (host && new URL(origin).host === host) return null;
    } catch {
      /* malformed Origin/url — fall through to 401 */
    }
  }

  return new Response(JSON.stringify({ error: "Unauthorized." }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
