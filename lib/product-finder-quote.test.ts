import { describe, it, expect } from "vitest";
import { quoteNumber, quoteValidityDate, formatDisplayDate } from "@/lib/product-finder-quote";

// Fixed date for deterministic tests: 2026-06-06, 14:05:03.042
const FIXED = new Date(2026, 5, 6, 14, 5, 3, 42); // month is 0-indexed

describe("quoteNumber", () => {
  it("produces Q-YYYYMMDD-XXXX format", () => {
    const result = quoteNumber(FIXED, 1);
    expect(result).toMatch(/^Q-\d{8}-\d{4}$/);
  });

  it("encodes the correct date part", () => {
    const result = quoteNumber(FIXED, 1);
    expect(result.startsWith("Q-20260606-")).toBe(true);
  });

  it("zero-pads seq to 4 digits", () => {
    expect(quoteNumber(FIXED, 1)).toBe("Q-20260606-0001");
    expect(quoteNumber(FIXED, 99)).toBe("Q-20260606-0099");
    expect(quoteNumber(FIXED, 1000)).toBe("Q-20260606-1000");
  });

  it("uses provided seq when given", () => {
    expect(quoteNumber(FIXED, 42)).toBe("Q-20260606-0042");
  });

  it("auto-derives seq from seconds+ms when seq is omitted (deterministic given same date)", () => {
    const a = quoteNumber(FIXED);
    const b = quoteNumber(FIXED);
    expect(a).toBe(b); // same date → same result
    expect(a).toMatch(/^Q-20260606-\d{4}$/);
  });

  it("different dates produce different date parts", () => {
    const other = new Date(2025, 0, 1, 0, 0, 0, 0);
    expect(quoteNumber(other, 1).startsWith("Q-20250101-")).toBe(true);
  });

  it("month is zero-padded", () => {
    const jan = new Date(2026, 0, 5); // January
    expect(quoteNumber(jan, 1)).toBe("Q-20260105-0001");
  });

  it("day is zero-padded", () => {
    const early = new Date(2026, 5, 6); // June 6
    expect(quoteNumber(early, 1)).toBe("Q-20260606-0001");
  });
});

describe("quoteValidityDate", () => {
  it("adds 30 days by default", () => {
    const start = new Date(2026, 5, 6); // June 6
    const valid = quoteValidityDate(start);
    expect(valid.getFullYear()).toBe(2026);
    expect(valid.getMonth()).toBe(6); // July (0-indexed)
    expect(valid.getDate()).toBe(6);
  });

  it("does not mutate the input date", () => {
    const start = new Date(2026, 5, 6);
    const startCopy = new Date(start);
    quoteValidityDate(start);
    expect(start.getTime()).toBe(startCopy.getTime());
  });

  it("handles month rollover (Jan 20 + 30 = Feb 19)", () => {
    const jan20 = new Date(2026, 0, 20);
    const result = quoteValidityDate(jan20);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(19);
  });

  it("handles year rollover (Dec 15 + 30 = Jan 14 next year)", () => {
    const dec15 = new Date(2026, 11, 15);
    const result = quoteValidityDate(dec15);
    expect(result.getFullYear()).toBe(2027);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getDate()).toBe(14);
  });

  it("accepts a custom days argument", () => {
    const start = new Date(2026, 5, 6);
    const result = quoteValidityDate(start, 7);
    expect(result.getDate()).toBe(13);
    expect(result.getMonth()).toBe(5); // still June
  });
});

describe("formatDisplayDate", () => {
  it("formats a date as 'Month DD, YYYY'", () => {
    const d = new Date(2026, 5, 6); // June 6, 2026
    expect(formatDisplayDate(d)).toBe("June 6, 2026");
  });

  it("formats single-digit day without padding", () => {
    const d = new Date(2026, 0, 1); // January 1, 2026
    expect(formatDisplayDate(d)).toBe("January 1, 2026");
  });
});
