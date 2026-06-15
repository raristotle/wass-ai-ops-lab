import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore, mutate, forTenant } from "@/lib/server/persistence";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { resolveBySku } from "@/lib/catalog/sku-index";
import { buildOrder, orderId, type PlacedOrder, type ResolvedLine } from "@/lib/product-finder-order-intake";
import { withArtifact, removeArtifact, type Job } from "@/lib/product-finder-job-workspace";

export const dynamic = "force-dynamic";

// A sanity ceiling so an erroneous/agentic call can't book an absurd order in a
// single request. Generous for real procurement; well below the schema's
// theoretical max (100 lines × 100k qty).
const MAX_ORDER_TOTAL = 5_000_000;

// Durable, idempotent order placement — the transactional surface behind agentic
// checkout (the MCP server's place_order tool posts here). SKUs are resolved +
// priced server-side against the catalog; the order is persisted to Neon when
// configured. Idempotency is by clientRef (deterministic order id), so an agent
// retry never double-places. The order model + pricing live in the pure lib.
const NS = "orders";
const JOBS_NS = "jobs";

const BodySchema = z.object({
  clientRef: z.string().trim().min(1).max(80),
  items: z.array(z.object({ sku: z.string().trim().min(1).max(64), qty: z.number().int().positive().max(100_000) })).min(1).max(100),
  customer: z.string().trim().max(120).optional(),
  jobId: z.string().trim().max(120).optional(),
  source: z.enum(["mcp", "api", "web"]).optional(),
});

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid order." }, { status: 400 });
    const { clientRef, items, customer, jobId, source } = parsed.data;
    const store = forTenant(getStore(), tenantForRequest(req));

    // Idempotency: the same clientRef returns the already-placed order unchanged.
    const id = orderId(clientRef);
    const existing = await store.get<PlacedOrder>(NS, id);
    if (existing) {
      return NextResponse.json({ ok: true, idempotent: true, order: existing, persisted: store.backend });
    }

    // Resolve + price each SKU against the catalog; collect any we don't carry.
    const resolved: ResolvedLine[] = [];
    const unresolved: string[] = [];
    for (const it of items) {
      const p = resolveBySku(it.sku);
      if (p) resolved.push({ sku: p.sku, name: p.name, unitPrice: p.unitPrice, qty: it.qty });
      else unresolved.push(it.sku);
    }
    if (resolved.length === 0) {
      return NextResponse.json({ error: "None of the SKUs are carried.", unresolved }, { status: 400 });
    }

    const order = buildOrder({ clientRef, resolved, customer, jobId: jobId ?? null, source, now: Date.now() });
    if (order.total > MAX_ORDER_TOTAL) {
      return NextResponse.json(
        { error: `Order total $${order.total.toLocaleString()} exceeds the $${MAX_ORDER_TOTAL.toLocaleString()} single-order limit — split it or place it through a rep.` },
        { status: 400 },
      );
    }
    await store.put(NS, id, order);

    // Best-effort: link the order onto its job's rollup (the order is placed
    // regardless). Atomic compare-and-set with retry so two orders linking the
    // same job concurrently can't lose each other's update.
    if (jobId) {
      await mutate<Job>(store, JOBS_NS, jobId, (job) =>
        job
          ? withArtifact(job, {
              kind: "order",
              ref: order.id,
              label: `Order ${order.id} · ${order.customer}`,
              value: order.total,
              status: "placed",
              at: order.placedAt,
            })
          : null,
      );
    }

    return NextResponse.json({ ok: true, idempotent: false, order, unresolved, persisted: store.backend });
  } catch (e) {
    logApiError("/api/orders:POST", e);
    return NextResponse.json({ error: "Could not place the order." }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const idParam = new URL(req.url).searchParams.get("id");
    if (!idParam) return NextResponse.json({ error: "Missing id." }, { status: 400 });
    const key = idParam.startsWith("ord-") ? idParam : orderId(idParam);
    const store = forTenant(getStore(), tenantForRequest(req));
    // Unlink the cancelled order from its job so the rollup doesn't keep counting
    // it — atomic compare-and-set so a concurrent link/unlink can't clobber it.
    const order = await store.get<PlacedOrder>(NS, key);
    if (order?.jobId) {
      await mutate<Job>(store, JOBS_NS, order.jobId, (job) =>
        job ? removeArtifact(job, "order", key, Date.now()) : null,
      );
    }
    await store.delete(NS, key);
    return NextResponse.json({ ok: true, id: key });
  } catch (e) {
    logApiError("/api/orders:DELETE", e);
    return NextResponse.json({ error: "Could not cancel the order." }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const store = forTenant(getStore(), tenantForRequest(req));
    // Accept either the order id ("ord-…") or the raw clientRef it was placed with.
    const idParam = new URL(req.url).searchParams.get("id");
    if (idParam) {
      const key = idParam.startsWith("ord-") ? idParam : orderId(idParam);
      const order = await store.get<PlacedOrder>(NS, key);
      return NextResponse.json({ backend: store.backend, order });
    }
    const orders = await store.list<PlacedOrder>(NS, { limit: 200 });
    orders.sort((a, b) => (b.placedAt ?? 0) - (a.placedAt ?? 0));
    return NextResponse.json({ backend: store.backend, count: orders.length, recent: orders.slice(0, 20) });
  } catch (e) {
    logApiError("/api/orders:GET", e);
    return NextResponse.json({ backend: "unknown", count: 0, recent: [] }, { status: 200 });
  }
}
