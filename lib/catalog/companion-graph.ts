/**
 * Companion graph + attach-rank (v5-S1 #2) — the unified cross-sell brain. It
 * blends three signals into ONE ranked, scored companion list per product:
 *
 *   - SPEC-RULE edges (companion-rules.ts) — engineering-mandatory "required" +
 *     "recommended" companions with a stated reason; fire on every product.
 *   - MARKET-BASKET lift (market-basket.ts) — behavioral affinity from real order
 *     baskets; sharpens ranking when order history is available.
 *   - AFFINITY map (goeswith.ts) — the shipped subcategory complementarity baseline.
 *
 * Output is an attach-scored list (0-100) with a relation + reasons, so a rep sees
 * "Required — a switch needs a wall plate" above "Frequently bought together (2.4×)".
 *
 * MATERIALIZED FOR SPEED: the best candidate products per subcategory are
 * precomputed once (a $0, in-memory stand-in for a Neon materialized table), and
 * the deterministic spec+affinity result per product is memoized — so the common
 * rails are an O(1) keyed lookup, not a per-request catalog scan. Pure given the
 * catalog (no Date/random); market-basket rules are applied as a fresh overlay.
 */

import { getCatalog } from "@/lib/catalog/index";
import {
  companionRulesFor,
  specValue,
  COMPANION_RULES,
  type CompanionRelation,
} from "@/lib/catalog/companion-rules";
import { AFFINITY } from "@/lib/catalog/goeswith";
import type { AssocRule } from "@/lib/catalog/market-basket";
import type { CatalogProduct } from "@/features/product-finder/types";

export interface Companion {
  product: CatalogProduct;
  /** Strongest relation across the signals that produced this companion. */
  relation: CompanionRelation;
  /** Combined attach score, 0-100 (required edges + lift + stock + preferred). */
  attachScore: number;
  reasons: string[];
  sources: ("spec-rule" | "market-basket" | "affinity")[];
}

export interface CompanionContext {
  branchId?: string;
  /** Optional subcategory-grain market-basket rules (from mineAssociationRules). */
  rulesBySubcat?: Map<string, AssocRule[]>;
  /** Product ids to exclude (e.g. what's already in the cart). */
  excludeIds?: ReadonlySet<string>;
}

function totalStock(p: CatalogProduct): number {
  return p.branchStock.reduce((s, b) => s + b.quantity, 0);
}
function branchStockOf(p: CatalogProduct, branchId?: string): number {
  if (!branchId) return totalStock(p);
  return p.branchStock.find((b) => b.branchId === branchId)?.quantity ?? 0;
}

// ── Materialized: top candidate products per subcategory (built once) ──────────

let _topBySubcat: Map<string, CatalogProduct[]> | null = null;
const TOP_PER_SUBCAT = 12;

function topBySubcategory(): Map<string, CatalogProduct[]> {
  if (_topBySubcat) return _topBySubcat;
  const groups = new Map<string, CatalogProduct[]>();
  for (const p of getCatalog().products) {
    const list = groups.get(p.subcategory) ?? [];
    list.push(p);
    groups.set(p.subcategory, list);
  }
  const top = new Map<string, CatalogProduct[]>();
  for (const [sub, list] of groups) {
    list.sort(
      (a, b) =>
        Number(b.preferred) - Number(a.preferred) ||
        totalStock(b) - totalStock(a) ||
        a.unitPrice - b.unitPrice ||
        a.id.localeCompare(b.id),
    );
    top.set(sub, list.slice(0, TOP_PER_SUBCAT));
  }
  _topBySubcat = top;
  return top;
}

/** Pick the single best companion product for a subcategory, honoring a spec hint. */
function bestInSubcategory(
  subcategory: string,
  branchId: string | undefined,
  exclude: ReadonlySet<string>,
  specHint: { name: string; value: string } | null,
): CatalogProduct | null {
  const candidates = (topBySubcategory().get(subcategory) ?? []).filter((p) => !exclude.has(p.id));
  if (candidates.length === 0) return null;
  // Re-rank by spec-hint match first (a 2-gang device → a 2-gang plate), then the
  // materialized order (preferred / stock / price) already baked in.
  if (specHint) {
    const matches = candidates.filter((p) => specValue(p, specHint.name) === specHint.value);
    if (matches.length > 0) return matches[0];
  }
  const inStock = candidates.filter((p) => branchStockOf(p, branchId) > 0);
  return (inStock[0] ?? candidates[0]) ?? null;
}

// ── Companion subcategory aggregation (spec-rule + affinity + market-basket) ───

interface SubcatEdge {
  subcategory: string;
  relation: CompanionRelation;
  reasons: string[];
  sources: Set<Companion["sources"][number]>;
  specHint: { name: string; value: string } | null;
  lift: number | null;
}

function aggregateSubcatEdges(product: CatalogProduct, ctx: CompanionContext): SubcatEdge[] {
  const edges = new Map<string, SubcatEdge>();
  const upsert = (sub: string): SubcatEdge => {
    let e = edges.get(sub);
    if (!e) {
      e = { subcategory: sub, relation: "recommended", reasons: [], sources: new Set(), specHint: null, lift: null };
      edges.set(sub, e);
    }
    return e;
  };

  // 1. Spec-rule edges (carry relation + why + spec hint).
  for (const r of companionRulesFor(product)) {
    const e = upsert(r.to);
    if (r.relation === "required") e.relation = "required";
    e.reasons.push(r.relation === "required" ? `Required — ${r.why}` : r.why);
    e.sources.add("spec-rule");
    if (r.specHint && !e.specHint) e.specHint = r.specHint(product);
  }

  // 2. Affinity map (recommended baseline).
  for (const sub of AFFINITY[product.subcategory] ?? []) {
    const e = upsert(sub);
    e.sources.add("affinity");
  }

  // 3. Market-basket lift (behavioral), if rules were supplied.
  for (const rule of ctx.rulesBySubcat?.get(product.subcategory) ?? []) {
    if (rule.b === product.subcategory) continue;
    const e = upsert(rule.b);
    e.sources.add("market-basket");
    e.lift = Math.max(e.lift ?? 0, rule.lift);
    e.reasons.push(`Frequently bought together (${rule.lift.toFixed(1)}× lift)`);
  }

  return [...edges.values()];
}

function scoreEdge(edge: SubcatEdge, product: CatalogProduct, branchId?: string): number {
  let score = edge.relation === "required" ? 70 : 40;
  if (edge.lift && edge.lift > 1) score += Math.min(20, (edge.lift - 1) * 10);
  if (branchStockOf(product, branchId) > 0) score += 10;
  if (product.preferred) score += 8;
  if (edge.sources.has("spec-rule") && edge.sources.has("market-basket")) score += 5; // agreement
  return Math.min(100, Math.round(score));
}

// Deterministic (spec+affinity-only) memo — the hot prod path with no order data.
const _memo = new Map<string, Companion[]>();

/**
 * Ranked companions for a product: required first, then by attach score. `k`
 * caps the list. When no market-basket rules are supplied the result is
 * deterministic and memoized (the always-on, sub-10ms rail).
 */
export function companionsFor(product: CatalogProduct, k = 6, ctx: CompanionContext = {}): Companion[] {
  const hasRules = Boolean(ctx.rulesBySubcat && ctx.rulesBySubcat.size > 0);
  const exclude = ctx.excludeIds ?? new Set<string>();
  const memoKey = !hasRules && exclude.size === 0 ? `${product.id}:${ctx.branchId ?? ""}` : null;
  if (memoKey) {
    const cached = _memo.get(memoKey);
    if (cached) return cached.slice(0, k);
  }

  const edges = aggregateSubcatEdges(product, ctx);
  const out: Companion[] = [];
  for (const edge of edges) {
    const best = bestInSubcategory(edge.subcategory, ctx.branchId, new Set([product.id, ...exclude]), edge.specHint);
    if (!best) continue;
    out.push({
      product: best,
      relation: edge.relation,
      attachScore: scoreEdge(edge, best, ctx.branchId),
      reasons: [...new Set(edge.reasons)],
      sources: [...edge.sources],
    });
  }
  out.sort(
    (a, b) =>
      Number(b.relation === "required") - Number(a.relation === "required") ||
      b.attachScore - a.attachScore ||
      a.product.name.localeCompare(b.product.name),
  );
  if (memoKey) _memo.set(memoKey, out);
  return out.slice(0, k);
}

export interface AssemblyResult {
  /** Required companions whose subcategory is absent from the input set. */
  missingRequired: Companion[];
  /** Recommended add-ons across the set, deduped against what's present. */
  recommended: Companion[];
}

/**
 * Complete-the-assembly: given a partial BOM / cart, find the REQUIRED companions
 * that aren't present yet ("you forgot the wall plates / lugs / fittings") plus the
 * top recommended add-ons. The headline cross-sell: turn an incomplete order into a
 * complete, code-correct one.
 */
export function completeAssembly(products: CatalogProduct[], ctx: CompanionContext = {}, k = 6): AssemblyResult {
  const presentSubcats = new Set(products.map((p) => p.subcategory));
  const presentIds = new Set(products.map((p) => p.id));
  const exclude = new Set<string>([...presentIds, ...(ctx.excludeIds ?? [])]);

  const missing = new Map<string, Companion>();
  const rec = new Map<string, Companion>();
  for (const product of products) {
    for (const c of companionsFor(product, 8, { ...ctx, excludeIds: exclude })) {
      const bucket = c.relation === "required" && !presentSubcats.has(c.product.subcategory) ? missing : rec;
      if (c.relation === "required" && presentSubcats.has(c.product.subcategory)) continue; // requirement already met
      const prev = bucket.get(c.product.id);
      if (!prev || c.attachScore > prev.attachScore) bucket.set(c.product.id, c);
    }
  }
  const byScore = (a: Companion, b: Companion) =>
    b.attachScore - a.attachScore || a.product.name.localeCompare(b.product.name);
  return {
    missingRequired: [...missing.values()].sort(byScore).slice(0, k),
    recommended: [...rec.values()].filter((c) => !missing.has(c.product.id)).sort(byScore).slice(0, k),
  };
}

/**
 * Cart-level attach suggestions: aggregate companions across every cart line,
 * dedup against what's already in the cart, and return the top picks — the
 * "complete your order" rail in the cart drawer.
 */
export function attachSuggestionsForCart(products: CatalogProduct[], ctx: CompanionContext = {}, k = 6): Companion[] {
  const result = completeAssembly(products, ctx, 24);
  const merged = [...result.missingRequired, ...result.recommended];
  const seen = new Set<string>();
  const out: Companion[] = [];
  for (const c of merged) {
    if (seen.has(c.product.id)) continue;
    seen.add(c.product.id);
    out.push(c);
  }
  return out.slice(0, k);
}

/** Test/SSR helper: clear the in-memory materialization + memo. */
export function _resetCompanionCache(): void {
  _topBySubcat = null;
  _memo.clear();
}

// ── Subcategory adjacency (v5-S2) ─────────────────────────────────────────────
// A catalog-free, global subcategory→companions map built once from the spec rules
// (with required relation) + the affinity baseline (recommended). Feeds the Account
// 360 whitespace panel and the Segment Solution Builder — neither needs the 200k
// catalog, so this is cheap to ship to the client via an API route.

export interface SubcatAdjacencyEdge {
  to: string;
  required: boolean;
}

let _adjacency: Map<string, SubcatAdjacencyEdge[]> | null = null;

export function subcategoryAdjacency(): Map<string, SubcatAdjacencyEdge[]> {
  if (_adjacency) return _adjacency;
  const m = new Map<string, Map<string, boolean>>(); // from → (to → required)
  const add = (from: string, to: string, required: boolean) => {
    if (from === to) return;
    const inner = m.get(from) ?? new Map<string, boolean>();
    inner.set(to, (inner.get(to) ?? false) || required);
    m.set(from, inner);
  };
  for (const r of COMPANION_RULES) add(r.from, r.to, r.relation === "required");
  for (const [from, tos] of Object.entries(AFFINITY)) {
    for (const to of tos ?? []) add(from, to, false);
  }
  _adjacency = new Map([...m].map(([from, inner]) => [from, [...inner].map(([to, required]) => ({ to, required }))]));
  return _adjacency;
}
