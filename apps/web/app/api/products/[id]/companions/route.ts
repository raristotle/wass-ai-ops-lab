import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/index";
import { companionsFor, type Companion } from "@/lib/catalog/companion-graph";

export const dynamic = "force-dynamic";

/**
 * Companion products for a SKU (v5-S1) — the always-on cross-sell rail. Returns the
 * spec-rule + affinity companions (required first, then by attach score), each with
 * a relation, attach score, and the reasons behind it. Deterministic + $0 (the
 * companion graph memoizes per product); behavioral market-basket lift is layered
 * in by the cart endpoint where order baskets are available.
 *
 * This GET feeds the product-detail UI, so it returns the FULL CatalogProduct (the
 * client can add it to the cart or open its detail directly, exactly like the
 * goes-with rail). The agent-facing POST /api/companions keeps a slim shape.
 *
 * GET /api/products/{id}/companions?branchId=&k=
 */
function withMeta(c: Companion) {
  return {
    relation: c.relation,
    attachScore: c.attachScore,
    reasons: c.reasons,
    sources: c.sources,
    product: c.product,
  };
}

export function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return ctx.params.then(({ id }) => {
    const product = getCatalog().byId.get(id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") ?? undefined;
    const k = Math.min(12, Math.max(1, Number(searchParams.get("k")) || 6));
    const companions = companionsFor(product, k, { branchId });
    return NextResponse.json({
      sku: product.sku,
      companions: companions.map(withMeta),
      required: companions.filter((c) => c.relation === "required").length,
    });
  });
}
