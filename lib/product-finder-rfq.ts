/**
 * Inbound RFQ auto-quote — turn a customer's messy emailed takeoff / pasted BOM
 * into a confidence-scored DRAFT quote the rep just reviews and sends. This is
 * pure orchestration over machinery that already exists and is tested:
 * parseBomLines → matchBomScored (fuzzy + typo rescue) → findCrossSuggestion →
 * addToCart → saveQuote. The deterministic path needs no AI key; an LLM
 * extraction step is the env-gated upgrade (ANTHROPIC_API_KEY), dormant by default.
 *
 * This module is the pure summary/selection logic; the modal wires it to the
 * live search + store.
 */

import type { CatalogProduct } from "@/features/product-finder/types";
import type { ScoredBomLine } from "@/lib/product-finder-bom";

export interface RfqSummary {
  totalLines: number;
  /** Lines that resolved to a catalog product. */
  matched: number;
  /** Matched lines at high confidence (≥0.8). */
  highConfidence: number;
  /** Lines a rep should eyeball before sending (matched-but-not-high, or unmatched). */
  needsReview: number;
  /** Lines with no catalog match. */
  unmatched: number;
  /** Lines whose competitor part documents a stocked cross (separate signal). */
  crossable: number;
  /** Lines that will populate the draft quote (every matched line). */
  draftLineCount: number;
}

export function summarizeRfq(lines: ScoredBomLine[], crossableCount = 0): RfqSummary {
  const matched = lines.filter((l) => l.match !== null);
  const highConfidence = matched.filter((l) => l.tier === "high").length;
  const unmatched = lines.length - matched.length;
  const needsReview = unmatched + matched.filter((l) => l.tier !== "high").length;
  return {
    totalLines: lines.length,
    matched: matched.length,
    highConfidence,
    needsReview,
    unmatched,
    crossable: crossableCount,
    draftLineCount: matched.length,
  };
}

/** The cart lines for the draft quote: every line that resolved to a product. */
export function rfqDraftLines(lines: ScoredBomLine[]): { product: CatalogProduct; qty: number }[] {
  return lines
    .filter((l): l is ScoredBomLine & { match: CatalogProduct } => l.match !== null)
    .map((l) => ({ product: l.match, qty: l.qty }));
}

/** One-line, demo-safe headline for the result banner. */
export function rfqHeadline(summary: RfqSummary): string {
  if (summary.totalLines === 0) return "Paste or upload a bill of materials to start.";
  const parts = [`${summary.matched} of ${summary.totalLines} lines matched`];
  if (summary.needsReview > 0) parts.push(`${summary.needsReview} to review`);
  if (summary.crossable > 0) parts.push(`${summary.crossable} competitor part${summary.crossable === 1 ? "" : "s"} crossable`);
  return parts.join(" · ");
}
