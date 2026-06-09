import { describe, it, expect } from "vitest";
import { resolveBulk, bulkQuoteCsv, matchedCount, type BulkResolution } from "@/lib/product-finder-bulk-quote";
import type { CatalogProduct } from "@/features/product-finder/types";
import type { ParsedBomLine } from "@/lib/product-finder-bom";

function prod(id: string, sku: string, branch = 0, dc = 0): CatalogProduct {
  return {
    id, sku, name: `Product ${id}`, brand: "Acme", category: "electrical",
    subcategory: "Circuit Breakers", description: "", unitPrice: 10, uom: "EA", specs: [],
    preferred: false,
    branchStock: branch ? [{ branchId: "B1", branchName: "B", city: "H", state: "TX", quantity: branch }] : [],
    dcStock: dc ? [{ dcId: "D1", dcName: "D", location: "K", quantity: dc }] : [],
    externalSources: [], imageIcon: "⚡",
  };
}

const line = (query: string, qty = 1): ParsedBomLine => ({ raw: query, qty, query });
const price = (_p: CatalogProduct, _q: number) => 9.5;

describe("resolveBulk", () => {
  it("resolves, prices, and reports availability for each line", async () => {
    const resolve = async (q: string): Promise<BulkResolution> =>
      q === "QO115" ? { product: prod("a", "QO115", 12, 30), matchedVia: "sku" } : { product: null, matchedVia: null };

    const rows = await resolveBulk([line("QO115", 4), line("ZZZ")], resolve, price);
    expect(rows).toHaveLength(2);
    expect(rows[0].matchedVia).toBe("sku");
    expect(rows[0].unitPrice).toBe(9.5);
    expect(rows[0].lineTotal).toBe(38);
    expect(rows[0].available).toBe(42);
    expect(rows[1].product).toBeNull();
    expect(rows[1].unitPrice).toBeNull();
  });

  it("treats resolver errors as no-match", async () => {
    const rows = await resolveBulk([line("boom")], async () => { throw new Error("x"); }, price);
    expect(rows[0].product).toBeNull();
    expect(rows[0].matchedVia).toBeNull();
  });

  it("preserves input order under concurrency", async () => {
    const lines = Array.from({ length: 15 }, (_, i) => line(`q${i}`, i + 1));
    const resolve = async (q: string): Promise<BulkResolution> => ({ product: prod(q, q), matchedVia: "search" });
    const rows = await resolveBulk(lines, resolve, price);
    expect(rows.map((r) => r.query)).toEqual(lines.map((l) => l.query));
  });
});

describe("matchedCount", () => {
  it("counts only resolved rows", async () => {
    const resolve = async (q: string): Promise<BulkResolution> =>
      q === "hit" ? { product: prod("a", "A"), matchedVia: "search" } : { product: null, matchedVia: null };
    const rows = await resolveBulk([line("hit"), line("miss")], resolve, price);
    expect(matchedCount(rows)).toBe(1);
  });
});

describe("bulkQuoteCsv", () => {
  it("emits a header and a row per line, marking unresolved as NOT FOUND", async () => {
    const resolve = async (q: string): Promise<BulkResolution> =>
      q === "QO115" ? { product: prod("a", "QO115", 0, 5), matchedVia: "cross-ref" } : { product: null, matchedVia: null };
    const rows = await resolveBulk([line("QO115", 2), line("ghost")], resolve, price);
    const csv = bulkQuoteCsv(rows).trim().split("\r\n");
    expect(csv[0]).toContain("Input,Qty,Matched SKU");
    expect(csv[1]).toContain("QO115");
    expect(csv[1]).toContain("cross-ref");
    expect(csv[1]).toMatch(/Yes$/);
    expect(csv[2]).toContain("NOT FOUND");
    expect(csv[2]).toMatch(/No$/);
  });
});
