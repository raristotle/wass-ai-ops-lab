/**
 * Pure helpers for generating quote metadata.
 * All functions accept a Date argument — no Date.now() inside.
 * Safe to unit-test with injected dates.
 */

/**
 * Formats a quote number: Q-YYYYMMDD-XXXX
 *
 * `seq` is an optional explicit 4-digit sequence number. When omitted, a
 * deterministic 4-digit value is derived from the date's seconds and
 * milliseconds (seconds * 1000 + ms, clamped to 4 digits).
 *
 * In the component: quoteNumber(new Date())
 */
export function quoteNumber(date: Date, seq?: number): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const datePart = `${yyyy}${mm}${dd}`;
  const seqPart =
    seq !== undefined
      ? String(seq).padStart(4, "0")
      : String(date.getSeconds() * 1000 + date.getMilliseconds())
          .padStart(4, "0")
          .slice(0, 4);
  return `Q-${datePart}-${seqPart}`;
}

/**
 * Returns a new Date that is `days` calendar days after `date`.
 * Does not mutate the input. Default is 30 days (quote validity window).
 *
 * In the component: quoteValidityDate(new Date())
 */
export function quoteValidityDate(date: Date, days = 30): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Formats a Date as "Month D, YYYY" (e.g. "June 6, 2026").
 * Uses the en-US locale — deterministic for any environment.
 */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
