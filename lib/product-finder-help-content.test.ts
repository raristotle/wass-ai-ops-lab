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

  it("covers the Tier 1 polish features", () => {
    const ids = new Set(HELP_TOPICS.map((t) => t.id));
    for (const required of ["tour", "voice-search", "command-palette", "deep-links", "did-you-mean", "role-switcher"]) {
      expect(ids.has(required), required).toBe(true);
    }
  });

  it("covers the Tier 2 features", () => {
    const ids = new Set(HELP_TOPICS.map((t) => t.id));
    for (const required of ["for-you", "price-override", "notifications", "customer-link", "bom-confidence", "mobile"]) {
      expect(ids.has(required), required).toBe(true);
    }
  });

  it("covers the Tier 3 features", () => {
    const ids = new Set(HELP_TOPICS.map((t) => t.id));
    for (const required of ["job-wizard", "win-loss-insights", "customer-health", "commodity-index", "counter-offer"]) {
      expect(ids.has(required), required).toBe(true);
    }
  });

  it("covers the Tier 4 features", () => {
    const ids = new Set(HELP_TOPICS.map((t) => t.id));
    for (const required of ["quote-revisions", "audit-trail", "quote-terms", "seasonal"]) {
      expect(ids.has(required), required).toBe(true);
    }
  });

  it("covers the Tier 5 features", () => {
    const ids = new Set(HELP_TOPICS.map((t) => t.id));
    for (const required of [
      "live-pricing",
      "demand-forecast",
      "verified-crosses",
      "cross-explorer",
      "substitute-save",
      "saved-searches",
      "ask-meridian-ai",
      "mcp-server",
      "white-label",
      "sso",
      "procurement-export",
      "offer-ladder",
      "jobsite-weather",
      "deposits",
      "order-lifecycle",
    ]) {
      expect(ids.has(required), required).toBe(true);
    }
  });

  it("covers the v4-S2 features (e-signature, next-best-actions, rebates, audit log)", () => {
    const ids = new Set(HELP_TOPICS.map((t) => t.id));
    for (const required of ["esignature", "next-best-actions", "lighting-rebates", "audit-log"]) {
      expect(ids.has(required), required).toBe(true);
    }
  });

  it("covers the v4-S3 features (semantic search, visual part ID, data quality)", () => {
    const ids = new Set(HELP_TOPICS.map((t) => t.id));
    for (const required of ["semantic-search", "visual-part-id", "data-quality"]) {
      expect(ids.has(required), required).toBe(true);
    }
  });

  it("covers the v4-S4 features (will-call, customer portal, language)", () => {
    const ids = new Set(HELP_TOPICS.map((t) => t.id));
    for (const required of ["will-call", "customer-portal", "language"]) {
      expect(ids.has(required), required).toBe(true);
    }
  });

  it("covers the v4-S1 features (NEC extended calcs, cut-to-length, kits, submittal PDF)", () => {
    const ids = new Set(HELP_TOPICS.map((t) => t.id));
    for (const required of ["cut-to-length", "kits-assemblies", "submittal-pdf-server"]) {
      expect(ids.has(required), required).toBe(true);
    }
    // guided-selectors must mention both new calcs
    const guided = HELP_TOPICS.find((t) => t.id === "guided-selectors");
    expect(guided).toBeDefined();
    const body = guided!.body.join(" ");
    expect(body).toContain("Ampacity check");
    expect(body).toContain("Box fill");
  });

  it("covers the dataset-ingestion enrichment (manufacturer entity, ETIM, compliance)", () => {
    const ids = new Set(HELP_TOPICS.map((t) => t.id));
    expect(ids.has("data-enrichment")).toBe(true);
    const topic = HELP_TOPICS.find((t) => t.id === "data-enrichment")!;
    const body = topic.body.join(" ");
    expect(body).toContain("LEI");
    expect(body).toContain("ETIM");
    expect(body).toMatch(/REACH-SVHC|RoHS|Prop 65/);
  });

  it("covers the live free-dataset seams (admin-activated sources)", () => {
    const ids = new Set(HELP_TOPICS.map((t) => t.id));
    expect(ids.has("live-data-sources")).toBe(true);
    const topic = HELP_TOPICS.find((t) => t.id === "live-data-sources")!;
    const body = topic.body.join(" ");
    expect(body).toContain("ENERGY STAR");
    expect(body).toContain("FCC");
    expect(body).toMatch(/GLEIF|Wikidata/);
  });

  it("states the 200,000-product catalog size (not the old 60,000)", () => {
    const text = JSON.stringify(HELP_TOPICS);
    expect(text).toContain("200,000");
    expect(text).not.toContain("60,000");
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
