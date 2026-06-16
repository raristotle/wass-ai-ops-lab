import { describe, it, expect } from "vitest";
import { buildDigest, digestHtml, type DigestOrder } from "@/lib/product-finder-digest";

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;

function order(id: string, placedAt: number, total: number, lines: [string, string, number][]): DigestOrder {
  return { id, placedAt, total, lines: lines.map(([sku, name, qty]) => ({ sku, name, qty })) };
}

describe("buildDigest", () => {
  const orders: DigestOrder[] = [
    order("o1", NOW - 1 * DAY, 100, [["A", "Breaker", 5], ["B", "Wire", 2]]),
    order("o2", NOW - 2 * DAY, 50, [["A", "Breaker", 3]]),
    order("o3", NOW - 20 * DAY, 999, [["A", "Breaker", 100]]), // outside a 7-day window
  ];

  it("windows to the trailing N days and sums order count + value", () => {
    const d = buildDigest(orders, NOW, { days: 7 });
    expect(d.orderCount).toBe(2);
    expect(d.totalValue).toBe(150);
    expect(d.periodDays).toBe(7);
  });

  it("ranks top movers by total qty, counting distinct orders per SKU", () => {
    const d = buildDigest(orders, NOW, { days: 7 });
    expect(d.topMovers[0]).toMatchObject({ sku: "A", qty: 8, orders: 2 });
    expect(d.topMovers[1]).toMatchObject({ sku: "B", qty: 2, orders: 1 });
  });

  it("counts a SKU appearing twice in one order as a single order", () => {
    const dup = [order("o1", NOW, 10, [["A", "Breaker", 2], ["A", "Breaker", 3]])];
    const d = buildDigest(dup, NOW, { days: 7 });
    expect(d.topMovers[0]).toMatchObject({ sku: "A", qty: 5, orders: 1 });
  });
});

describe("digestHtml", () => {
  it("renders the title, period summary, and a top-mover row", () => {
    const d = buildDigest([order("o1", NOW, 100, [["A", "Breaker", 5]])], NOW, { days: 7 });
    const html = digestHtml(d, { title: "Weekly digest" });
    expect(html).toContain("Weekly digest");
    expect(html).toContain("Breaker");
    expect(html).toContain("Top movers");
  });

  it("shows an empty-window message when there are no orders", () => {
    const d = buildDigest([], NOW, { days: 7 });
    expect(digestHtml(d)).toContain("No orders in this window.");
  });
});
