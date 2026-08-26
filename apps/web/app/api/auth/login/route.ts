import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { logApiError } from "@/lib/server/log";
import { evaluateDemoLogin } from "@/lib/server/demo-login";
import {
  signSession,
  sessionSetCookie,
  sessionsEnabled,
  tenantFromEmail,
  assertProductionSessionSecret,
} from "@/lib/server/session";

export const dynamic = "force-dynamic";

// Password login: shared demo password from DEMO_LOGIN_PASSWORD (no default) and
// an explicit email allowlist for roles. Issues a signed server session scoped
// to the email's tenant. The real-IdP path is /api/auth/sso/callback.
// Returns { sessions: false } when SESSION_SECRET is unset (local/pilot only).

const Body = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().max(200),
  name: z.string().trim().max(120).optional(),
});

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  try {
    assertProductionSessionSecret();
    if (!sessionsEnabled()) return NextResponse.json({ sessions: false });
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid login." }, { status: 400 });
    const { email, password, name } = parsed.data;

    const decision = evaluateDemoLogin(email, password);
    if (!decision.ok) {
      return NextResponse.json({ error: decision.error }, { status: decision.status });
    }

    const { tenantId, tenantName } = tenantFromEmail(decision.email);
    const value = signSession(
      {
        sub: decision.email,
        email: decision.email,
        name: name || decision.email.split("@")[0] || decision.email,
        role: decision.role,
        tenantId,
        tenantName,
      },
      Date.now(),
    );
    const res = NextResponse.json({ ok: true, tenantId, tenantName, role: decision.role });
    if (value) res.headers.set("Set-Cookie", sessionSetCookie(value));
    return res;
  } catch (e) {
    logApiError("/api/auth/login", e);
    return NextResponse.json({ error: "Login failed." }, { status: 400 });
  }
}
