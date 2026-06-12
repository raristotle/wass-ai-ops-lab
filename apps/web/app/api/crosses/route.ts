import { NextResponse } from "next/server";
import { resolvedCrossEntries, resolveStocked } from "@/lib/catalog/cross-runtime";
import { SOURCE_CONFIDENCE } from "@/lib/catalog/verified-crosses";
import { CROSS_SOURCE_ENTRIES, CROSS_SOURCE_WORKBOOK_ROWS } from "@/data/real/cross-source-registry";
import { crossSourceStats } from "@/lib/catalog/cross-sources";

export const dynamic = "force-dynamic";

/** Explorer payload: every resolved cross pair + the full source registry. */
export function GET() {
  const pairs = resolvedCrossEntries().map((e) => {
    const aProduct = resolveStocked(e.aBrand, e.aMpn);
    const bProduct = resolveStocked(e.bBrand, e.bMpn);
    return {
      aBrand: e.aBrand,
      aMpn: e.aMpn,
      aProductId: aProduct?.id ?? null,
      bBrand: e.bBrand,
      bMpn: e.bMpn,
      bProductId: bProduct?.id ?? null,
      relation: e.relation,
      sourceKind: e.sourceKind,
      confidence: SOURCE_CONFIDENCE[e.sourceKind],
      sourceUrl: e.sourceUrl,
      sourceId: e.sourceId ?? null,
      notes: e.notes ?? null,
      verifiedAt: e.verifiedAt,
    };
  });

  let bothStocked = 0;
  let oneStocked = 0;
  const bySourceKind: Record<string, number> = {};
  for (const p of pairs) {
    bySourceKind[p.sourceKind] = (bySourceKind[p.sourceKind] ?? 0) + 1;
    if (p.aProductId && p.bProductId) bothStocked += 1;
    else if (p.aProductId || p.bProductId) oneStocked += 1;
  }

  const srcStats = crossSourceStats(CROSS_SOURCE_ENTRIES);

  return NextResponse.json({
    stats: {
      pairs: pairs.length,
      bothStocked,
      oneStocked,
      bySourceKind,
      sources: { total: srcStats.total, byStatus: srcStats.byStatus, workbookRows: CROSS_SOURCE_WORKBOOK_ROWS },
    },
    pairs,
    sources: CROSS_SOURCE_ENTRIES.map((s) => ({
      id: s.id,
      name: s.name,
      domain: s.domain,
      url: s.url,
      urlTruncated: s.urlTruncated,
      kind: s.kind,
      access: s.access,
      ingestStatus: s.ingestStatus,
      qualityScore: s.qualityScore,
      recordCount: s.recordCount,
      categories: s.categories,
      ingestNote: s.ingestNote ?? null,
    })),
  });
}
