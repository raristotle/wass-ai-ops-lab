import { NextResponse } from "next/server";
import { sessionClearCookie } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Clear the server session cookie. */
export function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", sessionClearCookie());
  return res;
}
