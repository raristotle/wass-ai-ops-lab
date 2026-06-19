import { describe, it, expect } from "vitest";
import { willCallOrders, buildPickTicket, pickTicketHtml } from "@/lib/product-finder-pick-ticket";
import type { Order } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";

const prod = (sku: string, name: string): CatalogProduct => ({ id: sku, sku, name } as unknown as CatalogProduct);

const order = (id: string, placedAt: number): Order => ({
  id,
  placedAt,
  lines: [
    { product: prod("SKU-1", "20A Breaker"), qty: 3 },
    { product: prod("SKU-2", "EMT Conduit"), qty: 10 },
  ],
  total: 100,
  customerId: "c1",
  customerName: "Acme Electric",
});

describe("willCallOrders", () => {
  it("returns only will-call orders, newest first", () => {
    const orders = [order("o1", 1000), order("o2", 3000), order("o3", 2000)];
    const fulfillment = { o1: "willcall" as const, o2: "willcall" as const, o3: "delivery" as const };
    const out = willCallOrders(orders, fulfillment);
    expect(out.map((o) => o.id)).toEqual(["o2", "o1"]); // o3 excluded, newest first
  });
  it("is empty when nothing is will-call", () => {
    expect(willCallOrders([order("o1", 1)], { o1: "delivery" })).toEqual([]);
    expect(willCallOrders([order("o1", 1)], {})).toEqual([]);
  });
});

describe("buildPickTicket", () => {
  it("summarizes lines + item count", () => {
    const t = buildPickTicket(order("o9", 5000), 9999);
    expect(t.orderId).toBe("o9");
    expect(t.customer).toBe("Acme Electric");
    expect(t.lineCount).toBe(2);
    expect(t.itemCount).toBe(13); // 3 + 10
    expect(t.printedAt).toBe(9999);
  });
  it("falls back to Walk-in for a null customer", () => {
    const o = { ...order("o1", 1), customerName: null };
    expect(buildPickTicket(o, 1).customer).toBe("Walk-in");
  });
});

describe("pickTicketHtml", () => {
  it("produces a printable document with the brand, order, and lines", () => {
    const html = pickTicketHtml(buildPickTicket(order("o9", 5000), 9999), "Meridian Supply Co.");
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Meridian Supply Co.");
    expect(html).toContain("o9");
    expect(html).toContain("20A Breaker");
    expect(html).toContain("PICK TICKET");
  });
  it("escapes HTML in product names (XSS-safe)", () => {
    const o = order("o1", 1);
    o.lines[0] = { product: prod("X", '<script>alert(1)</script>'), qty: 1 };
    const html = pickTicketHtml(buildPickTicket(o, 1), "Brand & Co <x>");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Brand &amp; Co &lt;x&gt;");
  });
});
