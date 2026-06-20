import { describe, it, expect } from "vitest";
import {
  addDaysIso,
  nextDueDate,
  daysUntilDue,
  dueStatus,
  dueSubscriptions,
  CADENCE_DAYS,
  type Subscription,
} from "@/lib/product-finder-subscription";

function sub(over: Partial<Subscription> = {}): Subscription {
  return { id: "S1", sku: "CB-1", name: "Breaker", qty: 10, cadence: "monthly", lastOrderedIso: "2026-06-01T00:00:00.000Z", active: true, ...over };
}

describe("addDaysIso / nextDueDate", () => {
  it("adds whole days, returns YYYY-MM-DD", () => {
    expect(addDaysIso("2026-06-01T00:00:00.000Z", 30)).toBe("2026-07-01");
    expect(addDaysIso("bad", 5)).toBe("bad"); // unparseable → slice(0,10) fallback
  });
  it("nextDueDate uses the cadence days", () => {
    expect(nextDueDate(sub({ cadence: "weekly" }))).toBe(addDaysIso("2026-06-01T00:00:00.000Z", CADENCE_DAYS.weekly));
  });
});

describe("daysUntilDue / dueStatus", () => {
  it("computes days until due (negative = overdue)", () => {
    // monthly from 2026-06-01 → due 2026-07-01. On 2026-06-25, 6 days out.
    expect(daysUntilDue(sub(), "2026-06-25T00:00:00.000Z")).toBe(6);
    // On 2026-07-10, overdue by 9.
    expect(daysUntilDue(sub(), "2026-07-10T00:00:00.000Z")).toBe(-9);
  });
  it("buckets by urgency", () => {
    expect(dueStatus(sub(), "2026-07-10T00:00:00.000Z")).toBe("overdue");
    expect(dueStatus(sub(), "2026-06-28T00:00:00.000Z")).toBe("due-soon"); // 3 days
    expect(dueStatus(sub(), "2026-06-10T00:00:00.000Z")).toBe("scheduled"); // 21 days
  });
});

describe("dueSubscriptions", () => {
  it("drops inactive, annotates, sorts most-urgent first", () => {
    const list = dueSubscriptions(
      [
        sub({ id: "A", lastOrderedIso: "2026-06-01T00:00:00.000Z", cadence: "monthly" }), // due 07-01
        sub({ id: "B", lastOrderedIso: "2026-05-01T00:00:00.000Z", cadence: "monthly" }), // due 05-31 → overdue
        sub({ id: "C", active: false }),
      ],
      "2026-06-25T00:00:00.000Z",
    );
    expect(list.map((s) => s.id)).toEqual(["B", "A"]); // overdue B first, C dropped
    expect(list[0].status).toBe("overdue");
    expect(list[1].nextDue).toBe("2026-07-01");
  });

  it("empty list → empty", () => {
    expect(dueSubscriptions([], "2026-06-25T00:00:00.000Z")).toEqual([]);
  });
});
