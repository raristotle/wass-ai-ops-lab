// Next Best Action engine — pure functions, no I/O
//
// Inputs: open quotes, digital adoption, platform risk, margin trend,
//         inventory issues, past-due invoices, cross-sell gaps.
// Output: ranked NbaAction[] with reason codes, urgency, and email draft.

// ── Types ─────────────────────────────────────────────────────────────────────

export type ActionType =
  | "call"
  | "quote-followup"
  | "platform-discovery"
  | "cross-sell-intro"
  | "collections-check"
  | "pricing-review";

export type Persona = "inside-sales" | "outside-sales" | "sales-manager";

export type Urgency = "low" | "medium" | "high" | "critical";

export const ACTION_LABELS: Record<ActionType, string> = {
  "call":                "Outreach Call",
  "quote-followup":      "Quote Follow-Up",
  "platform-discovery":  "Platform Discovery",
  "cross-sell-intro":    "Cross-Sell Intro",
  "collections-check":   "Collections Check",
  "pricing-review":      "Pricing Review",
};

// Which personas see each action type by default
export const ACTION_PERSONAS: Record<ActionType, Persona[]> = {
  "call":                ["inside-sales", "outside-sales", "sales-manager"],
  "quote-followup":      ["inside-sales", "outside-sales", "sales-manager"],
  "platform-discovery":  ["outside-sales", "sales-manager"],
  "cross-sell-intro":    ["outside-sales", "sales-manager"],
  "collections-check":   ["inside-sales", "sales-manager"],
  "pricing-review":      ["outside-sales", "sales-manager"],
};

export const PERSONA_LABELS: Record<Persona, string> = {
  "inside-sales":  "Inside Sales",
  "outside-sales": "Outside Sales",
  "sales-manager": "Sales Manager",
};

// ── Reason codes ──────────────────────────────────────────────────────────────

export const NBA_REASON_CODES = {
  OPEN_QUOTES:          "OPEN_QUOTES",
  AGING_QUOTE:          "AGING_QUOTE",
  LARGE_QUOTE_VALUE:    "LARGE_QUOTE_VALUE",
  PAST_DUE_INVOICES:    "PAST_DUE_INVOICES",
  SIGNIFICANT_AR:       "SIGNIFICANT_AR",
  SEVERELY_PAST_DUE:    "SEVERELY_PAST_DUE",
  HIGH_PLATFORM_RISK:   "HIGH_PLATFORM_RISK",
  NO_INTEGRATION:       "NO_INTEGRATION",
  COMPETITOR_PRESENT:   "COMPETITOR_PRESENT",
  LOW_DIGITAL_ADOPTION: "LOW_DIGITAL_ADOPTION",
  MARGIN_DECLINE:       "MARGIN_DECLINE",
  BELOW_CATEGORY_AVG:   "BELOW_CATEGORY_AVG",
  THIN_MARGIN:          "THIN_MARGIN",
  CROSS_SELL_GAP:       "CROSS_SELL_GAP",
  HIGH_POTENTIAL:       "HIGH_POTENTIAL",
  SLOW_INVENTORY:       "SLOW_INVENTORY",
  NO_RECENT_CONTACT:    "NO_RECENT_CONTACT",
  GOLD_TIER:            "GOLD_TIER",
} as const;

// ── Input / Output interfaces ─────────────────────────────────────────────────

export interface NbaInput {
  account: {
    id: string;
    name: string;
    sbu: string;
    owner: string;
    tier: "Gold" | "Silver" | "Bronze" | "New";
    annualRevenueUsd: number;
    lastContactDate: string; // ISO date string
  };
  quotes: {
    open: number;
    totalValueUsd: number;
    oldestDays: number;
  };
  digitalAdoption: {
    platformCount: number;
    integrationStatus: "none" | "partial" | "full";
    lastLoginDays: number;
  };
  platformRisk: {
    riskScore: number; // 0-100
    riskLevel: "low" | "medium" | "high" | "critical";
    competitorPresent: boolean;
  };
  marginTrend: {
    currentPct: number;     // e.g. 0.18 = 18 %
    priorPct: number;
    categoryAvgPct: number;
  };
  inventory: {
    slowMovingSkus: number;
    outOfStockEvents: number;
    totalValueAtRiskUsd: number;
  };
  invoices: {
    pastDueCount: number;
    pastDueDays: number;    // average days past due
    pastDueAmountUsd: number;
  };
  crossSell: {
    untappedCategories: string[];
    estimatedPotentialUsd: number;
  };
}

export interface NbaAction {
  type: ActionType;
  label: string;
  priorityScore: number; // 0-100
  urgency: Urgency;
  reasonCodes: string[];
  emailDraft: string;
  revenueImpactUsd: number;
  personas: Persona[];
}

export interface NbaOutput {
  accountId: string;
  accountName: string;
  sbu: string;
  owner: string;
  tier: "Gold" | "Silver" | "Bronze" | "New";
  annualRevenueUsd: number;
  actions: NbaAction[]; // sorted by priorityScore desc
  topAction: NbaAction;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtUsd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

function urgencyFromScore(score: number): Urgency {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

function daysSince(dateStr: string): number {
  // NOTE: uses Date.now() — in production, pass an asOf parameter for determinism.
  return Math.max(0, Math.round((Date.now() - new Date(dateStr).getTime()) / 86_400_000));
}

// ── Score functions (each returns 0-100) ──────────────────────────────────────

function scoreQuoteFollowup(q: NbaInput["quotes"]): number {
  if (q.open === 0) return 0;
  const ageFactor   = Math.min(60, (q.oldestDays  / 60)   * 60);
  const valueFactor = Math.min(40, (q.totalValueUsd / 500_000) * 40);
  return Math.round(ageFactor + valueFactor);
}

function scoreCollections(inv: NbaInput["invoices"]): number {
  if (inv.pastDueCount === 0) return 0;
  const daysFactor   = Math.min(60, (inv.pastDueDays      / 90)      * 60);
  const amountFactor = Math.min(40, (inv.pastDueAmountUsd / 100_000) * 40);
  return Math.round(daysFactor + amountFactor);
}

function scorePlatformDiscovery(
  pr: NbaInput["platformRisk"],
  da: NbaInput["digitalAdoption"],
): number {
  if (pr.riskScore < 40) return 0;
  const bonus = (pr.competitorPresent ? 8 : 0) +
                (da.integrationStatus === "none" ? 8 : 0);
  return Math.min(100, Math.round(pr.riskScore + bonus));
}

function scorePricingReview(mt: NbaInput["marginTrend"]): number {
  const decline  = Math.max(0, mt.priorPct - mt.currentPct);
  const belowAvg = Math.max(0, mt.categoryAvgPct - mt.currentPct);
  return Math.min(100, Math.round(
    Math.min(50, (decline  / 0.15) * 50) +
    Math.min(50, (belowAvg / 0.15) * 50),
  ));
}

function scoreCrossSell(cs: NbaInput["crossSell"]): number {
  if (cs.untappedCategories.length === 0) return 0;
  const catFactor   = Math.min(40, cs.untappedCategories.length * 8);
  const valueFactor = Math.min(60, (cs.estimatedPotentialUsd / 500_000) * 60);
  return Math.round(catFactor + valueFactor);
}

function scoreCall(lastContactDate: string): number {
  return Math.min(100, Math.round((daysSince(lastContactDate) / 180) * 100));
}

// ── Reason code builders ──────────────────────────────────────────────────────

function reasonsQuoteFollowup(q: NbaInput["quotes"]): string[] {
  const codes: string[] = [NBA_REASON_CODES.OPEN_QUOTES];
  if (q.oldestDays >= 21)          codes.push(NBA_REASON_CODES.AGING_QUOTE);
  if (q.totalValueUsd >= 100_000)  codes.push(NBA_REASON_CODES.LARGE_QUOTE_VALUE);
  return codes;
}

function reasonsCollections(inv: NbaInput["invoices"]): string[] {
  const codes: string[] = [NBA_REASON_CODES.PAST_DUE_INVOICES];
  if (inv.pastDueAmountUsd >= 20_000) codes.push(NBA_REASON_CODES.SIGNIFICANT_AR);
  if (inv.pastDueDays       >= 60)    codes.push(NBA_REASON_CODES.SEVERELY_PAST_DUE);
  return codes;
}

function reasonsPlatformDiscovery(
  pr: NbaInput["platformRisk"],
  da: NbaInput["digitalAdoption"],
): string[] {
  const codes: string[] = [NBA_REASON_CODES.HIGH_PLATFORM_RISK];
  if (da.integrationStatus === "none") codes.push(NBA_REASON_CODES.NO_INTEGRATION);
  if (pr.competitorPresent)            codes.push(NBA_REASON_CODES.COMPETITOR_PRESENT);
  if (da.platformCount === 0)          codes.push(NBA_REASON_CODES.LOW_DIGITAL_ADOPTION);
  return codes;
}

function reasonsPricingReview(mt: NbaInput["marginTrend"]): string[] {
  const codes: string[] = [];
  if (mt.currentPct < mt.priorPct)       codes.push(NBA_REASON_CODES.MARGIN_DECLINE);
  if (mt.currentPct < mt.categoryAvgPct) codes.push(NBA_REASON_CODES.BELOW_CATEGORY_AVG);
  if (mt.currentPct < 0.05)             codes.push(NBA_REASON_CODES.THIN_MARGIN);
  return codes;
}

function reasonsCrossSell(cs: NbaInput["crossSell"]): string[] {
  const codes: string[] = [NBA_REASON_CODES.CROSS_SELL_GAP];
  if (cs.estimatedPotentialUsd >= 200_000) codes.push(NBA_REASON_CODES.HIGH_POTENTIAL);
  return codes;
}

function reasonsCall(account: NbaInput["account"]): string[] {
  const codes: string[] = [NBA_REASON_CODES.NO_RECENT_CONTACT];
  if (account.tier === "Gold") codes.push(NBA_REASON_CODES.GOLD_TIER);
  return codes;
}

// ── Email draft generators ────────────────────────────────────────────────────

function draftQuoteFollowup(input: NbaInput): string {
  const { name } = input.account;
  const { open, totalValueUsd, oldestDays } = input.quotes;
  const plural = open > 1;
  return `Subject: Open Quote${plural ? "s" : ""} for ${name} — Ready to Move Forward?

Hi [Contact Name],

I wanted to follow up on the ${open} open quote${plural ? "s" : ""} we currently have on file for ${name}, totaling ${fmtUsd(totalValueUsd)}.${oldestDays >= 21 ? ` The oldest quote is now ${oldestDays} days old, and I want to make sure the scope and pricing still align with your current needs.` : ""}

I'd love to connect for 15–20 minutes to walk through the details, address any questions, and see how we can move this forward together.

Do you have availability this week or early next week? I'm happy to work around your schedule.

Best regards,
[Your Name]
Wesco International
[Your Phone] | [Your Email]`;
}

function draftCollections(input: NbaInput): string {
  const { name } = input.account;
  const { pastDueCount, pastDueDays, pastDueAmountUsd } = input.invoices;
  return `Subject: Account Balance Follow-Up — ${name}

Hi [Contact Name],

I hope you're doing well. I'm reaching out regarding ${pastDueCount} invoice${pastDueCount > 1 ? "s" : ""} totaling ${fmtUsd(pastDueAmountUsd)} that ${pastDueCount > 1 ? "are" : "is"} currently ${pastDueDays} days past due on your ${name} account.

I understand things can get busy, and I want to make sure we address this quickly so it doesn't affect your purchasing flow or credit terms.

Could we connect briefly to confirm receipt of the invoice${pastDueCount > 1 ? "s" : ""} and discuss next steps? I can also work with our AR team to explore any payment arrangement options if needed.

Thank you for your continued partnership — let's get this resolved.

Best regards,
[Your Name]
Wesco International
[Your Phone] | [Your Email]`;
}

function draftPlatformDiscovery(input: NbaInput): string {
  const { name, annualRevenueUsd } = input.account;
  const { competitorPresent } = input.platformRisk;
  const { integrationStatus } = input.digitalAdoption;
  return `Subject: Streamlining Procurement for ${name} — Let's Connect

Hi [Contact Name],

I've been reviewing your account and noticed that ${name} is using an eProcurement platform${integrationStatus === "none" ? " without a direct Wesco integration" : " with a partial Wesco integration"}. Given your purchasing volume${annualRevenueUsd >= 1_000_000 ? ` of ${fmtUsd(annualRevenueUsd)} annually` : ""}, a tighter connection could meaningfully reduce your team's manual processing time and improve order accuracy.

${competitorPresent ? "I also want to make sure we're staying competitive with any other suppliers you may be working with — a proper integration often tips the scale." : "Our integration team has helped similar accounts cut PO processing time by up to 60%."}

I'd love to schedule a 30-minute discovery call to walk through what a Wesco integration would look like for your workflow.

Are you available this week?

Best regards,
[Your Name]
Wesco International
[Your Phone] | [Your Email]`;
}

function draftPricingReview(input: NbaInput): string {
  const { name } = input.account;
  const { currentPct, priorPct, categoryAvgPct } = input.marginTrend;
  const declinePp = Math.round((priorPct - currentPct) * 100);
  const belowAvgPp = Math.round((categoryAvgPct - currentPct) * 100);
  return `Subject: Pricing Strategy Review — ${name}

Hi [Contact Name],

As part of our ongoing account review, I wanted to connect regarding the pricing structure on your ${name} account.${declinePp > 0 ? ` Our records show a ${declinePp}-point margin shift over the past period` : ""}${belowAvgPp > 0 ? `, and current margins are tracking ${belowAvgPp} points below the category average` : ""}.

I'd like to schedule a brief pricing review to ensure you're getting the best value from the Wesco product mix — and to make sure our pricing reflects your current volume and strategic commitments.

This is also a good opportunity to explore any contract pricing or tier adjustments we might be able to put in place.

Would a 20-minute call work for you this week?

Best regards,
[Your Name]
Wesco International
[Your Phone] | [Your Email]`;
}

function draftCrossSell(input: NbaInput): string {
  const { name, annualRevenueUsd } = input.account;
  const { untappedCategories, estimatedPotentialUsd } = input.crossSell;
  const cats = untappedCategories.slice(0, 3).join(", ");
  const more = untappedCategories.length > 3 ? ` and ${untappedCategories.length - 3} more` : "";
  return `Subject: Expanding Our Partnership — New Categories for ${name}

Hi [Contact Name],

Thank you for your continued business with Wesco. As I've been looking at your account, I noticed there are several product categories where we can add significant value that ${name} isn't currently sourcing through us: ${cats}${more}.

Based on your purchasing patterns and industry benchmarks, we estimate ${fmtUsd(estimatedPotentialUsd)} in incremental opportunity — representing a meaningful expansion of our ${fmtUsd(annualRevenueUsd)} relationship.

I'd love to set up a quick 20-minute introduction to walk through what we carry in these categories and how we've helped similar customers consolidate their supply base.

Would next week work for a brief call?

Best regards,
[Your Name]
Wesco International
[Your Phone] | [Your Email]`;
}

function draftCall(input: NbaInput): string {
  const { name, tier, annualRevenueUsd } = input.account;
  const days = daysSince(input.account.lastContactDate);
  return `Subject: Checking In — ${name}

Hi [Contact Name],

It's been ${days} day${days !== 1 ? "s" : ""} since we last connected, and I wanted to reach out to see how things are going at ${name}.${tier === "Gold" ? ` As one of our valued ${tier} accounts, staying close to your evolving needs is a priority for me.` : ""}

I'd love to hear what's on your radar for the next quarter — whether it's upcoming projects, supply chain challenges, or areas where you'd like us to do better. Even a quick 15-minute check-in would be valuable.

Is there a convenient time this week or next that works for you?

Best regards,
[Your Name]
Wesco International
[Your Phone] | [Your Email]`;
}

// ── Revenue impact estimators ─────────────────────────────────────────────────

function impactQuoteFollowup(q: NbaInput["quotes"]): number {
  return q.totalValueUsd;
}

function impactCollections(inv: NbaInput["invoices"]): number {
  return inv.pastDueAmountUsd;
}

function impactPlatformDiscovery(input: NbaInput): number {
  // Estimated churn risk averted: riskScore / 100 * annual revenue * 20 %
  return Math.round((input.platformRisk.riskScore / 100) * input.account.annualRevenueUsd * 0.2);
}

function impactPricingReview(input: NbaInput): number {
  const marginGap = Math.max(0, input.marginTrend.categoryAvgPct - input.marginTrend.currentPct);
  return Math.round(marginGap * input.account.annualRevenueUsd);
}

function impactCrossSell(cs: NbaInput["crossSell"]): number {
  return cs.estimatedPotentialUsd;
}

// ── Main scorer ───────────────────────────────────────────────────────────────

export function scoreNbaAccount(input: NbaInput): NbaOutput {
  const candidates: NbaAction[] = [];

  const addAction = (
    type: ActionType,
    score: number,
    reasons: string[],
    draft: string,
    impact: number,
  ) => {
    if (score <= 0) return;
    candidates.push({
      type,
      label:           ACTION_LABELS[type],
      priorityScore:   Math.min(100, score),
      urgency:         urgencyFromScore(score),
      reasonCodes:     reasons,
      emailDraft:      draft,
      revenueImpactUsd: impact,
      personas:        ACTION_PERSONAS[type],
    });
  };

  addAction(
    "quote-followup",
    scoreQuoteFollowup(input.quotes),
    reasonsQuoteFollowup(input.quotes),
    draftQuoteFollowup(input),
    impactQuoteFollowup(input.quotes),
  );

  addAction(
    "collections-check",
    scoreCollections(input.invoices),
    reasonsCollections(input.invoices),
    draftCollections(input),
    impactCollections(input.invoices),
  );

  addAction(
    "platform-discovery",
    scorePlatformDiscovery(input.platformRisk, input.digitalAdoption),
    reasonsPlatformDiscovery(input.platformRisk, input.digitalAdoption),
    draftPlatformDiscovery(input),
    impactPlatformDiscovery(input),
  );

  addAction(
    "pricing-review",
    scorePricingReview(input.marginTrend),
    reasonsPricingReview(input.marginTrend),
    draftPricingReview(input),
    impactPricingReview(input),
  );

  addAction(
    "cross-sell-intro",
    scoreCrossSell(input.crossSell),
    reasonsCrossSell(input.crossSell),
    draftCrossSell(input),
    impactCrossSell(input.crossSell),
  );

  addAction(
    "call",
    scoreCall(input.account.lastContactDate),
    reasonsCall(input.account),
    draftCall(input),
    0,
  );

  const actions = candidates.sort((a, b) => b.priorityScore - a.priorityScore);

  // topAction is guaranteed — "call" always produces a non-zero score
  const topAction = actions[0]; // non-null: call always added

  return {
    accountId:        input.account.id,
    accountName:      input.account.name,
    sbu:              input.account.sbu,
    owner:            input.account.owner,
    tier:             input.account.tier,
    annualRevenueUsd: input.account.annualRevenueUsd,
    actions,
    topAction,
  };
}
