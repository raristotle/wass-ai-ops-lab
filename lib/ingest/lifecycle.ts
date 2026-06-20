/**
 * Lifecycle-signal mapping for the ingestion framework (Sprint D5).
 *
 * Manufacturer product pages often encode a product's lifecycle in their schema.org
 * `offers.availability` (the schema.org `ItemAvailability` enum) — most usefully
 * `Discontinued`, which is a real end-of-life signal. This pure mapper turns that enum
 * (a full URL, a short `schema:Discontinued`, or bare text) into one of our coarse
 * lifecycle states, or null when it carries no lifecycle meaning (a plain stock state like
 * InStock isn't a lifecycle fact — honest: we don't infer lifecycle we weren't told).
 */

export type LifecycleState = "active" | "discontinued";

/**
 * Map a schema.org ItemAvailability value to a lifecycle state, or null when it implies no
 * lifecycle change. Only `Discontinued` is treated as a lifecycle (EOL) signal; ordinary
 * stock states (In/OutOfStock, PreOrder, BackOrder, SoldOut, …) describe availability, not
 * lifecycle, so they map to null rather than asserting "active" we can't substantiate.
 */
export function mapAvailabilityToLifecycle(raw: string | null | undefined): LifecycleState | null {
  if (!raw) return null;
  // Reduce "https://schema.org/Discontinued" / "schema:Discontinued" / "Discontinued" /
  // "Discontinued/" to the leaf (strip a trailing separator first so a trailing slash keeps).
  const leaf = raw.trim().replace(/[/#?]+$/, "").replace(/^.*[/:#]/, "").toLowerCase();
  if (leaf === "discontinued") return "discontinued";
  return null;
}

/** The canonical attribute name used to carry a lifecycle signal on an ingested record. */
export const LIFECYCLE_ATTRIBUTE = "Lifecycle status";

/** A human label for a lifecycle state (used as the attribute value). */
export function lifecycleLabel(state: LifecycleState): string {
  return state === "discontinued" ? "Discontinued" : "Active";
}
