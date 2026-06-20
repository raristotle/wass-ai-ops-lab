/**
 * Cross-reference harvest adapter (Sprint D5).
 *
 * Emits competitive / second-source CROSS-REFERENCES into the ingestion pipeline: for a
 * seed MPN, the alternate-manufacturer parts that are the same component. The data comes
 * from the existing dormant Nexar/Octopart seam (lib/integration/nexar-live `enrichByMpn`),
 * whose `secondSources` are exactly this — same part, different manufacturer. (D3 keeps only
 * the primary identity; D5 picks up the second-source EDGES.) These are factual
 * "part X is also made as part Y" relations, not proprietary catalog content.
 *
 * The transform is PURE; the only I/O is the dormant client call, which returns nothing
 * until Nexar is keyed ($0 default). Reuses the same INGEST_DISTRIBUTOR_MPNS seed list.
 *
 * COST NOTE: when an operator runs ALL sources with Nexar keyed, both this adapter and the
 * D3 distributor identity adapter call Nexar per MPN — 2 Nexar queries/MPN against the
 * operator's own metered plan. Run a specific adapter id (the run API/UI accept adapterIds)
 * to avoid the double query when you only need one.
 */

import type { AdapterContext, IngestRecord, RawPayload, SourceAdapter } from "@/lib/ingest/source-adapter";
import { PRODUCTION_CONFIDENCE } from "@/lib/catalog/provenance";
import { enrichByMpn, nexarConfigured, type ProductEnrichment } from "@/lib/integration/nexar-live";

/** The relation label for a Nexar second-source edge (honest — not "equivalent"). */
export const SECOND_SOURCE_RELATION = "second-source";

const clean = (s: string | null | undefined): string | undefined => {
  const t = (s ?? "").trim();
  return t && t !== "—" ? t : undefined;
};
const normMpn = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

/**
 * A Nexar enrichment → a cross-reference record: the primary MPN keyed, with one cross per
 * DISTINCT second-source MPN (the primary itself excluded). Null when there's no primary
 * MPN or no distinct second source — we don't emit an empty crosses list.
 */
export function enrichmentToCrossRecord(e: ProductEnrichment): IngestRecord | null {
  const mpn = clean(e.mpn);
  if (!mpn) return null;
  const self = normMpn(mpn);
  const seen = new Set<string>([self]);
  const crosses: { competitorSku: string; relation: string }[] = [];
  for (const s of e.secondSources ?? []) {
    const alt = clean(s.mpn);
    if (!alt) continue;
    const key = normMpn(alt);
    if (!key || seen.has(key)) continue; // skip the primary + dupes
    seen.add(key);
    crosses.push({ competitorSku: alt, relation: SECOND_SOURCE_RELATION });
  }
  if (crosses.length === 0) return null;
  return {
    mpn,
    brand: clean(e.manufacturer),
    crosses,
    sourceUrl: clean(e.octopartUrl) ?? "https://octopart.com",
    confidence: PRODUCTION_CONFIDENCE + 1,
  };
}

export interface CrossReferenceAdapterConfig {
  id: string;
  label: string;
  segment: string;
  /** The MPNs to find second-source crosses for (seed list). */
  mpns: string[];
}

/** What a cross fetch packs into a RawPayload body for the pure parse() to read. */
interface CrossPayload {
  mpn: string;
  nexar: ProductEnrichment | null;
}

/** Build a renewable Nexar second-source cross-reference adapter for a seed MPN list. */
export function makeNexarCrossAdapter(config: CrossReferenceAdapterConfig): SourceAdapter {
  return {
    id: config.id,
    label: config.label,
    segment: config.segment,
    dataTypes: ["cross-reference"],
    license:
      "Second-source cross-references (same part, alternate manufacturer) from Nexar/Octopart — factual relations only, not proprietary catalog content.",
    async fetch(_ctx: AdapterContext): Promise<RawPayload[]> {
      const out: RawPayload[] = [];
      const keyed = nexarConfigured();
      for (let i = 0; i < config.mpns.length; i++) {
        const mpn = config.mpns[i].trim();
        if (!mpn) continue;
        let nexar: ProductEnrichment | null = null;
        try {
          const nx = await enrichByMpn(mpn); // dormant → {enabled:false} unkeyed
          nexar = nx.enabled ? nx.enrichment : null;
        } catch {
          /* one MPN's outage shouldn't sink the batch */
        }
        const payload: CrossPayload = { mpn, nexar };
        out.push({ url: `cross-ingest://mpn/${encodeURIComponent(mpn)}`, contentType: "application/json", body: JSON.stringify(payload) });
        if (keyed && i < config.mpns.length - 1) await new Promise((r) => setTimeout(r, 250));
      }
      return out;
    },
    parse(raw: RawPayload): IngestRecord[] {
      let payload: CrossPayload;
      try {
        payload = JSON.parse(raw.body) as CrossPayload;
      } catch {
        return [];
      }
      if (!payload.nexar) return [];
      const rec = enrichmentToCrossRecord(payload.nexar);
      return rec ? [rec] : [];
    },
  };
}

/** True when the cross-reference source can run (Nexar keyed). */
export function crossReferenceClientConfigured(): boolean {
  return nexarConfigured();
}
