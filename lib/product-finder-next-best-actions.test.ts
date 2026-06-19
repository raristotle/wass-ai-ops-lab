import { describe, it, expect } from "vitest";
import { nextBestActions } from "@/lib/product-finder-next-best-actions";
import type { SavedQuote } from "@/lib/product-finder-quotes";
import type { Order } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";

const DAY = 86_400_000;
const NOW = 1_750_000_000_000;

function prod(brand: string): CatalogProduct {
  return {
    id: `p-${brand}`,
    sku: `SKU-${brand}`,
    name: `${brand} breaker`,
    brand,
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "",
    unitPrice: 100,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "🔌",
  } as unknown as CatalogProduct;
}

function quote(p: Partial<SavedQuote>): SavedQuote {
  return {
    id: "q1",
    number: "Q-1",
    customer: "Acme Electric",
    project: "",
    lines: [{ product: prod("Square D"), qty: 2 }],
    total: 1000,
    status: "sent",
    createdAt: NOW,
    customerId: "CUST-001",
    ...p,
  } as SavedQuote;
}

describe("nextBestActions", () => {
  it("returns no actions for an empty pipeline (seasonal aside)", () => {
    const res = nextBestActions({ quotes: [], orders: [], customers: [], now: NOW });
    // Only the always-on seasonal promo may appear.
    expect(res.actions.every((a) => a.kind === "run-promo")).toBe(true);
  });

  it("surfaces a counter-offer at the top priority", () => {
    const q = quote({ id: "qc", number: "Q-C", counterOffer: { note: "sharpen price", at: NOW } });
    const res = nextBestActions({ quotes: [q], orders: [], customers: [], now: NOW });
    const top = res.actions[0];
    expect(top.kind).toBe("answer-counter");
    expect(top.context).toContain("Q-C");
    expect(top.context).toContain("sharpen price");
  });

  it("flags below-margin quotes needing approval", () => {
    const q = quote({ id: "qa", number: "Q-A", approvalStatus: "pending", marginPct: 0.1 });
    const res = nextBestActions({ quotes: [q], orders: [], customers: [], now: NOW });
    expect(res.actions.some((a) => a.kind === "approve-margin" && a.context.includes("Q-A"))).toBe(true);
  });

  it("flags a stale sent quote (sent > 14 days ago)", () => {
    const q = quote({ id: "qs", number: "Q-S", createdAt: NOW - 20 * DAY });
    const res = nextBestActions({ quotes: [q], orders: [], customers: [], now: NOW });
    expect(res.actions.some((a) => a.kind === "follow-up-stale" && a.context.includes("Q-S"))).toBe(true);
  });

  it("surfaces unclaimed SPA rebates from won quotes", () => {
    const q = quote({ id: "qw", number: "Q-W", status: "won", lines: [{ product: prod("Square D"), qty: 10 }] });
    const res = nextBestActions({ quotes: [q], orders: [], customers: [], now: NOW });
    const rebate = res.actions.find((a) => a.kind === "claim-rebate");
    expect(rebate).toBeDefined();
    expect(rebate!.target).toEqual({ kind: "card", card: "spa" });
    expect(rebate!.value).toBeGreaterThan(0);
  });

  it("flags an at-risk customer from stale order cadence", () => {
    const orders: Order[] = [
      { id: "o1", placedAt: NOW - 200 * DAY, lines: [], total: 100, customerId: "CUST-9", customerName: "Quiet Co" },
      { id: "o2", placedAt: NOW - 190 * DAY, lines: [], total: 100, customerId: "CUST-9", customerName: "Quiet Co" },
    ];
    const res = nextBestActions({
      quotes: [],
      orders,
      customers: [{ id: "CUST-9", name: "Quiet Co" }],
      now: NOW,
    });
    expect(res.actions.some((a) => a.kind === "reach-out-at-risk" && a.context.includes("Quiet Co"))).toBe(true);
  });

  it("ranks counter-offer above approval above stale", () => {
    const quotes = [
      quote({ id: "qs", number: "Q-S", createdAt: NOW - 20 * DAY }),
      quote({ id: "qa", number: "Q-A", approvalStatus: "pending", marginPct: 0.1 }),
      quote({ id: "qc", number: "Q-C", counterOffer: { note: "x", at: NOW } }),
    ];
    const res = nextBestActions({ quotes, orders: [], customers: [], now: NOW });
    const kinds = res.actions.map((a) => a.kind);
    expect(kinds.indexOf("answer-counter")).toBeLessThan(kinds.indexOf("approve-margin"));
    expect(kinds.indexOf("approve-margin")).toBeLessThan(kinds.indexOf("follow-up-stale"));
  });

  it("respects the limit", () => {
    const quotes = Array.from({ length: 20 }, (_, i) =>
      quote({ id: `q${i}`, number: `Q-${i}`, createdAt: NOW - 20 * DAY }),
    );
    const res = nextBestActions({ quotes, orders: [], customers: [], now: NOW, limit: 3 });
    expect(res.actions.length).toBe(3);
    expect(res.total).toBeGreaterThan(3);
  });
});
