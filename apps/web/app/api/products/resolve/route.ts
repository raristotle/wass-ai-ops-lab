import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/index";
import { searchCatalog } from "@/lib/catalog/search";
import { lookupCrossReference } from "@/lib/integration/cross-reference";

export const dynamic = "force-dynamic";

/**
 * Resolve a single query to the best catalog product for the bulk price &
 * availability check: exact SKU → competitor/legacy cross-reference → search.
 * Returns { product, matchedVia } or { product: null, matchedVia: null }.
 */
export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ product: null, matchedVia: null });

  const catalog = getCatalog();

  // 1. exact SKU (case-insensitive)
  const upper = q.toUpperCase();
  const bySku = catalog.products.find((p) => p.sku.toUpperCase() === upper);
  if (bySku) return NextResponse.json({ product: bySku, matchedVia: "sku" });

  // 2. competitor / legacy cross-reference
  const xref = lookupCrossReference(q);
  if (xref) return NextResponse.json({ product: xref, matchedVia: "cross-ref" });

  // 3. search top hit
  const top = searchCatalog({ text: q, page: 0, pageSize: 1 }).items[0];
  if (top) return NextResponse.json({ product: top, matchedVia: "search" });

  return NextResponse.json({ product: null, matchedVia: null });
}
