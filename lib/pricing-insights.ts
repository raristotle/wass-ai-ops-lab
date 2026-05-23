// lib/pricing-insights.ts — deterministic insight engine for Win-Loss Workbench
// All rules run pure / local. No API calls. All data from MOCK_QUOTES.

import type { QuoteRecord } from "@/lib/win-loss";
import { LOSS_REASON_LABELS } from "@/lib/win-loss";

export type InsightType =
  | "price-review"       // SKU losing repeatedly to same competitor on price
  | "competitor-alert"   // customer repeatedly lost to same competitor
  | "market-share-alert" // product family win rate < 30% vs specific competitor
  | "margin-risk"        // won quotes with margin < 12% (configurable floor)
  | "value-sell-note"    // rep winning only when bundling/noting value-sell
  | "rep-concern";       // rep win rate < 30% overall

export type InsightSeverity = "high" | "medium" | "low";

export interface PricingInsight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  body: string;
  metric: string;         // short stat shown in card badge
  affectedIds: string[];  // QuoteRecord IDs involved
  suggestion: string;
}

// ── Thresholds (easy to tune) ─────────────────────────────────────────────────

const THRESHOLDS = {
  priceReviewMinLosses:    5,   // # losses to same competitor on same SKU
  competitorAlertMinLosses:4,   // # losses of same customer to same competitor
  marketShareMaxWinRate:   30,  // % — below this triggers market-share alert
  marketShareMinTotal:     4,   // minimum # quotes to consider
  marginFloor:             12,  // % — below this on a won quote → margin risk
  marginRiskMinCount:      2,   // minimum # low-margin wins to trigger
  repConcernMaxWinRate:    30,  // % win rate floor for rep-concern
  repConcernMinTotal:      5,   // minimum # decided quotes
};

// ── Helpers ────────────────────────────────────────────────────────────────────

type GroupKey = string;

function groupBy<T>(items: T[], key: (item: T) => GroupKey): Map<GroupKey, T[]> {
  const map = new Map<GroupKey, T[]>();
  for (const item of items) {
    const k = key(item);
    const arr = map.get(k) ?? [];
    arr.push(item);
    map.set(k, arr);
  }
  return map;
}

function decided(records: QuoteRecord[]): QuoteRecord[] {
  return records.filter((r) => r.outcome === "won" || r.outcome === "lost");
}

let _seq = 0;
function nextId(type: InsightType): string {
  return `INS-${type.slice(0, 3).toUpperCase()}-${String(++_seq).padStart(3, "0")}`;
}

// ── Rule implementations ──────────────────────────────────────────────────────

/** Price Review: same primarySku + same competitor + lost on price, N+ times */
function rulePriceReview(records: QuoteRecord[]): PricingInsight[] {
  const losses = records.filter(
    (r) => r.outcome === "lost" && r.lossReason === "price" && r.competitor !== null,
  );
  const groups = groupBy(losses, (r) => `${r.primarySku}||${r.competitor}`);
  const insights: PricingInsight[] = [];

  for (const [key, group] of groups) {
    if (group.length < THRESHOLDS.priceReviewMinLosses) continue;
    const [sku, competitor] = key.split("||") as [string, string];
    const totalLost = group.reduce((s, r) => s + r.quoteValue, 0);
    const avgDelta = group
      .filter((r) => r.priceDelta !== null)
      .reduce((s, r, _, arr) => s + r.priceDelta! / arr.length, 0);

    insights.push({
      id: nextId("price-review"),
      type: "price-review",
      severity: group.length >= 7 ? "high" : "medium",
      title: `${sku} — Recurring Price Losses to ${competitor}`,
      body: `Lost ${group.length} quotes on ${sku} to ${competitor} citing price. ` +
        `Our price averages ${Math.abs(avgDelta).toFixed(1)}% above theirs. ` +
        `Total revenue at risk: $${(totalLost / 1000).toFixed(0)}K.`,
      metric: `${group.length}× losses`,
      affectedIds: group.map((r) => r.id),
      suggestion:
        `Request a cost-down analysis for ${sku} and negotiate volume pricing with the manufacturer. ` +
        `Consider a floor-price exception for ${competitor} competitive situations.`,
    });
  }

  return insights.sort((a, b) => b.affectedIds.length - a.affectedIds.length);
}

/** Competitor Alert: same customer + same competitor + lost, N+ times */
function ruleCompetitorAlert(records: QuoteRecord[]): PricingInsight[] {
  const losses = records.filter(
    (r) => r.outcome === "lost" && r.competitor !== null,
  );
  const groups = groupBy(losses, (r) => `${r.customer}||${r.competitor}`);
  const insights: PricingInsight[] = [];

  for (const [key, group] of groups) {
    if (group.length < THRESHOLDS.competitorAlertMinLosses) continue;
    const [customer, competitor] = key.split("||") as [string, string];
    const topReason = (() => {
      const counts = new Map<string, number>();
      for (const r of group) {
        const reason = r.lossReason ?? "other";
        counts.set(reason, (counts.get(reason) ?? 0) + 1);
      }
      const [top] = [...counts.entries()].sort(([, a], [, b]) => b - a);
      return top ? LOSS_REASON_LABELS[top[0] as keyof typeof LOSS_REASON_LABELS] ?? top[0] : "Unknown";
    })();
    const families = [...new Set(group.map((r) => r.productFamily))].join(", ");

    insights.push({
      id: nextId("competitor-alert"),
      type: "competitor-alert",
      severity: group.length >= 5 ? "high" : "medium",
      title: `${customer} — Repeatedly Lost to ${competitor}`,
      body: `${group.length} losses at ${customer} where ${competitor} won. ` +
        `Primary loss reason: "${topReason}". Product families: ${families}.`,
      metric: `${group.length}× lost`,
      affectedIds: group.map((r) => r.id),
      suggestion:
        `Schedule an executive-level meeting at ${customer} to understand the relationship dynamics. ` +
        `Build a value-sell deck specific to their use cases vs. ${competitor}'s positioning.`,
    });
  }

  return insights.sort((a, b) => b.affectedIds.length - a.affectedIds.length);
}

/** Market Share Alert: productFamily + competitor win rate < threshold, min N quotes */
function ruleMarketShareAlert(records: QuoteRecord[]): PricingInsight[] {
  const d = decided(records).filter((r) => r.competitor !== null);
  const groups = groupBy(d, (r) => `${r.productFamily}||${r.competitor}`);
  const insights: PricingInsight[] = [];

  for (const [key, group] of groups) {
    if (group.length < THRESHOLDS.marketShareMinTotal) continue;
    const won = group.filter((r) => r.outcome === "won").length;
    const winRate = Math.round((won / group.length) * 100);
    if (winRate >= THRESHOLDS.marketShareMaxWinRate) continue;

    const [productFamily, competitor] = key.split("||") as [string, string];
    const lostValue = group
      .filter((r) => r.outcome === "lost")
      .reduce((s, r) => s + r.quoteValue, 0);

    insights.push({
      id: nextId("market-share-alert"),
      type: "market-share-alert",
      severity: winRate < 15 ? "high" : "medium",
      title: `${productFamily} — Losing Market Share to ${competitor}`,
      body: `Win rate of ${winRate}% (${won}/${group.length}) on ${productFamily} when competing against ${competitor}. ` +
        `$${(lostValue / 1000).toFixed(0)}K in revenue lost to them this period.`,
      metric: `${winRate}% win rate`,
      affectedIds: group.map((r) => r.id),
      suggestion:
        `Investigate ${competitor}'s ${productFamily} pricing program or channel incentives. ` +
        `Consider a value-sell approach highlighting inventory, lead time, and technical support advantages.`,
    });
  }

  return insights.sort((a, b) => {
    const ar = parseInt(a.metric); const br = parseInt(b.metric);
    return ar - br; // lowest win rate first
  });
}

/** Margin Risk: won quotes with margin below floor */
function ruleMarginRisk(records: QuoteRecord[]): PricingInsight[] {
  const lowMargin = records.filter(
    (r) => r.outcome === "won" && r.marginPct !== null && r.marginPct < THRESHOLDS.marginFloor,
  );
  if (lowMargin.length < THRESHOLDS.marginRiskMinCount) return [];

  const avgMargin = lowMargin.reduce((s, r) => s + r.marginPct!, 0) / lowMargin.length;
  const totalWon  = lowMargin.reduce((s, r) => s + (r.wonValue ?? r.quoteValue), 0);
  const reps      = [...new Set(lowMargin.map((r) => r.salesOwner))].join(", ");

  return [
    {
      id: nextId("margin-risk"),
      type: "margin-risk",
      severity: avgMargin < 9 ? "high" : "medium",
      title: `${lowMargin.length} Won Quotes Below Margin Floor (${THRESHOLDS.marginFloor}%)`,
      body: `${lowMargin.length} won quotes have margin below the ${THRESHOLDS.marginFloor}% floor. ` +
        `Average margin on these deals: ${avgMargin.toFixed(1)}%. Total value: $${(totalWon / 1000).toFixed(0)}K. ` +
        `Reps involved: ${reps}.`,
      metric: `avg ${avgMargin.toFixed(1)}% margin`,
      affectedIds: lowMargin.map((r) => r.id),
      suggestion:
        `Review discount authority levels and require manager approval for quotes below ${THRESHOLDS.marginFloor}%. ` +
        `Coach reps on value-based pricing to reduce margin compression.`,
    },
  ];
}

/** Rep Concern: rep win rate < threshold with enough history */
function ruleRepConcern(records: QuoteRecord[]): PricingInsight[] {
  const d = decided(records);
  const byRep = groupBy(d, (r) => r.salesOwner);
  const insights: PricingInsight[] = [];

  for (const [rep, group] of byRep) {
    if (group.length < THRESHOLDS.repConcernMinTotal) continue;
    const won = group.filter((r) => r.outcome === "won").length;
    const winRate = Math.round((won / group.length) * 100);
    if (winRate >= THRESHOLDS.repConcernMaxWinRate) continue;

    const topLossReason = (() => {
      const lost = group.filter((r) => r.outcome === "lost" && r.lossReason);
      if (lost.length === 0) return "Unknown";
      const counts = new Map<string, number>();
      for (const r of lost) counts.set(r.lossReason!, (counts.get(r.lossReason!) ?? 0) + 1);
      const [top] = [...counts.entries()].sort(([, a], [, b]) => b - a);
      return top ? LOSS_REASON_LABELS[top[0] as keyof typeof LOSS_REASON_LABELS] ?? top[0] : "Unknown";
    })();

    const lostValue = group.filter((r) => r.outcome === "lost").reduce((s, r) => s + r.quoteValue, 0);

    insights.push({
      id: nextId("rep-concern"),
      type: "rep-concern",
      severity: winRate < 20 ? "high" : "medium",
      title: `${rep} — Win Rate Below Threshold`,
      body: `${rep} has a ${winRate}% win rate (${won}/${group.length} quotes). ` +
        `Top loss reason: "${topLossReason}". $${(lostValue / 1000).toFixed(0)}K in lost revenue.`,
      metric: `${winRate}% win rate`,
      affectedIds: group.map((r) => r.id),
      suggestion:
        `Schedule a deal-review session with ${rep} to identify coaching opportunities. ` +
        `Review their quoting strategy and ensure they are leveraging competitive intelligence resources.`,
    });
  }

  return insights.sort((a, b) => {
    const ar = parseInt(a.metric); const br = parseInt(b.metric);
    return ar - br;
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export function generateInsights(records: QuoteRecord[]): PricingInsight[] {
  _seq = 0; // reset ID counter for deterministic results
  return [
    ...rulePriceReview(records),
    ...ruleCompetitorAlert(records),
    ...ruleMarketShareAlert(records),
    ...ruleMarginRisk(records),
    ...ruleRepConcern(records),
  ];
}
