/**
 * Wesco sales-rank ingestion seam.
 *
 * The goal targets "the top 80% of Wesco sales-volume SKUs" — that ranking is
 * NOT public. Per the work rules we do not guess it. This module defines the
 * file contract so the ranking can be dropped in later, and reports the
 * missing input honestly until then.
 *
 * Expected file: data/real/wesco-sales-rank.json
 */

import { identifierKey } from "@/lib/catalog/identifiers";

export const SALES_RANK_PATH = "data/real/wesco-sales-rank.json";

/** One row of the (future) sales-rank input file. */
export interface SalesRankRow {
  /** Manufacturer part number (required — joins to the catalog). */
  mpn: string;
  brand: string;
  /** 1 = highest sales volume. */
  rank: number;
  /** Optional: Wesco stock number, annual units, or revenue share. */
  wescoSku?: string;
  annualUnits?: number;
  revenueSharePct?: number;
}

export type SalesRankResult =
  | { available: true; rows: SalesRankRow[]; byMpnKey: Map<string, SalesRankRow>; invalidRows: number }
  | { available: false; reason: string; expectedPath: string; expectedSchema: string };

function isRow(x: unknown): x is SalesRankRow {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.mpn === "string" && o.mpn.trim().length > 0 &&
    typeof o.brand === "string" && o.brand.trim().length > 0 &&
    typeof o.rank === "number" && Number.isFinite(o.rank) && o.rank >= 1
  );
}

/**
 * Parse sales-rank JSON content (already read from disk — pure for tests).
 * Pass `null` when the file does not exist.
 */
export function parseSalesRank(raw: string | null): SalesRankResult {
  const missing = (reason: string): SalesRankResult => ({
    available: false,
    reason,
    expectedPath: SALES_RANK_PATH,
    expectedSchema:
      '[{ "mpn": string, "brand": string, "rank": number≥1, "wescoSku"?, "annualUnits"?, "revenueSharePct"? }]',
  });

  if (raw === null) {
    return missing(
      "Wesco sales-volume ranking is not public and has not been provided. " +
        "Coverage targets (top-80% of sales volume) cannot be computed — not guessing."
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return missing("Sales-rank file exists but is not valid JSON.");
  }
  if (!Array.isArray(parsed)) {
    return missing("Sales-rank file must be a JSON array of rows.");
  }

  const rows: SalesRankRow[] = [];
  let invalidRows = 0;
  for (const x of parsed) {
    if (isRow(x)) rows.push(x);
    else invalidRows += 1;
  }
  if (rows.length === 0) {
    return missing("Sales-rank file contained no valid rows.");
  }

  const byMpnKey = new Map<string, SalesRankRow>();
  for (const r of rows) {
    const key = identifierKey(r.mpn);
    if (!byMpnKey.has(key)) byMpnKey.set(key, r);
  }
  return { available: true, rows, byMpnKey, invalidRows };
}
