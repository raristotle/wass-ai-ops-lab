/**
 * Cut-to-length / by-the-foot CPQ-lite. Pure, deterministic.
 *
 * Wire, conduit, and strut are often sold by the linear foot. This module
 * detects ft-sold products, parses their AWG size (for NEC ampacity), and
 * produces a line-item spec the cart can use (qty = ⌈lengthFt⌉, unitPrice per ft).
 */

import type { CatalogProduct } from "@/features/product-finder/types";
import type { AwgSize, Conductor } from "@/lib/catalog/nec-selectors";
import { wireAmpacity, AWG_SIZES } from "@/lib/catalog/nec-selectors";

/** True when this product is sold by the linear foot. */
export function isSoldByFoot(product: CatalogProduct): boolean {
  const uom = product.uom?.toLowerCase().trim();
  return uom === "ft" || uom === "lf";
}

/**
 * Detect AWG size from a product name/sku — e.g. "12 AWG THHN" → "12",
 * "4/0 AWG Cu" → "4/0". Returns null when none found.
 */
export function extractWireAwg(product: CatalogProduct): AwgSize | null {
  // Sort longest tokens first so "1/0" matches before "1", etc.
  const sorted = [...AWG_SIZES].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`\\b(${sorted.map((s) => s.replace("/", "\\/")).join("|")})\\s*AWG\\b`, "i");
  const m = pattern.exec(product.name) ?? pattern.exec(product.sku ?? "");
  if (!m) return null;
  const found = m[1];
  return AWG_SIZES.includes(found as AwgSize) ? (found as AwgSize) : null;
}

/** Detect conductor material from the product name. */
export function extractConductorMaterial(product: CatalogProduct): Conductor | null {
  const name = product.name.toLowerCase();
  if (/aluminum|\bal\b/.test(name)) return "Al";
  if (/copper|\bcu\b|thhn|thwn|xhhw/.test(name)) return "Cu";
  return null;
}

export interface CutToLengthResult {
  /** Length the user requested, in feet. */
  lengthFt: number;
  /** Cart quantity (= ⌈lengthFt⌉, one unit = one foot). */
  qty: number;
  /** Total price at the product's per-foot unit price. */
  totalPrice: number;
  /** NEC 310.15 ampacity if this is a wire product; null otherwise. */
  ampacity: number | null;
  /** Short display note for the cart line, e.g. "12 AWG Cu — 20 A @ 75°C". */
  note: string | null;
}

/**
 * Calculate a cut-to-length order. Wire products get their NEC ampacity from
 * the AWG detected in the product name.
 */
export function calcCutToLength(product: CatalogProduct, lengthFt: number): CutToLengthResult {
  if (lengthFt <= 0) {
    return { lengthFt: 0, qty: 0, totalPrice: 0, ampacity: null, note: null };
  }
  const qty = Math.ceil(lengthFt);
  const totalPrice = qty * product.unitPrice;
  const awg = extractWireAwg(product);
  const material = extractConductorMaterial(product) ?? "Cu";
  const ampacity = awg ? wireAmpacity(awg, material) : null;
  const note = awg && ampacity !== null
    ? `${awg} AWG ${material} — ${ampacity} A @ 75°C (NEC 310.15)`
    : awg
      ? `${awg} AWG ${material} — no ampacity data for this size/material`
      : null;
  return { lengthFt, qty, totalPrice, ampacity, note };
}

/**
 * Human-readable display of the cut-to-length order, e.g. "75 ft (75 units)".
 * The `note` field carries the NEC ampacity context.
 */
export function cutToLengthLabel(result: CutToLengthResult): string {
  return `${result.qty} ft — $${result.totalPrice.toFixed(2)}`;
}
