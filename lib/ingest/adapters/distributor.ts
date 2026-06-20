/**
 * Distributor identity-harvest adapter (Sprint D3).
 *
 * Wraps the existing dormant distributor seams — Mouser + Digi-Key (lib/integration/
 * distributor-live) and Nexar/Octopart (lib/integration/nexar-live) — as a renewable
 * Source Adapter on the D1 framework, seeded by a list of MPNs to enrich.
 *
 * TERMS-OF-SERVICE BOUNDARY (the honest part). Mouser/Digi-Key/Nexar API terms restrict
 * caching and redistribution of their PROPRIETARY CATALOG CONTENT — pricing, stock,
 * descriptions, and parametric specs. So this adapter persists ONLY the factual identity
 * linkage that is NOT their proprietary content: the manufacturer part number (the
 * manufacturer's identifier), the manufacturer/brand name (a fact), and the datasheet
 * URL (a link to the manufacturer's own document). Price/stock/description/specs are
 * deliberately DROPPED and never enter a snapshot. (Live pricing/stock is still available
 * per-request through the existing distributor seams — it just isn't ingested here.)
 *
 * The transforms are PURE (tested with fixtures); the only I/O is the dormant client
 * calls in fetch(), which return nothing until the distributor keys are set ($0 default).
 */

import type { AdapterContext, IngestRecord, RawPayload, SourceAdapter, IngestDataType } from "@/lib/ingest/source-adapter";
import { PRODUCTION_CONFIDENCE } from "@/lib/catalog/provenance";
import { getLiveQuotes, liveDistributorsConfigured, type LiveQuote } from "@/lib/integration/distributor-live";
import { enrichByMpn, nexarConfigured, type ProductEnrichment } from "@/lib/integration/nexar-live";

/** What a distributor fetch packs into a RawPayload body for the pure parse() to read. */
interface DistributorPayload {
  mpn: string;
  quotes: LiveQuote[];
  nexar: ProductEnrichment | null;
}

const clean = (s: string | null | undefined): string | undefined => {
  const t = (s ?? "").trim();
  return t && t !== "—" ? t : undefined;
};
const normMpn = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

/**
 * A Mouser/Digi-Key live quote → an identity record (MPN + brand + datasheet link only).
 * Pricing, stock, and description on the quote are intentionally not read. Null when the
 * quote carries no MPN.
 */
export function liveQuoteToIdentityRecord(q: LiveQuote): IngestRecord | null {
  const mpn = clean(q.matchedPart);
  if (!mpn) return null;
  return {
    mpn,
    brand: clean(q.manufacturer),
    datasheetUrl: clean(q.datasheetUrl),
    // Provenance: the distributor's product page when known, else the distributor itself.
    sourceUrl: clean(q.productUrl) ?? (q.distributor === "Digi-Key" ? "https://www.digikey.com" : "https://www.mouser.com"),
    confidence: PRODUCTION_CONFIDENCE + 1,
  };
}

/** A Nexar enrichment → an identity record (MPN + brand + datasheet link only). */
export function nexarEnrichmentToIdentityRecord(e: ProductEnrichment): IngestRecord | null {
  const mpn = clean(e.mpn);
  if (!mpn) return null;
  return {
    mpn,
    brand: clean(e.manufacturer),
    datasheetUrl: clean(e.datasheetUrl),
    sourceUrl: clean(e.octopartUrl) ?? "https://octopart.com",
    confidence: PRODUCTION_CONFIDENCE + 1,
  };
}

/**
 * Merge same-MPN identity records from multiple distributors into one, preferring the
 * first non-empty brand / datasheet (so a source that lacks a datasheet can't blank one
 * another source provided). Keeps the first record's sourceUrl.
 */
export function mergeIdentityRecords(records: IngestRecord[]): IngestRecord[] {
  const byMpn = new Map<string, IngestRecord>();
  for (const r of records) {
    const key = normMpn(r.mpn ?? "");
    if (!key) continue;
    const prev = byMpn.get(key);
    if (!prev) {
      byMpn.set(key, { ...r });
    } else {
      prev.brand = prev.brand ?? r.brand;
      prev.datasheetUrl = prev.datasheetUrl ?? r.datasheetUrl;
    }
  }
  return [...byMpn.values()];
}

export interface DistributorAdapterConfig {
  id: string;
  label: string;
  segment: string;
  /** The MPNs to enrich each run (the seed list). */
  mpns: string[];
}

/** Build a renewable distributor identity-harvest adapter for a seed MPN list. */
export function makeDistributorAdapter(config: DistributorAdapterConfig): SourceAdapter {
  const dataTypes: IngestDataType[] = ["manufacturer-entity", "datasheets"];
  return {
    id: config.id,
    label: config.label,
    segment: config.segment,
    dataTypes,
    license:
      "Distributor identity linkage only (MPN ↔ manufacturer ↔ datasheet URL). Per Mouser/Digi-Key/Nexar API terms, proprietary catalog content (pricing, stock, descriptions, parametric specs) is NEVER cached or redistributed and is omitted here.",
    async fetch(_ctx: AdapterContext): Promise<RawPayload[]> {
      const out: RawPayload[] = [];
      // When keyed, each MPN fires up to 3 upstream calls; pause briefly between MPNs so a
      // near-cap (200) seed list doesn't burst the operator's distributor quota. No pause
      // while dormant, so the $0 path (and tests) stay instant.
      const keyed = distributorClientsConfigured();
      const mpns = config.mpns;
      for (let i = 0; i < mpns.length; i++) {
        const mpn = mpns[i].trim();
        if (!mpn) continue;
        // Dormant clients: getLiveQuotes → [] and enrichByMpn → {enabled:false} when unkeyed.
        let quotes: LiveQuote[] = [];
        let nexar: ProductEnrichment | null = null;
        try {
          quotes = await getLiveQuotes(mpn);
        } catch {
          /* a distributor outage shouldn't sink the batch */
        }
        try {
          const nx = await enrichByMpn(mpn);
          nexar = nx.enabled ? nx.enrichment : null;
        } catch {
          /* same */
        }
        const payload: DistributorPayload = { mpn, quotes, nexar };
        out.push({ url: `distributor-ingest://mpn/${encodeURIComponent(mpn)}`, contentType: "application/json", body: JSON.stringify(payload) });
        if (keyed && i < mpns.length - 1) await new Promise((r) => setTimeout(r, 250));
      }
      return out;
    },
    parse(raw: RawPayload): IngestRecord[] {
      let payload: DistributorPayload;
      try {
        payload = JSON.parse(raw.body) as DistributorPayload;
      } catch {
        return [];
      }
      const records: IngestRecord[] = [];
      for (const q of payload.quotes ?? []) {
        const r = liveQuoteToIdentityRecord(q);
        if (r) records.push(r);
      }
      if (payload.nexar) {
        const r = nexarEnrichmentToIdentityRecord(payload.nexar);
        if (r) records.push(r);
      }
      return mergeIdentityRecords(records);
    },
  };
}

/** True when any distributor client (Mouser/Digi-Key/Nexar) is configured. */
export function distributorClientsConfigured(): boolean {
  return liveDistributorsConfigured().length > 0 || nexarConfigured();
}
