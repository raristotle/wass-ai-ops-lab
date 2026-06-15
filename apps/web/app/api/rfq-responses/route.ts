import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore, forTenant } from "@/lib/server/persistence";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import {
  responseId,
  responseTotal,
  responseLeadTime,
  rankResponses,
  type SupplierResponse,
} from "@/lib/product-finder-supplier";

export const dynamic = "force-dynamic";

// Supplier collaboration — a supplier's priced bid against an RFQ. Persisted to
// the KvStore (namespace "rfq-responses"); one bid per (rfqRef, supplier), so a
// resubmit updates in place. Totals/lead time + ranking come from the pure lib.
const NS = "rfq-responses";

const BodySchema = z.object({
  rfqRef: z.string().trim().min(1).max(80),
  supplier: z.string().trim().min(1).max(120),
  note: z.string().trim().max(2000).optional(),
  lines: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(200),
        qty: z.number().int().positive().max(1_000_000),
        unitPrice: z.number().nonnegative().max(10_000_000),
        leadTimeDays: z.number().int().nonnegative().max(3650),
        inStock: z.boolean(),
      }),
    )
    .min(1)
    .max(200),
});

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid supplier response." }, { status: 400 });
    const { rfqRef, supplier, lines, note } = parsed.data;
    const response: SupplierResponse = {
      id: responseId(rfqRef, supplier),
      rfqRef,
      supplier,
      lines,
      total: responseTotal(lines),
      leadTimeDays: responseLeadTime(lines),
      note: note || undefined,
      submittedAt: Date.now(),
    };
    const store = forTenant(getStore(), tenantForRequest(req));
    await store.put(NS, response.id, response);
    return NextResponse.json({ ok: true, id: response.id, total: response.total, persisted: store.backend });
  } catch (e) {
    logApiError("/api/rfq-responses:POST", e);
    return NextResponse.json({ error: "Could not submit the response." }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const store = forTenant(getStore(), tenantForRequest(req));
    const all = await store.list<SupplierResponse>(NS, { limit: 1000 });
    const rfqRef = new URL(req.url).searchParams.get("rfqRef");
    const scoped = rfqRef ? all.filter((r) => r.rfqRef === rfqRef) : all;
    return NextResponse.json({ backend: store.backend, count: scoped.length, responses: rankResponses(scoped) });
  } catch (e) {
    logApiError("/api/rfq-responses:GET", e);
    return NextResponse.json({ backend: "unknown", count: 0, responses: [] }, { status: 200 });
  }
}

export async function DELETE(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
    await forTenant(getStore(), tenantForRequest(req)).delete(NS, id);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    logApiError("/api/rfq-responses:DELETE", e);
    return NextResponse.json({ error: "Could not delete the response." }, { status: 400 });
  }
}
