import { describe, it, expect } from "vitest";
import {
  MARGIN_BANDS,
  MIN_DECIDED,
  bandFor,
  winLossByBand,
  winLossSummary,
  marginGuidance,
} from "@/lib/product-finder-winloss";
import type { SavedQuote, QuoteStatus } from "@/lib/product-finder-quotes";

function quote(status: QuoteStatus, marginPct?: number, id = Math.random().toString(36).slice(2)): SavedQuote {
  return {
    id,
    number: `Q-${id}`,
    customer: "Acme",
    project: "",
    lines: [],
    total: 100,
    status,
    createdAt: 1_780_000_000_000,
    customerId: null,
    ...(marginPct !== undefined ? { marginPct } : {}),
  };
}

describe("bandFor", () => {
  it("maps margins to the documented bands", () => {
    expect(bandFor(0.05).label).toBe("<15%");
    expect(bandFor(0.15).label).toBe("15–20%");
    expect(bandFor(0.199).label).toBe("15–20%");
    expect(bandFor(0.2).label).toBe("20–25%");
    expect(bandFor(0.25).label).toBe("25–30%");
    expect(bandFor(0.3).label).toBe("30%+");
    expect(bandFor(0.95).label).toBe("30%+");
  });

  it("clamps negative margins to the lowest band", () => {
    expect(bandFor(-0.2).label).toBe("<15%");
  });
});

describe("winLossByBand", () => {
  it("returns all bands with zero counts for no quotes", () => {
    const stats = winLossByBand([]);
    expect(stats).toHaveLength(MARGIN_BANDS.length);
    for (const s of stats) {
      expect(s.decided).toBe(0);
      expect(s.winRate).toBe(0);
    }
  });

  it("counts only decided quotes that captured a margin", () => {
    const quotes = [
      quote("won", 0.17),
      quote("lost", 0.18),
      quote("won", 0.17),
      quote("sent", 0.17),   // open — ignored
      quote("draft", 0.17),  // open — ignored
      quote("won"),          // no marginPct — ignored
    ];
    const band = winLossByBand(quotes).find((s) => s.band === "15–20%");
    expect(band).toEqual({ band: "15–20%", won: 2, lost: 1, decided: 3, winRate: 2 / 3 });
  });

  it("buckets across bands independently", () => {
    const quotes = [quote("won", 0.1), quote("lost", 0.32), quote("lost", 0.33)];
    const stats = winLossByBand(quotes);
    expect(stats.find((s) => s.band === "<15%")?.won).toBe(1);
    expect(stats.find((s) => s.band === "30%+")?.lost).toBe(2);
  });
});

describe("winLossSummary", () => {
  it("averages margins of won vs lost", () => {
    const s = winLossSummary([quote("won", 0.2), quote("won", 0.3), quote("lost", 0.4)]);
    expect(s.decided).toBe(3);
    expect(s.avgMarginWon).toBeCloseTo(0.25, 5);
    expect(s.avgMarginLost).toBeCloseTo(0.4, 5);
    expect(s.overallWinRate).toBeCloseTo(2 / 3, 5);
  });

  it("returns nulls and 0 rate when nothing is decided", () => {
    const s = winLossSummary([quote("sent", 0.2)]);
    expect(s).toEqual({ decided: 0, avgMarginWon: null, avgMarginLost: null, overallWinRate: 0 });
  });
});

describe("marginGuidance", () => {
  const history = [
    quote("won", 0.17),
    quote("won", 0.18),
    quote("won", 0.16),
    quote("lost", 0.19),   // 15–20%: 3W 1L → 75%
    quote("lost", 0.33),
    quote("lost", 0.35),
    quote("won", 0.31),    // 30%+: 1W 2L → 33%
  ];

  it("returns band-specific guidance with enough samples", () => {
    const g = marginGuidance(history, 0.18);
    expect(g).not.toBeNull();
    expect(g?.band).toBe("15–20%");
    expect(g?.bandWinRate).toBeCloseTo(0.75, 5);
    expect(g?.bandDecided).toBe(4);
    expect(g?.message).toContain("15–20%");
    expect(g?.message).toContain("75%");
  });

  it("guidance differs by current margin band", () => {
    const high = marginGuidance(history, 0.34);
    expect(high?.band).toBe("30%+");
    expect(high?.bandWinRate).toBeCloseTo(1 / 3, 5);
  });

  it(`returns null when the band has fewer than ${MIN_DECIDED} decided quotes`, () => {
    expect(marginGuidance(history, 0.22)).toBeNull(); // 20–25% band is empty
    expect(marginGuidance([], 0.18)).toBeNull();
  });
});
