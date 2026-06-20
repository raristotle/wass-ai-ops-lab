/**
 * Compare → complete-the-upgrade (v5-S3 #14) — $0, deterministic.
 *
 * When a rep compares products and moves the customer UP to a richer SKU, that
 * upgrade often needs companions the base didn't — a GFCI needs a weather-resistant
 * cover; a smart breaker needs a neutral kit. This computes the DELTA: the upgrade's
 * companions whose family isn't already represented among the compared products, so
 * the rep attaches exactly what the upgrade adds (not what they already had).
 *
 * Pure. The compare modal fetches the upgrade's companions (S1 engine) and the
 * compared products' subcategories, and passes them here.
 */

export interface UpgradeCompanion {
  relation: "required" | "recommended";
  attachScore: number;
  reasons: string[];
  product: { id: string; sku: string; name: string; subcategory: string; unitPrice: number; imageIcon?: string };
}

/**
 * The companions the upgrade adds over the compared set.
 *
 * @param upgradeCompanions  companions of the chosen upgrade product (from S1).
 * @param comparedSubcats    subcategories already present among the compared products
 *                           (and, optionally, the cart) — companions in these families
 *                           are NOT new, so they're dropped.
 * @param requiredOnly       when true, keep only engineering-required additions.
 */
export function upgradeDeltaCompanions(
  upgradeCompanions: UpgradeCompanion[],
  comparedSubcats: Iterable<string>,
  requiredOnly = false,
): UpgradeCompanion[] {
  const covered = new Set(comparedSubcats);
  const seen = new Set<string>();
  const out: UpgradeCompanion[] = [];
  for (const c of upgradeCompanions) {
    if (covered.has(c.product.subcategory)) continue; // already represented → not "new"
    if (requiredOnly && c.relation !== "required") continue;
    if (seen.has(c.product.id)) continue;
    seen.add(c.product.id);
    out.push(c);
  }
  // Required first, then by attach score (mirrors the companion rail ordering).
  return out.sort((a, b) => {
    if (a.relation !== b.relation) return a.relation === "required" ? -1 : 1;
    return b.attachScore - a.attachScore;
  });
}

/**
 * Pick the "upgrade" among a set of compared products: the one a rep would trade up
 * TO. Heuristic = highest unit price (ties broken by preferred, then id) — the
 * compare modal can override with an explicit choice.
 */
export function pickUpgrade<T extends { id: string; unitPrice: number; preferred?: boolean }>(products: T[]): T | null {
  if (products.length === 0) return null;
  return [...products].sort(
    // Coerce preferred to 0/1 — Number(undefined) is NaN and would silently drop the
    // tiebreak (NaN-NaN is falsy) when one candidate has `preferred` unset.
    (a, b) => b.unitPrice - a.unitPrice || Number(!!b.preferred) - Number(!!a.preferred) || a.id.localeCompare(b.id),
  )[0];
}
