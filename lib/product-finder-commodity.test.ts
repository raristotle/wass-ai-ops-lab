import { describe, it, expect } from "vitest";
import {
  commodityIndex,
  copperQuote,
  priceOnDay,
  FLAT_BAND_PCT,
} from "@/lib/product-finder-commodity";

const DAY = 86_400_000;
const NOW = 1_781_200_000_000;

describe("priceOnDay", () => {
  it("is deterministic — same metal+day → same price", () => {
    expect(priceOnDay("copper", 20_000)).toBe(priceOnDay("copper", 20_000));
  });

  it("moves smoothly day to day (single-step delta only)", () => {
    const a = priceOnDay("copper", 20_000);
    const b = priceOnDay("copper", 20_001);
    // One jitter leaves and one enters the 90-day window: max 2 steps of 1.2% of base
    expect(Math.abs(b - a)).toBeLessThanOrEqual(2 * 0.012 * 4.2 + 0.01);
  });

  it("stays within ±12% of base for any day", () => {
    for (let day = 19_900; day < 20_200; day += 7) {
      const p = priceOnDay("copper", day);
      expect(p).toBeGreaterThanOrEqual(4.2 * 0.88 - 0.01);
      expect(p).toBeLessThanOrEqual(4.2 * 1.12 + 0.01);
    }
  });

  it("returns 0 for an unknown metal", () => {
    expect(priceOnDay("unobtainium", 20_000)).toBe(0);
  });

  it("prices are rounded to cents", () => {
    const p = priceOnDay("aluminum", 20_050);
    expect(p).toBe(Math.round(p * 100) / 100);
  });
});

describe("commodityIndex", () => {
  it("returns copper and aluminum quotes", () => {
    const idx = commodityIndex(NOW);
    expect(idx.map((q) => q.id)).toEqual(["copper", "aluminum"]);
    for (const q of idx) {
      expect(q.price).toBeGreaterThan(0);
      expect(q.unit).toBe("$/lb");
      expect(["up", "down", "flat"]).toContain(q.trend);
    }
  });

  it("is stable within a day and may differ across days", () => {
    const morning = commodityIndex(NOW);
    const evening = commodityIndex(NOW + 10 * 60 * 60 * 1000 - 1);
    expect(evening).toEqual(morning);
    // across 60 days the walk must move at least once
    const later = commodityIndex(NOW + 60 * DAY);
    expect(later.some((q, i) => q.price !== morning[i].price)).toBe(true);
  });

  it("change30d matches the 30-day-earlier price", () => {
    const day = Math.floor(NOW / DAY);
    const copper = copperQuote(NOW);
    const prior = priceOnDay("copper", day - 30);
    const expected = Math.round(((copper.price - prior) / prior) * 10000) / 100;
    expect(copper.change30d).toBeCloseTo(expected, 2);
  });

  it("trend respects the flat band", () => {
    for (const q of commodityIndex(NOW)) {
      if (Math.abs(q.change30d) < FLAT_BAND_PCT) expect(q.trend).toBe("flat");
      else expect(q.trend).toBe(q.change30d > 0 ? "up" : "down");
    }
  });
});
