import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/index";
import { findEquivalents } from "@/lib/catalog/equivalents";
import { verifiedCrossesFor } from "@/lib/catalog/verified-crosses";
import { brandHierarchyFor } from "@/lib/catalog/brand-hierarchy";
import { resolvedCrossEntries, resolveStocked } from "@/lib/catalog/cross-runtime";

export const dynamic = "force-dynamic";

export function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return ctx.params.then(({ id }) => {
    const catalog = getCatalog();
    const product = catalog.byId.get(id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") ?? undefined;

    // Source-backed crosses: production path returns only ≥95-confidence
    // results, and only for records that are themselves provenance-backed.
    const verifiedCrosses =
      product.dataSource === "verified" || product.dataSource === "curated"
        ? verifiedCrossesFor(product, resolvedCrossEntries(), resolveStocked)
        : [];

    return NextResponse.json({
      product,
      equivalents: findEquivalents(product, 8, branchId),
      verifiedCrosses,
      brandHierarchy: brandHierarchyFor(product.brand),
    });
  });
}
