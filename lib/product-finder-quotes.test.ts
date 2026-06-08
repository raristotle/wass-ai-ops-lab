import { describe, it, expect } from "vitest";
import {
  QUOTE_STATUSES, QUOTE_STATUS_LABEL, QUOTE_STATUS_COLOR,
  isQuoteStatus, pipelineValue, winRate, type SavedQuote,
} from "@/lib/product-finder-quotes";

function quote(id: string, status: SavedQuote["status"], total: number): SavedQuote {
  return {
    id, number: `Q-20260608-${id}`, customer: "Acme", project: "P", lines: [],
    total, status, createdAt: 0, customerId: null,
  };
}

describe("status metadata", () => {
  it("has a label and color for every status", () => {
    for (const s of QUOTE_STATUSES) {
      expect(QUOTE_STATUS_LABEL[s]).toBeTruthy();
      expect(QUOTE_STATUS_COLOR[s].bg).toMatch(/^#/);
      expect(QUOTE_STATUS_COLOR[s].text).toMatch(/^#/);
    }
  });
});

describe("isQuoteStatus", () => {
  it("accepts known statuses and rejects others", () => {
    expect(isQuoteStatus("draft")).toBe(true);
    expect(isQuoteStatus("won")).toBe(true);
    expect(isQuoteStatus("archived")).toBe(false);
    expect(isQuoteStatus(42)).toBe(false);
    expect(isQuoteStatus(null)).toBe(false);
  });
});

describe("pipelineValue", () => {
  it("sums totals for a given status only", () => {
    const quotes = [quote("1", "sent", 100), quote("2", "sent", 50), quote("3", "won", 200)];
    expect(pipelineValue(quotes, "sent")).toBe(150);
    expect(pipelineValue(quotes, "won")).toBe(200);
    expect(pipelineValue(quotes, "lost")).toBe(0);
  });
});

describe("winRate", () => {
  it("is won / (won + lost), ignoring draft/sent", () => {
    const quotes = [
      quote("1", "won", 1), quote("2", "won", 1), quote("3", "won", 1),
      quote("4", "lost", 1), quote("5", "draft", 1), quote("6", "sent", 1),
    ];
    expect(winRate(quotes)).toBeCloseTo(0.75);
  });

  it("is 0 when nothing is decided", () => {
    expect(winRate([quote("1", "draft", 1), quote("2", "sent", 1)])).toBe(0);
    expect(winRate([])).toBe(0);
  });
});
