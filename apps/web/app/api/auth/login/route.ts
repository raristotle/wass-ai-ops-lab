import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { logApiError } from "@/lib/server/log";
import {
  signSession,
  sessionSetCookie,
  sessionsEnabled,
  tenantFromEmail,
  roleFromEmail,
} from "@/lib/server/session";

export const dynamic = "force-dynamic";

// Demo / password login: validates the shared demo password and issues a signed
// server session scoped to the email's tenant (one tenant per email domain). The
// real-IdP path is /api/auth/sso/callback. Returns { sessions: false } when
// SESSION_SECRET is unset, so the browser falls back to client-only auth.
const DEMO_PASSWORD = process.env.DEMO_LOGIN_PASSWORD?.trim() || "meridian2024";

const Body = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().max(200),
  name: z.string().trim().max(120).optional(),
});

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  try {
    if (!sessionsEnabled()) return NextResponse.json({ sessions: false });
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid login." }, { status: 400 });
    const { email, password, name } = parsed.data;
    if (password !== DEMO_PASSWORD) return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });

    const role = roleFromEmail(email);
    const { tenantId, tenantName } = tenantFromEmail(email);
    const value = signSession(
      { sub: email, email, name: name || email.split("@")[0], role, tenantId, tenantName },
      Date.now(),
    );
    const res = NextResponse.json({ ok: true, tenantId, tenantName, role });
    if (value) res.headers.set("Set-Cookie", sessionSetCookie(value));
    return res;
  } catch (e) {
    logApiError("/api/auth/login", e);
    return NextResponse.json({ error: "Login failed." }, { status: 400 });
  }
}
