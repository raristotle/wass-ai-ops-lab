import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/index";
import { resolveBySku } from "@/lib/catalog/sku-index";
import { getIcecatRelations } from "@/lib/integration/icecat-relations";

export const dynamic = "force-dynamic";

/**
 * Manufacturer-declared accessory relations for a product (v5-S3 #10) — Open Icecat.
 * DORMANT + $0 until ICECAT_USERNAME is set: returns { enabled:false } with no
 * network. When configured, fetches the product's related parts (accessories /
 * bundles / compatible) by brand+MPN and resolves each related MPN to a stocked SKU
 * where we carry it, so the relations can feed the cross-sell rail.
 *
 * GET /api/products/{id}/relations
 */
export function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return ctx.params.then(async ({ id }) => {
    const product = getCatalog().byId.get(id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // We have no GTIN on synthetic SKUs, so query by brand + the SKU as the MPN.
    const result = await getIcecatRelations({ brand: product.brand, mpn: product.sku });
    if (!("edges" in result)) return NextResponse.json(result); // {enabled:false} or {error}

    // Resolve each related MPN to a stocked SKU where we carry it.
    const edges = result.edges.map((e) => {
      const carried = resolveBySku(e.mpn);
      return {
        ...e,
        carriedSku: carried?.sku ?? null,
        carriedName: carried?.name ?? null,
      };
    });
    return NextResponse.json({ enabled: true, sku: product.sku, edges });
  });
}
