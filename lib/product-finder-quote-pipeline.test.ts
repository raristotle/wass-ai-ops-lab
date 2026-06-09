import { describe, it, expect } from "vitest";
import { quotePipeline, isStale, STALE_DAYS } from "@/lib/product-finder-quote-pipeline";
import type { SavedQuote, QuoteStatus } from "@/lib/product-finder-quotes";

const DAY = 86_400_000;
const NOW = 1_000_000_000_000;

function q(id: string, status: QuoteStatus, total: number, ageDays = 0, convertedOrderId?: string): SavedQuote {
  return {
    id, number: `Q-${id}`, customer: "Acme", project: "", lines: [],
    total, status, createdAt: NOW - ageDays * DAY, customerId: null, convertedOrderId,
  };
}

describe("isStale", () => {
  it("is true only for sent quotes older than STALE_DAYS", () => {
    expect(isStale(q("1", "sent", 100, STALE_DAYS + 1), NOW)).toBe(true);
    expect(isStale(q("2", "sent", 100, STALE_DAYS - 1), NOW)).toBe(false);
    expect(isStale(q("3", "draft", 100, STALE_DAYS + 5), NOW)).toBe(false);
    expect(isStale(q("4", "won", 100, STALE_DAYS + 5), NOW)).toBe(false);
  });
});

describe("quotePipeline", () => {
  const quotes = [
    q("1", "draft", 100),
    q("2", "sent", 200),
    q("3", "sent", 50, STALE_DAYS + 2),
    q("4", "won", 400),
    q("5", "won", 100),
    q("6", "lost", 75),
  ];
  const p = quotePipeline(quotes, NOW);

  it("counts and values each status", () => {
    const sent = p.byStatus.find((s) => s.status === "sent")!;
    expect(sent.count).toBe(2);
    expect(sent.value).toBe(250);
  });

  it("open value = draft + sent", () => {
    expect(p.openValue).toBe(100 + 250);
  });

  it("reports won and lost totals", () => {
    expect(p.wonValue).toBe(500);
    expect(p.lostValue).toBe(75);
  });

  it("computes win rate over decided quotes", () => {
    expect(p.winRate).toBeCloseTo(2 / 3); // 2 won, 1 lost
  });

  it("flags stale sent quotes, oldest first", () => {
    expect(p.stale.map((s) => s.id)).toEqual(["3"]);
  });

  it("handles an empty pipeline", () => {
    const empty = quotePipeline([], NOW);
    expect(empty.totalCount).toBe(0);
    expect(empty.openValue).toBe(0);
    expect(empty.winRate).toBe(0);
    expect(empty.stale).toEqual([]);
    expect(empty.convertedCount).toBe(0);
    expect(empty.conversionRate).toBe(0);
  });

  it("collects below-margin quotes awaiting approval, highest value first", () => {
    const withApprovals = quotePipeline(
      [
        { ...q("a", "draft", 300), approvalStatus: "pending" },
        { ...q("b", "sent", 900), approvalStatus: "pending" },
        { ...q("c", "draft", 100), approvalStatus: "approved" },
        q("d", "draft", 500),
      ],
      NOW,
    );
    expect(withApprovals.needsApproval.map((x) => x.id)).toEqual(["b", "a"]);
  });

  it("tracks conversion of won quotes into orders", () => {
    const conv = quotePipeline(
      [
        q("a", "won", 1000, 0, "order-1"),
        q("b", "won", 500), // won but not converted
        q("c", "lost", 200),
      ],
      NOW,
    );
    expect(conv.convertedCount).toBe(1);
    expect(conv.convertedValue).toBe(1000);
    expect(conv.conversionRate).toBeCloseTo(1 / 2); // 1 of 2 won quotes converted
  });
});
