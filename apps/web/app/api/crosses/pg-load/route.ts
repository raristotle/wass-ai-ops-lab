import { NextResponse } from "next/server";
import { loadXrefBatch, xrefSourceLabel } from "@/lib/server/xref-pg";
import { postgresUrl } from "@/lib/server/persistence";
import { logApiError } from "@/lib/server/log";
import { apiError } from "@/lib/server/api-envelope";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH = 100_000; // rows inserted per call (chunked into 1000-row statements)

/**
 * B15 — one-time loader for the Postgres cross tier. DORMANT: needs both CRON_SECRET (sent as a
 * Bearer token) and POSTGRES_URL. Truncates + (re)creates the schema on the first call (offset 0),
 * then inserts the next BATCH rows.
 *
 *   POST /api/crosses/pg-load?offset=0   → { total, inserted, nextOffset, done }
 *   …repeat with offset = the prior nextOffset until `done: true`, then set XREF_SOURCE=postgres.
 *
 * $0 until you run it — the packed literal + in-memory index answer every cross-match by default.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return apiError("unauthorized", "Set CRON_SECRET and send it as `Authorization: Bearer <secret>`.", 401);
  }
  if (!postgresUrl()) {
    return apiError("invalid_request", "POSTGRES_URL is not configured — provision Neon first.", 400);
  }
  const offset = Math.max(0, Math.floor(Number(new URL(req.url).searchParams.get("offset")) || 0));
  try {
    const res = await loadXrefBatch(offset, BATCH);
    return NextResponse.json({ ...res, done: res.nextOffset >= res.total, readsFrom: xrefSourceLabel() });
  } catch (e) {
    logApiError("/api/crosses/pg-load", e);
    return apiError("internal", "Load failed", 500);
  }
}
