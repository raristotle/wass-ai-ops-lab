import { describe, it, expect } from "vitest";
import { repScorecard, type ScorecardQuote } from "@/lib/product-finder-rep-scorecard";

const day = 86_400_000;

function q(rep: string, over: Partial<ScorecardQuote>): ScorecardQuote {
  return { rep, status: "draft", createdAt: 0, lines: [{ category: "electrical" }], ...over };
}

describe("repScorecard", () => {
  it("computes per-rep volume, win rate, margin, cross-sell, cycle time", () => {
    const stats = repScorecard([
      q("Sarah", { status: "won", marginPct: 0.3, convertedAt: 2 * day, lines: [{ category: "electrical" }, { category: "datacom" }] }),
      q("Sarah", { status: "lost", marginPct: 0.2 }),
      q("Sarah", { status: "draft" }),
      q("Marcus", { status: "won", marginPct: 0.25, convertedAt: 4 * day }),
    ]);
    const sarah = stats.find((s) => s.rep === "Sarah");
    expect(sarah).toBeDefined();
    expect(sarah?.volume).toBe(3);
    expect(sarah?.won).toBe(1);
    expect(sarah?.winRate).toBeCloseTo(0.5, 5); // 1 won / 2 decided
    expect(sarah?.avgMarginPct).toBeCloseTo(0.25, 5); // (0.3+0.2)/2
    expect(sarah?.crossSellAttachPct).toBeCloseTo(1 / 3, 5); // 1 of 3 spans >1 category
    expect(sarah?.avgCycleDays).toBeCloseTo(2, 5);
  });

  it("returns nulls (not NaN) for a rep with no decided quotes / no margins", () => {
    const [s] = repScorecard([q("New", { status: "draft" })]);
    expect(s.winRate).toBeNull();
    expect(s.avgMarginPct).toBeNull();
    expect(s.avgCycleDays).toBeNull();
    expect(s.crossSellAttachPct).toBe(0);
  });

  it("sorts by volume then win rate", () => {
    const stats = repScorecard([
      q("A", {}),
      q("B", {}),
      q("B", {}),
    ]);
    expect(stats[0].rep).toBe("B");
  });
});
