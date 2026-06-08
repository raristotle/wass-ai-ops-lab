import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/catalog/search";
import { parseSearchQuery } from "@/lib/catalog/schemas";
import { findEquivalents } from "@/lib/catalog/equivalents";
import { totalStock, pickInStockSubstitute } from "@/lib/product-finder-substitute";
import type { CatalogProduct } from "@/features/product-finder/types";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const params = parseSearchQuery(searchParams);
  const response = searchCatalog(params);

  // Attach the best in-stock substitute for each out-of-stock result so the
  // card can offer "in stock now" without a per-card round-trip.
  const substitutes: Record<string, CatalogProduct> = {};
  for (const item of response.items) {
    if (totalStock(item) > 0) continue;
    const sub = pickInStockSubstitute(item, findEquivalents(item, 24));
    if (sub) substitutes[item.id] = sub;
  }
  return NextResponse.json({ ...response, substitutes });
}
