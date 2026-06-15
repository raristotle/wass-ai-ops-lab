/**
 * Approval-routing policy engine — generalizes the single hard-coded
 * "below 20% margin → approval pending" rule into a configurable set of rules
 * (margin band, order value, discount depth, category) with an approver role and
 * a time-based escalation window. Pure + deterministic so it is fully testable;
 * the store evaluates it at quote-save time and records the triggering reason.
 *
 * Coupa/Ariba sell exactly this — spend controls with thresholds, delegation,
 * and SLA escalation — so it materially strengthens the quote-to-cash story.
 */

import { MARGIN_FLOOR } from "@/lib/product-finder-quotes";

export type ApproverRole = "manager" | "admin";

export interface ApprovalRule {
  id: string;
  label: string;
  /** Who must sign off. Admin outranks manager when several rules fire. */
  approver: ApproverRole;
  /** Escalate (e.g. notify the next level) if still pending past this many hours. */
  escalateAfterHours?: number;
  // Conditions — a rule fires only when EVERY present condition is met (AND).
  /** Fire when blended margin is strictly below this fraction (e.g. 0.2). */
  marginBelowPct?: number;
  /** Fire when the order subtotal is strictly above this many dollars. */
  orderValueAbove?: number;
  /** Fire when the deepest line discount off list is strictly above this fraction. */
  discountDepthAbove?: number;
  /** Fire when the order touches any of these product categories. */
  categoryIn?: string[];
}

export interface ApprovalContext {
  marginPct: number;
  orderValue: number;
  /** Deepest single-line discount off list, as a fraction (0–1). */
  discountDepthPct?: number;
  categories?: string[];
}

export interface ApprovalDecision {
  required: boolean;
  ruleId?: string;
  approver?: ApproverRole;
  /** Human sentence(s) — every triggered rule's label, joined. */
  reason: string;
  escalateAfterHours?: number;
}

/** The shipped default policy. The margin floor reuses the existing constant. */
export const DEFAULT_APPROVAL_POLICY: ApprovalRule[] = [
  {
    id: "margin-floor",
    label: `Below ${Math.round(MARGIN_FLOOR * 100)}% margin`,
    approver: "manager",
    marginBelowPct: MARGIN_FLOOR,
    escalateAfterHours: 24,
  },
  {
    id: "large-order",
    label: "Order over $25,000",
    approver: "manager",
    orderValueAbove: 25_000,
    escalateAfterHours: 48,
  },
  {
    id: "deep-discount",
    label: "Discount deeper than 25% off list",
    approver: "manager",
    discountDepthAbove: 0.25,
    escalateAfterHours: 24,
  },
];

/** True when a rule has at least one condition and every present condition holds. */
export function ruleMatches(rule: ApprovalRule, ctx: ApprovalContext): boolean {
  const conditions = [
    rule.marginBelowPct,
    rule.orderValueAbove,
    rule.discountDepthAbove,
    rule.categoryIn,
  ];
  if (conditions.every((c) => c === undefined)) return false; // a rule with no condition never fires
  if (rule.marginBelowPct !== undefined && !(ctx.marginPct < rule.marginBelowPct)) return false;
  if (rule.orderValueAbove !== undefined && !(ctx.orderValue > rule.orderValueAbove)) return false;
  if (rule.discountDepthAbove !== undefined && !((ctx.discountDepthPct ?? 0) > rule.discountDepthAbove)) return false;
  if (rule.categoryIn !== undefined) {
    const cats = ctx.categories ?? [];
    if (!rule.categoryIn.some((c) => cats.includes(c))) return false;
  }
  return true;
}

/** Evaluate the context against a policy; the strictest matched rule sets the approver. */
export function evaluateApproval(
  ctx: ApprovalContext,
  policy: ApprovalRule[] = DEFAULT_APPROVAL_POLICY,
): ApprovalDecision {
  const matched = policy.filter((r) => ruleMatches(r, ctx));
  if (matched.length === 0) {
    return { required: false, reason: "Within policy — no approval required." };
  }
  // Admin-level rules outrank manager-level; otherwise keep policy order.
  const strictest = [...matched].sort(
    (a, b) => (b.approver === "admin" ? 1 : 0) - (a.approver === "admin" ? 1 : 0),
  )[0];
  return {
    required: true,
    ruleId: strictest.id,
    approver: strictest.approver,
    reason: matched.map((r) => r.label).join("; "),
    escalateAfterHours: strictest.escalateAfterHours,
  };
}

/** True once a still-pending decision has aged past its escalation window. */
export function isEscalated(decision: ApprovalDecision, ageHours: number): boolean {
  return (
    decision.required &&
    decision.escalateAfterHours !== undefined &&
    ageHours >= decision.escalateAfterHours
  );
}
