import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { getStore, forTenant } from "@/lib/server/persistence";
import { runIngestion } from "@/lib/ingest/runner";
import { getAdapters } from "@/lib/ingest/registry";

export const dynamic = "force-dynamic";
// A run can fetch several live sources sequentially — give it room (still operator-only).
export const maxDuration = 60;

/**
 * Operator-triggered ingestion run (Sprint D1).
 *
 * Runs the selected Source Adapters (or all registered) end-to-end —
 * fetch → parse → gate(provenance ≥95) → snapshot → diff — and persists the new
 * snapshot + a run report per adapter, scoped to the caller's tenant. The default
 * deploy registers only the network-free self-test adapter, so a no-arg run is $0 and
 * never touches the network; live external sources run only when an operator declares
 * them in `INGEST_SOURCES`. NOT a cron — a run happens only on this explicit call.
 *
 * Auth-gated (operator action) + rate-limited.
 *
 * POST { adapterIds?: string[] }  →  { ok, persisted, reports }
 */
const BodySchema = z.object({
  adapterIds: z.array(z.string().min(1).max(120)).max(50).optional(),
});

export async function POST(req: Request) {
  // Tighter limit than read endpoints — a run can fan out to the network.
  const rl = await rateLimit(req, { limit: 6, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  let body: z.infer<typeof BodySchema> = {};
  try {
    const json = await req.json().catch(() => ({}));
    body = BodySchema.parse(json ?? {});
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Reject ids that aren't registered so a typo fails loudly instead of silently
  // running nothing.
  const known = new Set(getAdapters().map((a) => a.id));
  const unknown = (body.adapterIds ?? []).filter((id) => !known.has(id));
  if (unknown.length) {
    return NextResponse.json({ error: `Unknown adapter id(s): ${unknown.join(", ")}` }, { status: 400 });
  }

  try {
    const store = forTenant(getStore(), tenantForRequest(req));
    const reports = await runIngestion(store, { adapterIds: body.adapterIds });
    const added = reports.reduce((n, r) => n + r.diff.added, 0);
    const changed = reports.reduce((n, r) => n + r.diff.changed, 0);
    return NextResponse.json({
      ok: true,
      persisted: store.backend, // "postgres" (durable) or "memory" (per-instance demo)
      reports,
      headline: `Ran ${reports.length} source${reports.length === 1 ? "" : "s"} → ${added} new + ${changed} changed record(s) gated in.`,
    });
  } catch (e) {
    logApiError("/api/ingest/run:POST", e);
    return NextResponse.json({ error: "Ingestion run failed" }, { status: 500 });
  }
}
