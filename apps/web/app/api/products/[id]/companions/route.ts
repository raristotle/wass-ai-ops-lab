import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/index";
import { companionsFor, type Companion } from "@/lib/catalog/companion-graph";
import { getStore, forTenant } from "@/lib/server/persistence";
import { tenantForRequest } from "@/lib/server/api-auth";
import { loadRulesIndex } from "@/lib/catalog/order-history-rules";

export const dynamic = "force-dynamic";

/**
 * Companion products for a SKU (v5-S1) — the always-on cross-sell rail. Returns the
 * spec-rule + affinity companions (required first, then by attach score), each with
 * a relation, attach score, and the reasons behind it. Deterministic + $0 (the
 * companion graph memoizes per product). When a customer's order history has been
 * imported, the mined market-basket lift is blended in here too (loadImportedRulesIndex),
 * so the rail reflects REAL co-purchase behavior — not just the deterministic backbone.
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
  return ctx.params.then(async ({ id }) => {
    const product = getCatalog().byId.get(id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") ?? undefined;
    const k = Math.min(12, Math.max(1, Number(searchParams.get("k")) || 6));
    // Blend in mined co-purchase lift for this scope (tenant when sessions are on, else global):
    // real imported rules when present, otherwise the labeled demo baskets (B10) so the rail is alive
    // on day one. Cached + fail-closed. `demo` tells the UI which one drove the rail.
    const tenant = tenantForRequest(req);
    const { index, demo } = await loadRulesIndex(forTenant(getStore(), tenant), tenant ?? "global");
    const companions = companionsFor(product, k, { branchId, rulesBySubcat: index ?? undefined });
    const behavioral = companions.some((c) => c.sources.includes("market-basket"));
    return NextResponse.json({
      sku: product.sku,
      companions: companions.map(withMeta),
      required: companions.filter((c) => c.relation === "required").length,
      // True only when mined lift actually influenced THIS product's rail (not merely
      // because some import exists) — the market-basket source is added per-edge.
      behavioral,
      // B10: the market-basket lift on THIS rail came from labeled demo baskets, not real orders.
      demo: behavioral && demo,
    });
  });
}
