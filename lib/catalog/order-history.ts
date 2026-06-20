/**
 * Order-history import (pilot data onboarding) — pure parser.
 *
 * The behavioral engines (market-basket lift, also-bought, demand) are dormant until
 * the app sees REAL order baskets. This parser turns a customer's historical order
 * export (a CSV of order lines) into grouped orders, which the import route resolves
 * to catalog products and mines into association rules — so importing one real order
 * file lights up the cross-sell rail with genuine co-purchase signal instead of the
 * always-on deterministic spec-rule fallback.
 *
 * Pure + deterministic (no catalog, no network). SKU→product resolution and rule
 * mining happen server-side over the parsed output. Forgiving about column names and
 * delimiter because real exports are messy; strict about never inventing data — an
 * unparseable line is dropped and counted, never guessed.
 */

export interface RawOrderLine {
  sku: string;
  qty: number;
}

export interface RawOrder {
  orderId: string;
  lines: RawOrderLine[];
}

export interface ParseStats {
  /** Data rows seen (excluding the header). */
  rows: number;
  /** Rows dropped because they had no usable SKU. */
  dropped: number;
  /** Distinct orders parsed. */
  orders: number;
  /** Total resolved-or-not order lines across all orders. */
  lines: number;
  /** The header columns we mapped, for the import summary / debugging. */
  mapping: { order: string | null; sku: string | null; qty: string | null };
}

export interface ParsedOrderHistory {
  orders: RawOrder[];
  stats: ParseStats;
}

// Header synonyms, lowercased. First match wins. Kept generous because distributor /
// ERP exports vary wildly (P21, SAP, Excel hand-exports, …).
const ORDER_HEADERS = ["order", "order_id", "orderid", "order number", "order_no", "ordernumber", "po", "po_number", "invoice", "invoice_no", "transaction", "ticket", "sales_order", "so", "so_number"];
const SKU_HEADERS = ["sku", "part", "part_number", "partnumber", "part number", "item", "item_number", "itemnumber", "item number", "product", "product_code", "catalog", "catalog_number", "mpn", "material"];
const QTY_HEADERS = ["qty", "quantity", "qty_ordered", "order_qty", "ordered", "units", "count"];

/** Split one CSV line, honoring simple double-quoted fields (incl. embedded commas/quotes). */
function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else cur += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Pick the delimiter by sampling the header row (comma, tab, semicolon, or pipe). */
function detectDelimiter(headerLine: string): string {
  const candidates = [",", "\t", ";", "|"];
  let best = ",";
  let bestCount = -1;
  for (const d of candidates) {
    const n = headerLine.split(d).length;
    if (n > bestCount) {
      bestCount = n;
      best = d;
    }
  }
  return best;
}

/** Split a header into alphanumeric tokens ("Order Number" → ["order","number"]). */
function tokenize(header: string): string[] {
  return header.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

/**
 * Map a header to a column by name. Three passes, most-precise first:
 *   1. the whole header equals a synonym ("sku", "order number"),
 *   2. a header TOKEN equals a synonym ("Order Number"→order, "po_number"→po),
 *   3. a substring contains a synonym — but ONLY for synonyms ≥ 4 chars, so the
 *      2-char ids "po"/"so" can't shadow "postal_code" / "disposition" etc. and
 *      silently mis-map the order column (which would collapse every row into its
 *      own basket and mine zero pairs).
 */
function findColumn(headers: string[], synonyms: string[]): number {
  const lower = headers.map((h) => h.toLowerCase());
  for (const syn of synonyms) {
    const i = lower.indexOf(syn);
    if (i !== -1) return i;
  }
  const tokens = headers.map(tokenize);
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].some((t) => synonyms.includes(t))) return i;
  }
  for (let i = 0; i < lower.length; i++) {
    if (synonyms.some((syn) => syn.length >= 4 && lower[i].includes(syn))) return i;
  }
  return -1;
}

/** Parse a positive-integer-ish quantity; default 1 (a line means "ordered it"). */
function parseQty(raw: string | undefined): number {
  if (!raw) return 1;
  const n = Math.floor(Number(raw.replace(/[^0-9.\-]/g, "")));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Parse a CSV order export into grouped orders. The header row is required (we map
 * columns by name). When no `order` column is present, EVERY row is treated as its
 * own single-line order (still useful — single-item orders just contribute item
 * frequency, not pairs). When no `sku` column is found at all, returns zero orders
 * with the mapping nulled so the caller can show a clear error.
 */
export function parseOrderHistoryCsv(csv: string): ParsedOrderHistory {
  const empty: ParsedOrderHistory = {
    orders: [],
    stats: { rows: 0, dropped: 0, orders: 0, lines: 0, mapping: { order: null, sku: null, qty: null } },
  };
  if (!csv || !csv.trim()) return empty;

  const allLines = csv.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);
  if (allLines.length < 2) return empty; // header + at least one data row

  const delim = detectDelimiter(allLines[0]);
  const headers = splitCsvLine(allLines[0], delim);
  const orderCol = findColumn(headers, ORDER_HEADERS);
  const skuCol = findColumn(headers, SKU_HEADERS);
  const qtyCol = findColumn(headers, QTY_HEADERS);

  const mapping = {
    order: orderCol === -1 ? null : headers[orderCol],
    sku: skuCol === -1 ? null : headers[skuCol],
    qty: qtyCol === -1 ? null : headers[qtyCol],
  };
  if (skuCol === -1) return { orders: [], stats: { ...empty.stats, rows: allLines.length - 1, mapping } };

  // Group lines by order id (or synthesize a per-row id when no order column).
  const byOrder = new Map<string, RawOrderLine[]>();
  let rows = 0;
  let dropped = 0;
  let lines = 0;
  for (let r = 1; r < allLines.length; r++) {
    rows++;
    const cells = splitCsvLine(allLines[r], delim);
    const sku = (cells[skuCol] ?? "").trim();
    if (!sku) {
      dropped++;
      continue;
    }
    const qty = parseQty(qtyCol === -1 ? undefined : cells[qtyCol]);
    const orderId = orderCol === -1 ? `row-${r}` : (cells[orderCol] ?? "").trim() || `row-${r}`;
    const list = byOrder.get(orderId) ?? [];
    list.push({ sku, qty });
    byOrder.set(orderId, list);
    lines++;
  }

  const orders: RawOrder[] = [...byOrder.entries()].map(([orderId, l]) => ({ orderId, lines: l }));
  return {
    orders,
    stats: { rows, dropped, orders: orders.length, lines, mapping },
  };
}
