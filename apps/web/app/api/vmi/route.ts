import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/server/persistence";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { logApiError } from "@/lib/server/log";
import { resolveBySku } from "@/lib/catalog/sku-index";
import {
  vmiPolicyId,
  reorderSuggestion,
  demandBySku,
  type VmiPolicy,
  type ReorderLine,
} from "@/lib/product-finder-vmi";
import type { PlacedOrder } from "@/lib/product-finder-order-intake";
import type { CatalogProduct } from "@/features/product-finder/types";

export const dynamic = "force-dynamic";

// Vendor-managed inventory: durable per-SKU min/max policies + a live
// replenishment view. GET pairs each policy with current on-hand stock (catalog)
// and projected demand (durable order history) and recommends a reorder. The
// reorder math lives in the pure lib; the route resolves stock/demand and stores.
const NS = "vmi";
const ORDERS_NS = "orders";

const PolicySchema = z.object({
  sku: z.string().trim().min(1).max(64),
  name: z.string().trim().max(160).optional(),
  customerId: z.string().trim().max(120).nullable().optional(),
  branchId: z.string().trim().max(64).nullable().optional(),
  min: z.number().int().nonnegative().max(1_000_000),
  max: z.number().int().positive().max(1_000_000),
});

function onHandOf(p: CatalogProduct): number {
  return p.branchStock.reduce((s, b) => s + b.quantity, 0) + p.dcStock.reduce((s, d) => s + d.quantity, 0);
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  try {
    const parsed = PolicySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid VMI policy." }, { status: 400 });
    const d = parsed.data;
    if (d.max < d.min) return NextResponse.json({ error: "max must be ≥ min." }, { status: 400 });
    const product = resolveBySku(d.sku);
    if (!product) return NextResponse.json({ error: `SKU not carried: ${d.sku}` }, { status: 400 });

    const customerId = d.customerId ?? null;
    const branchId = d.branchId ?? null;
    const policy: VmiPolicy = {
      id: vmiPolicyId(product.sku, customerId, branchId),
      sku: product.sku,
      name: d.name?.trim() || product.name,
      customerId,
      branchId,
      min: d.min,
      max: d.max,
      updatedAt: Date.now(),
    };
    const store = getStore();
    await store.put(NS, policy.id, policy);
    return NextResponse.json({ ok: true, id: policy.id, persisted: store.backend });
  } catch (e) {
    logApiError("/api/vmi:POST", e);
    return NextResponse.json({ error: "Could not save the VMI policy." }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  try {
    const store = getStore();
    const policies = await store.list<VmiPolicy>(NS);
    const orders = await store.list<PlacedOrder>(ORDERS_NS);
    const now = Date.now();

    // One pass over orders → per-SKU 30-day demand, so scoring N policies is
    // O(orders + policies), not O(policies × orders).
    const demand = demandBySku(orders, now, 30);
    const lines: ReorderLine[] = policies.map((policy) => {
      const product = resolveBySku(policy.sku);
      const onHand = product ? onHandOf(product) : 0;
      return reorderSuggestion(policy, onHand, demand.get(policy.sku) ?? 0);
    });
    // Worst status first so the action items surface at the top.
    const rank: Record<string, number> = { critical: 0, reorder: 1, ok: 2 };
    lines.sort((a, b) => rank[a.status] - rank[b.status] || b.reorderQty - a.reorderQty);

    return NextResponse.json({
      backend: store.backend,
      count: policies.length,
      needingReorder: lines.filter((l) => l.status !== "ok").length,
      lines,
    });
  } catch (e) {
    logApiError("/api/vmi:GET", e);
    return NextResponse.json({ backend: "unknown", count: 0, needingReorder: 0, lines: [] }, { status: 200 });
  }
}

export async function DELETE(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
    await getStore().delete(NS, id);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    logApiError("/api/vmi:DELETE", e);
    return NextResponse.json({ error: "Could not delete the VMI policy." }, { status: 400 });
  }
}
