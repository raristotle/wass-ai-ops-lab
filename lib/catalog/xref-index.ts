import { XREF_BRANDS, XREF_SOURCES, XREF_PACKED } from "@/data/real/xref-crosses";
import { identifierKey } from "@/lib/catalog/identifiers";

/**
 * Bulk cross-reference index — 539k real competitor→target cross pairs ingested from manufacturer
 * xref files (Hubbell, Eaton/Danfoss, Panduit, Leviton). Unlike the verified-cross engine (which
 * requires the target to be a STOCKED catalog product), this answers the rep's core question even
 * when we don't stock the target: "what does competitor part X cross to, and who says so."
 *
 * Lazy + cached on globalThis: the 25 MB packed string is parsed into a competitor-part → hits map
 * only on first lookup (the cross-match route), separate from the catalog. Hits per competitor part
 * are capped so one part can't blow up memory or the response.
 */

const TAB = String.fromCharCode(9);
const PER_KEY_CAP = 25;

export interface XrefHit {
  competitorBrand: string;
  competitorPart: string;
  targetBrand: string;
  targetPart: string;
  source: string;
  relation: "equivalent" | "functional-substitute";
}

const g = globalThis as unknown as { __xrefIndex?: Map<string, XrefHit[]> };

function index(): Map<string, XrefHit[]> {
  if (g.__xrefIndex) return g.__xrefIndex;
  const m = new Map<string, XrefHit[]>();
  if (XREF_PACKED) {
    for (const line of XREF_PACKED.split("\n")) {
      // cbIdx \t competitorPart \t tbIdx \t targetPart \t srcIdx \t rel
      const f = line.split(TAB);
      if (f.length < 6) continue;
      const key = identifierKey(f[1]);
      if (!key) continue;
      const existing = m.get(key);
      if (existing && existing.length >= PER_KEY_CAP) continue;
      const hit: XrefHit = {
        competitorBrand: XREF_BRANDS[Number(f[0])] ?? "—",
        competitorPart: f[1],
        targetBrand: XREF_BRANDS[Number(f[2])] ?? "—",
        targetPart: f[3],
        source: XREF_SOURCES[Number(f[4])] ?? "—",
        relation: f[5] === "e" ? "equivalent" : "functional-substitute",
      };
      if (existing) existing.push(hit);
      else m.set(key, [hit]);
    }
  }
  g.__xrefIndex = m;
  return m;
}

/** All ingested cross hits for a competitor/legacy part number (normalized), capped. */
export function lookupXref(part: string, limit = 8): XrefHit[] {
  const k = identifierKey(part);
  if (!k) return [];
  return (index().get(k) ?? []).slice(0, limit);
}

/** Number of distinct competitor parts indexed (for health/diagnostics). */
export function xrefIndexSize(): number {
  return index().size;
}
