/**
 * Attribute normalization (Sprint D2 — identity + attribute backbone).
 *
 * Turns a record's raw `{name, value}` attribute pairs into canonical
 * {@link NormalizedAttribute}s — one stable key, a parsed numeric + canonical unit where
 * possible — so the SAME attribute from different sources lines up and merges. Pure and
 * fully tested.
 *
 * Honest by construction:
 *   • An attribute NAME we can't map is reported in `unmapped`, never force-bucketed.
 *   • A UNIT is only attached when it actually appears in the source value — the canonical
 *     unit is the EXPECTED unit (metadata), never silently stamped onto a bare number.
 *   • The raw pair is preserved on every normalized attribute for provenance.
 */

import type { IngestRecord } from "@/lib/ingest/source-adapter";
import { resolveAttribute, canonicalUnit, type CanonicalAttribute } from "@/lib/ingest/attribute-taxonomy";

export interface NormalizedAttribute {
  /** Canonical key from the taxonomy, e.g. "amperage". */
  key: string;
  label: string;
  /** The source value, trimmed (never invented). */
  value: string;
  /** First numeric parsed from the value (e.g. 120 from "120/240"), when present. */
  numeric?: number;
  /** Canonical unit symbol — present only when a unit was found in the source value. */
  unit?: string;
  /** The original pair, kept for provenance. */
  raw: { name: string; value: string };
}

/**
 * Extract a leading numeric and the unit IMMEDIATELY FOLLOWING it. The unit must be
 * adjacent to the number — otherwise a trailing WORD ("Class F", "Grade A", "Type C")
 * would be misread as a unit (°F / A / …), inventing a unit the source never stated. A
 * value with no leading number yields no unit at all.
 *
 * `numeric` is the FIRST number in the value (advisory for ranges/fractions: "120/240"→120,
 * "1/2"→1) — the full `value` string is always preserved as the source of truth.
 */
function parseNumericAndUnit(value: string, canonical: CanonicalAttribute): { numeric?: number; unit?: string } {
  const trimmed = value.trim();
  // Anchor at start: optional "#", a numeric run (digits + . , / -), then the adjacent unit.
  const m = trimmed.match(/^#?\s*(-?\d+(?:[.,/\-]\d+)*)\s*([a-zA-Z]+\/?[a-zA-Z]*|°[cf]|"|%|Ω)?/i);
  if (!m) return {}; // no leading number → no numeric, no unit
  const firstNum = m[1].match(/-?\d+(?:[.,]\d+)?/);
  const numeric = firstNum ? Number(firstNum[0].replace(",", "")) : undefined;
  let unit = m[2] ? canonicalUnit(m[2]) : undefined;
  // Only keep a unit that's consistent with this attribute's expected family — a
  // mismatched family (e.g. "mm" where we expect "in") is conservative-dropped, not wrong.
  if (unit && canonical.unit && unit !== canonical.unit) unit = undefined;
  return { numeric: Number.isFinite(numeric) ? numeric : undefined, unit };
}

/** Normalize one raw attribute pair, or null when its name is unmapped. */
export function normalizeAttribute(pair: { name: string; value: string }): NormalizedAttribute | null {
  const canonical = resolveAttribute(pair.name);
  if (!canonical) return null;
  const value = pair.value.trim();
  if (!value) return null; // an empty value is not a fact
  const { numeric, unit } = canonical.datatype === "number" || canonical.unit
    ? parseNumericAndUnit(value, canonical)
    : {};
  return { key: canonical.key, label: canonical.label, value, numeric, unit, raw: pair };
}

export interface NormalizeResult {
  normalized: NormalizedAttribute[];
  unmapped: { name: string; value: string }[];
}

/**
 * Normalize a list of attribute pairs. Deduplicates by canonical key (FIRST occurrence
 * wins — sources typically list the authoritative value first); unmapped names are
 * collected, never dropped silently.
 */
export function normalizeAttributes(pairs: { name: string; value: string }[]): NormalizeResult {
  const normalized: NormalizedAttribute[] = [];
  const unmapped: { name: string; value: string }[] = [];
  const seen = new Set<string>();
  for (const pair of pairs) {
    const n = normalizeAttribute(pair);
    if (!n) {
      if (pair.value.trim()) unmapped.push(pair);
      continue;
    }
    if (seen.has(n.key)) continue; // first canonical value wins
    seen.add(n.key);
    normalized.push(n);
  }
  return { normalized, unmapped };
}

/** Attach `normalizedAttributes` to a record (derived from its raw `attributes`). */
export function normalizeRecord(record: IngestRecord): IngestRecord {
  if (!record.attributes || record.attributes.length === 0) return record;
  const { normalized } = normalizeAttributes(record.attributes);
  if (normalized.length === 0) return record;
  return { ...record, normalizedAttributes: normalized };
}

export interface AttributeCoverage {
  /** Total raw attributes seen across the records. */
  attributesSeen: number;
  /** How many mapped to a canonical key. */
  attributesMapped: number;
  /** 0..100 — mapped ÷ seen. */
  coverage: number;
}

/** Coverage of raw attributes that map onto the canonical taxonomy, across records. */
export function attributeCoverage(records: IngestRecord[]): AttributeCoverage {
  let seen = 0;
  let mapped = 0;
  for (const r of records) {
    for (const a of r.attributes ?? []) {
      if (!a.value.trim()) continue;
      seen++;
      if (resolveAttribute(a.name)) mapped++;
    }
  }
  return { attributesSeen: seen, attributesMapped: mapped, coverage: seen ? Math.round((mapped / seen) * 100) : 0 };
}
