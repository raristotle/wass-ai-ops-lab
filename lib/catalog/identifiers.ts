/**
 * Product identifier normalization — MPNs, catalog numbers, GTIN/UPC.
 * Pure. One canonical comparison key everywhere (the BOM matcher,
 * distributor-live, and the cross engine previously each rolled their own).
 */

/** Canonical comparison key: uppercase alphanumerics only. */
export function identifierKey(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Display-normalized MPN: trimmed, internal whitespace collapsed, uppercased. */
export function normalizeMpn(s: string): string {
  return s.trim().replace(/\s+/g, " ").toUpperCase();
}

/** Catalog numbers normalize the same way as MPNs (manufacturers vary on which they print). */
export const normalizeCatalogNumber = normalizeMpn;

/** True when two part/catalog numbers refer to the same identifier. */
export function sameIdentifier(a: string, b: string): boolean {
  const ka = identifierKey(a);
  return ka.length > 0 && ka === identifierKey(b);
}

// ─── GTIN / UPC ───────────────────────────────────────────────────────────────

const GTIN_LENGTHS = new Set([8, 12, 13, 14]);

/** GS1 mod-10 check digit validation (GTIN-8/12/13/14). */
export function isValidGtin(digits: string): boolean {
  if (!/^\d+$/.test(digits) || !GTIN_LENGTHS.has(digits.length)) return false;
  let sum = 0;
  // Weights 3/1 alternating from the RIGHT, starting at 3 next to the check digit.
  for (let i = digits.length - 2, w = 3; i >= 0; i--, w = 4 - w) {
    sum += Number(digits[i]) * w;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(digits[digits.length - 1]);
}

/**
 * Normalize a GTIN/UPC: strip separators/spaces, validate length + check
 * digit. Returns the digit string or null when invalid — callers must not
 * store unvalidated GTINs.
 */
export function normalizeGtin(s: string): string | null {
  const digits = s.replace(/[\s-]/g, "");
  return isValidGtin(digits) ? digits : null;
}
