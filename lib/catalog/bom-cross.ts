import type { CatalogProduct } from "@/features/product-finder/types";
import {
  SOURCE_CONFIDENCE,
  type VerifiedCrossEntry,
  type CrossRelation,
  type CrossSourceKind,
} from "@/lib/catalog/verified-crosses";
import { PRODUCTION_CONFIDENCE } from "@/lib/catalog/provenance";
import { identifierKey } from "@/lib/catalog/identifiers";

/**
 * Competitor-BOM cross conversion — when a pasted BOM line carries a
 * competitor's part number that our verified cross dataset documents, suggest
 * the stocked equivalent with its source citation. Only production-grade
 * (≥95-confidence source) crosses are suggested; nothing is inferred from
 * similarity here — every suggestion cites the document that states it.
 */

export interface BomCrossSuggestion {
  /** The competitor part the BOM line named. */
  fromBrand: string;
  fromMpn: string;
  /** The stocked verified/curated equivalent we carry. */
  product: CatalogProduct;
  relation: CrossRelation;
  sourceKind: CrossSourceKind;
  sourceUrl: string;
  confidence: number;
  matchReason: string;
  notes?: string;
  /** True when the named part itself is also stocked (search will find it directly). */
  originStocked: boolean;
}

const RELATION_LABEL: Record<CrossRelation, string> = {
  equivalent: "Documented equivalent",
  "functional-substitute": "Documented functional substitute",
};
const SOURCE_LABEL: Record<CrossSourceKind, string> = {
  "manufacturer-cross": "manufacturer cross-reference",
  datasheet: "manufacturer datasheet/catalog",
  "distributor-cross": "authorized distributor cross table",
  "industry-table": "published industry cross table",
};

/**
 * Tokens of a BOM-line query that could be part numbers: contain a digit,
 * at least 4 identifier characters, not a pure quantity/dimension word.
 * Longest candidates first so "100-C09D10" beats "100".
 */
export function extractMpnCandidates(query: string): string[] {
  const tokens = query.split(/[\s,;]+/).filter(Boolean);
  const out: string[] = [];
  for (const t of tokens) {
    const key = identifierKey(t);
    if (key.length < 4) continue;
    if (!/\d/.test(key)) continue;
    if (/^\d+(X\d+)?$/.test(key)) continue; // bare numbers / dimensions like 12X12
    out.push(t);
  }
  return out.sort((a, b) => identifierKey(b).length - identifierKey(a).length);
}

/**
 * Find the best stocked cross for a BOM-line query.
 *
 * @param query    The parsed BOM line query text.
 * @param entries  Conflict-RESOLVED cross entries.
 * @param resolve  (brand, mpn) → stocked verified/curated product or null.
 */
export function findCrossSuggestion(
  query: string,
  entries: readonly VerifiedCrossEntry[],
  resolve: (brand: string, mpn: string) => CatalogProduct | null,
  anyStocked?: (mpn: string) => boolean
): BomCrossSuggestion | null {
  for (const candidate of extractMpnCandidates(query)) {
    const key = identifierKey(candidate);
    let best: BomCrossSuggestion | null = null;
    for (const e of entries) {
      let from: { brand: string; mpn: string };
      let to: { brand: string; mpn: string };
      if (identifierKey(e.aMpn) === key) {
        from = { brand: e.aBrand, mpn: e.aMpn };
        to = { brand: e.bBrand, mpn: e.bMpn };
      } else if (identifierKey(e.bMpn) === key) {
        from = { brand: e.bBrand, mpn: e.bMpn };
        to = { brand: e.aBrand, mpn: e.aMpn };
      } else {
        continue;
      }
      const confidence = SOURCE_CONFIDENCE[e.sourceKind];
      if (confidence < PRODUCTION_CONFIDENCE) continue; // production path only
      const product = resolve(to.brand, to.mpn);
      if (!product) continue;
      const suggestion: BomCrossSuggestion = {
        fromBrand: from.brand,
        fromMpn: from.mpn,
        product,
        relation: e.relation,
        sourceKind: e.sourceKind,
        sourceUrl: e.sourceUrl,
        confidence,
        matchReason: `${RELATION_LABEL[e.relation]} per ${SOURCE_LABEL[e.sourceKind]}`,
        ...(e.notes ? { notes: e.notes } : {}),
        originStocked: anyStocked ? anyStocked(from.mpn) : false,
      };
      // Prefer "equivalent" over "functional-substitute", then higher confidence.
      if (
        !best ||
        (suggestion.relation === "equivalent" && best.relation !== "equivalent") ||
        (suggestion.relation === best.relation && suggestion.confidence > best.confidence)
      ) {
        best = suggestion;
      }
    }
    if (best) return best; // longest matching candidate wins
  }
  return null;
}
