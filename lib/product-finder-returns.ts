/**
 * Self-service returns / RMA — a contained post-purchase loop: select order
 * lines, pick a reason, generate an RMA number, and track the refund/credit
 * status. Pure model + helpers (now/seq injected for determinism); the store
 * persists ReturnRequests in localStorage today and upgrades to the server
 * persistence seam when configured.
 */

export const RETURN_REASONS = [
  "Wrong item ordered",
  "Over-ordered for the job",
  "Defective / DOA",
  "Damaged in transit",
  "No longer needed",
] as const;
export type ReturnReason = (typeof RETURN_REASONS)[number];

export const RETURN_STATUSES = ["requested", "approved", "in-transit", "received", "refunded", "rejected"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  requested: "Requested",
  approved: "Approved — ship it back",
  "in-transit": "In transit to DC",
  received: "Received",
  refunded: "Credit issued",
  rejected: "Rejected",
};

export interface ReturnLine {
  productId: string;
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
}

export interface ReturnRequest {
  id: string;
  rma: string;
  orderId: string;
  customerId: string | null;
  lines: ReturnLine[];
  reason: ReturnReason;
  status: ReturnStatus;
  createdAt: number;
  refundAmount: number;
  note?: string;
}

function pad(n: number, w: number): string {
  return String(n).padStart(w, "0");
}

/** "RMA-YYYYMMDD-XXXX" — seq derived from time when not supplied (demo-stable). */
export function rmaNumber(date: Date, seq?: number): string {
  const ymd = `${date.getFullYear()}${pad(date.getMonth() + 1, 2)}${pad(date.getDate(), 2)}`;
  const n = seq ?? (date.getSeconds() * 1000 + date.getMilliseconds()) % 10000;
  return `RMA-${ymd}-${pad(n, 4)}`;
}

export function returnRefund(lines: ReturnLine[]): number {
  return Math.round(lines.reduce((s, l) => s + l.unitPrice * l.qty, 0) * 100) / 100;
}

export function createReturn(input: {
  orderId: string;
  customerId: string | null;
  lines: ReturnLine[];
  reason: ReturnReason;
  now: number;
  seq?: number;
  note?: string;
}): ReturnRequest {
  const date = new Date(input.now);
  return {
    id: `rma-${input.now}`,
    rma: rmaNumber(date, input.seq),
    orderId: input.orderId,
    customerId: input.customerId,
    lines: input.lines,
    reason: input.reason,
    status: "requested",
    createdAt: input.now,
    refundAmount: returnRefund(input.lines),
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
  };
}

/** Next status in the happy-path lifecycle (for demo advance); null when terminal. */
export function nextReturnStatus(status: ReturnStatus): ReturnStatus | null {
  const flow: ReturnStatus[] = ["requested", "approved", "in-transit", "received", "refunded"];
  const i = flow.indexOf(status);
  if (i === -1 || i === flow.length - 1) return null;
  return flow[i + 1];
}
