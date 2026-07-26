/**
 * Crosswalk import TRIAGE — the unresolved-row report (PF-5).
 *
 * WHY THIS EXISTS. Importing a customer catalog-number crosswalk used to report its
 * failures as a single number ("12 unresolved"). That number is a dead end: the
 * operator learns *how many* rows failed but not *which*, *why*, or *what to do*.
 * Yet the unresolved rows are the most actionable thing the import produces — each
 * one is either a data-entry error the customer can fix in their source file or a
 * genuine catalog gap worth knowing about. This module turns that count back into a
 * list you can download, fix, and re-import.
 *
 * DESIGN: pure + tiny + client-safe. It deliberately does NOT import
 * `lib/catalog/crosswalk.ts` (which pulls the 200k-product catalog in via the demo
 * seed) so the browser modal can import the CSV builder without dragging the catalog
 * into the client bundle. The server module imports FROM here, never the reverse.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE FAILURE-REASON TAXONOMY — read this before adding a reason.
 * ─────────────────────────────────────────────────────────────────────────────
 * A "reason" is a distinct, *actionable* way a source row failed to become a
 * crosswalk entry. Every reason must satisfy all three of these, or it does not
 * belong here:
 *   1. The code ACTUALLY distinguishes it at a specific branch (no speculative
 *      buckets — an unreachable reason is worse than no reason).
 *   2. The row was DISCARDED — it did not become a mapping. Rows that were kept
 *      belong in the manifest, not in a triage report titled "unresolved".
 *   3. It implies a DIFFERENT fix than the reasons already listed.
 *
 * The three reasons below are exactly the branches the import path distinguishes:
 *   · missing_customer_number — `parseCrosswalkCsv`, per row: the lookup-key cell
 *     was blank. (Counted in `stats.dropped`.)
 *   · missing_sku             — `parseCrosswalkCsv`, per row: the SKU cell was
 *     blank. (Also counted in `stats.dropped`.) Split from the reason above on
 *     purpose: which side is empty is the whole fix.
 *   · sku_not_carried         — `resolveCrosswalkRows`, per row: the SKU cell was
 *     present but the injected resolver (`resolveBySku`) found no catalog product.
 *
 * DELIBERATELY ABSENT, and why — so a future contributor does not "restore" them:
 *   · ambiguous / multiple matches — impossible today. `resolveBySku` is an O(1)
 *     lookup in a Map keyed by `identifierKey`, so a key either hits exactly one
 *     product or nothing. If a fuzzy or multi-index matcher is ever introduced,
 *     "sku_ambiguous" becomes the fourth reason and the `nearMatch` field below is
 *     where its candidates belong.
 *   · unmappable header row — the file has no recognizable customer-number column
 *     or no SKU column. That is a whole-FILE failure, not a row failure; the import
 *     route rejects it up front with a 400 naming both required columns, and no
 *     per-row report would add anything.
 *   · duplicate customer number — two rows with the same normalized number are both
 *     STORED today; the later one simply wins when `crosswalkIndex` is built. That
 *     violates rule 2 (the row was not discarded), so it is out of scope here. If
 *     import is ever changed to drop the losing row, add "duplicate_customer_number"
 *     and report the winning row's line number in `nearMatch`.
 *
 * TO ADD A REASON: append the code to CROSSWALK_REJECT_REASONS, add its fix text to
 * CROSSWALK_REJECT_HINTS (TypeScript's Record will fail the build until you do —
 * that is intentional), document it in `docs/catalog-crosswalk.md`, and cover the
 * new branch in `lib/catalog/crosswalk-reject.test.ts`.
 */

import { toCsv } from "@/lib/product-finder-csv";

/**
 * Every failure reason the import path distinguishes, in the order they can occur
 * (parse-time first, then resolve-time). Exported as a const array so tests can
 * assert full coverage of the taxonomy rather than a hand-maintained list.
 */
export const CROSSWALK_REJECT_REASONS = [
  "missing_customer_number",
  "missing_sku",
  "sku_not_carried",
] as const;

export type CrosswalkRejectReason = (typeof CROSSWALK_REJECT_REASONS)[number];

/** One source row that did NOT become a crosswalk mapping. */
export interface CrosswalkReject {
  /**
   * 1-based line number in the uploaded file, counting the header. Blank lines are
   * skipped for parsing but still consume a line number, so this always matches what
   * the operator sees in their spreadsheet/editor.
   */
  line: number;
  /** The customer's own part number exactly as supplied (may be ""). Never normalized. */
  customerNumber: string;
  /** The SKU cell exactly as supplied (may be ""). Never normalized. */
  sku: string;
  reason: CrosswalkRejectReason;
  /**
   * The normalized key the matcher actually looked up (`identifierKey(sku)`) — the
   * one candidate an exact-match resolver considers. "" when there was no SKU to try.
   * Surfacing it explains the otherwise-invisible normalization ("QO 115" → "QO115").
   */
  lookupKey: string;
  /**
   * An EXACT alternative found by the caller, or "" for none. Today the only case is
   * a swapped-column file: the customer-number cell turned out to be a carried SKU.
   * This is never a fuzzy guess — if a near-miss cannot be proven, it stays empty.
   */
  nearMatch: string;
}

/**
 * The persisted/returned triage report for the most recent import. Bounded on purpose:
 * a 5 MB CSV can produce six figures of rejected rows and the durable store holds one
 * JSON value per key.
 */
export interface CrosswalkRejectReport {
  rows: CrosswalkReject[];
  /** Total rejected rows in the source file — may exceed `rows.length` when truncated. */
  total: number;
  /** True when `total > rows.length`, i.e. the list was capped. */
  truncated: boolean;
  importedAtIso: string;
}

/** Cap on rejected rows kept/returned. Enough to triage a real file; bounded storage. */
export const MAX_STORED_CROSSWALK_REJECTS = 1000;

/**
 * The fix for each reason, written for the person holding the source CSV — an
 * instruction, not a restatement of the error. Exhaustive by type: adding a reason
 * without a hint is a compile error.
 */
export const CROSSWALK_REJECT_HINTS: Record<CrosswalkRejectReason, string> = {
  missing_customer_number:
    "The customer-number cell is empty. Fill in the number your buyers actually type, or delete the row.",
  missing_sku:
    "The SKU cell is empty. Fill in the manufacturer/catalog SKU this number should map to, or delete the row.",
  sku_not_carried:
    "No catalog product matches this SKU under any of its identities (manufacturer SKU, Wesco stock #, catalog #, GTIN). Check for a typo, or accept that the part isn't carried.",
};

/**
 * The per-row next step. A proven near match outranks the generic reason hint,
 * because a swapped-column file fails EVERY row and naming that once saves the
 * operator from "fixing" hundreds of rows that were never wrong.
 */
export function crosswalkRejectHint(reason: CrosswalkRejectReason, nearMatch: string): string {
  if (nearMatch) {
    return `Columns may be swapped — "${nearMatch}" is a carried product. Check which column holds your number and which holds our SKU.`;
  }
  return CROSSWALK_REJECT_HINTS[reason];
}

export const CROSSWALK_REJECT_CSV_HEADER = [
  "Row",
  "Customer number",
  "SKU",
  "Reason",
  "Lookup key tried",
  "Near match",
  "What to do",
];

/** Suggested download filename, shared by the UI and any future server export. */
export const CROSSWALK_REJECTS_FILENAME = "meridian-crosswalk-unresolved.csv";

/**
 * Render the triage report as CSV: a header plus one row per unresolved source row.
 *
 * Cells go through the repo's shared `csvField` (via `toCsv`), which quotes
 * delimiters/newlines AND neutralizes spreadsheet formula injection — load-bearing
 * here, because every value in the first three columns is UNTRUSTED text copied
 * verbatim out of a customer's uploaded file.
 *
 * An empty report still yields the header row; the UI is responsible for not
 * offering a download when there is nothing to triage.
 */
export function crosswalkRejectsCsv(rows: CrosswalkReject[]): string {
  const out: (string | number)[][] = [CROSSWALK_REJECT_CSV_HEADER];
  for (const r of rows) {
    out.push([
      r.line,
      r.customerNumber,
      r.sku,
      r.reason,
      r.lookupKey,
      r.nearMatch,
      crosswalkRejectHint(r.reason, r.nearMatch),
    ]);
  }
  return toCsv(out);
}
