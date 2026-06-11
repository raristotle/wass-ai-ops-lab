/**
 * lib/product-finder-plate.ts — key-spec callout selection for product plates.
 *
 * A "callout" is the single most identifying short spec value (e.g. "20A",
 * "12 AWG", "4K UHD") rendered on the product art plate. Pure & deterministic.
 */

import type { ProductSpec } from "@/features/product-finder/types";

/** Spec names in callout priority order — first present-and-short value wins. */
export const CALLOUT_SPEC_PRIORITY: readonly string[] = [
  "Amperage",
  "Main Rating",
  "Output Current",
  "Gauge",
  "kVA",
  "Power Rating",
  "Capacity",
  "Wattage",
  "Lumens",
  "Category",
  "Resolution",
  "Ports",
  "Channels",
  "Zones",
  "NRR",
  "Voltage",
];

/** Longest value that still fits on the plate. */
export const CALLOUT_MAX_LEN = 8;

/**
 * Pick the callout for a product's specs: the first spec in priority order
 * whose trimmed value is non-empty and at most CALLOUT_MAX_LEN characters.
 * Returns null when no spec qualifies.
 */
export function keySpecCallout(specs: ProductSpec[]): string | null {
  for (const name of CALLOUT_SPEC_PRIORITY) {
    const spec = specs.find((s) => s.name === name);
    if (!spec) continue;
    const value = spec.value.trim();
    if (value.length > 0 && value.length <= CALLOUT_MAX_LEN) return value;
  }
  return null;
}
