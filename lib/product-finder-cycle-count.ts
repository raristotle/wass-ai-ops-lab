/**
 * Scan-to-reorder cycle count (v3-S4 #11 bin manager + #17 cycle-count session).
 *
 * A field rep scans a shelf/bin/van SKU and enters the physical on-hand count;
 * we diff each count against its VMI min/max policy and propose a replenishment
 * basket for everything below min. Pure + deterministic — it REUSES the shipped
 * VMI replenishment math ([[product-finder-vmi]] reorderSuggestion) with the
 * counted quantity as on-hand and zero projected demand (a point-in-time count).
 */

import { reorderSuggestion, type VmiPolicy, type ReorderLine } from "@/lib/product-finder-vmi";

export interface CountEntry {
  sku: string;
  name: string;
  /** Physical units counted at the bin. */
  counted: number;
  /** The VMI policy for this SKU, or null when none is set. */
  policy: VmiPolicy | null;
}

export interface CountResult {
  sku: string;
  name: string;
  counted: number;
  /** Replenishment recommendation, or null when there's no VMI policy to diff against. */
  reorder: ReorderLine | null;
  underMin: boolean;
}

/** Diff each counted SKU against its VMI policy. */
export function evaluateCounts(entries: CountEntry[]): CountResult[] {
  return entries.map((e) => {
    if (!e.policy) {
      return { sku: e.sku, name: e.name, counted: e.counted, reorder: null, underMin: false };
    }
    // On-hand = the counted qty; a cycle count is a snapshot, so no demand offset.
    const reorder = reorderSuggestion(e.policy, Math.max(0, e.counted), 0);
    return { sku: e.sku, name: e.name, counted: e.counted, reorder, underMin: reorder.status !== "ok" };
  });
}

/** The replenishment basket — under-min SKUs with their reorder quantities. */
export function replenishmentItems(results: CountResult[]): { sku: string; qty: number }[] {
  return results
    .filter((r) => r.reorder != null && r.reorder.reorderQty > 0)
    .map((r) => ({ sku: r.sku, qty: r.reorder!.reorderQty }));
}

export interface CountSummary {
  counted: number;
  withPolicy: number;
  underMin: number;
  reorderUnits: number;
}

export function countSummary(results: CountResult[]): CountSummary {
  let withPolicy = 0;
  let underMin = 0;
  let reorderUnits = 0;
  for (const r of results) {
    if (r.reorder) withPolicy += 1;
    if (r.underMin && r.reorder) {
      underMin += 1;
      reorderUnits += r.reorder.reorderQty;
    }
  }
  return { counted: results.length, withPolicy, underMin, reorderUnits };
}
