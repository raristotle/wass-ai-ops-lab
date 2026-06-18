/**
 * Plan-takeoff import (v3-S3 #15) — ingest an estimating / Bluebeam "Quantity
 * Link" CSV (device counts, fixture schedules with CSI codes) and feed its rows
 * through the SHIPPED fuzzy-match + confidence pipeline ([[product-finder-bom]]).
 * No PDF parsing — we meet contractors at the CSV they already export. Pure,
 * deterministic, $0; flexible header detection so column order/naming can vary.
 */

import type { ParsedBomLine } from "@/lib/product-finder-bom";

export interface TakeoffRow {
  description: string;
  qty: number;
  uom?: string;
  csiCode?: string;
}

const ROW_CAP = 200;

const DESC_HEADERS = ["description", "item", "material", "product", "scope", "desc", "fixture"];
const QTY_HEADERS = ["qty", "quantity", "count", "total qty", "ext qty"];
const UOM_HEADERS = ["uom", "unit", "units", "u/m", "uo m"];
const CSI_HEADERS = ["csi code", "csi#", "csi", "code", "section"];

/** Split one CSV line, honoring quoted fields ("a, b" stays one cell). */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Index of the first header matching any of `names` (exact, then contains). */
function colIndex(headers: string[], names: string[]): number {
  const exact = headers.findIndex((h) => names.includes(h));
  if (exact >= 0) return exact;
  return headers.findIndex((h) => names.some((n) => h.includes(n)));
}

function parseQty(cell: string | undefined): number {
  if (!cell) return 1;
  const n = parseInt(cell.replace(/[^\d.-]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** True when the text looks like a structured takeoff CSV (header + a desc + qty/count column). */
export function isLikelyTakeoffCsv(text: string): boolean {
  const firstLine = text.split(/\r?\n/).map((l) => l.trim()).find(Boolean);
  if (!firstLine || !firstLine.includes(",")) return false;
  const headers = splitCsvLine(firstLine).map((h) => h.toLowerCase());
  return colIndex(headers, DESC_HEADERS) >= 0 && colIndex(headers, QTY_HEADERS) >= 0;
}

/** Parse a takeoff CSV into rows. Returns [] when there's no recognizable description column. */
export function parseTakeoffCsv(text: string): TakeoffRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const di = colIndex(headers, DESC_HEADERS);
  if (di < 0) return [];
  const qi = colIndex(headers, QTY_HEADERS);
  const ui = colIndex(headers, UOM_HEADERS);
  const ci = colIndex(headers, CSI_HEADERS);

  const rows: TakeoffRow[] = [];
  for (let i = 1; i < lines.length && rows.length < ROW_CAP; i += 1) {
    const cells = splitCsvLine(lines[i]);
    const description = (cells[di] ?? "").trim();
    if (!description) continue;
    rows.push({
      description,
      qty: qi >= 0 ? parseQty(cells[qi]) : 1,
      uom: ui >= 0 ? (cells[ui] || "").trim() || undefined : undefined,
      csiCode: ci >= 0 ? (cells[ci] || "").trim() || undefined : undefined,
    });
  }
  return rows;
}

/**
 * Map takeoff rows to the shipped BOM matcher's input. The description is the
 * match query; qty + a readable `raw` line carry through for display.
 */
export function takeoffToParsedLines(rows: TakeoffRow[]): ParsedBomLine[] {
  return rows.map((r) => ({
    raw: `${r.qty}× ${r.description}${r.uom ? ` ${r.uom}` : ""}${r.csiCode ? ` [${r.csiCode}]` : ""}`,
    qty: r.qty,
    query: r.description,
  }));
}
