import { describe, it, expect } from "vitest";
import { orderTracking } from "@/lib/product-finder-tracking";

const DAY = 86_400_000;
const placedAt = 1_000_000_000_000;

describe("orderTracking", () => {
  it("starts at 'Order placed' immediately after the order", () => {
    const t = orderTracking({ placedAt, etaDays: 5, method: "delivery" }, placedAt + 1000);
    expect(t.status).toBe("Order placed");
    expect(t.delivered).toBe(false);
    expect(t.stages[0].current).toBe(true);
  });

  it("advances the current stage as time passes", () => {
    const t = orderTracking({ placedAt, etaDays: 10, method: "delivery" }, placedAt + 6 * DAY);
    // 60% of a 10-day window → past 'shipped' (0.55), before 'out' (0.85).
    expect(t.status).toBe("Shipped");
    const current = t.stages.find((s) => s.current)!;
    expect(current.key).toBe("shipped");
  });

  it("marks delivered once the ETA window elapses", () => {
    const t = orderTracking({ placedAt, etaDays: 2, method: "delivery" }, placedAt + 3 * DAY);
    expect(t.delivered).toBe(true);
    expect(t.status).toBe("Delivered");
    expect(t.etaAt).toBe(placedAt + 2 * DAY);
  });

  it("relabels stages for will-call pickup", () => {
    const t = orderTracking({ placedAt, etaDays: 2, method: "willcall" }, placedAt + 3 * DAY);
    expect(t.status).toBe("Picked up");
    expect(t.stages.find((s) => s.key === "out")!.label).toBe("Ready for pickup");
  });

  it("keeps six ordered stages with monotonic timestamps", () => {
    const t = orderTracking({ placedAt, etaDays: 5, method: "delivery" }, placedAt);
    expect(t.stages).toHaveLength(6);
    for (let i = 1; i < t.stages.length; i++) {
      expect(t.stages[i].at).toBeGreaterThanOrEqual(t.stages[i - 1].at);
    }
  });
});
