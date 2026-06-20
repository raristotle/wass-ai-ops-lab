/**
 * Account 360 / call-prep whitespace panel (v5-S2 #6) — $0, deterministic.
 *
 * Turns a customer's own order/quote history into a one-screen call-prep view:
 *   - what they buy (subcategories ranked by spend),
 *   - WHITESPACE — adjacent product families they should be buying from us but
 *     aren't (the single biggest average-order-value lever: "they buy breakers
 *     here but source the whips and lugs elsewhere"), and
 *   - the reorder shortlist (their most-purchased SKUs).
 *
 * Whitespace is derived deterministically from the companion adjacency graph
 * (the same spec-rule + affinity edges behind the cross-sell engine): for every
 * subcategory the account buys, its companion subcategories that the account has
 * NEVER purchased are gaps, scored by how much of their spend "points at" the gap.
 * No model, no network. The panel pairs this with the shipped customer-health
 * status and reorder list.
 */

/** One line of account history (an order/quote line), reduced to what we score. */
export interface AccountLine {
  subcategory: string;
  amount: number; // extended line amount
  sku?: string;
  name?: string;
}

export interface PurchasedFamily {
  subcategory: string;
  spend: number;
  lines: number;
  /** Share of total account spend (0..1). */
  share: number;
}

export interface WhitespaceGap {
  /** The family they don't buy from us. */
  subcategory: string;
  /** The purchased families that point at this gap (their companions). */
  drivenBy: string[];
  /** Spend in the driving families — the "pull" toward this gap. */
  pullSpend: number;
  /** 0..100 opportunity score (relative to the strongest gap). */
  score: number;
  /** Whether any driver→gap edge is engineering-required (highest-priority gap). */
  required: boolean;
  reason: string;
}

export interface ReorderCandidate {
  sku: string;
  name: string;
  subcategory: string;
  spend: number;
  lines: number;
}

export interface Account360 {
  purchased: PurchasedFamily[];
  whitespace: WhitespaceGap[];
  topReorder: ReorderCandidate[];
  summary: {
    totalSpend: number;
    distinctFamilies: number;
    whitespaceCount: number;
    requiredGapCount: number;
  };
}

/** A companion edge at the subcategory grain, used to walk adjacency. */
export interface SubcatEdge {
  to: string;
  required: boolean;
}

/**
 * Build the Account 360 view.
 *
 * @param history     the account's order/quote lines.
 * @param adjacency   subcategory → its companion subcategories (from the cross-sell
 *                    graph). Drives whitespace; pass an empty map to skip gaps.
 * @param maxGaps     cap on returned whitespace gaps (default 8).
 */
export function buildAccount360(
  history: AccountLine[],
  adjacency: Map<string, SubcatEdge[]>,
  maxGaps = 8,
): Account360 {
  // ── Purchased families ──────────────────────────────────────────────────────
  const famSpend = new Map<string, { spend: number; lines: number }>();
  for (const l of history) {
    const f = famSpend.get(l.subcategory) ?? { spend: 0, lines: 0 };
    f.spend += l.amount;
    f.lines += 1;
    famSpend.set(l.subcategory, f);
  }
  const totalSpend = [...famSpend.values()].reduce((s, f) => s + f.spend, 0);
  const purchased: PurchasedFamily[] = [...famSpend.entries()]
    .map(([subcategory, f]) => ({
      subcategory,
      spend: f.spend,
      lines: f.lines,
      share: totalSpend > 0 ? f.spend / totalSpend : 0,
    }))
    .sort((a, b) => b.spend - a.spend);

  const owned = new Set(famSpend.keys());

  // ── Whitespace gaps ─────────────────────────────────────────────────────────
  // For each owned family, follow its companion edges to families they DON'T own.
  const gaps = new Map<string, { drivers: Set<string>; pull: number; required: boolean }>();
  for (const fam of owned) {
    const edges = adjacency.get(fam) ?? [];
    const drivingSpend = famSpend.get(fam)?.spend ?? 0;
    for (const e of edges) {
      if (owned.has(e.to)) continue; // already buying it from us — not whitespace
      const g = gaps.get(e.to) ?? { drivers: new Set<string>(), pull: 0, required: false };
      g.drivers.add(fam);
      g.pull += drivingSpend;
      g.required = g.required || e.required;
      gaps.set(e.to, g);
    }
  }

  const maxPull = Math.max(1, ...[...gaps.values()].map((g) => g.pull));
  const whitespace: WhitespaceGap[] = [...gaps.entries()]
    .map(([subcategory, g]) => {
      const drivenBy = [...g.drivers];
      return {
        subcategory,
        drivenBy,
        pullSpend: g.pull,
        // Required gaps get a fixed floor so they never sort below a recommended gap.
        score: Math.round((g.required ? 100 : 0.9 * 100 * (g.pull / maxPull)) || 0),
        required: g.required,
        reason: g.required
          ? `Required with ${drivenBy[0]} — they're buying the device but not the mandatory companion from us`
          : `Goes with ${drivenBy.slice(0, 2).join(" & ")}, which they buy from us`,
      };
    })
    .sort((a, b) => Number(b.required) - Number(a.required) || b.pullSpend - a.pullSpend)
    .slice(0, maxGaps);

  // ── Reorder shortlist ───────────────────────────────────────────────────────
  const skuAgg = new Map<string, ReorderCandidate>();
  for (const l of history) {
    if (!l.sku) continue;
    const r = skuAgg.get(l.sku) ?? { sku: l.sku, name: l.name ?? l.sku, subcategory: l.subcategory, spend: 0, lines: 0 };
    r.spend += l.amount;
    r.lines += 1;
    skuAgg.set(l.sku, r);
  }
  const topReorder = [...skuAgg.values()].sort((a, b) => b.lines - a.lines || b.spend - a.spend).slice(0, 6);

  return {
    purchased,
    whitespace,
    topReorder,
    summary: {
      totalSpend,
      distinctFamilies: purchased.length,
      whitespaceCount: whitespace.length,
      requiredGapCount: whitespace.filter((w) => w.required).length,
    },
  };
}
