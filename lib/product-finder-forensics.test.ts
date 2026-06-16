import { describe, it, expect } from "vitest";
import { lostReasonBreakdown, cohortWinLoss, winLossByCustomer, LOST_REASONS } from "@/lib/product-finder-forensics";
import type { SavedQuote, QuoteStatus } from "@/lib/product-finder-quotes";

function q(id: string, status: QuoteStatus, customer: string, lostReason?: string): SavedQuote {
  return { id, number: id, customer, project: "", lines: [], total: 100, status, createdAt: 1, customerId: null, ...(lostReason ? { lostReason } : {}) };
}

describe("lostReasonBreakdown", () => {
  it("counts lost quotes by reason (descending) and buckets unknown/absent as 'other'", () => {
    const quotes = [
      q("1", "lost", "Acme", "price"),
      q("2", "lost", "Acme", "price"),
      q("3", "lost", "Globex", "competitor"),
      q("4", "lost", "Globex"), // no reason → other
      q("5", "lost", "Globex", "made-up"), // unknown → other
      q("6", "won", "Acme"), // ignored
    ];
    const b = lostReasonBreakdown(quotes);
    expect(b.map((x) => [x.reason, x.count])).toEqual([
      ["price", 2],
      ["other", 2],
      ["competitor", 1],
    ]);
    expect(b[0].pct).toBeCloseTo(2 / 5, 5); // 5 lost quotes
  });

  it("is empty when there are no lost quotes", () => {
    expect(lostReasonBreakdown([q("1", "won", "Acme")])).toEqual([]);
  });
});

describe("cohortWinLoss / winLossByCustomer", () => {
  const quotes = [
    q("1", "won", "Acme"),
    q("2", "won", "Acme"),
    q("3", "lost", "Acme"),
    q("4", "lost", "Globex"),
    q("5", "lost", "Globex"),
    q("6", "won", "Solo"), // decided=1 → dropped by minDecided
    q("7", "draft", "Acme"), // not decided → ignored
  ];

  it("ranks cohorts by win-rate, drops sub-threshold cohorts", () => {
    const c = winLossByCustomer(quotes, 2);
    expect(c.map((x) => [x.cohort, x.won, x.lost])).toEqual([
      ["Acme", 2, 1], // 67%
      ["Globex", 0, 2], // 0%
    ]);
    expect(c.find((x) => x.cohort === "Solo")).toBeUndefined();
    expect(c[0].winRate).toBeCloseTo(2 / 3, 5);
  });

  it("supports an arbitrary cohort key", () => {
    const byStatusParity = cohortWinLoss(quotes, (x) => (x.total > 0 ? "paid" : "free"), 1);
    expect(byStatusParity[0].decided).toBeGreaterThan(0);
  });
});

describe("LOST_REASONS", () => {
  it("includes the core taxonomy", () => {
    const values = LOST_REASONS.map((r) => r.value);
    expect(values).toContain("price");
    expect(values).toContain("competitor");
    expect(values).toContain("other");
  });
});
