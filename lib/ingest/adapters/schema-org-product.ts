/**
 * Reference Source Adapter (Sprint D1): schema.org / JSON-LD `Product` pages.
 *
 * This is the canonical adapter the framework ships with — most manufacturer and
 * distributor product pages embed a JSON-LD `Product` block server-side, so a single
 * configurable adapter covers a large slice of Group A/B/D sources with no per-site
 * scraping code. Point it at a set of product-page URLs; it fetches each politely and
 * parses the structured data into {@link IngestRecord}s. `parse()` is PURE — fed raw
 * HTML it needs no network, so it is fully unit-tested with fixtures.
 *
 * Confidence: official structured data carrying a manufacturer part number or GTIN is
 * authoritative, so it scores at/above the production floor; a node with only a name
 * scores below it and is honestly dropped by the gate.
 */

import type {
  AdapterContext,
  IngestDataType,
  IngestRecord,
  RawPayload,
  SourceAdapter,
} from "@/lib/ingest/source-adapter";
import { PRODUCTION_CONFIDENCE } from "@/lib/catalog/provenance";
import { normalizeGtin } from "@/lib/catalog/identifiers";
import { productsFromHtml, type SchemaProduct } from "@/lib/ingest/fetcher";
import { pickBestImage } from "@/lib/ingest/image";
import { LIFECYCLE_ATTRIBUTE } from "@/lib/ingest/lifecycle";

export interface SchemaOrgAdapterConfig {
  /** Stable id (snapshot namespace), e.g. "schema-org:eaton". */
  id: string;
  label: string;
  segment: string;
  license: string;
  /** Product-page URLs to harvest. */
  urls: string[];
  /** Brand to stamp when a page's JSON-LD omits it (e.g. a single-brand site). */
  brandFallback?: string;
  /** Which data types this configured instance contributes (defaults inferred). */
  dataTypes?: IngestDataType[];
}

/**
 * Score a parsed schema.org product. Authoritative identity (an mpn or a CHECK-DIGIT-VALID
 * gtin) clears the production floor; a sku alone is one below it (mergeable but flagged for
 * review); a node with neither — or whose only "gtin" fails GS1 validation — is well under
 * the floor and the gate drops it. An invalid GTIN never lifts a record to authoritative.
 */
export function scoreSchemaProduct(p: SchemaProduct): number {
  const validGtin = p.gtin ? normalizeGtin(p.gtin) !== null : false;
  if (validGtin || p.mpn) return PRODUCTION_CONFIDENCE + 1; // 96 — authoritative key
  if (p.sku) return PRODUCTION_CONFIDENCE - 5; // 90 — identifiable but unkeyed → dropped
  return 40; // name only (or unverifiable code only) → dropped
}

/** Map one parsed schema.org product to an IngestRecord stamped with its source URL. The
 *  image is resolved to an absolute, non-placeholder URL against the page it came from. */
export function schemaProductToRecord(
  p: SchemaProduct,
  sourceUrl: string,
  brandFallback?: string,
): IngestRecord {
  const pageUrl = p.url ?? sourceUrl;
  // Carry a lifecycle signal (e.g. "Discontinued") and certifications/approvals (D6) as
  // factual attributes so they flow through the gate, the D2 backbone, and the renewable
  // diff like any other spec.
  const attributes = [...p.attributes];
  if (p.lifecycle) attributes.push({ name: LIFECYCLE_ATTRIBUTE, value: p.lifecycle });
  if (p.certifications && p.certifications.length) attributes.push({ name: "Certifications", value: p.certifications.join(", ") });
  return {
    sku: p.sku,
    mpn: p.mpn,
    gtin: p.gtin,
    brand: p.brand ?? brandFallback,
    attributes: attributes.length ? attributes : undefined,
    imageUrl: pickBestImage(p.images ?? [], pageUrl),
    sourceUrl: pageUrl,
    confidence: scoreSchemaProduct(p),
  };
}

/** Build a renewable schema.org/JSON-LD product adapter from a URL list. */
export function makeSchemaOrgAdapter(config: SchemaOrgAdapterConfig): SourceAdapter {
  return {
    id: config.id,
    label: config.label,
    segment: config.segment,
    license: config.license,
    dataTypes: config.dataTypes ?? ["attributes", "images", "manufacturer-entity", "gtin-identity"],
    async fetch(ctx: AdapterContext): Promise<RawPayload[]> {
      const out: RawPayload[] = [];
      for (const url of config.urls) {
        // One bad URL shouldn't sink the batch — skip it; runAdapter still reports counts.
        try {
          out.push(await ctx.get(url));
        } catch {
          /* skip unreachable page; a future enhancement can surface per-URL errors */
        }
      }
      return out;
    },
    parse(raw: RawPayload): IngestRecord[] {
      return productsFromHtml(raw.body).map((p) => schemaProductToRecord(p, raw.url, config.brandFallback));
    },
  };
}
