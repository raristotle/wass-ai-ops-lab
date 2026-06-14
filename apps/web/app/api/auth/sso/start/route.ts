import { NextResponse } from "next/server";
import { readSsoConfig, buildAuthorizeUrl } from "@/lib/auth/sso";

export const dynamic = "force-dynamic";

/**
 * Begins the OIDC authorization-code flow: redirects the browser to the
 * configured IdP's authorize endpoint with a CSRF `state`. Only active when a
 * real IdP is configured (SSO_*); otherwise the login screen uses the demo SSO
 * sign-in. The IdP returns to SSO_REDIRECT_URI; completing the token exchange
 * there (with JWKS signature verification) is the onboarding step documented in
 * docs/sso.md — the claims→user mapping it uses (lib/auth/sso mapClaimsToUser)
 * is already built and tested.
 */
export function GET() {
  const cfg = readSsoConfig();
  if (!cfg.enabled) {
    return NextResponse.redirect(new URL("/product-finder/login", process.env.APP_ORIGIN || "http://localhost:3000"));
  }
  const state = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
  const res = NextResponse.redirect(buildAuthorizeUrl(cfg, state));
  // Short-lived, http-only state cookie the callback verifies (CSRF defense).
  res.cookies.set("sso_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
