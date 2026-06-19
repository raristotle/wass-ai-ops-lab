/**
 * Per-subcategory HTS + landed-duty model (DI-7) — the real-data replacement for
 * the old chapter-level tariff approximation. It reads the web-verified
 * data/real/hts-codes.ts table and computes a landed duty that stacks the three
 * layers a US importer actually pays:
 *
 *   1. MFN (General / Column-1) ad-valorem duty — applies to any non-US origin.
 *   2. Section 301 — China-origin only; PER-SUBCATEGORY rate (datacom/displays are
 *      List 4A at 7.5%, most of chapter 85 is List 3 at 25%), unlike the old flat
 *      chapter rate.
 *   3. Section 232 — steel articles (cable tray, strut, steel conduit, racks) carry
 *      a steel surcharge on most-origin imports.
 *
 * Pure + deterministic + $0 (a static table, no API). NOT modeled (documented in
 * the data file): FTA preferences, 301 exclusions, compound specific duties on
 * clock-based timers, and IEEPA/reciprocal overlays. Advisory — a customs broker
 * confirms a binding classification.
 */

import { HTS_CODE_ENTRIES, type HtsCodeEntry } from "@/data/real/hts-codes";

/**
 * Section 232 steel surcharge, as a fraction. The base steel rate; 2025 actions
 * raised many steel *derivatives* to 50%, so treat this as a documented floor an
 * operator/broker confirms per article. Named so it is trivial to update.
 */
export const SECTION_232_STEEL_PCT = 0.25;

const BY_SUBCATEGORY: Map<string, HtsCodeEntry> = new Map(
  HTS_CODE_ENTRIES.map((e) => [e.subcategory, e]),
);

/** The verified HTS entry for a catalog subcategory, or null when unmapped. */
export function htsEntryForSubcategory(subcategory: string): HtsCodeEntry | null {
  return BY_SUBCATEGORY.get(subcategory) ?? null;
}

/** Format the dotted 8-digit HTS as a 10-digit code (statistical suffix "00"). */
export function hts10(hts: string): string {
  const digits = hts.replace(/\D/g, "");
  return (digits + "0000000000").slice(0, 10);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface LandedTariff {
  htsCode: string; // 10-digit
  htsDotted: string; // 8-digit dotted, for display
  description: string;
  countryOfOrigin: string;
  /** Layer rates (fractions). */
  mfnDutyPct: number;
  section301Pct: number;
  section232Pct: number;
  /** Effective total ad-valorem rate (sum of the layers). Aliased as ratePct. */
  ratePct: number;
  /** Human label of which layers applied, e.g. "MFN 2.7% + Section 301 25%". */
  program: string;
  dutyPerUnit: number;
  dutyLine: number;
  confidence: HtsCodeEntry["confidence"];
}

export interface LandedTariffInput {
  subcategory: string;
  countryOfOrigin: string;
  /** Whether the product is Section-301 exposed (compliance sets this when origin is China). */
  section301: boolean;
  unitPrice: number;
  qty?: number;
}

/**
 * Compute the real landed duty for a line from its subcategory + origin, or null
 * when the subcategory isn't in the HTS table (the caller falls back to the legacy
 * chapter model). US origin ⇒ no import duty.
 */
export function landedTariffForLine(input: LandedTariffInput): LandedTariff | null {
  const entry = htsEntryForSubcategory(input.subcategory);
  if (!entry) return null;

  const domestic = input.countryOfOrigin === "US";
  const mfnDutyPct = domestic ? 0 : entry.mfnDutyPct;
  // Section 301 is a China-only surcharge; honor BOTH the compliance flag and origin.
  const section301Pct = input.section301 && input.countryOfOrigin === "CN" ? entry.section301Pct : 0;
  const section232Pct = !domestic && entry.section232 ? SECTION_232_STEEL_PCT : 0;
  const ratePct = round4(mfnDutyPct + section301Pct + section232Pct);

  const parts: string[] = [];
  if (mfnDutyPct > 0) parts.push(`MFN ${pct(mfnDutyPct)}`);
  if (section301Pct > 0) parts.push(`Section 301 ${pct(section301Pct)}`);
  if (section232Pct > 0) parts.push(`Section 232 ${pct(section232Pct)}`);
  const program = parts.length ? parts.join(" + ") : "none";

  const dutyPerUnit = round2(input.unitPrice * ratePct);
  const qty = Math.max(1, input.qty ?? 1);

  return {
    htsCode: hts10(entry.hts),
    htsDotted: entry.hts,
    description: entry.description,
    countryOfOrigin: input.countryOfOrigin,
    mfnDutyPct,
    section301Pct,
    section232Pct,
    ratePct,
    program,
    dutyPerUnit,
    dutyLine: round2(dutyPerUnit * qty),
    confidence: entry.confidence,
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
function pct(n: number): string {
  return `${round4(n * 100)}%`;
}
