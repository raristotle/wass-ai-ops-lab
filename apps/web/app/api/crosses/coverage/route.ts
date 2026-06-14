import { NextResponse } from "next/server";
import { buildDataQualityReport } from "@/lib/catalog/data-quality";
import { resolvedCrossEntries, resolveStocked } from "@/lib/catalog/cross-runtime";

export const dynamic = "force-dynamic";

/**
 * Cross-reference coverage summary for the manager dashboard card — pairs by
 * category and source kind, stocked-side coverage, source ingest-status mix,
 * and the largest brands still missing a modeled hierarchy. Derived from the
 * same deterministic data-quality report the test gate regenerates.
 */
export function GET() {
  const report = buildDataQualityReport();

  // Cross pairs grouped by the category of whichever side we stock.
  const byCategory: Record<string, number> = {};
  for (const e of resolvedCrossEntries()) {
    const cat = (resolveStocked(e.aBrand, e.aMpn) ?? resolveStocked(e.bBrand, e.bMpn))?.category;
    if (cat) byCategory[cat] = (byCategory[cat] ?? 0) + 1;
  }

  return NextResponse.json({
    pairs: report.crosses.pairs,
    bothStocked: report.crosses.anchoredBothSides,
    oneStocked: report.crosses.anchoredOneSide,
    bySourceKind: report.crosses.bySourceKind,
    byCategory,
    sources: {
      total: report.sources.total,
      byStatus: report.sources.byStatus,
      workbookRows: report.sources.workbookRows,
    },
    products: {
      total: report.products.total,
      productionReady: report.products.productionReady,
    },
    brands: {
      distinct: report.brands.distinct,
      modeled: report.brands.hierarchyModeled,
      topUncovered: report.brands.hierarchyMissingTop.slice(0, 6),
    },
  });
}
