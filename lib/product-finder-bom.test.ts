import { describe, it, expect, vi } from "vitest";
import { parseBomLines, matchBom, BOM_LINE_CAP } from "@/lib/product-finder-bom";
import type { WescoProduct } from "@/features/product-finder/types";

// ─── parseBomLines ────────────────────────────────────────────────────────────

describe("parseBomLines", () => {
  // ── blank / whitespace lines ──────────────────────────────────────────────
  it("returns empty array for empty string", () => {
    expect(parseBomLines("")).toEqual([]);
  });

  it("skips blank-only lines", () => {
    const result = parseBomLines("\n   \n\nCircuit Breaker\n\n");
    expect(result).toHaveLength(1);
    expect(result[0].query).toBe("Circuit Breaker");
  });

  it("skips whitespace-only lines throughout", () => {
    const result = parseBomLines("  \n\t\n  \n");
    expect(result).toHaveLength(0);
  });

  // ── qty syntax: 12x ──────────────────────────────────────────────────────
  it("parses '12x 15A circuit breaker' → qty 12", () => {
    const [line] = parseBomLines("12x 15A circuit breaker");
    expect(line.qty).toBe(12);
    expect(line.query).toBe("15A circuit breaker");
    expect(line.raw).toBe("12x 15A circuit breaker");
  });

  it("parses '12X Item' (uppercase X) → qty 12", () => {
    const [line] = parseBomLines("12X Item");
    expect(line.qty).toBe(12);
    expect(line.query).toBe("Item");
  });

  // ── qty syntax: 12 x ─────────────────────────────────────────────────────
  it("parses '12 x Item' (space-x-space) → qty 12", () => {
    const [line] = parseBomLines("12 x Item");
    expect(line.qty).toBe(12);
    expect(line.query).toBe("Item");
  });

  it("parses '5 x Cat6 Cable' → qty 5", () => {
    const [line] = parseBomLines("5 x Cat6 Cable");
    expect(line.qty).toBe(5);
    expect(line.query).toBe("Cat6 Cable");
  });

  // ── qty syntax: plain integer space ─────────────────────────────────────
  it("parses '12 Item' (space only) → qty 12", () => {
    const [line] = parseBomLines("12 Item");
    expect(line.qty).toBe(12);
    expect(line.query).toBe("Item");
  });

  it("parses '3 Safety Glasses' → qty 3", () => {
    const [line] = parseBomLines("3 Safety Glasses");
    expect(line.qty).toBe(3);
    expect(line.query).toBe("Safety Glasses");
  });

  // ── qty syntax: 12, Item ─────────────────────────────────────────────────
  it("parses '12, Item' (comma separator) → qty 12", () => {
    const [line] = parseBomLines("12, Item");
    expect(line.qty).toBe(12);
    expect(line.query).toBe("Item");
  });

  it("parses '4, Relay' → qty 4", () => {
    const [line] = parseBomLines("4, Relay");
    expect(line.qty).toBe(4);
    expect(line.query).toBe("Relay");
  });

  // ── qty syntax: 12 - Item ────────────────────────────────────────────────
  it("parses '12 - Item' (dash separator) → qty 12", () => {
    const [line] = parseBomLines("12 - Item");
    expect(line.qty).toBe(12);
    expect(line.query).toBe("Item");
  });

  it("parses '2 - LED Troffer' → qty 2", () => {
    const [line] = parseBomLines("2 - LED Troffer");
    expect(line.qty).toBe(2);
    expect(line.query).toBe("LED Troffer");
  });

  // ── plain name (no qty) ──────────────────────────────────────────────────
  it("parses plain name with no qty → qty 1", () => {
    const [line] = parseBomLines("15A circuit breaker");
    expect(line.qty).toBe(1);
    expect(line.query).toBe("15A circuit breaker");
  });

  it("sets raw = original line", () => {
    const [line] = parseBomLines("  8x Safety Glasses  ");
    expect(line.raw).toBe("  8x Safety Glasses  ");
    expect(line.qty).toBe(8);
    expect(line.query).toBe("Safety Glasses");
  });

  // ── junk leading tokens ──────────────────────────────────────────────────
  it("'ABC123 wire' → qty 1, query = whole line (junk leading token)", () => {
    const [line] = parseBomLines("ABC123 wire");
    expect(line.qty).toBe(1);
    expect(line.query).toBe("ABC123 wire");
  });

  it("'AB2 cable' → qty 1, full query (leading token is not a pure integer)", () => {
    const [line] = parseBomLines("AB2 cable");
    expect(line.qty).toBe(1);
    expect(line.query).toBe("AB2 cable");
  });

  // ── product name that contains 'x' (not qty) ─────────────────────────────
  it("'12x10 cable tray' → qty 12, query '10 cable tray'", () => {
    // The leading '12' is a positive integer, 'x' is consumed as separator
    const [line] = parseBomLines("12x10 cable tray");
    expect(line.qty).toBe(12);
    expect(line.query).toBe("10 cable tray");
  });

  it("'Flex-duct 6x50' — no leading qty → qty 1, full query", () => {
    const [line] = parseBomLines("Flex-duct 6x50");
    expect(line.qty).toBe(1);
    expect(line.query).toBe("Flex-duct 6x50");
  });

  // ── decimal leading token ────────────────────────────────────────────────
  it("'1.5 Item' — decimal is not a qty → qty 1, full query", () => {
    const [line] = parseBomLines("1.5 Item");
    expect(line.qty).toBe(1);
    expect(line.query).toBe("1.5 Item");
  });

  it("'0.5x wire' — zero/decimal is not a valid qty → qty 1, full query", () => {
    const [line] = parseBomLines("0.5x wire");
    expect(line.qty).toBe(1);
    expect(line.query).toBe("0.5x wire");
  });

  // ── qty must be positive ─────────────────────────────────────────────────
  it("'0 Item' — zero is not a valid qty → qty 1, full query", () => {
    const [line] = parseBomLines("0 Item");
    expect(line.qty).toBe(1);
    expect(line.query).toBe("0 Item");
  });

  // ── multi-line ───────────────────────────────────────────────────────────
  it("handles multi-line input correctly", () => {
    const text = "5x Circuit Breaker\n3 Relay\n1, Safety Glasses";
    const result = parseBomLines(text);
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ qty: 5, query: "Circuit Breaker" });
    expect(result[1]).toMatchObject({ qty: 3, query: "Relay" });
    expect(result[2]).toMatchObject({ qty: 1, query: "Safety Glasses" });
  });

  // ── trimming ─────────────────────────────────────────────────────────────
  it("trims whitespace from query", () => {
    const [line] = parseBomLines("10x   lots of spaces   ");
    expect(line.query).toBe("lots of spaces");
  });

  // ── line cap ─────────────────────────────────────────────────────────────
  it(`caps output at BOM_LINE_CAP (${BOM_LINE_CAP}) lines`, () => {
    const lines = Array.from({ length: BOM_LINE_CAP + 50 }, (_, i) => `Item ${i + 1}`).join("\n");
    const result = parseBomLines(lines);
    expect(result).toHaveLength(BOM_LINE_CAP);
  });

  it("exports BOM_LINE_CAP as a positive integer", () => {
    expect(BOM_LINE_CAP).toBeGreaterThan(0);
    expect(Number.isInteger(BOM_LINE_CAP)).toBe(true);
  });
});

// ─── matchBom ─────────────────────────────────────────────────────────────────

const MOCK_PRODUCT: WescoProduct = {
  id: "p-001",
  sku: "SKU-001",
  name: "15A Circuit Breaker",
  brand: "Eaton",
  category: "electrical",
  subcategory: "Circuit Breakers",
  description: "Single pole 15A breaker",
  unitPrice: 12.99,
  uom: "EA",
  specs: [],
  preferred: true,
  branchStock: [],
  dcStock: [],
  externalSources: [],
  imageIcon: "⚡",
};

describe("matchBom", () => {
  it("calls searchFn for each parsed line and returns matches", async () => {
    const searchFn = vi.fn().mockResolvedValue(MOCK_PRODUCT);
    const parsed = parseBomLines("5x 15A circuit breaker");
    const result = await matchBom(parsed, searchFn);
    expect(searchFn).toHaveBeenCalledWith("15A circuit breaker");
    expect(result).toHaveLength(1);
    expect(result[0].match).toBe(MOCK_PRODUCT);
    expect(result[0].qty).toBe(5);
    expect(result[0].query).toBe("15A circuit breaker");
  });

  it("returns null match when searchFn returns null", async () => {
    const searchFn = vi.fn().mockResolvedValue(null);
    const parsed = parseBomLines("3x UnknownItem XYZ");
    const result = await matchBom(parsed, searchFn);
    expect(result[0].match).toBeNull();
  });

  it("calls searchFn once per line", async () => {
    const searchFn = vi.fn().mockResolvedValue(null);
    const parsed = parseBomLines("1x ItemA\n2x ItemB\n3x ItemC");
    await matchBom(parsed, searchFn);
    expect(searchFn).toHaveBeenCalledTimes(3);
  });

  it("preserves raw and qty in output", async () => {
    const searchFn = vi.fn().mockResolvedValue(MOCK_PRODUCT);
    const parsed = parseBomLines("7x Safety Glasses");
    const result = await matchBom(parsed, searchFn);
    expect(result[0].raw).toBe("7x Safety Glasses");
    expect(result[0].qty).toBe(7);
  });

  it("handles empty parsed array", async () => {
    const searchFn = vi.fn().mockResolvedValue(null);
    const result = await matchBom([], searchFn);
    expect(result).toEqual([]);
    expect(searchFn).not.toHaveBeenCalled();
  });

  it("handles searchFn that rejects gracefully", async () => {
    const searchFn = vi.fn().mockRejectedValue(new Error("network error"));
    const parsed = parseBomLines("5x Circuit Breaker");
    const result = await matchBom(parsed, searchFn);
    expect(result[0].match).toBeNull();
  });

  it("enforces max concurrency of 6 and preserves output order for 20 lines", async () => {
    let maxConcurrent = 0;
    let currentConcurrent = 0;

    const searchFn = vi.fn(async () => {
      // Increment in-flight count on entry
      currentConcurrent++;
      maxConcurrent = Math.max(maxConcurrent, currentConcurrent);

      // Simulate async work with a microtask delay
      await new Promise((resolve) => setTimeout(resolve, 1));

      // Decrement on exit
      currentConcurrent--;
      return MOCK_PRODUCT;
    });

    // Create 20 parsed lines
    const lines = Array.from({ length: 20 }, (_, i) => ({
      raw: `${i + 1}x Item ${i + 1}`,
      qty: i + 1,
      query: `Item ${i + 1}`,
    }));

    const result = await matchBom(lines, searchFn);

    // Assert max concurrency never exceeds 6
    expect(maxConcurrent).toBeLessThanOrEqual(6);

    // Assert output order matches input order
    expect(result).toHaveLength(20);
    for (let i = 0; i < 20; i++) {
      expect(result[i].qty).toBe(i + 1);
      expect(result[i].query).toBe(`Item ${i + 1}`);
      expect(result[i].match).toBe(MOCK_PRODUCT);
    }

    // Assert searchFn was called once per line
    expect(searchFn).toHaveBeenCalledTimes(20);
  });
});
