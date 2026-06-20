import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { getStore, forTenant, persistenceConfigured } from "@/lib/server/persistence";
import { getOrderHistoryManifest, clearOrderHistory } from "@/lib/catalog/order-history-rules";

export const dynamic = "force-dynamic";

/**
 * Order-history status + management (pilot data onboarding).
 *   GET    → the import manifest (counts + top co-purchase pairs) for the status card,
 *            plus whether persistence is durable (postgres) or per-instance (memory).
 *   DELETE → clear the imported history (rail reverts to the deterministic-only view).
 *
 * Auth-gated (operator/admin view; the app UI is same-origin).
 */
export async function GET(req: Request) {
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const manifest = await getOrderHistoryManifest(forTenant(getStore(), tenantForRequest(req)));
    return NextResponse.json({ durable: persistenceConfigured(), manifest });
  } catch (e) {
    logApiError("/api/order-history:GET", e);
    return NextResponse.json({ durable: persistenceConfigured(), manifest: null });
  }
}

export async function DELETE(req: Request) {
  const rl = await rateLimit(req, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    await clearOrderHistory(forTenant(getStore(), tenantForRequest(req)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    logApiError("/api/order-history:DELETE", e);
    return NextResponse.json({ error: "Clear failed" }, { status: 500 });
  }
}
