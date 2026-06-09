import type { CatalogProduct } from "@/features/product-finder/types";
import type { ParsedBomLine } from "@/lib/product-finder-bom";
import { csvField } from "@/lib/product-finder-csv";

/**
 * Bulk price & availability ("RFQ response"): resolve a pasted list of SKUs /
 * part numbers / descriptions to catalog products — trying an exact SKU, then a
 * competitor/legacy cross-reference, then a search — and report priced
 * availability for each. Pure orchestration over an injected resolver so it is
 * unit-testable without a network.
 */

export type MatchedVia = "sku" | "cross-ref" | "search";

export interface BulkResolution {
  product: CatalogProduct | null;
  matchedVia: MatchedVia | null;
}

export interface BulkRow {
  query: string;
  qty: number;
  product: CatalogProduct | null;
  matchedVia: MatchedVia | null;
  /** Effective unit price for the active customer (caller supplies pricing). */
  unitPrice: number | null;
  lineTotal: number | null;
  /** Total available stock (branch + DC). */
  available: number | null;
}

const MATCH_CONCURRENCY = 6;

async function batched<T, R>(items: T[], fn: (item: T) => Promise<R>, size: number): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return out;
}

function totalStock(p: CatalogProduct): number {
  return (
    p.branchStock.reduce((s, b) => s + b.quantity, 0) +
    p.dcStock.reduce((s, d) => s + d.quantity, 0)
  );
}

/**
 * Resolve each parsed line and price it.
 * @param resolveFn  query → { product, matchedVia } (tries SKU → cross-ref → search).
 * @param priceFn    (product, qty) → effective unit price.
 */
export async function resolveBulk(
  parsed: ParsedBomLine[],
  resolveFn: (query: string) => Promise<BulkResolution>,
  priceFn: (product: CatalogProduct, qty: number) => number,
): Promise<BulkRow[]> {
  return batched(
    parsed,
    async (line) => {
      let res: BulkResolution = { product: null, matchedVia: null };
      try {
        res = await resolveFn(line.query);
      } catch {
        res = { product: null, matchedVia: null };
      }
      const product = res.product;
      const unitPrice = product ? priceFn(product, line.qty) : null;
      return {
        query: line.query,
        qty: line.qty,
        product,
        matchedVia: res.matchedVia,
        unitPrice,
        lineTotal: unitPrice !== null ? unitPrice * line.qty : null,
        available: product ? totalStock(product) : null,
      };
    },
    MATCH_CONCURRENCY,
  );
}

const HEADERS = [
  "Input", "Qty", "Matched SKU", "Name", "Brand", "Matched Via",
  "Unit Price", "Line Total", "Available", "In Stock",
];

/** Export the resolved bulk table as CSV (Excel-safe). */
export function bulkQuoteCsv(rows: BulkRow[]): string {
  const lines: string[] = [HEADERS.map(csvField).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.query,
        r.qty,
        r.product?.sku ?? "NOT FOUND",
        r.product?.name ?? "",
        r.product?.brand ?? "",
        r.matchedVia ?? "",
        r.unitPrice !== null ? r.unitPrice.toFixed(2) : "",
        r.lineTotal !== null ? r.lineTotal.toFixed(2) : "",
        r.available ?? "",
        r.available !== null && r.available > 0 ? "Yes" : "No",
      ]
        .map(csvField)
        .join(","),
    );
  }
  return lines.join("\r\n") + "\r\n";
}

/** Count of resolved (matched) rows. */
export function matchedCount(rows: BulkRow[]): number {
  return rows.filter((r) => r.product !== null).length;
}
