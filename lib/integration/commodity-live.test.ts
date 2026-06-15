import { describe, it, expect } from "vitest";
import { fredToQuote } from "@/lib/integration/commodity-live";

// PCOPPUSDM is USD/metric ton; ~9000 $/t ≈ $4.08/lb (÷ 2204.62).
describe("fredToQuote", () => {
  it("converts USD/metric-ton observations to a $/lb quote with change vs prior", () => {
    const q = fredToQuote(
      [
        { date: "2026-05-01", value: "9200" },
        { date: "2026-04-01", value: "9000" },
      ],
      { id: "copper", label: "Copper" },
    );
    expect(q).not.toBeNull();
    expect(q!.unit).toBe("$/lb");
    expect(q!.price).toBeCloseTo(9200 / 2204.62, 2);
    expect(q!.asOf).toBe("2026-05-01");
    expect(q!.change30d).toBeCloseTo(2.2, 1); // (9200-9000)/9000
    expect(q!.trend).toBe("up");
  });

  it("marks a small move as flat", () => {
    const q = fredToQuote(
      [
        { date: "2026-05-01", value: "9010" },
        { date: "2026-04-01", value: "9000" },
      ],
      { id: "copper", label: "Copper" },
    );
    expect(q!.trend).toBe("flat"); // ~0.1% < FLAT_BAND
  });

  it("skips FRED missing-value markers and uses the next numeric observation", () => {
    const q = fredToQuote(
      [
        { date: "2026-05-01", value: "." },
        { date: "2026-04-01", value: "2900" },
      ],
      { id: "aluminum", label: "Aluminum" },
    );
    expect(q).not.toBeNull();
    expect(q!.asOf).toBe("2026-04-01");
    expect(q!.change30d).toBe(0); // only one usable observation
  });

  it("returns null when there is no usable observation", () => {
    expect(fredToQuote([{ date: "x", value: "." }], { id: "copper", label: "Copper" })).toBeNull();
    expect(fredToQuote([], { id: "copper", label: "Copper" })).toBeNull();
  });

  it("reports a downward trend", () => {
    const q = fredToQuote(
      [
        { date: "2026-05-01", value: "8500" },
        { date: "2026-04-01", value: "9000" },
      ],
      { id: "copper", label: "Copper" },
    );
    expect(q!.trend).toBe("down");
    expect(q!.change30d).toBeLessThan(0);
  });
});
