import { describe, it, expect } from "vitest";
import {
  customerHealth,
  allCustomerHealth,
  SINGLE_ORDER_BASELINE_DAYS,
} from "@/lib/product-finder-customer-health";
import type { Order } from "@/lib/product-finder-store";

const DAY = 86_400_000;
const NOW = 1_781_200_000_000;
const CUST = { id: "CUST-001", name: "Gulf Coast Industrial" };

function order(daysAgo: number, customerId = CUST.id): Order {
  return {
    id: `o-${daysAgo}`,
    placedAt: NOW - daysAgo * DAY,
    lines: [],
    total: 100,
    customerId,
    customerName: "x",
  };
}

describe("customerHealth", () => {
  it("no orders → new", () => {
    const h = customerHealth([], CUST, NOW);
    expect(h.status).toBe("new");
    expect(h.orderCount).toBe(0);
    expect(h.avgIntervalDays).toBeNull();
    expect(h.message).toBe("No orders yet");
  });

  it("computes cadence from order gaps and reports healthy within 1.25×", () => {
    // orders 65, 35, 5 days ago → span 60d over 2 gaps → cadence 30d, last 5d ago
    const h = customerHealth([order(65), order(35), order(5)], CUST, NOW);
    expect(h.orderCount).toBe(3);
    expect(h.avgIntervalDays).toBe(30);
    expect(h.daysSinceLast).toBe(5);
    expect(h.status).toBe("healthy");
    expect(h.message).toContain("every 30 days");
  });

  it("watch between 1.25× and 2× cadence; at-risk beyond 2×", () => {
    // cadence 30 (orders 90 and 60 days ago... gap 30): last 60d ago → 2× → watch boundary
    const watch = customerHealth([order(90), order(60)], CUST, NOW);
    expect(watch.avgIntervalDays).toBe(30);
    expect(watch.daysSinceLast).toBe(60);
    expect(watch.status).toBe("watch");

    const atRisk = customerHealth([order(120), order(90)], CUST, NOW);
    expect(atRisk.daysSinceLast).toBe(90);
    expect(atRisk.status).toBe("at-risk");
    expect(atRisk.message).toContain("quiet");
  });

  it("single order uses the fixed baseline", () => {
    const fresh = customerHealth([order(10)], CUST, NOW);
    expect(fresh.avgIntervalDays).toBeNull();
    expect(fresh.status).toBe("healthy");

    const quiet = customerHealth([order(SINGLE_ORDER_BASELINE_DAYS * 2 + 5)], CUST, NOW);
    expect(quiet.status).toBe("at-risk");
    expect(quiet.message).toContain(`${SINGLE_ORDER_BASELINE_DAYS}-day baseline`);
  });

  it("ignores other customers' orders", () => {
    const h = customerHealth([order(5, "CUST-OTHER")], CUST, NOW);
    expect(h.status).toBe("new");
  });

  it("is deterministic", () => {
    const orders = [order(40), order(10)];
    expect(customerHealth(orders, CUST, NOW)).toEqual(customerHealth(orders, CUST, NOW));
  });
});

describe("allCustomerHealth", () => {
  it("sorts most urgent first (at-risk → watch → new → healthy)", () => {
    const customers = [
      { id: "A", name: "Healthy Co" },
      { id: "B", name: "Risky Co" },
      { id: "C", name: "New Co" },
    ];
    const orders = [
      order(5, "A"), order(35, "A"),         // cadence 30, last 5d → healthy
      order(200, "B"),                         // 1 order, 200d quiet → at-risk
    ];
    const out = allCustomerHealth(orders, customers, NOW);
    expect(out.map((h) => h.customerId)).toEqual(["B", "C", "A"]);
    expect(out[0].status).toBe("at-risk");
  });
});
