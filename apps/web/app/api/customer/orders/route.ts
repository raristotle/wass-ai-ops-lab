import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { getStore, forTenant } from "@/lib/server/persistence";
import { logApiError } from "@/lib/server/log";
import type { PlacedOrder } from "@/lib/product-finder-order-intake";

export const dynamic = "force-dynamic";

/**
 * Customer self-service order history (v4-S4 #13) — READ-ONLY. A logged-in
 * customer sees their own tenant's placed orders (the session auto-scopes via
 * forTenant, the same hard isolation the rep APIs use). No write surface here, so
 * a customer session can only read. $0; reuses the shipped durable orders.
 */
const NS = "orders";

export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  try {
    const store = forTenant(getStore(), tenantForRequest(req));
    const orders = await store.list<PlacedOrder>(NS, { limit: 100 });
    orders.sort((a, b) => (b.placedAt ?? 0) - (a.placedAt ?? 0));
    return NextResponse.json({ backend: store.backend, orders });
  } catch (e) {
    logApiError("/api/customer/orders:GET", e);
    return NextResponse.json({ backend: "unknown", orders: [] }, { status: 200 });
  }
}
