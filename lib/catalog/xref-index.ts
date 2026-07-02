import { XREF_BRANDS, XREF_SOURCES, XREF_PACKED } from "@/data/real/xref-crosses";
import { identifierKey } from "@/lib/catalog/identifiers";

/**
 * Bulk cross-reference index — 766k real competitor→target cross pairs ingested from manufacturer
 * xref files + PDF guides (Hubbell, Eaton/Danfoss, Panduit, Leviton, 3M, Ferraz, RFI, …). Unlike the
 * verified-cross engine (which requires the target to be a STOCKED catalog product), this answers
 * the rep's core question even when we don't stock the target: "what does part X cross to, and who
 * says so."
 *
 * BIDIRECTIONAL (B1): the raw rows are competitor→target, but a rep just as often knows the
 * target/stocked number and wants the competitor equivalents. We build TWO maps in one parse pass —
 * a forward map keyed on the competitor part and a reverse map keyed on the target part — so a
 * lookup resolves no matter which side of the equivalence the rep types. Each returned hit is tagged
 * `matchedAs` so the UI can phrase it correctly ("crosses to" vs "is crossed to by").
 *
 * CONFIDENCE (B2): every hit carries its documented `relation` (equivalent vs functional-substitute),
 * the real per-pair confidence signal already in the data. `crossRelationMeta()` turns it into a
 * banded chip. (Per-pair source corroboration count is NOT available here — pairs were deduped to a
 * single source at ingest; retaining multiplicity would require regenerating xref-crosses.ts.)
 *
 * Lazy + cached on globalThis: the ~35 MB packed string is parsed only on first lookup, separate
 * from the catalog. Hits per key are capped so one part can't blow up memory or the response. The
 * one-time build cost + row count are recorded for the health endpoint (B5).
 */

const TAB = String.fromCharCode(9);
const PER_KEY_CAP = 25;

export type CrossDirection = "competitor" | "target";

export interface XrefHit {
  competitorBrand: string;
  competitorPart: string;
  targetBrand: string;
  targetPart: string;
  source: string;
  relation: "equivalent" | "functional-substitute";
  /** Which side of the pair the query matched: "competitor" = you searched the competitor part and
   *  this is what it crosses TO; "target" = you searched the stocked/target part and this competitor
   *  part crosses to it. */
  matchedAs: CrossDirection;
}

interface XrefState {
  forward: Map<string, XrefHit[]>; // competitor key → hits (matchedAs "competitor")
  reverse: Map<string, XrefHit[]>; // target key → hits (matchedAs "target")
  rows: number;
  buildMs: number;
}

const g = globalThis as unknown as { __xrefState?: XrefState };

function build(): XrefState {
  if (g.__xrefState) return g.__xrefState;
  const startedAt = Date.now();
  const forward = new Map<string, XrefHit[]>();
  const reverse = new Map<string, XrefHit[]>();
  let rows = 0;
  if (XREF_PACKED) {
    for (const line of XREF_PACKED.split("\n")) {
      // cbIdx \t competitorPart \t tbIdx \t targetPart \t srcIdx \t rel
      const f = line.split(TAB);
      if (f.length < 6) continue;
      const compKey = identifierKey(f[1]);
      const tgtKey = identifierKey(f[3]);
      if (!compKey || !tgtKey) continue;
      rows++;
      const competitorBrand = XREF_BRANDS[Number(f[0])] ?? "—";
      const competitorPart = f[1];
      const targetBrand = XREF_BRANDS[Number(f[2])] ?? "—";
      const targetPart = f[3];
      const source = XREF_SOURCES[Number(f[4])] ?? "—";
      const relation = f[5] === "e" ? "equivalent" : "functional-substitute";

      const fwd = forward.get(compKey);
      if (!fwd || fwd.length < PER_KEY_CAP) {
        const hit: XrefHit = { competitorBrand, competitorPart, targetBrand, targetPart, source, relation, matchedAs: "competitor" };
        if (fwd) fwd.push(hit);
        else forward.set(compKey, [hit]);
      }
      const rev = reverse.get(tgtKey);
      if (!rev || rev.length < PER_KEY_CAP) {
        const hit: XrefHit = { competitorBrand, competitorPart, targetBrand, targetPart, source, relation, matchedAs: "target" };
        if (rev) rev.push(hit);
        else reverse.set(tgtKey, [hit]);
      }
    }
  }
  const state: XrefState = { forward, reverse, rows, buildMs: Date.now() - startedAt };
  g.__xrefState = state;
  return state;
}

/**
 * All ingested cross hits for a part number (normalized), capped. Resolves BOTH directions:
 * competitor→target matches first (matchedAs "competitor"), then target→competitor matches
 * (matchedAs "target") so a rep who types the stocked/target number still gets answers.
 */
export function lookupXref(part: string, limit = 8): XrefHit[] {
  const k = identifierKey(part);
  if (!k) return [];
  const st = build();
  const fwd = st.forward.get(k) ?? [];
  if (fwd.length >= limit) return fwd.slice(0, limit);
  // Fill the remainder with reverse matches the forward direction didn't already cover.
  const seen = new Set(fwd.map((h) => identifierKey(h.targetPart)));
  const rev = (st.reverse.get(k) ?? []).filter((h) => !seen.has(identifierKey(h.competitorPart)));
  return [...fwd, ...rev].slice(0, limit);
}

/** Number of distinct part keys indexed across both directions (for health/diagnostics). */
export function xrefIndexSize(): number {
  const st = build();
  return st.forward.size + st.reverse.size;
}

/** Index build cost + row count, for the health endpoint's cold-start metric (B5). */
export function xrefIndexStats(): { rows: number; keys: number; buildMs: number } {
  const st = build();
  return { rows: st.rows, keys: st.forward.size + st.reverse.size, buildMs: st.buildMs };
}

/**
 * Build stats ONLY if the index has already been parsed on this instance — returns null otherwise.
 * The health probe uses this so it never triggers the ~35MB parse itself; after the first real
 * cross-match request builds the index, health surfaces the one-time cold-start cost (B5).
 */
export function xrefIndexStatsIfBuilt(): { rows: number; keys: number; buildMs: number } | null {
  const st = g.__xrefState;
  if (!st) return null;
  return { rows: st.rows, keys: st.forward.size + st.reverse.size, buildMs: st.buildMs };
}

/**
 * Banded confidence chip for a documented cross relation (B2). "Equivalent" is a drop-in documented
 * replacement; "functional-substitute" performs the same function but confirm the flagged specs.
 * Colors are Meridian brand tertiaries (WCAG-safe on white).
 */
export function crossRelationMeta(relation: XrefHit["relation"]): { label: string; color: string; blurb: string } {
  return relation === "equivalent"
    ? { label: "Documented equivalent", color: "#00573F", blurb: "Manufacturer-documented drop-in equivalent." }
    : { label: "Functional substitute", color: "#004986", blurb: "Performs the same function — confirm the application-critical specs before substituting." };
}
