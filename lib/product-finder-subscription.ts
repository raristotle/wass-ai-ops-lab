/**
 * Reorder / subscription scheduling (v5-S4 #16) — $0, deterministic, no network.
 *
 * The D2C side of cross-sell: a customer can put a recurring SKU (or a whole basket)
 * on a cadence, and the portal nudges them with the cross-sell companions each time
 * they reorder. This module is the pure scheduling core — cadence math + the next due
 * date — used by the customer portal. Persistence (when activated) reuses the
 * existing durable store; nothing here touches it.
 *
 * Dates are injected (ISO strings) so the logic is deterministic and testable — the
 * caller passes "now".
 */

export type Cadence = "weekly" | "biweekly" | "monthly" | "quarterly";

export const CADENCE_DAYS: Record<Cadence, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 91,
};

export const CADENCE_LABEL: Record<Cadence, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

export interface Subscription {
  id: string;
  sku: string;
  name: string;
  qty: number;
  cadence: Cadence;
  /** ISO date the subscription started / was last fulfilled. */
  lastOrderedIso: string;
  active: boolean;
}

/** Add whole days to an ISO date, returning a YYYY-MM-DD string (UTC). */
export function addDaysIso(iso: string, days: number): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso.slice(0, 10);
  return new Date(ms + days * 86_400_000).toISOString().slice(0, 10);
}

/** The next due date (YYYY-MM-DD) for a subscription. */
export function nextDueDate(sub: Pick<Subscription, "lastOrderedIso" | "cadence">): string {
  return addDaysIso(sub.lastOrderedIso, CADENCE_DAYS[sub.cadence]);
}

/** Whole days until a subscription is due, given "now" (negative = overdue).
 *  Both dates are normalized to UTC midnight so the bucket is day-granular regardless
 *  of the wall-clock time carried by `nowIso`. */
export function daysUntilDue(sub: Pick<Subscription, "lastOrderedIso" | "cadence">, nowIso: string): number {
  const due = Date.parse(nextDueDate(sub) + "T00:00:00.000Z");
  const now = Date.parse(nowIso.slice(0, 10) + "T00:00:00.000Z");
  if (Number.isNaN(due) || Number.isNaN(now)) return 0;
  return Math.floor((due - now) / 86_400_000);
}

export type DueStatus = "overdue" | "due-soon" | "scheduled";

/** Bucket a subscription by urgency: overdue (≤0), due-soon (≤ leadDays), else scheduled. */
export function dueStatus(sub: Pick<Subscription, "lastOrderedIso" | "cadence">, nowIso: string, leadDays = 7): DueStatus {
  const d = daysUntilDue(sub, nowIso);
  if (d <= 0) return "overdue";
  if (d <= leadDays) return "due-soon";
  return "scheduled";
}

export interface DueSubscription extends Subscription {
  nextDue: string;
  daysUntil: number;
  status: DueStatus;
}

/**
 * Annotate active subscriptions with their due info and sort the most-urgent first
 * (overdue, then due-soon, then by soonest date). Inactive ones are dropped.
 */
export function dueSubscriptions(subs: Subscription[], nowIso: string, leadDays = 7): DueSubscription[] {
  return subs
    .filter((s) => s.active)
    .map((s) => ({
      ...s,
      nextDue: nextDueDate(s),
      daysUntil: daysUntilDue(s, nowIso),
      status: dueStatus(s, nowIso, leadDays),
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
