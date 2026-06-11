import type { QuoteStatus, SavedQuote } from "@/lib/product-finder-quotes";
import { MARGIN_FLOOR } from "@/lib/product-finder-quotes";
import { isStale } from "@/lib/product-finder-quote-pipeline";
import { leadTimeDaysForId } from "@/lib/product-finder-leadtime";
import { formatDisplayDate } from "@/lib/product-finder-quote";
import { allCustomerHealth } from "@/lib/product-finder-customer-health";
import type { Order } from "@/lib/product-finder-store";
import type { CustomerAccount } from "@/lib/integration/types";

/**
 * In-app notification feed — pure & deterministic (`now` injected).
 * Five signal sources, all already tracked by the store:
 *   approval      — below-margin quotes awaiting manager sign-off (manager/admin)
 *   stale-quote   — sent quotes past the 14-day follow-up window
 *   counter       — quotes the customer countered via "Request changes"
 *   restock       — watched products: ETA reminder, then a "window reached" alert
 *   customer-risk — accounts gone quiet vs their usual order cadence
 */

const DAY_MS = 86_400_000;

/** A watched product. Legacy string[] entries are migrated at hydration. */
export type WatchEntry = {
  id: string;
  name: string;
  /** When the watch was added — drives the simulated restock ETA. */
  addedAt: number;
};

export type NotificationKind =
  | "approval"
  | "stale-quote"
  | "counter"
  | "restock-due"
  | "restock-eta"
  | "customer-risk";

export interface PfNotification {
  /** Stable id (`kind:entityId`) — read state keys off this. */
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  /** Sort key (epoch ms) — newest first in the panel. */
  at: number;
  productId?: string;
  quoteId?: string;
  customerId?: string;
  /** Deep-link hint for the cart drawer's quote section. */
  quoteStatus?: QuoteStatus;
}

export interface NotificationInput {
  quotes: SavedQuote[];
  watches: WatchEntry[];
  /** Order history + accounts — drives customer-risk alerts. */
  orders: Order[];
  customers: Pick<CustomerAccount, "id" | "name">[];
  /** Approval requests are a manager/admin concern. */
  isManager: boolean;
}

/** Epoch ms when a watch's simulated restock window elapses. */
export function watchDueAt(watch: WatchEntry): number {
  return watch.addedAt + leadTimeDaysForId(watch.id) * DAY_MS;
}

export function buildNotifications(input: NotificationInput, now: number): PfNotification[] {
  const out: PfNotification[] = [];

  for (const q of input.quotes) {
    if (input.isManager && q.approvalStatus === "pending") {
      const marginLabel = q.marginPct !== undefined ? `${(q.marginPct * 100).toFixed(0)}%` : "low";
      out.push({
        id: `approval:${q.id}`,
        kind: "approval",
        title: `Quote ${q.number} needs margin approval`,
        detail: `$${q.total.toFixed(2)} at ${marginLabel} margin — below the ${MARGIN_FLOOR * 100}% floor`,
        at: q.createdAt,
        quoteId: q.id,
        quoteStatus: q.status,
      });
    }
    if (isStale(q, now)) {
      const daysAgo = Math.floor((now - q.createdAt) / DAY_MS);
      out.push({
        id: `stale:${q.id}`,
        kind: "stale-quote",
        title: `Follow up on quote ${q.number}`,
        detail: `Sent ${daysAgo} days ago · $${q.total.toFixed(2)}${q.customer ? ` · ${q.customer}` : ""}`,
        at: q.createdAt,
        quoteId: q.id,
        quoteStatus: "sent",
      });
    }
    if (q.counterOffer && q.status !== "won" && q.status !== "lost") {
      const excerpt =
        q.counterOffer.note.length > 80 ? `${q.counterOffer.note.slice(0, 77)}…` : q.counterOffer.note;
      out.push({
        id: `counter:${q.id}`,
        kind: "counter",
        title: `Counter-offer on quote ${q.number}`,
        detail: `${q.customer || "Customer"}: “${excerpt}”`,
        at: q.counterOffer.at,
        quoteId: q.id,
        quoteStatus: q.status,
      });
    }
  }

  for (const h of allCustomerHealth(input.orders, input.customers, now)) {
    if (h.status !== "at-risk" || h.lastOrderAt === null) continue;
    out.push({
      id: `customer-risk:${h.customerId}`,
      kind: "customer-risk",
      title: `${h.customerName} is going quiet`,
      detail: `${h.message.charAt(0).toUpperCase()}${h.message.slice(1)} — worth a call.`,
      at: h.lastOrderAt,
      customerId: h.customerId,
    });
  }

  for (const w of input.watches) {
    const dueAt = watchDueAt(w);
    if (now >= dueAt) {
      out.push({
        id: `restock-due:${w.id}`,
        kind: "restock-due",
        title: `Restock window reached — ${w.name}`,
        detail: `Estimated lead time (~${leadTimeDaysForId(w.id)} days) has elapsed. Check availability.`,
        at: dueAt,
        productId: w.id,
      });
    } else {
      out.push({
        id: `restock-eta:${w.id}`,
        kind: "restock-eta",
        title: `Watching ${w.name}`,
        detail: `Estimated restock by ${formatDisplayDate(new Date(dueAt))} — we'll flag it here.`,
        at: w.addedAt,
        productId: w.id,
      });
    }
  }

  return out.sort((a, b) => b.at - a.at);
}

/** Count of notifications not present in the read map. */
export function unreadCount(
  notifications: PfNotification[],
  reads: Record<string, number>
): number {
  return notifications.reduce((n, notif) => (reads[notif.id] !== undefined ? n : n + 1), 0);
}
