import { LEVITON_GTIN_PACKED } from "@/data/real/leviton-gtin";

/**
 * B11 — Leviton UPC → GTIN resolution. We parsed 8,220 Leviton MPN→UPC pairs from a rep
 * cross-reference workbook but honestly declined to mislabel the UPCs as Wesco stock numbers.
 * Those Leviton parts are cross-reference TARGETS (see data/real/xref-crosses.ts), not stand-alone
 * catalog products — so a Leviton UPC/GTIN can't hit the product search directly. Instead it resolves
 * to the Leviton MPN, which the bulk cross index (lookupXref) then crosses to what we stock: a rep who
 * scans or types a physical Leviton barcode still gets the documented cross.
 *
 * Lazy + globalThis-cached: the ~170 KB packed string is parsed into a Map only the first time a
 * UPC-shaped query actually misses a direct cross lookup — a non-numeric part never triggers it.
 */

const TAB = String.fromCharCode(9);
const g = globalThis as unknown as { __levitonGtin?: Map<string, string> };

function gtinMap(): Map<string, string> {
  if (g.__levitonGtin) return g.__levitonGtin;
  const m = new Map<string, string>();
  for (const line of LEVITON_GTIN_PACKED.split("\n")) {
    const tab = line.indexOf(TAB);
    if (tab < 0) continue;
    const gtin = line.slice(0, tab);
    const mpn = line.slice(tab + 1);
    if (gtin && mpn) m.set(gtin, mpn);
  }
  g.__levitonGtin = m;
  return m;
}

/**
 * Resolve a possible UPC-A / GTIN-12 to the Leviton MPN it identifies. Accepts the 11-digit UPC-A
 * (leading zero dropped, as retailers often store it) or the 12-digit GTIN-12. Returns null for
 * anything that isn't a UPC-shaped number or isn't a known Leviton GTIN — cheaply, without building
 * the map, when the input clearly can't be a UPC.
 */
export function resolveLevitonGtin(part: string): { mpn: string; gtin: string } | null {
  const digits = (part ?? "").replace(/\D/g, "");
  if (digits.length !== 11 && digits.length !== 12) return null; // not UPC-A shaped → skip the parse
  const gtin = digits.padStart(12, "0");
  const mpn = gtinMap().get(gtin);
  return mpn ? { mpn, gtin } : null;
}

/** Count of Leviton GTINs indexed (for health/diagnostics). Builds the map. */
export function levitonGtinCount(): number {
  return gtinMap().size;
}
