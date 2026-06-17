/**
 * Spec-compare diff helpers (v3-S1 #5) — power "show differences only" + per-cell
 * difference highlighting in the comparison modal. Pure + unit-tested.
 *
 * A row is "shared" when every product that has the spec reports the same value
 * (a missing value alone doesn't make a row differ). When collapsing to
 * differences only, shared rows are hidden. Within a differing row, each cell is
 * flagged against the reference (first present value) so the outliers stand out.
 */

/** True when all present values match (≤1 present value counts as shared). */
export function rowIsShared(values: (string | null)[]): boolean {
  const present = values.filter((v): v is string => v !== null);
  if (present.length <= 1) return true;
  return present.every((v) => v === present[0]);
}

/**
 * Per-cell "differs from the reference" flags. The reference is the first present
 * value; a cell differs if its value !== reference. A missing cell in an
 * otherwise-shared row does NOT differ (nothing to contrast); in a differing row
 * a missing cell counts as a difference. Returns all-false for shared rows.
 */
export function diffFlags(values: (string | null)[]): boolean[] {
  if (rowIsShared(values)) return values.map(() => false);
  const reference = values.find((v): v is string => v !== null) ?? null;
  return values.map((v) => v !== reference);
}

/** Count of shared rows — drives the "(N shared specs hidden)" hint. */
export function countSharedRows(rows: (string | null)[][]): number {
  return rows.reduce((n, r) => (rowIsShared(r) ? n + 1 : n), 0);
}
