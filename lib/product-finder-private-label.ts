/**
 * Private-label / preferred-brand upsell lane (v5-S2 #9) — $0, deterministic.
 *
 * The highest-margin distributor lever is a brand shift that doesn't change the
 * spec: move a line from a commodity brand to Meridian's preferred / private-label
 * equivalent. This module measures PENETRATION (how much of the cart is already
 * preferred) and proposes a BULK SWAP of the rest to their preferred equivalents,
 * with the customer-price and margin deltas spelled out so the rep can defend it.
 *
 * Pure. The equivalent lookup (commodity SKU → preferred functional equivalent) is
 * injected, so the engine stays testable; the UI wires it to the shipped
 * cross-reference / functionalEquivalents engine with a preferred-brand bias.
 */

import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Margin-point advantage a preferred / private-label line carries over a commodity
 * brand — the distributor's own / preferred-line buy is structurally better. The
 * base cost model derives cost as a flat fraction of LIST (with per-product jitter),
 * which can't see this, so we model the lever DIRECTLY and deterministically: a
 * preferred swap adds ~8 points of margin on the line's revenue. Conservative,
 * documented, and INTERNAL only (never surfaced on a customer artifact).
 */
export const PREFERRED_MARGIN_ADVANTAGE = 0.08;

export interface PenetrationStat {
  preferredLines: number;
  totalLines: number;
  preferredValue: number;
  totalValue: number;
  /** Share of lines that are preferred (0..100). */
  linePenetrationPct: number;
  /** Share of dollars that are preferred (0..100). */
  valuePenetrationPct: number;
}

const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Current preferred-brand penetration of a cart. */
export function cartPenetration(lines: { product: CatalogProduct; qty: number }[]): PenetrationStat {
  let preferredLines = 0;
  let totalValue = 0;
  let preferredValue = 0;
  for (const { product, qty } of lines) {
    const ext = product.unitPrice * qty;
    totalValue += ext;
    if (product.preferred) {
      preferredLines += 1;
      preferredValue += ext;
    }
  }
  return {
    preferredLines,
    totalLines: lines.length,
    preferredValue,
    totalValue,
    linePenetrationPct: pct(preferredLines, lines.length),
    valuePenetrationPct: pct(preferredValue, totalValue),
  };
}

export interface PreferredSwap {
  from: CatalogProduct;
  to: CatalogProduct;
  qty: number;
  /** Customer-facing unit price change (to − from); negative = also cheaper for them. */
  unitPriceDelta: number;
  /** Margin-point improvement on the line (preferred is usually richer margin). */
  marginDeltaPct: number;
  /** Extra gross margin dollars across the quantity from making the swap. */
  lineMarginGain: number;
}

/**
 * Propose preferred-brand swaps for every non-preferred line that has a preferred
 * equivalent. Only swaps that do NOT raise the customer's price beyond a small
 * tolerance AND improve our margin are returned (a defensible, no-downside swap).
 *
 * @param lines               the cart.
 * @param findPreferredEquiv  commodity product → its preferred equivalent (or null).
 * @param maxUnitPriceIncrease customer unit-price increase tolerated (default 0 — never costs them more).
 */
export function preferredSwaps(
  lines: { product: CatalogProduct; qty: number }[],
  findPreferredEquiv: (p: CatalogProduct) => CatalogProduct | null,
  maxUnitPriceIncrease = 0,
): PreferredSwap[] {
  const swaps: PreferredSwap[] = [];
  for (const { product, qty } of lines) {
    if (product.preferred) continue;
    const to = findPreferredEquiv(product);
    if (!to || to.id === product.id || !to.preferred) continue;

    const unitPriceDelta = to.unitPrice - product.unitPrice;
    if (unitPriceDelta > maxUnitPriceIncrease) continue; // would cost the customer more — skip

    // The lever is the private-label margin advantage on the swapped line's revenue,
    // plus any margin already implied by a lower customer price still capturing list.
    const lineMarginGain = round2(PREFERRED_MARGIN_ADVANTAGE * to.unitPrice * qty);
    if (lineMarginGain <= 0) continue;

    swaps.push({
      from: product,
      to,
      qty,
      unitPriceDelta,
      marginDeltaPct: PREFERRED_MARGIN_ADVANTAGE,
      lineMarginGain,
    });
  }
  // Biggest margin win first, then DEDUPE by target: several commodity lines can
  // cross to the same preferred SKU, but offering the same swap twice would double-
  // count penetration and clutter the rail — keep the highest-gain one per target.
  swaps.sort((a, b) => b.lineMarginGain - a.lineMarginGain || a.from.id.localeCompare(b.from.id));
  const seenTo = new Set<string>();
  return swaps.filter((s) => {
    if (seenTo.has(s.to.id)) return false;
    seenTo.add(s.to.id);
    return true;
  });
}

/** Penetration the cart WOULD have if every proposed swap were taken. */
export function penetrationAfterSwaps(
  lines: { product: CatalogProduct; qty: number }[],
  swaps: PreferredSwap[],
): PenetrationStat {
  const swapByFromId = new Map(swaps.map((s) => [s.from.id, s.to]));
  const swapped = lines.map(({ product, qty }) => ({ product: swapByFromId.get(product.id) ?? product, qty }));
  return cartPenetration(swapped);
}
