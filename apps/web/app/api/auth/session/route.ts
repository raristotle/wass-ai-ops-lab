import { NextResponse } from "next/server";
import { readSession, sessionsEnabled } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Report whether sessions are active and, if so, the caller's current session. */
export function GET(req: Request) {
  const s = readSession(req, Date.now());
  return NextResponse.json({
    sessionsEnabled: sessionsEnabled(),
    session: s
      ? { email: s.email, name: s.name, role: s.role, tenantId: s.tenantId, tenantName: s.tenantName, exp: s.exp }
      : null,
  });
}
