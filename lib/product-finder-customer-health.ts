import type { Order } from "@/lib/product-finder-store";
import type { CustomerAccount } from "@/lib/integration/types";

/**
 * Customer health from order cadence — pure & deterministic (`now` injected).
 *
 * The signal a rep actually uses: "this account usually orders every N days —
 * it's been M." Cadence comes from the gaps between a customer's orders;
 * single-order customers fall back to a fixed baseline.
 */

const DAY_MS = 86_400_000;

/** Cadence baseline (days) for customers with exactly one order. */
export const SINGLE_ORDER_BASELINE_DAYS = 45;

/** daysSince ≤ cadence × HEALTHY_FACTOR → healthy. */
export const HEALTHY_FACTOR = 1.25;
/** daysSince ≤ cadence × AT_RISK_FACTOR → watch; beyond → at-risk. */
export const AT_RISK_FACTOR = 2;

export type HealthStatus = "healthy" | "watch" | "at-risk" | "new";

export interface CustomerHealthInfo {
  customerId: string;
  customerName: string;
  status: HealthStatus;
  orderCount: number;
  lastOrderAt: number | null;
  /** Mean days between orders; null with < 2 orders. */
  avgIntervalDays: number | null;
  daysSinceLast: number | null;
  /** Ready-to-render sentence, e.g. "usually orders every 30 days — now 38 days quiet". */
  message: string;
}

export const HEALTH_COLOR: Record<HealthStatus, string> = {
  healthy: "#00AA13",
  watch: "#EAAA00",
  "at-risk": "#DB6B30",
  new: "#B7C9D3",
};

export const HEALTH_LABEL: Record<HealthStatus, string> = {
  healthy: "Healthy",
  watch: "Watch",
  "at-risk": "At risk",
  new: "New",
};

export function customerHealth(
  orders: Order[],
  customer: Pick<CustomerAccount, "id" | "name">,
  now: number
): CustomerHealthInfo {
  const mine = orders
    .filter((o) => o.customerId === customer.id)
    .sort((a, b) => a.placedAt - b.placedAt);

  if (mine.length === 0) {
    return {
      customerId: customer.id,
      customerName: customer.name,
      status: "new",
      orderCount: 0,
      lastOrderAt: null,
      avgIntervalDays: null,
      daysSinceLast: null,
      message: "No orders yet",
    };
  }

  const lastOrderAt = mine[mine.length - 1].placedAt;
  const daysSinceLast = Math.max(0, Math.floor((now - lastOrderAt) / DAY_MS));

  let avgIntervalDays: number | null = null;
  if (mine.length >= 2) {
    const span = mine[mine.length - 1].placedAt - mine[0].placedAt;
    avgIntervalDays = Math.max(1, Math.round(span / (mine.length - 1) / DAY_MS));
  }

  const cadence = avgIntervalDays ?? SINGLE_ORDER_BASELINE_DAYS;
  const status: HealthStatus =
    daysSinceLast <= cadence * HEALTHY_FACTOR
      ? "healthy"
      : daysSinceLast <= cadence * AT_RISK_FACTOR
        ? "watch"
        : "at-risk";

  const cadenceLabel =
    avgIntervalDays !== null
      ? `usually orders every ${avgIntervalDays} days`
      : `one order so far (${SINGLE_ORDER_BASELINE_DAYS}-day baseline)`;
  const message =
    status === "healthy"
      ? `${cadenceLabel} — last ${daysSinceLast} days ago`
      : `${cadenceLabel} — now ${daysSinceLast} days quiet`;

  return {
    customerId: customer.id,
    customerName: customer.name,
    status,
    orderCount: mine.length,
    lastOrderAt,
    avgIntervalDays,
    daysSinceLast,
    message,
  };
}

const STATUS_RANK: Record<HealthStatus, number> = { "at-risk": 0, watch: 1, new: 2, healthy: 3 };

/** Health for every account, most urgent first. */
export function allCustomerHealth(
  orders: Order[],
  customers: Pick<CustomerAccount, "id" | "name">[],
  now: number
): CustomerHealthInfo[] {
  return customers
    .map((c) => customerHealth(orders, c, now))
    .sort(
      (a, b) =>
        STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
        (b.daysSinceLast ?? 0) - (a.daysSinceLast ?? 0)
    );
}
