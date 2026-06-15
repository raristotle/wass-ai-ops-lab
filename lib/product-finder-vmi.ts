/**
 * Vendor-managed inventory (VMI) — per-SKU min/max stocking policy and the
 * auto-replenishment math behind it.
 *
 * Pure model + reorder calculation (fully testable); the server (`/api/vmi` over
 * the Neon-backed KvStore) persists policies and computes the live replenishment
 * view by pairing each policy with current on-hand stock (catalog) and projected
 * demand drawn from the durable order history. When projected-available dips to
 * or below `min`, it recommends a replenishment quantity that restocks to `max`.
 */

export type ReorderStatus = "ok" | "reorder" | "critical";

export interface VmiPolicy {
  id: string;
  sku: string;
  name: string;
  /** Scoping (informational): the account / branch this policy is managed for. */
  customerId: string | null;
  branchId: string | null;
  min: number;
  max: number;
  updatedAt: number;
}

export interface ReorderLine {
  policyId: string;
  sku: string;
  name: string;
  onHand: number;
  /** Expected demand over the planning window (from order history). */
  projectedDemand: number;
  /** onHand − projectedDemand: what's left after expected pulls. */
  available: number;
  min: number;
  max: number;
  /** Units to order to restock to max (0 when status is ok). */
  reorderQty: number;
  status: ReorderStatus;
}

const DAY_MS = 86_400_000;

/** Deterministic policy id keyed by SKU + scope (so an upsert replaces in place). */
export function vmiPolicyId(sku: string, customerId: string | null, branchId: string | null): string {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "x";
  return `vmi-${norm(sku)}-${customerId ?? "any"}-${branchId ?? "any"}`;
}

/**
 * Recommend a replenishment for one policy given current on-hand and the demand
 * expected over the planning window. `available` is what remains after that
 * demand; at/below `min` triggers a reorder back up to `max`. "critical" when
 * already under min or projected to stock out (available ≤ 0).
 */
export function reorderSuggestion(policy: VmiPolicy, onHand: number, projectedDemand: number): ReorderLine {
  const available = onHand - projectedDemand;
  let status: ReorderStatus = "ok";
  if (available <= 0 || onHand < policy.min) status = "critical";
  else if (available <= policy.min) status = "reorder";
  const reorderQty = status === "ok" ? 0 : Math.max(0, policy.max - available);
  return {
    policyId: policy.id,
    sku: policy.sku,
    name: policy.name,
    onHand,
    projectedDemand,
    available,
    min: policy.min,
    max: policy.max,
    reorderQty,
    status,
  };
}

/** Sum the demand for one SKU across durable orders in the trailing window. */
export function demandFromOrders(
  orders: { placedAt: number; lines: { sku: string; qty: number }[] }[],
  sku: string,
  now: number,
  windowDays = 30,
): number {
  const cutoff = now - windowDays * DAY_MS;
  let total = 0;
  for (const o of orders) {
    if (o.placedAt < cutoff || o.placedAt > now) continue;
    for (const l of o.lines) if (l.sku === sku) total += l.qty;
  }
  return total;
}
