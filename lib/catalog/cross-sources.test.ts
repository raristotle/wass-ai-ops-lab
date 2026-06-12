import { describe, it, expect } from "vitest";
import {
  classifyAccess,
  classifyKind,
  initialIngestStatus,
  crossSourceStats,
  validateCrossSources,
  qualityScoreForUrl,
} from "@/lib/catalog/cross-sources";
import { CROSS_SOURCE_ENTRIES, CROSS_SOURCE_WORKBOOK_ROWS } from "@/data/real/cross-source-registry";

describe("source classification", () => {
  it("classifies access from the workbook's free/non-free strings", () => {
    expect(classifyAccess("Free web")).toBe("free");
    expect(classifyAccess("Free download")).toBe("free");
    expect(classifyAccess("Non-free")).toBe("licensed");
    expect(classifyAccess("Non-free/subscription")).toBe("licensed");
    expect(classifyAccess("Free but proprietary/confidential terms")).toBe("licensed");
    expect(classifyAccess("Free tier/paid tiers")).toBe("free");
    expect(classifyAccess("Free web / paid API")).toBe("free");
    expect(classifyAccess("Free/register")).toBe("registration");
    expect(classifyAccess("Free request-based")).toBe("registration");
  });

  it("classifies kind from the workbook's data_format strings", () => {
    expect(classifyKind("PDF cross-reference table")).toBe("pdf-table");
    expect(classifyKind("PDF migration table")).toBe("pdf-table");
    expect(classifyKind("HTML table")).toBe("html-table");
    expect(classifyKind("HTML cross-reference table")).toBe("html-table");
    expect(classifyKind("HTML tool")).toBe("interactive-tool");
    expect(classifyKind("HTML search/upload tool")).toBe("interactive-tool");
    expect(classifyKind("Paid SaaS/database/API")).toBe("api-database");
    expect(classifyKind("API / data platform")).toBe("api-database");
    expect(classifyKind("HTML product hierarchy")).toBe("catalog-page");
    expect(classifyKind("HTML product catalog")).toBe("catalog-page");
  });

  it("derives ingest status: only free parseable tables are ingestible", () => {
    expect(initialIngestStatus("free", "pdf-table", "Free download")).toBe("ingestible");
    expect(initialIngestStatus("free", "html-table", "Free web")).toBe("ingestible");
    expect(initialIngestStatus("free", "interactive-tool", "Free web")).toBe("requires-browser");
    expect(initialIngestStatus("licensed", "api-database", "Non-free")).toBe("requires-license");
    expect(initialIngestStatus("free", "api-database", "Free tier/paid tiers")).toBe("requires-api-key");
    expect(initialIngestStatus("free", "catalog-page", "Free web")).toBe("no-direct-crosses");
  });
});

describe("shipped cross-source registry", () => {
  it("is structurally valid (unique ids/urls, truncation flags honest)", () => {
    expect(validateCrossSources(CROSS_SOURCE_ENTRIES)).toEqual([]);
  });

  it("covers every workbook row exactly once", () => {
    const stats = crossSourceStats(CROSS_SOURCE_ENTRIES);
    expect(stats.workbookRecords).toBe(CROSS_SOURCE_WORKBOOK_ROWS);
    expect(stats.total).toBe(CROSS_SOURCE_ENTRIES.length);
  });

  it("truncated workbook URLs are never claimed as directly ingestible", () => {
    for (const e of CROSS_SOURCE_ENTRIES) {
      if (e.urlTruncated) expect(e.ingestStatus).not.toBe("ingestible");
    }
  });

  it("every ingested source carries a note saying what was extracted", () => {
    for (const e of CROSS_SOURCE_ENTRIES.filter((e) => e.ingestStatus === "ingested")) {
      expect(e.ingestNote, e.id).toBeTruthy();
    }
  });

  it("resolves a workbook quality score by source domain", () => {
    const hammond = CROSS_SOURCE_ENTRIES.find((e) => e.domain === "hammfg.com");
    expect(hammond).toBeTruthy();
    const score = qualityScoreForUrl("https://www.hammfg.com/pdf/Hoffman2HammondXRef.pdf", CROSS_SOURCE_ENTRIES);
    expect(score).toBeGreaterThanOrEqual(80);
    expect(qualityScoreForUrl("https://nonexistent-domain-xyz.example/x.pdf", CROSS_SOURCE_ENTRIES)).toBeNull();
  });
});
