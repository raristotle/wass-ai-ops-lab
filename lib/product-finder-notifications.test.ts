import { describe, it, expect } from "vitest";
import {
  buildNotifications,
  unreadCount,
  watchDueAt,
  type WatchEntry,
} from "@/lib/product-finder-notifications";
import { leadTimeDaysForId } from "@/lib/product-finder-leadtime";
import { STALE_DAYS } from "@/lib/product-finder-quote-pipeline";
import type { SavedQuote } from "@/lib/product-finder-quotes";

const DAY = 86_400_000;
const NOW = 1_780_000_000_000;

function quote(over: Partial<SavedQuote>): SavedQuote {
  return {
    id: "quote-1",
    number: "Q-20260611-0001",
    customer: "Acme",
    project: "",
    lines: [],
    total: 100,
    status: "draft",
    createdAt: NOW - DAY,
    customerId: null,
    ...over,
  };
}

describe("buildNotifications — approvals", () => {
  it("emits approval notifications for pending quotes when manager", () => {
    const q = quote({ approvalStatus: "pending", marginPct: 0.12 });
    const out = buildNotifications({ quotes: [q], watches: [], isManager: true }, NOW);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("approval:quote-1");
    expect(out[0].kind).toBe("approval");
    expect(out[0].detail).toContain("12%");
    expect(out[0].quoteId).toBe("quote-1");
  });

  it("suppresses approval notifications for sales role", () => {
    const q = quote({ approvalStatus: "pending" });
    const out = buildNotifications({ quotes: [q], watches: [], isManager: false }, NOW);
    expect(out).toHaveLength(0);
  });

  it("ignores approved/rejected quotes", () => {
    const out = buildNotifications(
      { quotes: [quote({ approvalStatus: "approved" }), quote({ id: "q2", approvalStatus: "rejected" })], watches: [], isManager: true },
      NOW
    );
    expect(out).toHaveLength(0);
  });
});

describe("buildNotifications — stale quotes", () => {
  it("flags sent quotes older than STALE_DAYS for any role", () => {
    const q = quote({ status: "sent", createdAt: NOW - (STALE_DAYS + 1) * DAY });
    const out = buildNotifications({ quotes: [q], watches: [], isManager: false }, NOW);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("stale:quote-1");
    expect(out[0].detail).toContain(`${STALE_DAYS + 1} days ago`);
    expect(out[0].quoteStatus).toBe("sent");
  });

  it("does not flag fresh sent quotes or non-sent quotes", () => {
    const fresh = quote({ status: "sent", createdAt: NOW - DAY });
    const draft = quote({ id: "q2", status: "draft", createdAt: NOW - 60 * DAY });
    const out = buildNotifications({ quotes: [fresh, draft], watches: [], isManager: false }, NOW);
    expect(out).toHaveLength(0);
  });
});

describe("buildNotifications — watches", () => {
  const w: WatchEntry = { id: "CB-SQD-QO115", name: "QO 15A Breaker", addedAt: NOW };

  it("young watch → restock-eta with the due date in the detail", () => {
    const out = buildNotifications({ quotes: [], watches: [w], isManager: false }, NOW + DAY);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("restock-eta");
    expect(out[0].id).toBe("restock-eta:CB-SQD-QO115");
    expect(out[0].productId).toBe("CB-SQD-QO115");
  });

  it("elapsed watch → restock-due, timed at the due moment", () => {
    const days = leadTimeDaysForId(w.id);
    const out = buildNotifications({ quotes: [], watches: [w], isManager: false }, NOW + (days + 1) * DAY);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("restock-due");
    expect(out[0].at).toBe(watchDueAt(w));
    expect(out[0].title).toContain("QO 15A Breaker");
  });

  it("watchDueAt is deterministic per id", () => {
    expect(watchDueAt(w)).toBe(watchDueAt({ ...w }));
    expect(watchDueAt(w)).toBe(NOW + leadTimeDaysForId(w.id) * DAY);
  });
});

describe("buildNotifications — ordering & unread", () => {
  it("sorts newest first across kinds", () => {
    const stale = quote({ id: "qA", status: "sent", createdAt: NOW - 20 * DAY });
    const pending = quote({ id: "qB", approvalStatus: "pending", createdAt: NOW - DAY });
    const w: WatchEntry = { id: "p1", name: "Thing", addedAt: NOW - 2 * DAY };
    const out = buildNotifications({ quotes: [stale, pending], watches: [w], isManager: true }, NOW);
    const ats = out.map((n) => n.at);
    expect([...ats].sort((a, b) => b - a)).toEqual(ats);
    expect(out[0].id).toBe("approval:qB");
  });

  it("unreadCount counts only ids missing from the read map", () => {
    const pending = quote({ approvalStatus: "pending" });
    const out = buildNotifications({ quotes: [pending], watches: [{ id: "p1", name: "X", addedAt: NOW }], isManager: true }, NOW);
    expect(unreadCount(out, {})).toBe(2);
    expect(unreadCount(out, { [out[0].id]: NOW })).toBe(1);
    expect(unreadCount(out, Object.fromEntries(out.map((n) => [n.id, NOW])))).toBe(0);
  });
});
