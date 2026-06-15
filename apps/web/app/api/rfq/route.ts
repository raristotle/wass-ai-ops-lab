import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/server/persistence";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
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
  try {
    const parsed = IntakeSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid RFQ intake." }, { status: 400 });
    const store = getStore();
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
  try {
    const store = getStore();
    const all = await store.list<{ at: number }>(NS);
    all.sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
    return NextResponse.json({ backend: store.backend, count: all.length, recent: all.slice(0, 20) });
  } catch (e) {
    logApiError("/api/rfq", e);
    return NextResponse.json({ backend: "unknown", count: 0, recent: [] }, { status: 200 });
  }
}
