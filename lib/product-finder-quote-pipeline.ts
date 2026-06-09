import type { SavedQuote, QuoteStatus } from "@/lib/product-finder-quotes";
import { QUOTE_STATUSES, pipelineValue, winRate } from "@/lib/product-finder-quotes";

/**
 * Aggregations over saved quotes for the pipeline view. Pure & deterministic:
 * `now` is injected so "stale" detection never reads the clock.
 */

const DAY_MS = 86_400_000;

/** A "sent" quote older than this many days is flagged as needing follow-up. */
export const STALE_DAYS = 14;

export interface PipelineStat {
  status: QuoteStatus;
  count: number;
  value: number;
}

export interface QuotePipeline {
  byStatus: PipelineStat[];
  /** draft + sent — quotes still in play. */
  openValue: number;
  wonValue: number;
  lostValue: number;
  /** won / (won + lost), 0..1. */
  winRate: number;
  totalCount: number;
  /** Sent quotes past STALE_DAYS, oldest first — these need a follow-up. */
  stale: SavedQuote[];
  /** Quotes converted into placed orders. */
  convertedCount: number;
  convertedValue: number;
  /** converted / won, 0..1 — how many won quotes became orders. */
  conversionRate: number;
}

/** A sent quote older than STALE_DAYS relative to `now`. */
export function isStale(quote: SavedQuote, now: number): boolean {
  return quote.status === "sent" && now - quote.createdAt > STALE_DAYS * DAY_MS;
}

export function quotePipeline(quotes: SavedQuote[], now: number): QuotePipeline {
  const byStatus: PipelineStat[] = QUOTE_STATUSES.map((status) => ({
    status,
    count: quotes.filter((q) => q.status === status).length,
    value: pipelineValue(quotes, status),
  }));

  const stale = quotes
    .filter((q) => isStale(q, now))
    .sort((a, b) => a.createdAt - b.createdAt);

  const converted = quotes.filter((q) => q.convertedOrderId !== undefined);
  const wonCount = quotes.filter((q) => q.status === "won").length;

  return {
    byStatus,
    openValue: pipelineValue(quotes, "draft") + pipelineValue(quotes, "sent"),
    wonValue: pipelineValue(quotes, "won"),
    lostValue: pipelineValue(quotes, "lost"),
    winRate: winRate(quotes),
    totalCount: quotes.length,
    stale,
    convertedCount: converted.length,
    convertedValue: converted.reduce((sum, q) => sum + q.total, 0),
    conversionRate: wonCount === 0 ? 0 : converted.length / wonCount,
  };
}
