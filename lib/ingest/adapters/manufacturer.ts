/**
 * Manufacturer product-page harvester (Sprint D4).
 *
 * A thin, branded layer over the schema.org/JSON-LD adapter (D1) tuned for MANUFACTURER
 * product pages — Eaton, Schneider, Siemens, ABB, Hubbell, Leviton, etc. The manufacturer
 * is the authoritative source for its own products' attributes, datasheets, and product
 * IMAGES, and (unlike third-party distributor catalog content) a manufacturer's own image
 * of its own product is redistributable, so D4 harvests accurate images here.
 *
 * This adds three things over the bare schema.org adapter: a curated brand → Wesco-segment
 * map (so a harvested record lands in the right segment), a manufacturer-appropriate
 * license note, and best-image resolution (handled in schemaProductToRecord via
 * lib/ingest/image). The harvest itself is the same renewable fetch → parse → gate →
 * snapshot → diff pipeline; sources are declared by the operator (dormant/$0 by default).
 */

import type { SourceAdapter } from "@/lib/ingest/source-adapter";
import { makeSchemaOrgAdapter } from "@/lib/ingest/adapters/schema-org-product";

/** A known manufacturer's default Wesco segment + display label. */
export interface ManufacturerInfo {
  segment: string;
  label: string;
}

/**
 * Curated registry of manufacturers Wesco carries → their primary segment. Used to place a
 * harvested record in the right segment and to validate operator-declared brands. Metadata
 * only (no URLs) — the operator supplies the product-page URLs. Aliases (Square D, Cutler-
 * Hammer) map to their parent brand's segment.
 */
export const MANUFACTURER_REGISTRY: Record<string, ManufacturerInfo> = {
  eaton: { segment: "EES", label: "Eaton" },
  "cutler-hammer": { segment: "EES", label: "Cutler-Hammer (Eaton)" },
  "schneider electric": { segment: "EES", label: "Schneider Electric" },
  "square d": { segment: "EES", label: "Square D (Schneider)" },
  siemens: { segment: "EES", label: "Siemens" },
  abb: { segment: "EES", label: "ABB" },
  "ge industrial": { segment: "EES", label: "GE Industrial" },
  hubbell: { segment: "EES", label: "Hubbell" },
  leviton: { segment: "EES", label: "Leviton" },
  legrand: { segment: "EES", label: "Legrand" },
  lutron: { segment: "EES", label: "Lutron" },
  nvent: { segment: "EES", label: "nVent" },
  "acuity brands": { segment: "UBS", label: "Acuity Brands" },
  panduit: { segment: "CSS", label: "Panduit" },
  commscope: { segment: "CSS", label: "CommScope" },
  corning: { segment: "CSS", label: "Corning" },
  "3m": { segment: "cross-segment", label: "3M" },
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "brand";

/** The known segment for a brand (case-insensitive), or "cross-segment" when unknown. */
export function segmentForBrand(brand: string): string {
  return MANUFACTURER_REGISTRY[brand.trim().toLowerCase()]?.segment ?? "cross-segment";
}

export interface ManufacturerAdapterConfig {
  brand: string;
  /** Manufacturer product-page URLs to harvest. */
  urls: string[];
  /** Override the segment (else derived from the registry). */
  segment?: string;
}

/** Build a manufacturer product-page harvest adapter (schema.org/JSON-LD + best images). */
export function makeManufacturerAdapter(config: ManufacturerAdapterConfig): SourceAdapter {
  const brand = config.brand.trim();
  return makeSchemaOrgAdapter({
    id: `manufacturer:${slug(brand)}`,
    label: `${brand} product pages`,
    segment: config.segment ?? segmentForBrand(brand),
    license:
      "Manufacturer product pages — factual specifications and the product images the manufacturer's own page references (a stored URL, not the bytes). No copyrighted marketing prose is ingested.",
    urls: config.urls,
    brandFallback: brand,
    dataTypes: ["attributes", "images", "datasheets", "manufacturer-entity", "gtin-identity"],
  });
}

/** Parse INGEST_MANUFACTURERS (JSON array of {brand, urls, segment?}) into configs. */
export function parseEnvManufacturers(raw: string | undefined): ManufacturerAdapterConfig[] {
  if (!raw || !raw.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: ManufacturerAdapterConfig[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const c = item as Record<string, unknown>;
    const brand = typeof c.brand === "string" ? c.brand.trim() : "";
    const urls = Array.isArray(c.urls) ? c.urls.filter((u): u is string => typeof u === "string") : [];
    if (!brand || urls.length === 0) continue; // nothing to harvest → skip
    out.push({ brand, urls, segment: typeof c.segment === "string" ? c.segment : undefined });
  }
  return out;
}
