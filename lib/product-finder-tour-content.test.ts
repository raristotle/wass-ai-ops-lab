import { describe, it, expect } from "vitest";
import { TOUR_STEPS } from "@/lib/product-finder-tour-content";

describe("TOUR_STEPS", () => {
  it("has exactly 11 steps", () => {
    expect(TOUR_STEPS).toHaveLength(11);
  });

  it("ids are unique and in the exact expected order", () => {
    const ids = TOUR_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      "welcome",
      "nl-search",
      "filters",
      "alternatives",
      "ask-meridian-ai",
      "job-wizard",
      "basket-quote",
      "close-the-deal",
      "insights",
      "load-your-data",
      "more-tools",
    ]);
  });

  it("load-your-data step opens the data hub and mentions both imports", () => {
    const step = TOUR_STEPS.find((s) => s.id === "load-your-data")!;
    expect(step.action?.kind).toBe("openDataHub");
    const text = step.body.join(" ").toLowerCase();
    expect(text).toContain("crosswalk");
    expect(text).toContain("order history");
  });

  it("close-the-deal step covers e-signature and rebates", () => {
    const step = TOUR_STEPS.find((s) => s.id === "close-the-deal")!;
    const text = step.body.join(" ").toLowerCase();
    expect(text).toContain("signature");
    expect(text).toContain("rebate");
  });

  it("job-wizard step opens the wizard", () => {
    const step = TOUR_STEPS.find((s) => s.id === "job-wizard")!;
    expect(step.action?.kind).toBe("openJobWizard");
    const text = step.body.join(" ").toLowerCase();
    expect(text).toContain("bill of materials");
  });

  it("every step has a non-empty title and body", () => {
    for (const step of TOUR_STEPS) {
      expect(step.title.trim().length, step.id).toBeGreaterThan(0);
      expect(step.body.length, step.id).toBeGreaterThan(0);
      for (const line of step.body) {
        expect(line.trim().length, step.id).toBeGreaterThan(0);
      }
    }
  });

  it("every nlSearch action has a non-empty query", () => {
    for (const step of TOUR_STEPS) {
      if (step.action?.kind === "nlSearch") {
        expect(step.action.query.trim().length, step.id).toBeGreaterThan(0);
      }
    }
  });

  it("nl-search step runs the canonical demo query", () => {
    const step = TOUR_STEPS.find((s) => s.id === "nl-search")!;
    expect(step.action).toEqual({
      kind: "nlSearch",
      label: expect.any(String),
      query: "20A breaker in stock under $50",
    });
  });

  it("filters step action searches circuit breakers", () => {
    const step = TOUR_STEPS.find((s) => s.id === "filters")!;
    expect(step.action?.kind).toBe("nlSearch");
    if (step.action?.kind === "nlSearch") {
      expect(step.action.query).toBe("circuit breakers");
    }
  });

  it("basket-quote step opens the cart", () => {
    const step = TOUR_STEPS.find((s) => s.id === "basket-quote")!;
    expect(step.action?.kind).toBe("openCart");
  });

  it('insights step navigates to the dashboard with actionRoles exactly ["manager","admin"]', () => {
    const step = TOUR_STEPS.find((s) => s.id === "insights")!;
    expect(step.action?.kind).toBe("navigate");
    if (step.action?.kind === "navigate") {
      expect(step.action.href).toBe("/product-finder/dashboard");
    }
    expect(step.actionRoles).toEqual(["manager", "admin"]);
  });

  it("more-tools covers voice, palette, deep links, and help", () => {
    const step = TOUR_STEPS.find((s) => s.id === "more-tools")!;
    const text = step.body.join(" ").toLowerCase();
    expect(text).toContain("voice");
    expect(text).toContain("palette");
    expect(text).toContain("deep link");
    expect(text).toContain("help");
  });
});
