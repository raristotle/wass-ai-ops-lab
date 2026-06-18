/**
 * Tariff-aware landed cost (v3-S3 #14) — a static USTR Section-301 duty model
 * keyed off the HTS code + country-of-origin that [[compliance]] already enriches.
 * Section 301 duties apply to China-origin goods on the USTR lists and land on
 * the importer of record (the buyer), so they belong in the landed-cost picture.
 *
 * Pure, deterministic, $0 — a published rate table, no API. (Section 232 steel/
 * aluminum is not modeled: the synthetic catalog's HTS codes are all chapter
 * 84/85/65, none in the 72/73/76 metal chapters.)
 */

export type TariffProgram = "Section 301" | "none";

/** Representative Section-301 ad-valorem rates by HTS chapter (USTR Lists 3/4A). */
const SECTION_301_BY_CHAPTER: Record<string, number> = {
  "84": 0.25, // machinery
  "85": 0.25, // electrical machinery & equipment (most of the catalog)
  "65": 0.075, // headgear / safety
};
const SECTION_301_DEFAULT = 0.075;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The duty rate + program for an HTS code, gated on Section-301 exposure. */
export function tariffRate(input: { htsCode: string; section301: boolean }): { ratePct: number; program: TariffProgram } {
  if (!input.section301) return { ratePct: 0, program: "none" };
  const chapter = (input.htsCode || "").slice(0, 2);
  return { ratePct: SECTION_301_BY_CHAPTER[chapter] ?? SECTION_301_DEFAULT, program: "Section 301" };
}

export interface TariffInput {
  htsCode: string;
  countryOfOrigin: string;
  section301: boolean;
  /** Customs-value basis per unit (use the line's unit price). */
  unitPrice: number;
  qty?: number;
}

export interface TariffDuty {
  ratePct: number;
  program: TariffProgram;
  dutyPerUnit: number;
  dutyLine: number;
  countryOfOrigin: string;
}

/** Per-line duty: dutyPerUnit = unitPrice × rate; line = × qty. */
export function tariffForLine(input: TariffInput): TariffDuty {
  const { ratePct, program } = tariffRate(input);
  const dutyPerUnit = round2(input.unitPrice * ratePct);
  const qty = Math.max(1, input.qty ?? 1);
  return {
    ratePct,
    program,
    dutyPerUnit,
    dutyLine: round2(dutyPerUnit * qty),
    countryOfOrigin: input.countryOfOrigin,
  };
}

export interface TariffRollup {
  exposedLines: number;
  totalDuty: number;
}

/** Aggregate duty exposure across a BOM. */
export function tariffRollup(duties: TariffDuty[]): TariffRollup {
  let exposedLines = 0;
  let totalDuty = 0;
  for (const d of duties) {
    if (d.ratePct > 0) {
      exposedLines += 1;
      totalDuty += d.dutyLine;
    }
  }
  return { exposedLines, totalDuty: round2(totalDuty) };
}
