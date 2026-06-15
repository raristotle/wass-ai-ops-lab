import { describe, it, expect } from "vitest";
import { buildOrder, orderId, type ResolvedLine } from "@/lib/product-finder-order-intake";

const lines: ResolvedLine[] = [
  { sku: "A-1", name: "Breaker", unitPrice: 12.5, qty: 4 },
  { sku: "B-2", name: "Wire", unitPrice: 3.33, qty: 3 },
];

describe("orderId (idempotency key)", () => {
  it("is a deterministic slug of the clientRef", () => {
    expect(orderId("Cart #2026-06-15 / rep-7")).toBe("ord-cart-2026-06-15-rep-7");
    expect(orderId("abc")).toBe(orderId("abc"));
  });
  it("falls back to 'order' for a ref with no alphanumerics", () => {
    expect(orderId("///")).toBe("ord-order");
  });
});

describe("buildOrder", () => {
  it("prices each line and totals the order (2-dp rounded)", () => {
    const o = buildOrder({ clientRef: "c1", resolved: lines, customer: "Acme", source: "mcp", now: 100 });
    expect(o.lines[0].lineTotal).toBe(50);
    expect(o.lines[1].lineTotal).toBe(9.99);
    expect(o.total).toBe(59.99);
    expect(o.itemCount).toBe(7);
    expect(o.status).toBe("placed");
    expect(o.source).toBe("mcp");
    expect(o.customer).toBe("Acme");
    expect(o.id).toBe("ord-c1");
    expect(o.placedAt).toBe(100);
    expect(o.jobId).toBeNull();
  });

  it("carries a jobId and defaults customer/source", () => {
    const o = buildOrder({ clientRef: "c2", resolved: lines, jobId: "job-x", now: 1 });
    expect(o.jobId).toBe("job-x");
    expect(o.customer).toBe("—");
    expect(o.source).toBe("api");
  });

  it("is stable: same clientRef yields the same id (idempotent upsert key)", () => {
    const a = buildOrder({ clientRef: "dup", resolved: lines, now: 1 });
    const b = buildOrder({ clientRef: "dup", resolved: [lines[0]], now: 2 });
    expect(a.id).toBe(b.id);
  });
});
