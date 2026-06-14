import { NextResponse, type NextRequest } from "next/server";

/**
 * Baseline security headers on every response. These are the high-confidence,
 * app-safe ones (clickjacking, MIME sniffing, referrer leakage, feature policy,
 * HSTS). A full Content-Security-Policy needs per-route nonce tuning against
 * Next's inline runtime and is tracked as the next hardening step in
 * docs/security.md — a broken CSP is worse than a documented gap.
 */
export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=(self)");
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  return res;
}

export const config = {
  // Apply to all routes except Next's static assets and the favicon.
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
