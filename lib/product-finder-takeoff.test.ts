import { describe, it, expect } from "vitest";
import { isLikelyTakeoffCsv, parseTakeoffCsv, takeoffToParsedLines } from "@/lib/product-finder-takeoff";

const CSV = [
  "CSI Code,Description,Count,UoM",
  '260533,"20A 1-pole breaker, plug-on",12,EA',
  "260519,#12 THHN copper wire,2,SPOOL",
  ",,,", // junk / empty description row → skipped
  "265100,LED high-bay fixture 150W,8,EA",
].join("\n");

describe("isLikelyTakeoffCsv", () => {
  it("detects a structured takeoff CSV (description + qty columns)", () => {
    expect(isLikelyTakeoffCsv(CSV)).toBe(true);
  });
  it("rejects a plain pasted BOM list", () => {
    expect(isLikelyTakeoffCsv("12 20A breaker\n2 spools of #12 THHN")).toBe(false);
  });
});

describe("parseTakeoffCsv", () => {
  it("parses rows with flexible headers, honoring quoted commas", () => {
    const rows = parseTakeoffCsv(CSV);
    expect(rows).toHaveLength(3); // empty-description row dropped
    expect(rows[0]).toEqual({ description: "20A 1-pole breaker, plug-on", qty: 12, uom: "EA", csiCode: "260533" });
    expect(rows[1]).toEqual({ description: "#12 THHN copper wire", qty: 2, uom: "SPOOL", csiCode: "260519" });
  });

  it("defaults qty to 1 when missing/unparseable", () => {
    const rows = parseTakeoffCsv("Item,Quantity\nJunction box,\n");
    expect(rows[0].qty).toBe(1);
  });

  it("returns [] when there's no recognizable description column", () => {
    expect(parseTakeoffCsv("foo,bar\n1,2")).toEqual([]);
  });
});

describe("takeoffToParsedLines", () => {
  it("uses the description as the match query and carries qty", () => {
    const lines = takeoffToParsedLines(parseTakeoffCsv(CSV));
    expect(lines[0].query).toBe("20A 1-pole breaker, plug-on");
    expect(lines[0].qty).toBe(12);
    expect(lines[0].raw).toContain("[260533]");
  });
});
