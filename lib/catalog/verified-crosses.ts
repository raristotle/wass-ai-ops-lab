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
  /** Attributes the source's table row states for the pair (amp rating, NEMA size...). */
  statedAttributes?: Record<string, string>;
  /** Registry id of the source this pair was extracted from (data/real/cross-source-registry). */
  sourceId?: string;
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
  /** Attributes the source's table row states for the pair, when provided. */
  statedAttributes?: Record<string, string>;
}

const normSpecName = (s: string) => s.trim().toLowerCase();
const normSpecValue = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Unit spellings that mean the same thing in spec text. */
const UNIT_SYNONYM: Record<string, string> = { vac: "v", volt: "v", volts: "v", amp: "a", amps: "a" };

/**
 * Canonical tokens: split digit↔letter boundaries ("15A" → "15 a"), map unit
 * synonyms ("125VAC" ≡ "125 V"), and depluralize words ("Terminals" ≡ "Terminal")
 * so formatting differences between two manufacturers' records don't read as
 * spec conflicts.
 */
function canonTokens(s: string): string[] {
  const spaced = normSpecValue(s)
    .replace(/(\d)([a-z])/g, "$1 $2")
    .replace(/([a-z])(\d)/g, "$1 $2");
  return (spaced.match(/[a-z0-9.]+/g) ?? []).map((t) => {
    const mapped = UNIT_SYNONYM[t] ?? t;
    return mapped.length >= 4 && mapped.endsWith("s") && !mapped.endsWith("ss") ? mapped.slice(0, -1) : mapped;
  });
}
const tokens = (s: string) => new Set(canonTokens(s));

/** Rating units where a substitute exceeding the original is acceptable. */
const SAFE_EXCEED_UNITS = new Set(["v", "vdc", "kv", "ka"]);

/** Pull adjacent (number, safe-unit) pairs out of a token list → unit→max + the rest. */
function splitRatings(toks: string[]): { ratings: Map<string, number>; rest: string[] } {
  const ratings = new Map<string, number>();
  const rest: string[] = [];
  for (let i = 0; i < toks.length; i++) {
    const n = Number(toks[i]);
    const u = toks[i + 1];
    if (Number.isFinite(n) && u !== undefined && SAFE_EXCEED_UNITS.has(u)) {
      ratings.set(u, Math.max(ratings.get(u) ?? 0, n));
      i += 1;
    } else {
      rest.push(toks[i]);
    }
  }
  return { ratings, rest };
}

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
 * Domain-aware value compatibility (a = original's value, b = substitute's):
 *  - exact (canonicalized) match — "15A" ≡ "15 A", "125VAC" ≡ "125 V";
 *  - token subset — "9A AC-3" is covered by "9A AC-3 / 25A AC-1";
 *  - numeric-range containment — a 120V coil is covered by a 100–250V coil
 *    (the range side's explicit lo–hi vs the other side's principal number);
 *  - safe-exceed ratings — a substitute whose voltage/interrupt rating is at
 *    least the original's ("250 Vac / 160 Vdc" covers "250 Vac / 125 Vdc");
 *    never applied to amperage, where ratings must match.
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
  const ra = splitRatings(canonTokens(a));
  const rb = splitRatings(canonTokens(b));
  if (ra.ratings.size > 0 && new Set(ra.rest).size === new Set(rb.rest).size && ra.rest.every((t) => rb.rest.includes(t))) {
    let ok = true;
    for (const [unit, n] of ra.ratings) {
      const sub = rb.ratings.get(unit);
      if (sub === undefined || sub < n) ok = false;
    }
    if (ok) return true;
  }
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
      if (e.statedAttributes) {
        // No stocked record to compare against, but the source row states attributes —
        // check them against the original so conflicts still surface.
        const stated = new Map(Object.entries(e.statedAttributes).map(([n, v]) => [normSpecName(n), { n, v }]));
        const matching: string[] = [];
        const conflicting: AttributeConflict[] = [];
        let hard = 0;
        for (const spec of product.specs) {
          const other = stated.get(normSpecName(spec.name));
          if (!other) continue;
          if (valuesCompatible(spec.value, other.v)) {
            matching.push(spec.name);
          } else {
            conflicting.push({ name: spec.name, original: spec.value, substitute: other.v });
            if (spec.isNonNeg) hard += 1;
          }
        }
        attrs = { matchingAttributes: matching, missingAttributes: [], conflictingAttributes: conflicting };
        if (conflicting.length > 0) {
          confidence -= Math.min(12, hard * 4);
          warnings.push(
            `Source-stated attribute differences: ${conflicting.map((c) => c.name).join(", ")} — verify before substituting`
          );
        }
      }
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
      ...(e.statedAttributes ? { statedAttributes: e.statedAttributes } : {}),
    };

    if (result.productionReady || opts?.includeReview) out.push(result);
  }

  return out.sort((a, b) => b.confidence - a.confidence);
}

/* ────────────────────────────────────────────────────────────────────────────
 * Conflict resolution — when sources contradict each other, one record wins.
 *
 * The rule (documented in docs/source-registry.md):
 *   1. Source authority      — manufacturer-cross > datasheet > distributor-cross > industry-table
 *   2. Source quality score  — the ingestion workbook's 0-100 quality score for the source
 *   3. Recency               — newer verifiedAt wins
 *   4. Specificity           — more stated attributes wins
 *   5. Deterministic tiebreak— lexicographic sourceUrl (stable builds)
 *
 * Two conflict classes:
 *   - duplicate pair: the same A↔B pair appears more than once → keep the winner only.
 *   - equivalent-claim conflict: the same origin product is claimed "equivalent" to two
 *     DIFFERENT MPNs of the same target brand → the winner keeps "equivalent"; losers are
 *     demoted to "functional-substitute" with a note, never silently dropped.
 * ──────────────────────────────────────────────────────────────────────────── */

export const SOURCE_PRIORITY: Record<CrossSourceKind, number> = {
  "manufacturer-cross": 4,
  datasheet: 3,
  "distributor-cross": 2,
  "industry-table": 1,
};

export interface CrossConflictResolution {
  /** Winning entries (equivalent-claim losers included, demoted to functional-substitute). */
  resolved: VerifiedCrossEntry[];
  dropped: { entry: VerifiedCrossEntry; winnerUrl: string; reason: string }[];
  demoted: { entry: VerifiedCrossEntry; winnerUrl: string; reason: string }[];
}

type QualityLookup = (sourceUrl: string) => number | null;

/** Higher = wins. Pure ordering used by both conflict classes. */
function compareEntries(a: VerifiedCrossEntry, b: VerifiedCrossEntry, quality?: QualityLookup): number {
  const prio = SOURCE_PRIORITY[a.sourceKind] - SOURCE_PRIORITY[b.sourceKind];
  if (prio !== 0) return prio;
  const qa = quality?.(a.sourceUrl) ?? 0;
  const qb = quality?.(b.sourceUrl) ?? 0;
  if (qa !== qb) return qa - qb;
  if (a.verifiedAt !== b.verifiedAt) return a.verifiedAt < b.verifiedAt ? -1 : 1;
  const sa = Object.keys(a.statedAttributes ?? {}).length;
  const sb = Object.keys(b.statedAttributes ?? {}).length;
  if (sa !== sb) return sa - sb;
  return b.sourceUrl.localeCompare(a.sourceUrl); // lexicographically smaller URL wins
}

const pairKey = (e: VerifiedCrossEntry) => {
  const ka = `${e.aBrand}|${identifierKey(e.aMpn)}`;
  const kb = `${e.bBrand}|${identifierKey(e.bMpn)}`;
  return ka < kb ? `${ka}↔${kb}` : `${kb}↔${ka}`;
};

export function resolveCrossConflicts(
  entries: readonly VerifiedCrossEntry[],
  opts?: { qualityScoreFor?: QualityLookup }
): CrossConflictResolution {
  const quality = opts?.qualityScoreFor;
  const dropped: CrossConflictResolution["dropped"] = [];
  const demoted: CrossConflictResolution["demoted"] = [];

  // 1. Duplicate pairs → keep the winner.
  const byPair = new Map<string, VerifiedCrossEntry[]>();
  for (const e of entries) {
    const k = pairKey(e);
    byPair.set(k, [...(byPair.get(k) ?? []), e]);
  }
  const winners: VerifiedCrossEntry[] = [];
  for (const group of byPair.values()) {
    const sorted = [...group].sort((a, b) => compareEntries(b, a, quality));
    const winner = sorted[0];
    winners.push(winner);
    for (const loser of sorted.slice(1)) {
      const relationConflict = loser.relation !== winner.relation;
      dropped.push({
        entry: loser,
        winnerUrl: winner.sourceUrl,
        reason: relationConflict
          ? `relation conflict (${loser.relation} vs ${winner.relation}) — resolved by source priority`
          : "duplicate pair — higher-priority source kept",
      });
    }
  }

  // 2. Conflicting "equivalent" claims: same origin → same target brand, different MPN,
  //    asserted by DIFFERENT sources. One source mapping many obsolete parts to a single
  //    replacement (or one origin to several variants) is normal guide structure, not a
  //    contradiction — only cross-source disagreement triggers resolution.
  //    Each pair makes two directional claims (a→bBrand and b→aBrand).
  const claims = new Map<string, { entry: VerifiedCrossEntry; targetMpn: string }[]>();
  for (const e of winners) {
    if (e.relation !== "equivalent") continue;
    const dirs = [
      { origin: `${e.aBrand}|${identifierKey(e.aMpn)}`, targetBrand: e.bBrand, targetMpn: e.bMpn },
      { origin: `${e.bBrand}|${identifierKey(e.bMpn)}`, targetBrand: e.aBrand, targetMpn: e.aMpn },
    ];
    for (const d of dirs) {
      const k = `${d.origin}→${d.targetBrand}`;
      claims.set(k, [...(claims.get(k) ?? []), { entry: e, targetMpn: d.targetMpn }]);
    }
  }
  const demote = new Map<VerifiedCrossEntry, string>(); // entry → winner url
  for (const [, group] of claims) {
    const distinctTargets = new Set(group.map((g) => identifierKey(g.targetMpn)));
    const distinctSources = new Set(group.map((g) => g.entry.sourceUrl));
    if (distinctTargets.size <= 1 || distinctSources.size <= 1) continue;
    const sorted = [...group].sort((a, b) => compareEntries(b.entry, a.entry, quality));
    const winner = sorted[0];
    for (const loser of sorted.slice(1)) {
      if (identifierKey(loser.targetMpn) === identifierKey(winner.targetMpn)) continue;
      // The winning source's own additional mappings are its assertion, not a conflict.
      if (loser.entry.sourceUrl === winner.entry.sourceUrl) continue;
      if (!demote.has(loser.entry)) demote.set(loser.entry, winner.entry.sourceUrl);
    }
  }

  const resolved = winners.map((e) => {
    const winnerUrl = demote.get(e);
    if (!winnerUrl) return e;
    const note = "demoted from 'equivalent': a higher-priority source names a different equivalent";
    demoted.push({ entry: e, winnerUrl, reason: note });
    return {
      ...e,
      relation: "functional-substitute" as CrossRelation,
      notes: e.notes ? `${e.notes}; ${note}` : note,
    };
  });

  return { resolved, dropped, demoted };
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
    // The same pair from DIFFERENT sources is conflict-resolution material, not
    // a structural problem; the same pair from the same source is redundant.
    const dupKey = `${ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`}@${e.sourceUrl}`;
    if (seen.has(dupKey)) problems.push(`${id}: duplicate pair from the same source`);
    seen.add(dupKey);
  }
  return problems;
}
