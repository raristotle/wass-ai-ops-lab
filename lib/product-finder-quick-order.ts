/**
 * Quick-Order Pad — pure parsing + exact-SKU resolution.
 *
 * Amazon-Business-style rapid entry: the user pastes/types KNOWN SKUs (one per
 * line, optional quantity) and the whole list is resolved against the catalog by
 * EXACT SKU and added to the cart in one action. This is distinct from the fuzzy
 * BOM import (which searches by description) — here the SKU is the contract, so
 * unmatched lines are flagged rather than guessed.
 *
 * parseQuickOrderLines + resolveQuickOrder + exactSkuResolver are pure and fully
 * unit-tested; the modal supplies the catalog.
 */

import type { CatalogProduct } from "@/features/product-finder/types";

/** Hard cap on parsed lines to bound a paste. */
export const QUICK_ORDER_CAP = 200;
/** Matches the durable order schema's per-line quantity ceiling. */
const MAX_QTY = 100_000;

export interface ParsedQuickLine {
  /** The trimmed source line. */
  raw: string;
  /** The SKU (first token). */
  sku: string;
  /** Positive-integer quantity (defaults to 1 when none/invalid). */
  qty: number;
}

export interface ResolvedQuickLine extends ParsedQuickLine {
  /** The catalog product for an exact SKU match, else null (unmatched). */
  product: CatalogProduct | null;
}

/**
 * Parse a paste list into { sku, qty } lines. The SKU is the FIRST whitespace/
 * comma/tab-delimited token; the quantity is the LAST token when it is a pure
 * positive integer (so "QO115 10", "QO115,10", "QO115\t10", and "QO115 x 10" all
 * give qty 10, while a bare "QO115" gives qty 1). A lone token whose own digits
 * are part of the SKU (e.g. "BX10") is never mis-read as a quantity, because a
 * quantity must be a SEPARATE trailing token.
 */
export function parseQuickOrderLines(text: string): ParsedQuickLine[] {
  const out: ParsedQuickLine[] = [];
  for (const rawLine of text.split("\n")) {
    if (out.length >= QUICK_ORDER_CAP) break;
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    const tokens = trimmed.split(/[\s,\t]+/).filter(Boolean);
    if (tokens.length === 0) continue;
    const sku = tokens[0];
    let qty = 1;
    if (tokens.length >= 2) {
      const last = tokens[tokens.length - 1];
      if (/^\d+$/.test(last)) {
        const n = parseInt(last, 10);
        if (n >= 1) qty = Math.min(n, MAX_QTY);
      }
    }
    out.push({ raw: trimmed, sku, qty });
  }
  return out;
}

/** Build a case-insensitive exact-SKU resolver over a catalog. */
export function exactSkuResolver(catalog: CatalogProduct[]): (sku: string) => CatalogProduct | null {
  const bySku = new Map<string, CatalogProduct>();
  for (const p of catalog) bySku.set(p.sku.trim().toLowerCase(), p);
  return (sku) => bySku.get(sku.trim().toLowerCase()) ?? null;
}

/** Resolve each parsed line to its catalog product (or null). Pure; injected resolver. */
export function resolveQuickOrder(
  parsed: ParsedQuickLine[],
  resolve: (sku: string) => CatalogProduct | null,
): ResolvedQuickLine[] {
  return parsed.map((line) => ({ ...line, product: resolve(line.sku) }));
}
