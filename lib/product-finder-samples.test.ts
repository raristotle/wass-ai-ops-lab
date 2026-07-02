import { describe, it, expect } from "vitest";
import {
  SAMPLE_ORDER_HISTORY_CSV,
  SAMPLE_CROSSWALK_CSV,
  downloadTextFile,
} from "@/lib/product-finder-samples";
import { parseOrderHistoryCsv } from "@/lib/catalog/order-history";
import { parseCrosswalkCsv } from "@/lib/catalog/crosswalk";

/**
 * B9: the sample templates must parse cleanly through the SAME parsers the real imports
 * use — otherwise "Download sample → Import" would fail the moment a user tries it.
 */
describe("B9 sample templates", () => {
  it("order-history sample parses into several orders with a recognized SKU column", () => {
    const parsed = parseOrderHistoryCsv(SAMPLE_ORDER_HISTORY_CSV);
    expect(parsed.stats.mapping.sku).not.toBeNull();
    expect(parsed.orders.length).toBeGreaterThanOrEqual(6);
    // Every parsed order has at least one line (so mining has baskets to work with).
    expect(parsed.orders.every((o) => o.lines.length > 0)).toBe(true);
    // The sample deliberately repeats subcategories across orders so rules can mine.
    const distinctSkus = new Set(parsed.orders.flatMap((o) => o.lines.map((l) => l.sku)));
    expect(distinctSkus.size).toBeGreaterThanOrEqual(4);
  });

  it("crosswalk sample parses into 8 customer→sku entries with both columns mapped", () => {
    const { entries, stats } = parseCrosswalkCsv(SAMPLE_CROSSWALK_CSV);
    expect(stats.mapping.customerNumber).not.toBeNull();
    expect(stats.mapping.sku).not.toBeNull();
    expect(entries.length).toBe(8);
    expect(entries.every((e) => e.customerNumber.length > 0 && e.sku.length > 0)).toBe(true);
  });

  it("downloadTextFile is a safe no-op server-side (no document) and never throws", () => {
    // Runs in the node (non-jsdom) test env, so `document` is undefined here.
    expect(() => downloadTextFile("x.csv", "a,b\n1,2")).not.toThrow();
  });
});
