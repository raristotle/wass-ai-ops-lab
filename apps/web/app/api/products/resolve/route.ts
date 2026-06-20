import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/index";
import { searchCatalog } from "@/lib/catalog/search";
import { lookupCrossReference } from "@/lib/integration/cross-reference";
import { resolveBySku } from "@/lib/catalog/sku-index";
import { crosswalkIndex, resolveCustomerNumber } from "@/lib/catalog/crosswalk";
import { getStore, forTenant } from "@/lib/server/persistence";
import { tenantForRequest } from "@/lib/server/api-auth";

export const dynamic = "force-dynamic";

/**
 * Resolve a single query to the best catalog product for the bulk price &
 * availability check: exact SKU → CUSTOMER CATALOG CROSSWALK → competitor/legacy
 * cross-reference → search. The crosswalk lets a buyer paste THEIR own catalog
 * number and have it resolve to the carried product (exact SKU still wins first, so
 * a customer number never shadows a real SKU). Returns { product, matchedVia,
 * customerNumber? } or { product: null, matchedVia: null }.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ product: null, matchedVia: null });

  const catalog = getCatalog();

  // 1. exact SKU (case-insensitive)
  const upper = q.toUpperCase();
  const bySku = catalog.products.find((p) => p.sku.toUpperCase() === upper);
  if (bySku) return NextResponse.json({ product: bySku, matchedVia: "sku" });

  // 2. customer catalog-number crosswalk (per-scope: demo seed + imported)
  const tenant = tenantForRequest(req);
  const idx = await crosswalkIndex(forTenant(getStore(), tenant), tenant ?? "global");
  const hit = resolveCustomerNumber(idx, q);
  if (hit) {
    const product = resolveBySku(hit.sku);
    if (product) return NextResponse.json({ product, matchedVia: "crosswalk", customerNumber: hit.customerNumber });
  }

  // 3. competitor / legacy cross-reference
  const xref = lookupCrossReference(q);
  if (xref) return NextResponse.json({ product: xref, matchedVia: "cross-ref" });

  // 4. search top hit
  const top = searchCatalog({ text: q, page: 0, pageSize: 1 }).items[0];
  if (top) return NextResponse.json({ product: top, matchedVia: "search" });

  return NextResponse.json({ product: null, matchedVia: null });
}
