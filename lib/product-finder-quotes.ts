import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Saved-quote model + status workflow. Pure data/helpers; the store owns
 * persistence and the cart drawer renders them.
 */

export const QUOTE_STATUSES = ["draft", "sent", "won", "lost"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

/** Quotes whose blended margin falls below this floor need manager sign-off. */
export const MARGIN_FLOOR = 0.2;

export type ApprovalStatus = "pending" | "approved" | "rejected";

/** A margin fraction below the floor requires approval. */
export function needsApproval(marginPct: number): boolean {
  return marginPct < MARGIN_FLOOR;
}

export const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  pending: "Approval pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const APPROVAL_COLOR: Record<ApprovalStatus, { bg: string; text: string }> = {
  pending: { bg: "#EAAA00", text: "#1D252D" },
  approved: { bg: "#00AA13", text: "#FFFFFF" },
  rejected: { bg: "#DB6B30", text: "#FFFFFF" },
};

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  won: "Won",
  lost: "Lost",
};

/** Badge colors per status (Meridian palette). */
export const QUOTE_STATUS_COLOR: Record<QuoteStatus, { bg: string; text: string }> = {
  draft: { bg: "#B7C9D3", text: "#1D252D" },
  sent: { bg: "#004986", text: "#FFFFFF" },
  won: { bg: "#00AA13", text: "#FFFFFF" },
  lost: { bg: "#DB6B30", text: "#FFFFFF" },
};

export interface SavedQuote {
  id: string;
  /** Human quote number, e.g. Q-20260608-0042. */
  number: string;
  customer: string;
  project: string;
  /** unitPrice = price the line was quoted at (incl. manual overrides); absent on pre-override quotes. */
  lines: { product: CatalogProduct; qty: number; unitPrice?: number }[];
  total: number;
  status: QuoteStatus;
  createdAt: number;
  /** The customer account this quote was built for (null = walk-in). */
  customerId: string | null;
  /** Blended gross margin captured at save time (0..1). */
  marginPct?: number;
  /** Present only when the quote's margin is below the floor. */
  approvalStatus?: ApprovalStatus;
  /** Set when the quote has been converted into a placed order. */
  convertedOrderId?: string;
  convertedAt?: number;
}

export function isQuoteStatus(value: unknown): value is QuoteStatus {
  return typeof value === "string" && (QUOTE_STATUSES as readonly string[]).includes(value);
}

/** Total pipeline value of quotes in a given status. */
export function pipelineValue(quotes: SavedQuote[], status: QuoteStatus): number {
  return quotes.filter((q) => q.status === status).reduce((sum, q) => sum + q.total, 0);
}

/** Win rate = won / (won + lost), 0 when no decided quotes. */
export function winRate(quotes: SavedQuote[]): number {
  const won = quotes.filter((q) => q.status === "won").length;
  const lost = quotes.filter((q) => q.status === "lost").length;
  const decided = won + lost;
  return decided === 0 ? 0 : won / decided;
}
