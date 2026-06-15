import { describe, it, expect } from "vitest";
import { buildOrder, orderId, type ResolvedLine } from "@/lib/product-finder-order-intake";

const lines: ResolvedLine[] = [
  { sku: "A-1", name: "Breaker", unitPrice: 12.5, qty: 4 },
  { sku: "B-2", name: "Wire", unitPrice: 3.33, qty: 3 },
];

describe("orderId (idempotency key)", () => {
  it("is a deterministic, readable-prefix + full-ref-hash id", () => {
    expect(orderId("abc")).toBe(orderId("abc"));
    expect(orderId("Cart #2026-06-15 / rep-7")).toMatch(/^ord-cart-2026-06-15-rep-7-[0-9a-f]{8}$/);
  });
  it("distinct refs sharing a long (>32 char) slug prefix do NOT collide", () => {
    const a = orderId("PO-2026-06-15-acme-electric-warehouse-fitout-phase-1");
    const b = orderId("PO-2026-06-15-acme-electric-warehouse-fitout-phase-2");
    expect(a).not.toBe(b);
  });
  it("falls back to 'order' slug for a ref with no alphanumerics", () => {
    expect(orderId("///")).toMatch(/^ord-order-[0-9a-f]{8}$/);
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
    expect(o.id).toMatch(/^ord-c1-[0-9a-f]{8}$/);
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
