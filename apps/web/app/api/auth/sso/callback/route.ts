import { NextResponse } from "next/server";
import { readSsoConfig, mapClaimsToUser } from "@/lib/auth/sso";
import { verifyIdToken } from "@/lib/server/oidc";
import { signSession, sessionSetCookie, sessionsEnabled, tenantFromEmail } from "@/lib/server/session";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { logApiError } from "@/lib/server/log";

export const dynamic = "force-dynamic";

// OIDC authorization-code callback — completes the SSO round-trip started by
// /api/auth/sso/start: verifies the CSRF state, exchanges the code for tokens,
// verifies the id_token signature (JWKS), maps claims → app user + tenant, and
// issues the signed server session. Active only when a real IdP (SSO_*) and
// SESSION_SECRET are configured.
function cookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tenant";

export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const url = new URL(req.url);
  const loginUrl = new URL("/product-finder/login", url.origin);
  try {
    const cfg = readSsoConfig();
    if (!cfg.enabled || !sessionsEnabled() || !cfg.tokenUrl || !cfg.jwksUrl) {
      loginUrl.searchParams.set("error", "sso_unconfigured");
      return NextResponse.redirect(loginUrl);
    }
    // CSRF: the state must match the http-only cookie set by /start.
    const state = url.searchParams.get("state");
    const code = url.searchParams.get("code");
    if (!state || !code || cookie(req, "sso_state") !== state) {
      loginUrl.searchParams.set("error", "sso_state");
      return NextResponse.redirect(loginUrl);
    }

    // Authorization-code → tokens.
    const tokenRes = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        ...(cfg.redirectUri ? { redirect_uri: cfg.redirectUri } : {}),
        client_id: cfg.clientId ?? "",
        ...(cfg.clientSecret ? { client_secret: cfg.clientSecret } : {}),
      }),
    });
    if (!tokenRes.ok) throw new Error(`token endpoint HTTP ${tokenRes.status}`);
    const tokens = (await tokenRes.json()) as { id_token?: string };
    if (!tokens.id_token) throw new Error("no id_token in token response");

    const claims = await verifyIdToken(tokens.id_token, {
      issuer: cfg.issuer,
      audience: cfg.clientId,
      jwksUrl: cfg.jwksUrl,
    });
    const user = mapClaimsToUser(claims);
    if (!user) {
      loginUrl.searchParams.set("error", "sso_no_identity");
      return NextResponse.redirect(loginUrl);
    }

    const tenant = claims.tid
      ? { tenantId: slug(claims.tid), tenantName: claims.tid }
      : tenantFromEmail(user.email);
    const value = signSession(
      { sub: user.email, email: user.email, name: user.name, role: user.role, tenantId: tenant.tenantId, tenantName: tenant.tenantName },
      Date.now(),
    );

    const res = NextResponse.redirect(new URL("/product-finder", url.origin));
    if (value) res.headers.append("Set-Cookie", sessionSetCookie(value));
    res.headers.append("Set-Cookie", "sso_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
    return res;
  } catch (e) {
    logApiError("/api/auth/sso/callback", e);
    loginUrl.searchParams.set("error", "sso_failed");
    return NextResponse.redirect(loginUrl);
  }
}
