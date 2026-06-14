import { describe, it, expect } from "vitest";
import { buildNotifications, type SavedSearchSignal } from "@/lib/product-finder-notifications";

const base = { quotes: [], watches: [], orders: [], customers: [], isManager: false };
const NOW = 1_750_000_000_000;

const sig = (over: Partial<SavedSearchSignal>): SavedSearchSignal => ({
  id: "s1",
  name: "Square D 20A breakers",
  createdAt: NOW - 86_400_000,
  alertsOn: true,
  newMatches: 3,
  ...over,
});

describe("saved-search notifications", () => {
  it("emits a new-matches alert when alerts are on and matches > 0", () => {
    const out = buildNotifications({ ...base, savedSearches: [sig({})] }, NOW);
    const n = out.find((x) => x.kind === "saved-search");
    expect(n).toBeTruthy();
    expect(n?.title).toContain("3 new matches");
    expect(n?.title).toContain("Square D 20A breakers");
    expect(n?.savedSearchId).toBe("s1");
  });

  it("is silent when alerts are muted or there are no new matches", () => {
    expect(buildNotifications({ ...base, savedSearches: [sig({ alertsOn: false })] }, NOW)
      .some((x) => x.kind === "saved-search")).toBe(false);
    expect(buildNotifications({ ...base, savedSearches: [sig({ newMatches: 0 })] }, NOW)
      .some((x) => x.kind === "saved-search")).toBe(false);
  });

  it("singularizes a single new match", () => {
    const out = buildNotifications({ ...base, savedSearches: [sig({ newMatches: 1 })] }, NOW);
    expect(out.find((x) => x.kind === "saved-search")?.title).toContain("1 new match —");
  });
});
