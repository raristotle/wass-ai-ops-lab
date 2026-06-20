import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { getStore, forTenant, persistenceConfigured } from "@/lib/server/persistence";
import { getCrosswalkManifest, clearCrosswalk } from "@/lib/catalog/crosswalk";

export const dynamic = "force-dynamic";

/**
 * Customer crosswalk status + management.
 *   GET    → the import manifest (entry counts), or null when only the demo seed is active.
 *   DELETE → clear the imported crosswalk (resolution falls back to the demo seed).
 * Auth-gated; tenant-scoped.
 */
export async function GET(req: Request) {
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const manifest = await getCrosswalkManifest(forTenant(getStore(), tenantForRequest(req)));
    return NextResponse.json({ durable: persistenceConfigured(), manifest });
  } catch (e) {
    logApiError("/api/catalog/crosswalk:GET", e);
    return NextResponse.json({ durable: persistenceConfigured(), manifest: null });
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
