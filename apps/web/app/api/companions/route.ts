import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { logApiError } from "@/lib/server/log";
import { resolveBySku } from "@/lib/catalog/sku-index";
import {
  completeAssembly,
  attachSuggestionsForCart,
  type Companion,
  type CompanionContext,
} from "@/lib/catalog/companion-graph";
import { mineAssociationRules, indexByAntecedent, type Basket } from "@/lib/catalog/market-basket";
import { getStore, forTenant } from "@/lib/server/persistence";
import { tenantForRequest } from "@/lib/server/api-auth";
import { loadImportedRulesIndex } from "@/lib/catalog/order-history-rules";

export const dynamic = "force-dynamic";

/**
 * Cart / BOM cross-sell (v5-S1) — two modes over a set of SKUs:
 *   - "complete-assembly": the REQUIRED companions absent from the set ("you forgot
 *     the wall plates / lugs / fittings") + the top recommended add-ons.
 *   - "attach": the deduped "complete your order" rail for the whole cart.
 *
 * Optional `baskets` (the caller's own order history) activate the behavioral
 * MARKET-BASKET lift overlay — so the demo sharpens with real co-purchase data
 * without any server-side order store. $0, no network. Read-only; public read of
 * companion suggestions, rate-limited.
 *
 * POST { skus[], mode, branchId?, baskets? }
 */
const BasketSchema = z.object({
  items: z.array(z.object({ productId: z.string(), subcategory: z.string() })).max(200),
});
const BodySchema = z.object({
  skus: z.array(z.string().min(1).max(80)).min(1).max(200),
  mode: z.enum(["complete-assembly", "attach"]).default("attach"),
  branchId: z.string().max(64).optional(),
  baskets: z.array(BasketSchema).max(2000).optional(),
});

function slim(c: Companion) {
  const p = c.product;
  const inStock = p.branchStock.reduce((s, b) => s + b.quantity, 0) + p.dcStock.reduce((s, b) => s + b.quantity, 0) > 0;
  return {
    relation: c.relation,
    attachScore: c.attachScore,
    reasons: c.reasons,
    sources: c.sources,
    product: { id: p.id, sku: p.sku, name: p.name, brand: p.brand, subcategory: p.subcategory, unitPrice: p.unitPrice, uom: p.uom, imageIcon: p.imageIcon, preferred: p.preferred, inStock },
  };
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const products = body.skus.map((s) => resolveBySku(s)).filter((p): p is NonNullable<typeof p> => p !== null);
    if (products.length === 0) return NextResponse.json({ unresolved: true, missingRequired: [], recommended: [], attach: [] });

    const ctx: CompanionContext = { branchId: body.branchId };
    // Behavioral market-basket overlay: a caller's request-supplied baskets win (a
    // one-off context); otherwise fall back to the app-global rules mined from any
    // IMPORTED order history, so the rail reflects real co-purchase by default.
    if (body.baskets && body.baskets.length > 0) {
      const baskets = body.baskets as Basket[];
      const rules = mineAssociationRules(baskets, { grain: "subcategory", minCount: 2, minLift: 1 });
      ctx.rulesBySubcat = indexByAntecedent(rules);
    } else {
      const tenant = tenantForRequest(req);
      ctx.rulesBySubcat = (await loadImportedRulesIndex(forTenant(getStore(), tenant), tenant ?? "global")) ?? undefined;
    }

    if (body.mode === "complete-assembly") {
      const res = completeAssembly(products, ctx, 6);
      return NextResponse.json({
        resolved: products.length,
        missingRequired: res.missingRequired.map(slim),
        recommended: res.recommended.map(slim),
      });
    }
    const attach = attachSuggestionsForCart(products, ctx, 8);
    return NextResponse.json({ resolved: products.length, attach: attach.map(slim) });
  } catch (e) {
    logApiError("/api/companions:POST", e);
    return NextResponse.json({ error: "Companion lookup failed" }, { status: 500 });
  }
}
