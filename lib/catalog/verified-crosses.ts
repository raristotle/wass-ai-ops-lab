import type { CatalogProduct } from "@/features/product-finder/types";
import { identifierKey } from "@/lib/catalog/identifiers";
import { PRODUCTION_CONFIDENCE } from "@/lib/catalog/provenance";

/**
 * Source-backed cross-reference engine.
 *
 * Unlike the simulated equivalence engine (spec-similarity over the synthetic
 * catalog), every pair here is backed by a citable source — a manufacturer
 * cross tool, datasheet, or published cross table. The engine adds the
 * explainable layer: attribute agreement, gaps, conflicts, confidence, and
 * warnings. Pairs are data (data/real/verified-crosses.ts), researched and
 * link-verified — never generated.
 */

export type CrossSourceKind =
  | "manufacturer-cross" // the manufacturer's own cross/substitution tool or doc
  | "datasheet"          // equivalence stated on a datasheet/catalog page
  | "distributor-cross"  // authorized distributor cross table
  | "industry-table";    // reputable published industry cross table

export type CrossRelation = "equivalent" | "functional-substitute";

export interface VerifiedCrossEntry {
  aBrand: string;
  aMpn: string;
  bBrand: string;
  bMpn: string;
  relation: CrossRelation;
  sourceKind: CrossSourceKind;
  /** The page/document that states this cross — link-verified at research time. */
  sourceUrl: string;
  notes?: string;
  verifiedAt: string; // YYYY-MM-DD
}

/** Base confidence by source authority (goal's scoring model). */
export const SOURCE_CONFIDENCE: Record<CrossSourceKind, number> = {
  "manufacturer-cross": 97,
  datasheet: 96,
  "distributor-cross": 88,
  "industry-table": 86,
};

export interface AttributeConflict {
  name: string;
  original: string;
  substitute: string;
}

export interface VerifiedCrossResult {
  originalSku: string;
  substituteSku: string;
  substituteBrand: string;
  relation: CrossRelation;
  /** Resolved catalog product for the substitute, when we stock it. */
  substituteProduct: CatalogProduct | null;
  matchReason: string;
  matchingAttributes: string[];
  missingAttributes: string[];
  conflictingAttributes: AttributeConflict[];
  sourceKind: CrossSourceKind;
  sourceUrl: string;
  confidence: number;
  warnings: string[];
  productionReady: boolean;
}

const normSpecName = (s: string) => s.trim().toLowerCase();
const normSpecValue = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const tokens = (s: string) => new Set(normSpecValue(s).match(/[a-z0-9.]+/g) ?? []);

/** The explicit hyphenated range in a value ("100-250v ac/dc" → [100, 250]). */
function explicitRange(s: string): [number, number] | null {
  const m = /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/.exec(s);
  if (!m) return null;
  const lo = Number(m[1]);
  const hi = Number(m[2]);
  return lo < hi ? [lo, hi] : null;
}

/** The principal magnitude of a value — its first number ("120VAC 50/60Hz" → 120). */
function principalNumber(s: string): number | null {
  const m = /(\d+(?:\.\d+)?)/.exec(s);
  return m ? Number(m[1]) : null;
}

/**
 * Domain-aware value compatibility:
 *  - exact (normalized) match;
 *  - token subset — "9A AC-3" is covered by "9A AC-3 / 25A AC-1";
 *  - numeric-range containment — a 120V coil is covered by a 100–250V coil
 *    (the range side's explicit lo–hi vs the other side's principal number).
 */
export function valuesCompatible(a: string, b: string): boolean {
  const na = normSpecValue(a);
  const nb = normSpecValue(b);
  if (na === nb) return true;
  const ta = tokens(a);
  const tb = tokens(b);
  if ([...ta].every((t) => tb.has(t)) || [...tb].every((t) => ta.has(t))) return true;
  const rangeA = explicitRange(na);
  const rangeB = explicitRange(nb);
  const pA = principalNumber(na);
  const pB = principalNumber(nb);
  if (rangeA && pB !== null && pB >= rangeA[0] && pB <= rangeA[1]) return true;
  if (rangeB && pA !== null && pA >= rangeB[0] && pA <= rangeB[1]) return true;
  return false;
}

interface AttributeComparison
  extends Pick<VerifiedCrossResult, "matchingAttributes" | "missingAttributes" | "conflictingAttributes"> {
  /** Conflicts on non-negotiable specs — these reduce confidence. */
  hardConflicts: number;
}

function compareAttributes(original: CatalogProduct, substitute: CatalogProduct): AttributeComparison {
  const subSpecs = new Map(substitute.specs.map((s) => [normSpecName(s.name), s]));
  const matching: string[] = [];
  const missing: string[] = [];
  const conflicting: AttributeConflict[] = [];
  let hardConflicts = 0;
  for (const spec of original.specs) {
    const other = subSpecs.get(normSpecName(spec.name));
    if (!other) {
      // Only gaps in non-negotiable attributes are worth flagging.
      if (spec.isNonNeg) missing.push(spec.name);
      continue;
    }
    if (valuesCompatible(spec.value, other.value)) {
      matching.push(spec.name);
    } else {
      conflicting.push({ name: spec.name, original: spec.value, substitute: other.value });
      if (spec.isNonNeg) hardConflicts += 1;
    }
  }
  return { matchingAttributes: matching, missingAttributes: missing, conflictingAttributes: conflicting, hardConflicts };
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
 * All source-backed crosses for a product. `resolve` looks a (brand, mpn)
 * pair up in the live catalog (null = we don't stock the substitute).
 * Production callers get only `productionReady` results unless
 * `includeReview` is set (reports/manual review want everything).
 */
export function verifiedCrossesFor(
  product: CatalogProduct,
  entries: readonly VerifiedCrossEntry[],
  resolve: (brand: string, mpn: string) => CatalogProduct | null,
  opts?: { includeReview?: boolean }
): VerifiedCrossResult[] {
  const key = identifierKey(product.sku);
  const out: VerifiedCrossResult[] = [];

  for (const e of entries) {
    let subBrand: string;
    let subMpn: string;
    if (identifierKey(e.aMpn) === key) {
      subBrand = e.bBrand;
      subMpn = e.bMpn;
    } else if (identifierKey(e.bMpn) === key) {
      subBrand = e.aBrand;
      subMpn = e.aMpn;
    } else {
      continue;
    }

    const substituteProduct = resolve(subBrand, subMpn);
    const warnings: string[] = [];
    let confidence = SOURCE_CONFIDENCE[e.sourceKind];

    let attrs: Pick<
      VerifiedCrossResult,
      "matchingAttributes" | "missingAttributes" | "conflictingAttributes"
    > = { matchingAttributes: [], missingAttributes: [], conflictingAttributes: [] };

    if (substituteProduct) {
      const cmp = compareAttributes(product, substituteProduct);
      attrs = cmp;
      if (cmp.conflictingAttributes.length > 0) {
        // Only genuine conflicts on non-negotiable specs cut confidence;
        // negotiable differences warn without disqualifying a documented cross.
        confidence -= Math.min(12, cmp.hardConflicts * 4);
        warnings.push(
          `Attribute differences: ${cmp.conflictingAttributes.map((c) => c.name).join(", ")} — verify before substituting`
        );
      }
      if (attrs.missingAttributes.length > 0) {
        warnings.push(`Substitute record does not state: ${attrs.missingAttributes.join(", ")}`);
      }
    } else {
      warnings.push("Substitute is documented but not in the stocked catalog — availability unknown");
    }
    if (e.notes) warnings.push(`Source qualifier: ${e.notes}`);

    const result: VerifiedCrossResult = {
      originalSku: product.sku,
      substituteSku: subMpn,
      substituteBrand: subBrand,
      relation: e.relation,
      substituteProduct,
      matchReason: `${RELATION_LABEL[e.relation]} per ${SOURCE_LABEL[e.sourceKind]}${e.notes ? ` — ${e.notes}` : ""}`,
      ...attrs,
      sourceKind: e.sourceKind,
      sourceUrl: e.sourceUrl,
      confidence,
      warnings,
      productionReady: confidence >= PRODUCTION_CONFIDENCE,
    };

    if (result.productionReady || opts?.includeReview) out.push(result);
  }

  return out.sort((a, b) => b.confidence - a.confidence);
}

/** Structural validation for the shipped cross dataset (used by tests + reports). */
export function validateCrossEntries(entries: readonly VerifiedCrossEntry[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    const ka = identifierKey(e.aMpn);
    const kb = identifierKey(e.bMpn);
    const id = `${e.aBrand}|${ka}↔${e.bBrand}|${kb}`;
    if (ka.length === 0 || kb.length === 0) problems.push(`${id}: empty identifier`);
    if (ka === kb && e.aBrand === e.bBrand) problems.push(`${id}: self-cross`);
    if (!/^https:\/\/\S+$/i.test(e.sourceUrl)) problems.push(`${id}: sourceUrl must be https`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.verifiedAt)) problems.push(`${id}: bad verifiedAt`);
    const dupKey = [Math.min(ka.localeCompare(kb), 0) <= 0 ? `${ka}|${kb}` : `${kb}|${ka}`].join();
    if (seen.has(dupKey)) problems.push(`${id}: duplicate pair`);
    seen.add(dupKey);
  }
  return problems;
}
