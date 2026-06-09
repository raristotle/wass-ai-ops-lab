import { describe, it, expect } from "vitest";
import { HELP_TOPICS, searchHelpTopics } from "@/lib/product-finder-help-content";

describe("HELP_TOPICS", () => {
  it("has unique ids", () => {
    const ids = HELP_TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every topic has a title and non-empty body", () => {
    for (const t of HELP_TOPICS) {
      expect(t.title.length, t.id).toBeGreaterThan(0);
      expect(t.body.length, t.id).toBeGreaterThan(0);
      for (const line of t.body) expect(line.trim().length, t.id).toBeGreaterThan(0);
    }
  });

  it("tryQuery values are non-empty when present", () => {
    for (const t of HELP_TOPICS) {
      if (t.tryQuery !== undefined) expect(t.tryQuery.trim().length, t.id).toBeGreaterThan(0);
    }
  });

  it("covers the core feature areas", () => {
    const ids = new Set(HELP_TOPICS.map((t) => t.id));
    for (const required of ["getting-started", "search", "substitutes", "csv-export", "orders", "basket", "quotes", "templates", "delivery-eta", "complete-job", "email-quote", "pipeline", "margin", "quote-to-order", "stock-warning", "bulk-check", "submittal", "approval"]) {
      expect(ids.has(required), required).toBe(true);
    }
  });
});

describe("searchHelpTopics", () => {
  it("returns all topics for an empty query", () => {
    expect(searchHelpTopics(HELP_TOPICS, "")).toHaveLength(HELP_TOPICS.length);
    expect(searchHelpTopics(HELP_TOPICS, "   ")).toHaveLength(HELP_TOPICS.length);
  });

  it("matches case-insensitively on title", () => {
    const hits = searchHelpTopics(HELP_TOPICS, "SUBSTITUTE");
    expect(hits.some((t) => t.id === "substitutes")).toBe(true);
  });

  it("matches on body text", () => {
    const hits = searchHelpTopics(HELP_TOPICS, "meridian2024");
    expect(hits.some((t) => t.id === "getting-started")).toBe(true);
  });

  it("returns empty for a nonsense query", () => {
    expect(searchHelpTopics(HELP_TOPICS, "zzzznotathing")).toHaveLength(0);
  });
});
