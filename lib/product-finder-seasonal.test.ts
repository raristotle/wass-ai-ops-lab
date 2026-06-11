import { describe, it, expect } from "vitest";
import { SEASONAL_EVENTS, seasonalEvent } from "@/lib/product-finder-seasonal";

const WEEK = 7 * 86_400_000;
const NOW = 1_781_300_000_000;

describe("SEASONAL_EVENTS", () => {
  it("has 4 events with unique ids and complete content", () => {
    expect(SEASONAL_EVENTS).toHaveLength(4);
    const ids = SEASONAL_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of SEASONAL_EVENTS) {
      expect(e.title.trim().length, e.id).toBeGreaterThan(0);
      expect(e.blurb.trim().length, e.id).toBeGreaterThan(0);
      expect(e.icon.trim().length, e.id).toBeGreaterThan(0);
      expect(e.picks.length, e.id).toBeGreaterThanOrEqual(3);
      for (const p of e.picks) {
        expect(p.label.trim().length, `${e.id}/${p.label}`).toBeGreaterThan(0);
        expect(p.query.trim().length, `${e.id}/${p.label}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("seasonalEvent", () => {
  it("is stable within a week", () => {
    const weekStart = Math.floor(NOW / WEEK) * WEEK;
    expect(seasonalEvent(weekStart)).toEqual(seasonalEvent(weekStart + WEEK - 1));
  });

  it("rotates weekly and covers every event over 4 weeks", () => {
    const seen = new Set<string>();
    for (let w = 0; w < 4; w++) seen.add(seasonalEvent(NOW + w * WEEK).id);
    expect(seen.size).toBe(4);
  });

  it("is deterministic", () => {
    expect(seasonalEvent(NOW)).toEqual(seasonalEvent(NOW));
  });
});
