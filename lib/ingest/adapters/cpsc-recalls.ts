/**
 * CPSC product-recall demand-signal adapter (Sprint D6).
 *
 * The U.S. Consumer Product Safety Commission publishes product recalls through a FREE,
 * keyless REST service (saferproducts.gov, U.S. gov public domain). This adapter turns
 * recalls that name a product MODEL into ingest records flagging that model as recalled —
 * a real safety/demand signal for the catalog ("is anything we carry under recall?").
 *
 * Honest + $0 by design: keyless and free, but per the "zero network until explicitly
 * enabled" rule it stays dormant until `INGEST_CPSC_RECALLS` is set (mirrors the NWS
 * weather seam's WEATHER_CONTACT switch). Only recalls carrying a usable model number
 * become records — a recall with no model has no identity and is skipped, never invented.
 */

import type { AdapterContext, IngestRecord, RawPayload, SourceAdapter } from "@/lib/ingest/source-adapter";
import { PRODUCTION_CONFIDENCE } from "@/lib/catalog/provenance";

/** The CPSC recall shape (only the fields we read). */
export interface CpscRecall {
  RecallNumber?: string;
  Title?: string;
  URL?: string;
  Products?: { Name?: string; Model?: string; Type?: string }[];
  Manufacturers?: { Name?: string }[];
}

/** Keep recall->record output bounded regardless of how many the API returns. */
export const MAX_RECALL_RECORDS = 500;

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const normMpn = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

/**
 * Map CPSC recalls to ingest records: one record per DISTINCT product MODEL across all
 * recalls, flagged with a "Safety recall" attribute and the recall URL as provenance.
 * Products without a model (no identity) are skipped. Pure + bounded.
 */
export function cpscRecallsToRecords(recalls: CpscRecall[]): IngestRecord[] {
  const byModel = new Map<string, IngestRecord>();
  for (const recall of recalls ?? []) {
    if (!recall || typeof recall !== "object") continue;
    const title = str(recall.Title) ?? str(recall.RecallNumber);
    const url = str(recall.URL);
    if (!url || !title) continue; // a recall with no source link or label isn't usable
    const brand = str(recall.Manufacturers?.[0]?.Name);
    for (const p of recall.Products ?? []) {
      const model = str(p?.Model);
      if (!model) continue; // no model → no identity → skip (never invented)
      const key = normMpn(model);
      if (!key || byModel.has(key)) continue; // first recall for a model wins
      byModel.set(key, {
        mpn: model,
        brand,
        attributes: [{ name: "Safety recall", value: title }],
        sourceUrl: url,
        confidence: PRODUCTION_CONFIDENCE + 1, // CPSC is authoritative for the recall fact
      });
      if (byModel.size >= MAX_RECALL_RECORDS) return [...byModel.values()];
    }
  }
  return [...byModel.values()];
}

/** ISO date string N days before the given ISO instant (YYYY-MM-DD), for the recall window. */
function isoDateMinusDays(nowIso: string, days: number): string {
  const t = Date.parse(nowIso);
  const base = Number.isFinite(t) ? t : Date.parse("2020-01-01T00:00:00.000Z");
  return new Date(base - days * 86_400_000).toISOString().slice(0, 10);
}

/** Build the CPSC recall demand-signal adapter (fetches via ctx.get; injectable for tests). */
export function makeCpscRecallAdapter(): SourceAdapter {
  return {
    id: "demand:cpsc-recalls",
    label: "CPSC product recalls (safety demand signal)",
    segment: "cross-segment",
    dataTypes: ["compliance-cert"],
    license: "U.S. CPSC recall data via saferproducts.gov — U.S. government public domain (17 USC 105). Free, keyless.",
    async fetch(ctx: AdapterContext): Promise<RawPayload[]> {
      // Last 365 days of recalls keeps the pull bounded + relevant.
      const start = isoDateMinusDays(ctx.nowIso(), 365);
      const url = `https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=${start}`;
      try {
        return [await ctx.get(url)];
      } catch {
        return []; // a CPSC outage yields an empty (honest) run, not a thrown batch
      }
    },
    parse(raw: RawPayload): IngestRecord[] {
      try {
        const parsed = JSON.parse(raw.body) as unknown;
        return Array.isArray(parsed) ? cpscRecallsToRecords(parsed as CpscRecall[]) : [];
      } catch {
        return [];
      }
    },
  };
}

/** True when the operator has explicitly enabled the CPSC recall source. */
export function cpscRecallsEnabled(env: Record<string, string | undefined>): boolean {
  const v = env.INGEST_CPSC_RECALLS?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
