/**
 * Rep next-best-action / coaching engine (v4-S2 #8).
 *
 * A deterministic ($0, no model calls) rules layer that synthesizes the shipped
 * analytics into a single ranked "what should I do next" list for a rep/manager:
 * counter-offers waiting on a reply, below-margin quotes needing sign-off, stale
 * sent quotes to follow up, at-risk accounts to re-engage, unclaimed SPA rebates,
 * and demand trending up to stock. Pure — `now` is injected — and fully testable.
 * It only composes existing pure analytics, so it can never disagree with the
 * dashboard cards it sits above.
 */

import type { SavedQuote } from "@/lib/product-finder-quotes";
import type { Order } from "@/lib/product-finder-store";
import type { CustomerAccount } from "@/lib/integration/types";
import { quotePipeline } from "@/lib/product-finder-quote-pipeline";
import { allCustomerHealth } from "@/lib/product-finder-customer-health";
import { spaClaimbacks, type SpaQuote } from "@/lib/product-finder-spa";
import { demandForecast } from "@/lib/product-finder-forecast";
import { seasonalEvent } from "@/lib/product-finder-seasonal";

export type NbaKind =
  | "answer-counter"
  | "approve-margin"
  | "follow-up-stale"
  | "reach-out-at-risk"
  | "claim-rebate"
  | "stock-up"
  | "run-promo";

/** Abstract deep-link target — the card maps it to a route/store action. */
export type NbaTarget =
  | { kind: "quotes"; status?: "draft" | "sent" | "won" | "lost" }
  | { kind: "orders"; customerId?: string | null }
  | { kind: "search"; query: string }
  | { kind: "card"; card: "spa" };

export interface NextBestAction {
  id: string;
  kind: NbaKind;
  /** Higher = more urgent. Sort key (then by `value` desc). */
  priority: number;
  title: string;
  /** One-line specifics, e.g. "Q-20260618-0007 · Acme Electric · $4,200". */
  context: string;
  /** Dollar value associated with the action, for display + secondary ranking. */
  value?: number;
  target: NbaTarget;
}

/** Base urgency per action kind (customer-waiting items rank highest). */
const RANK: Record<NbaKind, number> = {
  "answer-counter": 100,
  "approve-margin": 90,
  "follow-up-stale": 80,
  "reach-out-at-risk": 70,
  "claim-rebate": 60,
  "stock-up": 40,
  "run-promo": 30,
};

const fmt$ = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function quoteContext(q: SavedQuote): string {
  return `${q.number} · ${q.customer || "—"} · ${fmt$(q.total)}`;
}

export interface NbaInput {
  quotes: SavedQuote[];
  orders: Order[];
  customers: Pick<CustomerAccount, "id" | "name">[];
  now: number;
  /** Cap on actions returned (after ranking). Default 12. */
  limit?: number;
}

export interface NbaResult {
  actions: NextBestAction[];
  /** Total candidate actions before the limit. */
  total: number;
}

/**
 * Build the ranked next-best-action list. Each rule maps a shipped analytic to
 * concrete actions; the merged list is sorted by (priority desc, value desc) and
 * capped. Per-kind inner caps keep one noisy signal from crowding out the rest.
 */
export function nextBestActions(input: NbaInput): NbaResult {
  const { quotes, orders, customers, now } = input;
  const limit = input.limit ?? 12;
  const actions: NextBestAction[] = [];

  const pipeline = quotePipeline(quotes, now);

  // 1. Counter-offers awaiting a reply — the customer is literally waiting.
  for (const q of pipeline.countered.slice(0, 5)) {
    actions.push({
      id: `nba-counter-${q.id}`,
      kind: "answer-counter",
      priority: RANK["answer-counter"],
      title: "Answer a counter-offer",
      context: `${quoteContext(q)} — “${q.counterOffer?.note ?? ""}”`,
      value: q.total,
      target: { kind: "quotes", status: q.status === "draft" ? "draft" : "sent" },
    });
  }

  // 2. Below-margin quotes awaiting sign-off.
  for (const q of pipeline.needsApproval.slice(0, 5)) {
    actions.push({
      id: `nba-approve-${q.id}`,
      kind: "approve-margin",
      priority: RANK["approve-margin"],
      title: "Approve or escalate a below-margin quote",
      context: `${quoteContext(q)}${q.marginPct !== undefined ? ` · margin ${(q.marginPct * 100).toFixed(0)}%` : ""}`,
      value: q.total,
      target: { kind: "quotes", status: "sent" },
    });
  }

  // 3. Stale sent quotes — follow up.
  for (const q of pipeline.stale.slice(0, 5)) {
    actions.push({
      id: `nba-stale-${q.id}`,
      kind: "follow-up-stale",
      priority: RANK["follow-up-stale"],
      title: "Follow up on a stale quote",
      context: `${quoteContext(q)} · sent > 14 days ago`,
      value: q.total,
      target: { kind: "quotes", status: "sent" },
    });
  }

  // 4. At-risk customers — re-engage.
  const health = allCustomerHealth(orders, customers, now);
  for (const h of health.filter((c) => c.status === "at-risk").slice(0, 5)) {
    actions.push({
      id: `nba-atrisk-${h.customerId}`,
      kind: "reach-out-at-risk",
      priority: RANK["reach-out-at-risk"],
      title: "Re-engage an at-risk account",
      context: `${h.customerName} · ${h.message}`,
      target: { kind: "orders", customerId: h.customerId },
    });
  }

  // 5. Unclaimed SPA rebate dollars across won quotes.
  const won: SpaQuote[] = quotes
    .filter((q) => q.status === "won")
    .map((q) => ({
      number: q.number,
      customer: q.customer,
      customerId: q.customerId,
      lines: q.lines.map((l) => ({ product: l.product, qty: l.qty })),
    }));
  const spa = spaClaimbacks(won);
  if (spa.totalClaimable > 0) {
    actions.push({
      id: "nba-rebate",
      kind: "claim-rebate",
      priority: RANK["claim-rebate"],
      title: "File unclaimed SPA rebates",
      context: `${fmt$(spa.totalClaimable)} unclaimed across ${spa.lineCount} line${spa.lineCount === 1 ? "" : "s"}`,
      value: spa.totalClaimable,
      target: { kind: "card", card: "spa" },
    });
  }

  // 6. Demand trending up — stock ahead.
  const forecast = demandForecast(orders, quotes, now, 6);
  for (const f of forecast.filter((d) => d.trend === "up").slice(0, 3)) {
    actions.push({
      id: `nba-stockup-${f.subcategory}`,
      kind: "stock-up",
      priority: RANK["stock-up"],
      title: "Stock ahead of rising demand",
      context: `${f.subcategory} trending up · ~${f.projected30d} units next 30 days`,
      target: { kind: "search", query: f.subcategory },
    });
  }

  // 7. Seasonal merchandising push (one per week).
  const event = seasonalEvent(now);
  if (event) {
    actions.push({
      id: `nba-promo-${event.id ?? "seasonal"}`,
      kind: "run-promo",
      priority: RANK["run-promo"],
      title: `Seasonal push: ${event.title}`,
      context: event.blurb,
      target: { kind: "search", query: event.title },
    });
  }

  const total = actions.length;
  const ranked = actions
    .sort((a, b) => b.priority - a.priority || (b.value ?? 0) - (a.value ?? 0))
    .slice(0, limit);

  return { actions: ranked, total };
}
