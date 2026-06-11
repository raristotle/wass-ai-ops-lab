/**
 * lib/product-finder-voice.ts — speech-transcript normalization for voice search.
 *
 * Turns "please search for twenty amp breakers" into "20A breakers" before the
 * text reaches the NL search parser. Pure & deterministic — no browser APIs;
 * the Web Speech wiring lives in the UI layer.
 */

/** Leading/connective filler phrases stripped from transcripts (multi-word first). */
export const TRANSCRIPT_FILLERS: readonly string[] = [
  "search for",
  "find me",
  "show me",
  "look for",
  "can you",
  "please",
  "um",
  "uh",
];

/** Spoken number words → numeric values, used for "<numberword> amp(s)" → "<n>A". */
export const NUMBER_WORDS: Readonly<Record<string, number>> = {
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  hundred: 100,
  "two hundred": 200,
};

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Filler patterns, longest first so "search for" wins over a bare "for"-like overlap. */
const FILLER_PATTERNS: readonly RegExp[] = [...TRANSCRIPT_FILLERS]
  .sort((a, b) => b.length - a.length)
  .map((filler) => new RegExp(`\\b${escapeRe(filler).replace(/\s+/g, "\\s+")}\\b`, "gi"));

/** Amperage patterns, longest number-word first so "two hundred" beats "hundred". */
const AMP_PATTERNS: readonly { re: RegExp; value: number }[] = Object.entries(NUMBER_WORDS)
  .sort(([a], [b]) => b.length - a.length)
  .map(([word, value]) => ({
    re: new RegExp(`\\b${escapeRe(word).replace(/\s+/g, "\\s+")}[\\s-]+amps?\\b`, "gi"),
    value,
  }));

/**
 * Normalize a voice transcript for search:
 * 1. strip filler phrases (case-insensitive, word-boundary, longest-first),
 * 2. convert "<numberword>[- ]amp(s)" to "<n>A",
 * 3. collapse whitespace and trim.
 *
 * "" → ""; text with nothing to normalize passes through unchanged.
 * Idempotent: normalizing already-normalized text is a no-op.
 */
export function normalizeTranscript(raw: string): string {
  let working = raw;
  for (const pattern of FILLER_PATTERNS) {
    working = working.replace(pattern, " ");
  }
  for (const { re, value } of AMP_PATTERNS) {
    working = working.replace(re, `${value}A`);
  }
  return working.replace(/\s+/g, " ").trim();
}
