import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { getStore, forTenant, persistenceConfigured } from "@/lib/server/persistence";
import { getOrderHistoryManifest, clearOrderHistory } from "@/lib/catalog/order-history-rules";
import { getDatedOrdersManifest, clearDatedOrders } from "@/lib/catalog/order-history-orders";

export const dynamic = "force-dynamic";

/**
 * Order-history status + management (pilot data onboarding).
 *   GET    → the import manifest (counts + top co-purchase pairs) for the status card,
 *            plus whether persistence is durable (postgres) or per-instance (memory), plus
 *            (B20) the dated-orders manifest so the "what changed" UI can report whether the
 *            forecast/NBA/whitespace engines are live (real dates) or still demo-labeled.
 *   DELETE → clear the imported history (rail + dated engines revert to the deterministic/demo view).
 *
 * Auth-gated (operator/admin view; the app UI is same-origin).
 */
export async function GET(req: Request) {
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const store = forTenant(getStore(), tenantForRequest(req));
    const manifest = await getOrderHistoryManifest(store);
    const datedOrders = await getDatedOrdersManifest(store);
    return NextResponse.json({ durable: persistenceConfigured(), manifest, datedOrders });
  } catch (e) {
    logApiError("/api/order-history:GET", e);
    return NextResponse.json({ durable: persistenceConfigured(), manifest: null, datedOrders: null });
  }
}

export async function DELETE(req: Request) {
  const rl = await rateLimit(req, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const store = forTenant(getStore(), tenantForRequest(req));
    await clearOrderHistory(store);
    await clearDatedOrders(store);
    return NextResponse.json({ ok: true });
  } catch (e) {
    logApiError("/api/order-history:DELETE", e);
    return NextResponse.json({ error: "Clear failed" }, { status: 500 });
  }
}
