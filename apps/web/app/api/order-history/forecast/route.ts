import { NextResponse } from "next/server";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { getStore, forTenant } from "@/lib/server/persistence";
import { getDatedOrders, getDatedOrdersManifest } from "@/lib/catalog/order-history-orders";
import { demandForecast } from "@/lib/product-finder-forecast";

export const dynamic = "force-dynamic";

/**
 * B20 — the "is the import actually alive" endpoint. Reads the dated orders
 * persisted by `/api/order-history/import` for this tenant and runs them through
 * `demandForecast` (the dormant engine the whole blueprint exists to wake up).
 *
 * `demo:true` when no real-dated orders have been imported (nothing persisted, OR
 * every persisted order used a synthesized fallback date) — mirrors the honest
 * `demo` flag the cross-sell rail already reports via `order-history-rules.ts`.
 * Fails closed: any read/compute error returns an empty, demo-labeled forecast
 * rather than a 500.
 *
 * GET → { demo: boolean, forecast: SubcategoryDemand[], dateRange: {start,end}|null }
 */
export async function GET(req: Request) {
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const store = forTenant(getStore(), tenantForRequest(req));
    const [orders, manifest] = await Promise.all([getDatedOrders(store), getDatedOrdersManifest(store)]);

    // No persisted orders, or every persisted order used a synthesized date
    // (no real dates in the import) → stay honestly labeled demo, empty forecast.
    if (orders.length === 0 || !manifest?.allDatesReal) {
      return NextResponse.json({ demo: true, forecast: [], dateRange: null });
    }

    const now = Date.now();
    const forecast = demandForecast(orders, [], now, 6);
    return NextResponse.json({
      demo: false,
      forecast,
      dateRange: { start: manifest.dateRangeStart, end: manifest.dateRangeEnd },
    });
  } catch (e) {
    logApiError("/api/order-history/forecast:GET", e);
    return NextResponse.json({ demo: true, forecast: [], dateRange: null });
  }
}
