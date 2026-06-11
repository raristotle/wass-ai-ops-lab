import { describe, it, expect } from "vitest";
import {
  TRANSCRIPT_FILLERS,
  NUMBER_WORDS,
  normalizeTranscript,
} from "@/lib/product-finder-voice";

describe("TRANSCRIPT_FILLERS / NUMBER_WORDS data", () => {
  it("lists multi-word fillers before single words", () => {
    const firstSingleIdx = TRANSCRIPT_FILLERS.findIndex((f) => !f.includes(" "));
    const lastMultiIdx = TRANSCRIPT_FILLERS.reduce((acc, f, i) => (f.includes(" ") ? i : acc), -1);
    expect(TRANSCRIPT_FILLERS[0]).toContain(" ");
    expect(firstSingleIdx).toBeGreaterThan(lastMultiIdx);
  });

  it("includes the required number words", () => {
    expect(NUMBER_WORDS["fifteen"]).toBe(15);
    expect(NUMBER_WORDS["twenty"]).toBe(20);
    expect(NUMBER_WORDS["two hundred"]).toBe(200);
  });
});

describe("normalizeTranscript", () => {
  it('"twenty amp breaker" → "20A breaker"', () => {
    expect(normalizeTranscript("twenty amp breaker")).toBe("20A breaker");
  });

  it('"please search for gloves" → "gloves"', () => {
    expect(normalizeTranscript("please search for gloves")).toBe("gloves");
  });

  it('"fifteen amps gfci" → "15A gfci"', () => {
    expect(normalizeTranscript("fifteen amps gfci")).toBe("15A gfci");
  });

  it('"cat6 cable" passes through unchanged', () => {
    expect(normalizeTranscript("cat6 cable")).toBe("cat6 cable");
  });

  it('"" → ""', () => {
    expect(normalizeTranscript("")).toBe("");
  });

  it("is idempotent on already-normalized input", () => {
    const once = normalizeTranscript("please show me twenty amp breakers in stock");
    expect(once).toBe("20A breakers in stock");
    expect(normalizeTranscript(once)).toBe(once);
  });

  it("strips fillers case-insensitively", () => {
    expect(normalizeTranscript("Please Search For relays")).toBe("relays");
  });

  it('handles hyphenated "twenty-amp" and multi-word "two hundred amp"', () => {
    expect(normalizeTranscript("twenty-amp fuse")).toBe("20A fuse");
    expect(normalizeTranscript("two hundred amp panel")).toBe("200A panel");
  });

  it("does not mangle words containing filler substrings", () => {
    expect(normalizeTranscript("aluminum conduit")).toBe("aluminum conduit");
  });

  it("collapses leftover whitespace", () => {
    expect(normalizeTranscript("  um   show me   displays  ")).toBe("displays");
  });
});
