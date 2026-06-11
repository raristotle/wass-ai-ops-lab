/**
 * lib/product-finder-synonyms.ts — trade-slang → catalog-term expansion.
 *
 * Pure data + a deterministic apply function. The NL search runs this FIRST so
 * counter slang ("romex", "gfi", "wire nut") resolves to the catalog's own
 * vocabulary, optionally tagging a subcategory filter chip.
 *
 * Every `subcategory` value must exist verbatim in ALL_SUBCATEGORIES
 * (lib/catalog/taxonomy.ts) — enforced by the unit tests.
 */

export interface SynonymEntry {
  /** Lowercase trade term; may be multi-word (matched on whole tokens). */
  term: string;
  /** Replacement text inserted into the search query. */
  text: string;
  /** Optional taxonomy subcategory this term implies (verbatim name). */
  subcategory?: string;
}

export const SYNONYMS: readonly SynonymEntry[] = [
  // Wire, cable & raceway
  { term: "romex", text: "NM-B", subcategory: "Wire & Cable" },
  { term: "thhn", text: "THHN", subcategory: "Wire & Cable" },
  { term: "emt", text: "EMT", subcategory: "Conduit" },
  { term: "lfmc", text: "LFMC Liquidtight", subcategory: "Flexible Conduit & Liquidtight" },
  { term: "sealtight", text: "LFMC Liquidtight", subcategory: "Flexible Conduit & Liquidtight" },
  // Devices & gear
  { term: "gfi", text: "GFCI" },
  { term: "wire nut", text: "Twist-On", subcategory: "Lugs & Wire Connectors" },
  { term: "wirenut", text: "Twist-On", subcategory: "Lugs & Wire Connectors" },
  { term: "panel board", text: "Panelboard", subcategory: "Panelboards" },
  { term: "load center", text: "Load Center", subcategory: "Load Centers" },
  { term: "breaker box", text: "Load Center", subcategory: "Load Centers" },
  { term: "xfmr", text: "transformer", subcategory: "Dry-Type Transformers" },
  { term: "ev charger", text: "EV Charging Station", subcategory: "EV Charging Stations" },
  { term: "photocell", text: "Photo Control", subcategory: "Photo Controls" },
  { term: "occ sensor", text: "Occupancy Sensor", subcategory: "Occupancy & Vacancy Sensors" },
  { term: "e-stop", text: "E-Stop", subcategory: "Push Buttons" },
  { term: "estop", text: "E-Stop", subcategory: "Push Buttons" },
  // Lighting
  { term: "exit sign", text: "LED Exit Sign", subcategory: "Exit & Emergency Lighting" },
  { term: "wall pack", text: "Wall Pack", subcategory: "Outdoor & Area Lighting" },
  { term: "high bay", text: "High Bay", subcategory: "High Bay Fixtures" },
  { term: "led tube", text: "LED T8", subcategory: "Lamps & Tubes" },
  // Datacom
  { term: "cat 6", text: "Cat6" },
  { term: "cat6", text: "Cat6" },
  { term: "cat 5e", text: "Cat5e" },
  { term: "cat5e", text: "Cat5e" },
  { term: "cat 6a", text: "Cat6A" },
  { term: "cat6a", text: "Cat6A" },
  { term: "poe", text: "PoE" },
  { term: "access point", text: "Wireless Access Point", subcategory: "Wireless Access Points" },
  { term: "battery backup", text: "UPS", subcategory: "UPS & Power Protection" },
  { term: "keystone", text: "Keystone Jack", subcategory: "Connectivity" },
  { term: "patch cable", text: "Patch Cord", subcategory: "Connectivity" },
  // Safety
  { term: "hard hat", text: "Hard Hat", subcategory: "Hard Hats" },
  { term: "hardhat", text: "Hard Hat", subcategory: "Hard Hats" },
  { term: "lockout", text: "lockout", subcategory: "Lockout/Tagout" },
  { term: "ear plugs", text: "Earplugs", subcategory: "Hearing Protection" },
  { term: "safety vest", text: "Vest", subcategory: "Hi-Vis Apparel" },
];

export interface AppliedSynonym {
  term: string;
  text: string;
  subcategory?: string;
}

/** Longest-term-first matching order: more tokens first, then longer string. */
const ORDERED_SYNONYMS: readonly SynonymEntry[] = [...SYNONYMS].sort((a, b) => {
  const at = a.term.split(/\s+/).length;
  const bt = b.term.split(/\s+/).length;
  if (at !== bt) return bt - at;
  return b.term.length - a.term.length;
});

/**
 * Replace trade-slang terms in `raw` with catalog vocabulary.
 *
 * - Case-insensitive, whole-word (token-exact), whitespace-normalized.
 * - Multi-token terms match a contiguous token window.
 * - Longest term wins; each entry applies at most once.
 * - Replacement tokens are never re-scanned (no synonym chains).
 *
 * Pure and deterministic — no Date.now/Math.random.
 */
export function applySynonyms(raw: string): { text: string; applied: AppliedSynonym[] } {
  const tokens = raw.split(/\s+/).filter(Boolean);
  // Parallel lock flags: true = token came from a replacement, never re-scan.
  let locked: boolean[] = tokens.map(() => false);
  let working: string[] = [...tokens];
  const applied: AppliedSynonym[] = [];

  for (const entry of ORDERED_SYNONYMS) {
    const termTokens = entry.term.split(/\s+/).filter(Boolean);
    const span = termTokens.length;
    for (let i = 0; i + span <= working.length; i++) {
      let matches = true;
      for (let j = 0; j < span; j++) {
        if (locked[i + j] || working[i + j].toLowerCase() !== termTokens[j]) {
          matches = false;
          break;
        }
      }
      if (!matches) continue;
      const replacement = entry.text.split(/\s+/).filter(Boolean);
      working = [...working.slice(0, i), ...replacement, ...working.slice(i + span)];
      locked = [...locked.slice(0, i), ...replacement.map(() => true), ...locked.slice(i + span)];
      applied.push(
        entry.subcategory !== undefined
          ? { term: entry.term, text: entry.text, subcategory: entry.subcategory }
          : { term: entry.term, text: entry.text },
      );
      break; // each entry applies at most once
    }
  }

  return { text: working.join(" "), applied };
}
