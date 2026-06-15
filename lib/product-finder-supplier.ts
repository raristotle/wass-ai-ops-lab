/**
 * Supplier collaboration — the sell-side counterpart to the inbound RFQ.
 *
 * A supplier responds to an RFQ (referenced by its quote number) with a priced,
 * lead-timed bid; the rep can then compare responses. Pure model + ranking
 * helpers (fully testable); the server (`/api/rfq-responses` over the Neon-backed
 * KvStore) persists them and the supplier portal page renders the form + ranking.
 *
 * One response per (rfqRef, supplier): re-submitting updates in place — a supplier
 * sharpening their pencil, not a duplicate bid.
 */

export interface ResponseLine {
  description: string;
  qty: number;
  unitPrice: number;
  leadTimeDays: number;
  inStock: boolean;
}

export interface SupplierResponse {
  id: string;
  /** The RFQ this bids against — the rep's RFQ quote number. */
  rfqRef: string;
  supplier: string;
  lines: ResponseLine[];
  /** Extended total across lines. */
  total: number;
  /** Worst (longest) line lead time — the bid's effective lead time. */
  leadTimeDays: number;
  note?: string;
  submittedAt: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "x";

/** Deterministic id — one bid per supplier per RFQ (resubmit overwrites). */
export function responseId(rfqRef: string, supplier: string): string {
  return `resp-${slug(rfqRef)}-${slug(supplier)}`;
}

export function responseTotal(lines: ResponseLine[]): number {
  return round2(lines.reduce((s, l) => s + l.unitPrice * l.qty, 0));
}

/** Effective lead time = the longest line lead time (0 for an empty bid). */
export function responseLeadTime(lines: ResponseLine[]): number {
  return lines.reduce((m, l) => Math.max(m, l.leadTimeDays), 0);
}

/**
 * Rank bids best-first: lowest total wins, lead time breaks ties, then supplier
 * name for determinism. Returns each response with a 1-based `rank`.
 */
export function rankResponses(responses: SupplierResponse[]): (SupplierResponse & { rank: number })[] {
  return [...responses]
    .sort((a, b) => a.total - b.total || a.leadTimeDays - b.leadTimeDays || a.supplier.localeCompare(b.supplier))
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
