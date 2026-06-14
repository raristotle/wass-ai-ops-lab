import { describe, it, expect } from "vitest";
import { parseBulkCrossLines } from "@/features/product-finder/BulkCrossModal";

describe("parseBulkCrossLines", () => {
  it("returns one trimmed entry per non-blank line", () => {
    expect(parseBulkCrossLines("FRN-R-30\nHBL5266C\n\n  A1212CHFL  ")).toEqual([
      "FRN-R-30",
      "HBL5266C",
      "A1212CHFL",
    ]);
  });

  it("keeps CSV rows intact (the matcher extracts the part number)", () => {
    expect(parseBulkCrossLines("FRN-R-30,6,fuse\nHBL5266C,2")).toEqual(["FRN-R-30,6,fuse", "HBL5266C,2"]);
  });

  it("caps at 100 lines", () => {
    const text = Array.from({ length: 250 }, (_, i) => `PART-${i}`).join("\n");
    expect(parseBulkCrossLines(text)).toHaveLength(100);
  });

  it("returns empty for blank input", () => {
    expect(parseBulkCrossLines("   \n\n")).toEqual([]);
  });
});
