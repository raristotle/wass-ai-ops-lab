/**
 * BOM / List import — pure parsing + async matching helpers.
 *
 * parseBomLines  — pure, synchronous, no side-effects; fully unit-tested.
 * matchBom       — async, takes an injected searchFn so it stays unit-testable
 *                  without a real network.
 */

import type { CatalogProduct } from "@/features/product-finder/types";
import {
  matchConfidence,
  confidenceTier,
  type ConfidenceTier,
} from "@/lib/product-finder-match-confidence";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Hard cap on parsed lines to avoid abuse / runaway matching. */
export const BOM_LINE_CAP = 200;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ParsedBomLine = {
  /** The original, untrimmed line text. */
  raw: string;
  /** Parsed positive-integer quantity (defaults to 1 when none found). */
  qty: number;
  /** The search query — remainder after stripping the qty prefix; trimmed. */
  query: string;
};

export type MatchedBomLine = ParsedBomLine & {
  match: CatalogProduct | null;
};

export type ScoredBomLine = ParsedBomLine & {
  match: CatalogProduct | null;
  /** 0..1 token coverage of the (possibly corrected) query by the match. 0 when unmatched. */
  confidence: number;
  tier: ConfidenceTier | null;
  /** Runner-up candidates the user can swap in (top-3 search minus the match). */
  alternates: CatalogProduct[];
  /** Set when the raw query found nothing and a typo correction rescued it. */
  correctedQuery?: string;
};

// ─── parseBomLines ────────────────────────────────────────────────────────────

/**
 * Parse a multi-line BOM / paste-list into structured lines.
 *
 * Supported quantity prefix formats (leading positive integer only):
 *   12x Item    12X Item    12 x Item
 *   12 Item
 *   12, Item
 *   12 - Item
 *   Item           ← no qty prefix → qty defaults to 1
 *
 * Rules:
 * - One entry per non-blank line.
 * - The leading token must be a pure positive integer (≥ 1).
 *   Decimals (e.g. "1.5"), zero ("0"), and alphanumeric tokens (e.g. "ABC123")
 *   are NOT treated as qty — the whole line becomes the query with qty 1.
 * - `query` is the remainder after stripping the qty prefix, trimmed.
 * - `raw` is the original line (untrimmed).
 * - Blank / whitespace-only lines are skipped.
 * - Output is capped at BOM_LINE_CAP (200) lines.
 */
export function parseBomLines(text: string): ParsedBomLine[] {
  const lines = text.split("\n");
  const results: ParsedBomLine[] = [];

  for (const raw of lines) {
    if (results.length >= BOM_LINE_CAP) break;

    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Try each qty separator pattern in priority order.
    // The leading integer must be at position 0 of the trimmed string.
    // Patterns (in order of specificity):
    //   ^\d+\s*[xX]\s*  →  "12x Item", "12 x Item", "12X Item", "12x10 cable"
    //   ^\d+\s*,\s+      →  "12, Item"
    //   ^\d+\s+-\s+      →  "12 - Item"
    //   ^\d+\s+          →  "12 Item" (plain space, must have remainder)
    //
    // NOTE: For the 'x' separator we allow the remainder to start immediately
    // (no required whitespace after x) so "12x10 cable tray" → qty 12,
    // query "10 cable tray". We do require at least one non-empty remainder.

    const QTY_RE =
      /^(\d+)\s*[xX]\s*(\S.*)$|^(\d+)\s*,\s*(.+)$|^(\d+)\s+-\s+(.+)$|^(\d+)\s+(.+)$/;

    const m = trimmed.match(QTY_RE);
    if (m) {
      // Groups come in pairs: (qty, remainder) for each alternation
      let qtyStr: string;
      let remainder: string;
      if (m[1] !== undefined) { qtyStr = m[1]; remainder = m[2]; }
      else if (m[3] !== undefined) { qtyStr = m[3]; remainder = m[4]; }
      else if (m[5] !== undefined) { qtyStr = m[5]; remainder = m[6]; }
      else { qtyStr = m[7]; remainder = m[8]; }

      const qty = parseInt(qtyStr, 10);
      if (qty >= 1) {
        results.push({ raw, qty, query: remainder.trim() });
        continue;
      }
    }

    // No valid qty prefix found — whole line is the query, qty = 1.
    results.push({ raw, qty: 1, query: trimmed });
  }

  return results;
}

// ─── matchBom ─────────────────────────────────────────────────────────────────

/** Maximum concurrent searches to run in parallel. Prevents request floods. */
const MATCH_CONCURRENCY = 6;

/**
 * Process an array into chunks of a fixed size, awaiting each chunk sequentially,
 * and concatenate results preserving original order.
 */
async function batchedAwait<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  batchSize: number
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const chunkResults = await Promise.all(chunk.map(processFn));
    results.push(...chunkResults);
  }
  return results;
}

/**
 * Match parsed BOM lines against the catalog via an injected search function.
 *
 * @param parsed    Output of parseBomLines.
 * @param searchFn  Async function: query string → CatalogProduct | null (top hit).
 *                  Errors from searchFn are caught and treated as no-match.
 * @returns         Array of MatchedBomLine with `.match` populated.
 *
 * The real searchFn used in BomImportModal calls apiSearch with the line's
 * query as the text filter and pageSize=1, returning items[0] ?? null.
 * Keeping searchFn injected means matchBom can be unit-tested with a fake.
 *
 * Internally limits concurrent searches to MATCH_CONCURRENCY (6) at a time
 * to avoid flooding the serverless API with unbounded parallel requests.
 */
export async function matchBom(
  parsed: ParsedBomLine[],
  searchFn: (query: string) => Promise<CatalogProduct | null>
): Promise<MatchedBomLine[]> {
  return batchedAwait(
    parsed,
    async (line) => {
      let match: CatalogProduct | null = null;
      try {
        match = await searchFn(line.query);
      } catch {
        match = null;
      }
      return { ...line, match };
    },
    MATCH_CONCURRENCY
  );
}

// ─── matchBomScored ───────────────────────────────────────────────────────────

/**
 * Confidence-scored matching with alternates and an optional typo-correction
 * rescue pass.
 *
 * @param parsed     Output of parseBomLines.
 * @param searchTopK Async query → top candidate products (the modal uses
 *                   apiSearch with pageSize 3). Errors → treated as no hits.
 * @param suggest    Optional corrector (e.g. suggestCorrection). Consulted only
 *                   when the raw query returns zero hits; if the corrected
 *                   query finds products, the line carries `correctedQuery`.
 *
 * The top hit becomes `match`, scored against whichever query produced it;
 * the rest become `alternates` the user can swap in.
 */
export async function matchBomScored(
  parsed: ParsedBomLine[],
  searchTopK: (query: string) => Promise<CatalogProduct[]>,
  suggest?: (query: string) => { corrected: string } | null
): Promise<ScoredBomLine[]> {
  return batchedAwait(
    parsed,
    async (line) => {
      let items: CatalogProduct[] = [];
      let usedQuery = line.query;
      let correctedQuery: string | undefined;

      try {
        items = await searchTopK(line.query);
      } catch {
        items = [];
      }

      if (items.length === 0 && suggest) {
        const sugg = suggest(line.query);
        if (sugg && sugg.corrected.toLowerCase() !== line.query.toLowerCase()) {
          try {
            const rescued = await searchTopK(sugg.corrected);
            if (rescued.length > 0) {
              items = rescued;
              usedQuery = sugg.corrected;
              correctedQuery = sugg.corrected;
            }
          } catch {
            /* rescue failed — stay unmatched */
          }
        }
      }

      const match = items[0] ?? null;
      const confidence = match ? matchConfidence(usedQuery, match) : 0;
      return {
        ...line,
        match,
        confidence,
        tier: match ? confidenceTier(confidence) : null,
        alternates: items.slice(1, 3),
        ...(correctedQuery !== undefined ? { correctedQuery } : {}),
      };
    },
    MATCH_CONCURRENCY
  );
}
