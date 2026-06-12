import type { RealProductEntry } from "@/lib/catalog/real";
import { isValidGtin } from "@/lib/catalog/identifiers";

/**
 * Record-level provenance assessment and the production gate.
 *
 * Scoring model (goal-mandated):
 *   ≥95  verified       — manufacturer/Wesco/datasheet-backed (link-verified)
 *   85–94 cross-checked — multiple reputable secondary sources
 *   70–84 partial       — single/partial source support
 *   <70  quarantined    — no usable provenance; never reaches production
 *
 * Only `productionReady` (verified, ≥95) records may surface as real
 * SKU-level data. Everything else is excluded from the verified catalog and
 * listed in the data-quality report.
 */

export type VerificationStatus = "verified" | "cross-checked" | "partial" | "quarantined";

export const PRODUCTION_CONFIDENCE = 95;

export interface ProvenanceAssessment {
  confidence: number;
  status: VerificationStatus;
  productionReady: boolean;
  /** Why the record scored the way it did. */
  reasons: string[];
  /** Optional fields the record lacks — feeds the data-quality report. */
  missingFields: string[];
}

function isHttpUrl(s: string | undefined): s is string {
  return typeof s === "string" && /^https?:\/\/\S+$/i.test(s);
}

export function assessRecord(e: RealProductEntry): ProvenanceAssessment {
  const reasons: string[] = [];
  const missingFields: string[] = [];

  const hasDatasheet = isHttpUrl(e.specSheetUrl);
  const hasProductPage = isHttpUrl(e.productUrl);
  const hasSourceUrl = isHttpUrl(e.sourceUrl);
  const hasPriceSource = typeof e.priceSource === "string" && e.priceSource.trim().length > 0;
  const hasVerifiedAt = /^\d{4}-\d{2}-\d{2}$/.test(e.verifiedAt ?? "");
  const gtinOk = e.gtin !== undefined && isValidGtin(e.gtin);

  let confidence: number;
  if (hasDatasheet && hasVerifiedAt) {
    // Manufacturer datasheet, link-verified at build time → verified tier.
    confidence = 95;
    reasons.push(`manufacturer datasheet link-verified ${e.verifiedAt}`);
    if (hasProductPage) {
      confidence += 2;
      reasons.push("manufacturer/Wesco product page on record");
    }
    if (e.wescoSku) {
      confidence += 1;
      reasons.push("Wesco SKU on record");
    }
    if (gtinOk) {
      confidence += 1;
      reasons.push("validated GTIN");
    }
    if (e.catalogNumber) confidence += 0.5;
    confidence = Math.min(99, confidence);
  } else if ((hasProductPage || hasSourceUrl) && hasPriceSource) {
    // Two independent secondary sources, no verified datasheet.
    confidence = 88;
    reasons.push("multiple secondary sources (product page + price observation)");
  } else if (hasDatasheet || hasProductPage || hasSourceUrl || hasPriceSource) {
    confidence = 75;
    reasons.push("single-source support only");
  } else {
    confidence = 40;
    reasons.push("no source provenance — quarantined");
  }

  if (!hasDatasheet) missingFields.push("specSheetUrl");
  if (!hasProductPage) missingFields.push("productUrl");
  if (!e.wescoSku) missingFields.push("wescoSku");
  if (!e.catalogNumber) missingFields.push("catalogNumber");
  if (e.gtin === undefined) missingFields.push("gtin");
  else if (!gtinOk) {
    // An invalid GTIN is a data-integrity failure, not a missing field.
    confidence = Math.min(confidence, 69);
    reasons.push("invalid GTIN check digit — quarantined for review");
  }
  if (!e.parentCompany) missingFields.push("parentCompany");

  const status: VerificationStatus =
    confidence >= PRODUCTION_CONFIDENCE
      ? "verified"
      : confidence >= 85
        ? "cross-checked"
        : confidence >= 70
          ? "partial"
          : "quarantined";

  return {
    confidence,
    status,
    productionReady: status === "verified",
    reasons,
    missingFields,
  };
}

export interface CatalogAssessment {
  total: number;
  productionReady: RealProductEntry[];
  belowThreshold: { entry: RealProductEntry; assessment: ProvenanceAssessment }[];
}

/** Split a dataset into production-ready records and the quarantine/review list. */
export function assessCatalog(entries: readonly RealProductEntry[]): CatalogAssessment {
  const productionReady: RealProductEntry[] = [];
  const belowThreshold: CatalogAssessment["belowThreshold"] = [];
  for (const entry of entries) {
    const assessment = assessRecord(entry);
    if (assessment.productionReady) productionReady.push(entry);
    else belowThreshold.push({ entry, assessment });
  }
  return { total: entries.length, productionReady, belowThreshold };
}
