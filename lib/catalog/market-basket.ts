/**
 * Market-basket association-rule engine (v5-S1 #3) — pure, $0, no model, no
 * network. Mines "A → B" affinity from real baskets (orders, quotes, won BOMs)
 * the way a merchandiser does: support (how common the pair is), confidence
 * (P(B | A)), and LIFT (how much more likely B is given A vs. its base rate).
 * Lift > 1 means a genuine affinity, not just two popular items co-occurring.
 *
 * It mines at TWO grains so it works on sparse and rich data alike:
 *   - subcategory-level (robust on little data — the default companion signal), and
 *   - product-level (precise when a SKU pair recurs often enough).
 *
 * Deterministic (ties broken by id), self-improving (gets sharper as more order
 * history accrues), and fully unit-tested. The companion-graph blends these lift
 * scores with the deterministic spec-rule + affinity edges.
 */

export interface BasketItem {
  productId: string;
  subcategory: string;
}
export interface Basket {
  items: BasketItem[];
}

export type RuleGrain = "subcategory" | "product";

export interface AssocRule {
  grain: RuleGrain;
  /** Antecedent key (a subcategory name or a product id). */
  a: string;
  /** Consequent key. */
  b: string;
  /** Baskets containing both A and B. */
  count: number;
  /** count / totalBaskets. */
  support: number;
  /** P(B | A) = count / countA. */
  confidence: number;
  /** confidence / P(B) — affinity strength; > 1 is meaningful. */
  lift: number;
}

export interface MineOptions {
  grain?: RuleGrain;
  /** Drop rules seen in fewer than this many baskets (noise floor). Default 2. */
  minCount?: number;
  /** Drop rules below this lift. Default 1.0 (only positive affinity). */
  minLift?: number;
}

/**
 * Ordered-pair key delimiter. Keys are subcategory names ("Wall Plates & Covers")
 * or product ids — both routinely contain SPACES, so a space delimiter would
 * mis-split the packed key and silently drop most rules. NUL (U+0000) cannot occur
 * in either, so `key = `${a}${PAIR_SEP}${b}`` round-trips unambiguously.
 */
const PAIR_SEP = "\u0000";

/** Distinct keys present in a basket at the chosen grain (each counted once). */
function basketKeys(basket: Basket, grain: RuleGrain): string[] {
  const set = new Set<string>();
  for (const it of basket.items) set.add(grain === "product" ? it.productId : it.subcategory);
  return [...set];
}

/**
 * Mine directional association rules A→B over the baskets. Pure + deterministic.
 * Returns rules sorted by lift desc (then confidence, then count, then keys).
 */
export function mineAssociationRules(baskets: Basket[], opts: MineOptions = {}): AssocRule[] {
  const grain = opts.grain ?? "subcategory";
  const minCount = opts.minCount ?? 2;
  const minLift = opts.minLift ?? 1.0;

  const total = baskets.length;
  if (total === 0) return [];

  const itemCount = new Map<string, number>(); // baskets containing key
  const pairCount = new Map<string, number>(); // baskets containing both a→b (ordered)

  for (const basket of baskets) {
    const keys = basketKeys(basket, grain);
    for (const k of keys) itemCount.set(k, (itemCount.get(k) ?? 0) + 1);
    for (let i = 0; i < keys.length; i++) {
      for (let j = 0; j < keys.length; j++) {
        if (i === j) continue;
        const pk = `${keys[i]}${PAIR_SEP}${keys[j]}`;
        pairCount.set(pk, (pairCount.get(pk) ?? 0) + 1);
      }
    }
  }

  const rules: AssocRule[] = [];
  for (const [pk, count] of pairCount) {
    if (count < minCount) continue;
    const sep = pk.indexOf(PAIR_SEP);
    const a = pk.slice(0, sep);
    const b = pk.slice(sep + PAIR_SEP.length);
    const countA = itemCount.get(a) ?? 0;
    const countB = itemCount.get(b) ?? 0;
    if (countA === 0 || countB === 0) continue;
    const support = count / total;
    const confidence = count / countA;
    const pB = countB / total;
    const lift = pB > 0 ? confidence / pB : 0;
    if (lift < minLift) continue;
    rules.push({ grain, a, b, count, support, confidence, lift });
  }

  return rules.sort(
    (x, y) =>
      y.lift - x.lift ||
      y.confidence - x.confidence ||
      y.count - x.count ||
      x.a.localeCompare(y.a) ||
      x.b.localeCompare(y.b),
  );
}

/** The strongest consequents (B) for a given antecedent key, best lift first. */
export function consequentsFor(rules: AssocRule[], antecedent: string, k = 8): AssocRule[] {
  return rules.filter((r) => r.a === antecedent).slice(0, k);
}

/**
 * Index rules by antecedent for O(1) lookup, preserving the lift-sorted order.
 * The companion-graph keeps one of these per grain.
 */
export function indexByAntecedent(rules: AssocRule[]): Map<string, AssocRule[]> {
  const m = new Map<string, AssocRule[]>();
  for (const r of rules) {
    const list = m.get(r.a) ?? [];
    list.push(r);
    m.set(r.a, list);
  }
  return m;
}
