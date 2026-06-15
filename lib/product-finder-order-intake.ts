/**
 * Durable order intake — the model behind agentic / transactional checkout.
 *
 * Pure builder + idempotency helper (fully testable); the server (`/api/orders`
 * over the Neon-backed KvStore) resolves SKUs against the catalog and persists
 * the result. Idempotency is by a caller-supplied `clientRef`: the order id is a
 * deterministic function of it, so re-submitting the same checkout returns the
 * same order instead of duplicating it — the safety property an autonomous agent
 * needs when a retry might double-fire.
 */

import { fnv1aHex } from "@/lib/stable-id";

export type OrderSource = "mcp" | "api" | "web";

/** A SKU resolved against the catalog (name + price), ready to price into a line. */
export interface ResolvedLine {
  sku: string;
  name: string;
  unitPrice: number;
  qty: number;
}

export interface OrderLine {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PlacedOrder {
  id: string;
  clientRef: string;
  jobId: string | null;
  customer: string;
  source: OrderSource;
  lines: OrderLine[];
  /** Sum of line quantities. */
  itemCount: number;
  total: number;
  placedAt: number;
  status: "placed";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Deterministic, idempotent order id from the caller's clientRef. A readable
 * slug prefix (capped) plus a hash of the FULL ref, so two distinct clientRefs
 * can never collide even when their first 48 chars coincide — the truncated-slug
 * collision would silently return the wrong order on a money-bearing checkout.
 */
export function orderId(clientRef: string): string {
  const slug =
    clientRef
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "order";
  return `ord-${slug}-${fnv1aHex(clientRef)}`;
}

/** Build a priced order from resolved lines. Pure; caller supplies `now`. */
export function buildOrder(input: {
  clientRef: string;
  resolved: ResolvedLine[];
  customer?: string;
  jobId?: string | null;
  source?: OrderSource;
  now: number;
}): PlacedOrder {
  const lines: OrderLine[] = input.resolved.map((r) => ({
    sku: r.sku,
    name: r.name,
    qty: r.qty,
    unitPrice: r.unitPrice,
    lineTotal: round2(r.unitPrice * r.qty),
  }));
  return {
    id: orderId(input.clientRef),
    clientRef: input.clientRef,
    jobId: input.jobId ?? null,
    customer: input.customer?.trim() || "—",
    source: input.source ?? "api",
    lines,
    itemCount: lines.reduce((s, l) => s + l.qty, 0),
    total: round2(lines.reduce((s, l) => s + l.lineTotal, 0)),
    placedAt: input.now,
    status: "placed",
  };
}
