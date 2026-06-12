import { describe, it, expect } from "vitest";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildDataQualityReport, renderDataQualityMarkdown } from "@/lib/catalog/data-quality";

describe("data-quality report", () => {
  const report = buildDataQualityReport();

  it("loads the full dataset and the production gate accounts for every record", () => {
    expect(report.products.total).toBeGreaterThanOrEqual(600);
    expect(report.products.productionReady + report.products.belowThreshold.length).toBe(report.products.total);
  });

  it("every shipped record carries datasheet provenance (specSheetUrl 100%)", () => {
    expect(report.fieldCoverage.specSheetUrl.pct).toBe(100);
  });

  it("reports missing inputs instead of guessing (sales rank + Wesco index page)", () => {
    const names = report.missingInputs.map((m) => m.name);
    expect(names).toContain("Wesco sales-volume ranking");
    expect(names.some((n) => n.includes("Wesco brands"))).toBe(true);
    expect(report.missingInputs[0].detail).toContain("not guessing");
  });

  it("cross + hierarchy datasets have zero structural problems", () => {
    expect(report.crosses.structuralProblems).toEqual([]);
  });

  it("renders markdown with the goal-mandated sections, and refreshes the committed report", () => {
    const md = renderDataQualityMarkdown(report);
    expect(md).toContain("Confidence distribution");
    expect(md).toContain("Field coverage");
    expect(md).toContain("Cross-reference dataset");
    expect(md).toContain("Missing inputs (reported, not guessed)");
    // Deterministic regeneration: dates come from the dataset, not the clock.
    expect(md).toBe(renderDataQualityMarkdown(buildDataQualityReport()));
    writeFileSync(join(process.cwd(), "docs", "data-quality-report.md"), md, "utf8");
  });
});
