import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { getStore, forTenant, persistenceConfigured } from "@/lib/server/persistence";
import { getCrosswalkManifest, getCrosswalkRejects, clearCrosswalk } from "@/lib/catalog/crosswalk";

export const dynamic = "force-dynamic";

/**
 * Customer crosswalk status + management.
 *   GET    → the import manifest (entry counts) + the last import's unresolved-row
 *            triage report, or nulls when only the demo seed is active.
 *   DELETE → clear the imported crosswalk (resolution falls back to the demo seed).
 * Auth-gated; tenant-scoped.
 */
export async function GET(req: Request) {
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const store = forTenant(getStore(), tenantForRequest(req));
    const manifest = await getCrosswalkManifest(store);
    // PF-5: served alongside the manifest so re-opening the modal later still offers the
    // triage export — the unresolved rows outlive the import response that produced them.
    const rejects = await getCrosswalkRejects(store);
    return NextResponse.json({ durable: persistenceConfigured(), manifest, rejects });
  } catch (e) {
    logApiError("/api/catalog/crosswalk:GET", e);
    return NextResponse.json({ durable: persistenceConfigured(), manifest: null, rejects: null });
  }
}

export async function DELETE(req: Request) {
  const rl = await rateLimit(req, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    await clearCrosswalk(forTenant(getStore(), tenantForRequest(req)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    logApiError("/api/catalog/crosswalk:DELETE", e);
    return NextResponse.json({ error: "Clear failed" }, { status: 500 });
  }
}
