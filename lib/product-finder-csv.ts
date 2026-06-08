import type { CatalogProduct } from "@/features/product-finder/types";

// ─── CSV primitives ───────────────────────────────────────────────────────────

/**
 * Escape one CSV field: quote when it contains a delimiter/quote/newline, and
 * prefix a leading apostrophe on =/+/-/@ so spreadsheet apps never interpret a
 * catalog value as a formula (CSV-injection guard).
 */
export function csvField(value: string | number): string {
  let s = String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Join rows into CSV text with CRLF line endings (Excel-friendly). */
export function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(csvField).join(",")).join("\r\n") + "\r\n";
}

// ─── Export shapes ────────────────────────────────────────────────────────────

const RESULT_HEADERS = [
  "SKU", "Name", "Brand", "Category", "Subcategory",
  "List Price", "UoM", "Branch Stock", "DC Stock", "Preferred",
];

/** Search results export: one row per product with stock totals. */
export function searchResultsCsv(products: CatalogProduct[]): string {
  const rows: (string | number)[][] = [RESULT_HEADERS];
  for (const p of products) {
    rows.push([
      p.sku, p.name, p.brand, p.category, p.subcategory,
      p.unitPrice.toFixed(2), p.uom,
      p.branchStock.reduce((s, b) => s + b.quantity, 0),
      p.dcStock.reduce((s, d) => s + d.quantity, 0),
      p.preferred ? "Yes" : "No",
    ]);
  }
  return toCsv(rows);
}

export interface BasketCsvLine {
  product: CatalogProduct;
  qty: number;
  /** Effective (contract-aware) unit price shown in the basket. */
  effectiveUnitPrice: number;
}

const BASKET_HEADERS = [
  "SKU", "Name", "Brand", "Qty", "UoM",
  "List Unit Price", "Effective Unit Price", "Line Total",
];

/** Basket export: one row per line plus a trailing total row. */
export function basketCsv(lines: BasketCsvLine[]): string {
  const rows: (string | number)[][] = [BASKET_HEADERS];
  let total = 0;
  for (const { product, qty, effectiveUnitPrice } of lines) {
    const lineTotal = effectiveUnitPrice * qty;
    total += lineTotal;
    rows.push([
      product.sku, product.name, product.brand, qty, product.uom,
      product.unitPrice.toFixed(2), effectiveUnitPrice.toFixed(2), lineTotal.toFixed(2),
    ]);
  }
  rows.push(["", "", "", "", "", "", "Total", total.toFixed(2)]);
  return toCsv(rows);
}

// ─── Browser download helper ──────────────────────────────────────────────────

/** Trigger a client-side download of CSV text. No-op outside the browser. */
export function downloadCsv(filename: string, csv: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
