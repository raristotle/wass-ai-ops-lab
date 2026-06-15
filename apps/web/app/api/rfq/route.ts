import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore, forTenant } from "@/lib/server/persistence";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";

export const dynamic = "force-dynamic";

// Durable server-side log of inbound RFQs the rep drafted — the first concrete
// consumer of the persistence seam. Persists to Neon Postgres when POSTGRES_URL
// is set; per-instance memory otherwise. The client posts best-effort; nothing
// in the draft-quote flow depends on it succeeding.
const NS = "rfq-intake";

const IntakeSchema = z.object({
  customer: z.string().trim().max(120).optional(),
  project: z.string().trim().max(120).optional(),
  lines: z.number().int().nonnegative().max(1000),
  matched: z.number().int().nonnegative().max(1000),
  quoteNumber: z.string().trim().min(1).max(40),
  at: z.number().int().positive(),
});

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const parsed = IntakeSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid RFQ intake." }, { status: 400 });
    const store = forTenant(getStore(), tenantForRequest(req));
    const record = { id: parsed.data.quoteNumber, ...parsed.data };
    await store.put(NS, record.id, record);
    return NextResponse.json({ ok: true, id: record.id, persisted: store.backend });
  } catch (e) {
    logApiError("/api/rfq", e);
    return NextResponse.json({ error: "Could not record the RFQ intake." }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const store = forTenant(getStore(), tenantForRequest(req));
    const all = await store.list<{ at: number; quoteNumber?: string; lines?: number; matched?: number }>(NS, { limit: 200 });
    all.sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
    // This endpoint backs the PUBLIC, unauthenticated supplier portal, so it must
    // NOT disclose the distributor's customer/project identities — a bidding
    // supplier only needs the RFQ number + size. (Full detail belongs behind a
    // rep-authenticated endpoint once auth is wired.)
    const recent = all.slice(0, 20).map((r) => ({
      quoteNumber: r.quoteNumber,
      lines: r.lines,
      matched: r.matched,
      at: r.at,
    }));
    return NextResponse.json({ backend: store.backend, count: all.length, recent });
  } catch (e) {
    logApiError("/api/rfq", e);
    return NextResponse.json({ backend: "unknown", count: 0, recent: [] }, { status: 200 });
  }
}
