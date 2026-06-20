import { describe, it, expect } from "vitest";
import { parseOrderHistoryCsv } from "@/lib/catalog/order-history";

describe("parseOrderHistoryCsv", () => {
  it("groups lines by order id and maps common column names", () => {
    const csv = [
      "Order Number,SKU,Quantity",
      "1001,CB-SQU-28,10",
      "1001,WP-1G,10",
      "1002,CB-SQU-28,5",
    ].join("\n");
    const { orders, stats } = parseOrderHistoryCsv(csv);
    expect(stats.orders).toBe(2);
    expect(stats.lines).toBe(3);
    expect(stats.mapping).toEqual({ order: "Order Number", sku: "SKU", qty: "Quantity" });
    const o1 = orders.find((o) => o.orderId === "1001")!;
    expect(o1.lines.map((l) => l.sku)).toEqual(["CB-SQU-28", "WP-1G"]);
    expect(o1.lines[0].qty).toBe(10);
  });

  it("detects tab and semicolon delimiters and quoted fields with embedded commas", () => {
    const tab = "order\tpart\tqty\n7\tABC-1\t2";
    expect(parseOrderHistoryCsv(tab).orders[0].lines[0].sku).toBe("ABC-1");

    const quoted = ['po,item,quantity', '"5,000","WIRE, 12AWG, THHN",3'].join("\n");
    const o = parseOrderHistoryCsv(quoted).orders[0];
    expect(o.orderId).toBe("5,000");
    expect(o.lines[0].sku).toBe("WIRE, 12AWG, THHN");
  });

  it("defaults qty to 1 and drops blank-SKU rows (never guesses)", () => {
    const csv = ["order,sku", "1,A", "1,", "2,B"].join("\n");
    const { orders, stats } = parseOrderHistoryCsv(csv);
    expect(stats.dropped).toBe(1);
    expect(stats.lines).toBe(2);
    expect(orders.find((o) => o.orderId === "1")!.lines[0].qty).toBe(1);
  });

  it("treats every row as its own order when there is no order column", () => {
    const csv = ["sku,qty", "A,2", "B,3"].join("\n");
    const { orders, stats } = parseOrderHistoryCsv(csv);
    expect(stats.orders).toBe(2);
    expect(stats.mapping.order).toBeNull();
    expect(orders.every((o) => o.lines.length === 1)).toBe(true);
  });

  it("returns zero orders with a nulled sku mapping when no SKU column exists", () => {
    const { orders, stats } = parseOrderHistoryCsv("foo,bar\n1,2");
    expect(orders).toEqual([]);
    expect(stats.mapping.sku).toBeNull();
  });

  it("handles empty / header-only input without throwing", () => {
    expect(parseOrderHistoryCsv("").orders).toEqual([]);
    expect(parseOrderHistoryCsv("order,sku,qty").orders).toEqual([]);
  });

  it("does NOT let a short id ('po'/'so') substring-shadow an unrelated column", () => {
    // 'postal_code' contains 'po' — the OLD substring match wrongly claimed it as the
    // order column, collapsing every row into its own basket. Token match fixes it.
    const csv = ["postal_code,order_ref,sku,qty", "77001,1001,A,2", "77002,1001,B,3"].join("\n");
    const { orders, stats } = parseOrderHistoryCsv(csv);
    expect(stats.mapping.order).toBe("order_ref"); // not "postal_code"
    expect(stats.orders).toBe(1); // both rows grouped under order 1001
    expect(orders[0].lines.map((l) => l.sku)).toEqual(["A", "B"]);
  });

  it("maps a 'po' / no-separator header by token and longer substring", () => {
    // token match: "po" header → order; "Item Number" → sku; "Qty Ordered" → qty.
    const a = parseOrderHistoryCsv(["po,Item Number,Qty Ordered", "9,XYZ,4"].join("\n"));
    expect(a.stats.mapping).toEqual({ order: "po", sku: "Item Number", qty: "Qty Ordered" });
    // contains match (≥4) for a glued header: "ordernumber" → order.
    const b = parseOrderHistoryCsv(["ordernumber,sku", "7,Q"].join("\n"));
    expect(b.stats.mapping.order).toBe("ordernumber");
  });
});
