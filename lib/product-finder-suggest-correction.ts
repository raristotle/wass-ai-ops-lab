/**
 * lib/product-finder-suggest-correction.ts — "did you mean…?" typo correction.
 *
 * Builds a vocabulary from the taxonomy (subcategories, brands, category
 * labels) plus a hand-picked list of trade terms, then suggests the nearest
 * vocabulary word for misspelled query tokens via Levenshtein distance.
 *
 * Imports ONLY lib/catalog/taxonomy — never the catalog generator — so the
 * module stays cheap to load. Pure and deterministic throughout.
 */

import { ALL_SUBCATEGORIES, ALL_BRANDS, CATEGORY_META, CATEGORIES } from "@/lib/catalog/taxonomy";

/** Result totals below this are "near zero" — eligible for a suggestion. */
export const NEAR_ZERO_RESULTS = 3;

/** Common trade words a distributor counter hears all day. */
export const COMMON_TERMS: readonly string[] = [
  "amp", "ballast", "breaker", "cable", "camera", "conduit", "connector",
  "contactor", "dimmer", "disconnect", "driver", "enclosure", "fitting",
  "fixture", "fuse", "gauge", "gfci", "keystone", "lamp", "lug", "outlet",
  "panel", "plug", "receptacle", "relay", "sensor", "speaker", "switch",
  "transformer", "troffer", "volt", "watt", "wire",
];

/** Lowercase, strip punctuation/"&", keep alphanumeric tokens ≥ 3 chars. */
function tokenize(source: string): string[] {
  return source
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
}

/**
 * Build the correction vocabulary: subcategory words + brand words +
 * category display names + COMMON_TERMS. Sorted for determinism.
 */
export function buildVocabulary(): string[] {
  const words = new Set<string>();
  for (const sub of ALL_SUBCATEGORIES) for (const t of tokenize(sub)) words.add(t);
  for (const brand of ALL_BRANDS) for (const t of tokenize(brand)) words.add(t);
  for (const cat of CATEGORIES) for (const t of tokenize(CATEGORY_META[cat].label)) words.add(t);
  for (const term of COMMON_TERMS) words.add(term.toLowerCase());
  return [...words].sort();
}

let memoVocabulary: readonly string[] | null = null;

/** Module-level memo of buildVocabulary(). */
export function getVocabulary(): readonly string[] {
  if (memoVocabulary === null) memoVocabulary = buildVocabulary();
  return memoVocabulary;
}

/**
 * Levenshtein edit distance. Early-exits with a value > 2 when the strings
 * can't be within distance 2 (length gap) or the running minimum exceeds 2.
 */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;
  if (Math.abs(la - lb) > 2) return Math.abs(la - lb); // can't be ≤ 2

  let prev: number[] = Array.from({ length: lb + 1 }, (_, j) => j);
  for (let i = 1; i <= la; i++) {
    const curr: number[] = [i];
    let rowMin = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      curr.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > 2) return rowMin; // early exit — caller only cares about ≤ 2
    prev = curr;
  }
  return prev[lb];
}

/** Allowed edit distance by token length: ≤3 → 0, 4–6 → 1, ≥7 → 2. */
export function maxDistanceFor(term: string): 0 | 1 | 2 {
  if (term.length <= 3) return 0;
  if (term.length <= 6) return 1;
  return 2;
}

export interface Correction {
  corrected: string;
  confident: boolean;
}

/**
 * Suggest a corrected query, or null when no token can be improved.
 *
 * Per token (whitespace-split):
 * - tokens containing digits are skipped (specs like "20A", "12-2"),
 * - tokens already in the vocabulary are skipped,
 * - the nearest vocabulary word within maxDistanceFor(token) is chosen:
 *   a unique strict best → confident; a tie at the best distance → the
 *   lexicographically-first word, non-confident.
 *
 * The overall result is confident only when at least one token was corrected
 * and ALL corrected tokens were confident.
 */
export function suggestCorrection(
  query: string,
  vocabulary: readonly string[] = getVocabulary(),
): Correction | null {
  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const vocabSet = new Set(vocabulary);
  let correctedAny = false;
  let allConfident = true;

  const outTokens = tokens.map((token) => {
    if (/\d/.test(token)) return token;
    const lower = token.toLowerCase();
    if (vocabSet.has(lower)) return token;
    const maxD = maxDistanceFor(lower);
    if (maxD === 0) return token;

    let bestDist = maxD + 1;
    let bestWords: string[] = [];
    for (const word of vocabulary) {
      const d = editDistance(lower, word);
      if (d < bestDist) {
        bestDist = d;
        bestWords = [word];
      } else if (d === bestDist) {
        bestWords.push(word);
      }
    }
    if (bestDist > maxD || bestWords.length === 0) return token;

    correctedAny = true;
    if (bestWords.length === 1) return bestWords[0];
    allConfident = false;
    return [...bestWords].sort()[0]; // tie → lexicographically first
  });

  if (!correctedAny) return null;
  const corrected = outTokens.join(" ");
  if (corrected === query) return null;
  return { corrected, confident: allConfident };
}
