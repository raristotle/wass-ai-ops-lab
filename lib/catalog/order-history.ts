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
  /** Epoch-ms (UTC midnight) parsed from the order's date column. Undefined when
   *  no date column exists or every line's date was unparseable — the row still
   *  parses fine for market-basket mining, it just can't feed the dated engines. */
  date?: number;
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
  mapping: { order: string | null; sku: string | null; qty: string | null; date: string | null };
  /** Distinct orders that ended up with a usable date — lets the caller tell
   *  "no date column at all" apart from "a few rows had bad dates". */
  dated: number;
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
const DATE_HEADERS = ["date", "order_date", "orderdate", "order date", "invoice_date", "invoicedate", "po_date", "podate", "transaction_date", "transactiondate", "placed", "placed_at", "placedat"];

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

const MIN_REASONABLE_YEAR = 1990;
const MAX_REASONABLE_YEAR = 2100;

function epochFromParts(year: number, month1: number, day: number): number | undefined {
  if (
    !Number.isInteger(year) || !Number.isInteger(month1) || !Number.isInteger(day) ||
    year < MIN_REASONABLE_YEAR || year > MAX_REASONABLE_YEAR ||
    month1 < 1 || month1 > 12 || day < 1 || day > 31
  ) {
    return undefined;
  }
  // UTC midnight — never local-timezone drift, which would shift a date across
  // the day boundary depending on where the import runs.
  const ms = Date.UTC(year, month1 - 1, day);
  // Reject "overflow" dates JS silently normalizes (e.g. month=2,day=30 → March).
  const d = new Date(ms);
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month1 - 1 || d.getUTCDate() !== day) return undefined;
  return ms;
}

/**
 * Tolerant date parser for real-world distributor/ERP exports. Tries, in order:
 *   1. ISO 8601 (`2026-07-06`, `2026/07/06`, with an optional time component),
 *   2. `M/D/YYYY` or `MM/DD/YYYY` (US convention — the overwhelmingly common
 *      export format), also accepting `-` as the separator,
 *   3. 2-digit years for the slash/dash formats (`7/6/26` → 2026; `70`+ → 1900s).
 * Returns undefined (never throws, never guesses) when the text doesn't match
 * any of the above or resolves to an impossible calendar date — the row is kept,
 * it just contributes to market-basket only, exactly like an undated file today.
 */
export function parseOrderDate(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  if (!s) return undefined;

  // ISO: YYYY-MM-DD or YYYY/MM/DD, optionally followed by a time component.
  const iso = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ].*)?$/);
  if (iso) return epochFromParts(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  // US-style: M/D/YYYY or M-D-YYYY, 2- or 4-digit year.
  const us = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (us) {
    let year = Number(us[3]);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    return epochFromParts(year, Number(us[1]), Number(us[2]));
  }

  return undefined;
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
    stats: { rows: 0, dropped: 0, orders: 0, lines: 0, mapping: { order: null, sku: null, qty: null, date: null }, dated: 0 },
  };
  if (!csv || !csv.trim()) return empty;

  const allLines = csv.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);
  if (allLines.length < 2) return empty; // header + at least one data row

  const delim = detectDelimiter(allLines[0]);
  const headers = splitCsvLine(allLines[0], delim);
  const orderCol = findColumn(headers, ORDER_HEADERS);
  const skuCol = findColumn(headers, SKU_HEADERS);
  const qtyCol = findColumn(headers, QTY_HEADERS);
  const dateCol = findColumn(headers, DATE_HEADERS);

  const mapping = {
    order: orderCol === -1 ? null : headers[orderCol],
    sku: skuCol === -1 ? null : headers[skuCol],
    qty: qtyCol === -1 ? null : headers[qtyCol],
    date: dateCol === -1 ? null : headers[dateCol],
  };
  if (skuCol === -1) return { orders: [], stats: { ...empty.stats, rows: allLines.length - 1, mapping } };

  // Group lines by order id (or synthesize a per-row id when no order column).
  // The first successfully-parsed date seen for an order id wins — real exports
  // repeat the same order date on every line of a multi-line order.
  const byOrder = new Map<string, RawOrderLine[]>();
  const dateByOrder = new Map<string, number>();
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

    if (dateCol !== -1 && !dateByOrder.has(orderId)) {
      const parsed = parseOrderDate(cells[dateCol]);
      if (parsed !== undefined) dateByOrder.set(orderId, parsed);
    }
  }

  const orders: RawOrder[] = [...byOrder.entries()].map(([orderId, l]) => {
    const date = dateByOrder.get(orderId);
    return date === undefined ? { orderId, lines: l } : { orderId, date, lines: l };
  });
  return {
    orders,
    stats: { rows, dropped, orders: orders.length, lines, mapping, dated: dateByOrder.size },
  };
}
