import { describe, it, expect } from "vitest";
import {
  buildCopilotDraft,
  copilotDraftLines,
  copilotHeadline,
  type CopilotAttachItem,
} from "@/lib/product-finder-quote-copilot";
import type { ScoredBomLine } from "@/lib/product-finder-bom";
import type { CatalogProduct } from "@/features/product-finder/types";

function product(id: string, price: number): CatalogProduct {
  return {
    id,
    sku: id,
    name: `Product ${id}`,
    brand: "Acme",
    category: "electrical",
    subcategory: "Switches",
    description: "",
    unitPrice: price,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "x",
  };
}

function scored(query: string, match: CatalogProduct | null, qty: number, tier: ScoredBomLine["tier"]): ScoredBomLine {
  return { raw: `${qty} ${query}`, qty, query, match, confidence: tier === "high" ? 0.9 : 0.5, tier, alternates: [] };
}

function attach(id: string, relation: CopilotAttachItem["relation"], score: number, price: number): CopilotAttachItem {
  return {
    relation,
    attachScore: score,
    reasons: [relation === "required" ? "Required companion" : "Often attached"],
    product: { id, sku: id, name: `Companion ${id}`, brand: "Acme", subcategory: "Wall Plates & Covers", unitPrice: price },
  };
}

describe("copilotDraftLines", () => {
  it("keeps only matched lines and flags low-confidence ones for review", () => {
    const p1 = product("P1", 10);
    const lines = copilotDraftLines([
      scored("switch", p1, 3, "high"),
      scored("mystery part", null, 1, null),
      scored("dimmer", product("P2", 20), 2, "medium"),
    ]);
    expect(lines).toHaveLength(2);
    expect(lines[0].product.id).toBe("P1");
    expect(lines[0].needsReview).toBe(false);
    expect(lines[1].needsReview).toBe(true); // medium tier
  });
});

describe("buildCopilotDraft", () => {
  it("drafts lines, scopes the attach rail, and computes value headroom", () => {
    const p1 = product("P1", 10);
    const p2 = product("P2", 20);
    const draft = buildCopilotDraft(
      [scored("switch", p1, 2, "high"), scored("dimmer", p2, 1, "high")],
      [attach("WP", "required", 80, 4), attach("LB", "recommended", 40, 2)],
      1,
    );
    expect(draft.lines).toHaveLength(2);
    expect(draft.attach).toHaveLength(2);
    expect(draft.attach[0].relation).toBe("required"); // required sorts first
    expect(draft.summary.draftValue).toBe(10 * 2 + 20); // 40
    expect(draft.summary.companionValue).toBe(4 + 2); // 6
    expect(draft.summary.companionCount).toBe(2);
    expect(draft.summary.requiredCompanionCount).toBe(1);
    expect(draft.summary.crossable).toBe(1);
  });

  it("never attaches a companion that is already a draft line, and dedups", () => {
    const p1 = product("P1", 10);
    const draft = buildCopilotDraft(
      [scored("switch", p1, 1, "high")],
      [
        attach("P1", "recommended", 50, 10), // same as a draft line → dropped
        attach("WP", "required", 80, 4),
        attach("WP", "required", 80, 4), // duplicate → collapsed
      ],
    );
    expect(draft.attach).toHaveLength(1);
    expect(draft.attach[0].product.id).toBe("WP");
  });

  it("headline reflects required companions and review count", () => {
    const draft = buildCopilotDraft(
      [scored("switch", product("P1", 10), 1, "high"), scored("???", null, 1, null)],
      [attach("WP", "required", 80, 4)],
    );
    const h = copilotHeadline(draft.summary);
    expect(h).toMatch(/1 of 2 lines drafted/);
    expect(h).toMatch(/1 required/);
    expect(h).toMatch(/1 to review/);
  });

  it("empty input yields a prompt headline", () => {
    const draft = buildCopilotDraft([], []);
    expect(copilotHeadline(draft.summary)).toMatch(/Paste an RFQ/);
  });
});
